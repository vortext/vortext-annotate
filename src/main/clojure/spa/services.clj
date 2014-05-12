(ns spa.services
  (:import [spa Broker Client]
           [org.zeromq ZMsg])
  (:require
   [clojure.tools.logging :as log]
   [environ.core :refer :all]
   [clojure.java.io :as io]))

(defonce process-env {"DEBUG" (str (env :debug))
                      "SPA_VERSION" (System/getProperty "spa.version")})

(defonce client-session (atom nil))
(defonce broker (atom nil))

(defn start! []
  (let [b (Thread.
           (fn [] (doto (Broker.)
                   (.bind (env :broker-socket))
                   (.mediate))))
        c (Client. (env :broker-socket))]
    (reset! client-session c)
    (reset! broker b)
    (.start b)))

(defn shutdown! [])

(defn start-process!
  "Open a sub process, return the subprocess

  args - List of command line arguments
  :redirect - Redirect stderr to stdout
  :dir - Set initial directory
  :env - Set environment variables"
  [args &{:keys [redirect dir env]}]
  (let [pb (ProcessBuilder. args)
        environment (.environment pb)]
    (doseq [[k v] env] (.put environment k v))
    (-> pb
       (.directory (if (nil? dir) nil (io/file dir)))
       (.redirectErrorStream (boolean redirect))
       (.redirectOutput java.lang.ProcessBuilder$Redirect/INHERIT)
       (.start))))

(defprotocol RemoteProcedure
  (shutdown [self])
  (call [self payload]))

(deftype LocalService [type file process]
  RemoteProcedure
  (shutdown [self] (.destroy process))
  (call [self payload]
    (let [request (doto (ZMsg.)
                    (.addString payload))
          reply (.send @client-session file request)]
      (when-not (nil? reply)
        (String. (.getData (.pop reply)))))))

(def start-local!
  (memoize
   (fn [type server-file file]
     (let [server (.getPath (io/resource server-file))
           topologies (.getPath (io/resource "topologies"))
           args [(name type) server "-m" file "-s" (env :broker-socket) "-p" topologies "-n" file]
           process (start-process! args :env process-env :redirect true)]
       (LocalService. type file process)))))

(defmulti obtain-service! (fn [type arg] type))
(defmethod obtain-service! :python [type arg]
  (start-local! type "multilang/python/server.py" arg))
(defmethod obtain-service! :node [type arg]
  (start-local! type "multilang/nodejs/server.js" arg))

(defn call
  "Initiates a Remote Procedure Call
   will start the service if not running already"
  [type file payload]
  (let [service (obtain-service! type file)]
    (call service payload)))
