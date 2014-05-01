(ns spa.services
  (:require
   [clojure.java.io :as io]
   [zeromq [device :as device] [zmq :as zmq]]))

(defonce *running-services* (atom #{}))

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
       (.inheritIO)
       (.redirectErrorStream (boolean redirect))
       (.start))))

(defprotocol RemoteProcedure
  (shutdown! [self])
  (dispatch [self payload]))

(deftype Service [type file process socket]
  RemoteProcedure
  (shutdown! [self] "stop")
  (dispatch [self payload] (print "sending off" payload)))

(defn running?
  [type file]
  (contains? *running-services* [type file]))

(defmulti start-service! (fn [type file] type))
(defmethod start-service! "python" [type file]
  (let [port (zmq/first-free-port)
        process (start-process! ["python" "<path to Abstract>" file port])]))

(defn services
  [type file]
  (if-not (running? type file)
    (start-service! type file)
    (@*running-services* [type file])))

(defn call
  "Initiates a Remote Procedure Call
   will start the service if not running already"
  [type file payload]
  (let [service (services type file)]
    )

  )
