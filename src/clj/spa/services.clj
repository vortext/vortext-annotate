(ns spa.services
  (:import [spa Broker Client]
           [org.zeromq ZMsg])
  (:require [clojure.tools.logging :as log]
            [environ.core :refer :all]
            [clojure.java.io :as io]))

(defonce process-env {"DEBUG" (str (env :debug))
                      "SPA_VERSION" (System/getProperty "spa.version")})

(defonce client-session (atom nil))
(defonce broker (atom nil))

(defn start! []
  (let [b  (Broker. (env :broker-socket))
        c (Client. (env :broker-socket))]
    (future (.run b))
    (reset! client-session c)
    (reset! broker b)))

(defn shutdown! []
  (.destroy @client-session)
  (.destroy @broker))

(defn start-process!
  "Open a sub process, return the subprocess.

  args - List of command line arguments
  :redirect - Redirect stderr to stdout
  :dir - Set initial directory
  :env - Set environment variables"
  [args & {:keys [redirect dir env]}]
  (let [pb (ProcessBuilder. args)
        environment (.environment pb)]
    (doseq [[k v] env] (.put environment k v))
    (-> pb
       (.directory (if (nil? dir) nil (io/file dir)))
       (.redirectErrorStream (boolean redirect))
       (.redirectOutput java.lang.ProcessBuilder$Redirect/INHERIT)
       (.start))))

(defn rpc [name payload]
  (let [request (doto (ZMsg.)
                  (.add payload))
        _ (.send @client-session name request)
        reply (.recv @client-session)]
    (when-not (nil? reply)
      (let [result (String. (.getData (.pop reply)))]
        (.destroy reply)
        result))))

(defprotocol RemoteProcedure
  (shutdown [self])
  (dispatch [self payload]))

(deftype LocalService [type name process]
  RemoteProcedure
  (shutdown [self] (.destroy process))
  (dispatch [self payload] (rpc name payload)))

(def start-local!
  (memoize
   (fn [type worker-file file {:as options
                              :keys [reconnect heartbeat timeout service-name]
                              :or {service-name nil
                                   timeout (env :default-timeout)
                                   heartbeat (env :heartbeat-interval)
                                   reconnect (env :reconnect-timeout)}}]
     (let [worker (.getPath (io/resource worker-file))
           topologies (.getPath (io/resource "topologies"))
           service-name (or service-name file)
           args [(name type)
                 worker
                 "-m" file
                 "-s" (env :broker-socket)
                 "-p" topologies
                 "-n" service-name
                 "--timeout" (str timeout)
                 "--heartbeat" (str heartbeat)
                 "--reconnect" (str reconnect)]
           process (start-process! args :env process-env :redirect true)]
       (LocalService. type file process)))))

(defmulti local-service! (fn [type file options] type))
(defmethod local-service! :python [type file options]
  (start-local! type "multilang/python/worker" file options))
(defmethod local-service! :node [type file options]
  (start-local! type "multilang/nodejs/worker" file options))

(defn call
  "Initiates a Remote Procedure Call.
   Will open a local sub process unless :local? is false.
   When calling remote (i.e. :local? false) the :name and payload need to be defined.

  type - type of sub process to start
  file - module file that defines the handler for the subprocess
  payload - payload to process
  :name - (optional) name of the service to call
  :heartbeat - (optional) the heartbeat interval for the service
  :reconnect - (optional) the reconnect rate for the service
  :timeout - (optional) timeout for the service (per service)"

  [type file payload & options]
  (assert (and (not (nil? @broker)) (not (nil? @client-session))))
  (if (get options :local? true)
    (let [service (local-service! type file options)]
      (dispatch service payload))
    (rpc (:name options) payload)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Public convenience methods
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def py (partial call :python))
(def js (partial call :node))
