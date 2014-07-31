(ns spa.services
  (:import [spa Broker Client]
           [org.zeromq ZMsg])
  (:require   [taoensso.timbre :as timbre]
              [environ.core :refer :all]
              [clojure.core.async :as async :refer [mult map< filter< tap chan sliding-buffer go <! >!]]
              [clojure.java.io :as io]))

(defonce process-env {"DEBUG" (str (env :debug))
                      "SPA_VERSION" (System/getProperty "spa.version")})

(defonce client (Client. (env :broker-socket)))
(defonce broker (Broker. (env :broker-socket)))

(def listen-for
  ((fn []
     (let [replies (chan (sliding-buffer 32))
           mult (mult replies)]
       (go (loop [reply (.recv client)]
             (when-not (nil? reply)
               (let [id (String. (.getData (.pop reply)))
                     result (.getData (.pop reply))]
                 (timbre/debug "received reply for request id" id)
                 (>! replies {:id id :result result})
                 (.destroy reply)))
             (recur (.recv client))))
       (fn [id]
         (let [u (chan)]
           (map< :result (filter< (fn [reply] (= id (:id reply))) (tap mult u)))))))))

(defn start!
  "Start the service broker"
  []
  (doto (Thread. broker) (.start)))

(defn shutdown! []
  (.destroy broker)
  (.destroy client))

(defn rpc
  [name payload]
  (let [c (chan)
        id (str (java.util.UUID/randomUUID))
        request (doto (ZMsg.) (.add payload))]
    (timbre/debug "sending request to" name "with id" id)
    (.send client name (.getBytes id) request)
    (listen-for id)))

(defprotocol RemoteProcedure
  (shutdown [self])
  (dispatch [self payload]))

(deftype LocalService [type name process]
  RemoteProcedure
  (shutdown [self] (.destroy process))
  (dispatch [self payload] (rpc name payload)))

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

(def require-worker!
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
  (require-worker! type "multilang/python/worker" file options))
(defmethod local-service! :node [type file options]
  (require-worker! type "multilang/nodejs/worker" file options))

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
  (assert (and (not (nil? broker)) (not (nil? client))))
  (if (get options :local? true)
    (let [service (local-service! type file options)]
      (dispatch service payload))
    (rpc (:name options) payload)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Public convenience methods
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def py (partial call :python))
(def js (partial call :node))
