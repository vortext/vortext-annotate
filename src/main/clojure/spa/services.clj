(ns spa.services
  (:require
   [environ.core :refer :all]
   [clojure.java.io :as io]
   [zeromq [device :as device] [zmq :as zmq]]))

(defonce running-services (atom {}))
(defonce context (zmq/zcontext))
(defonce process-env {"DEBUG" (str (env :debug))
                      "SPA_VERSION" (System/getProperty "spa.version")})

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
  (dispatch [self payload]))

(defn- remote-dispatch [socket payload]
  (with-open [requester
              (doto (zmq/socket context :req)
                (zmq/connect socket))]
    (zmq/send-str requester payload)
    (zmq/receive-str requester)))

(deftype Service [type file process socket]
  RemoteProcedure
  (shutdown [self] (do (.destroy process)
                       (swap! running-services dissoc [type file])))
  (dispatch [self payload] (remote-dispatch socket payload)))

(defn running?
  [type file]
  (contains? @running-services [type file]))

(defn- build-and-start-service
  [type server-file file]
  (let [server (.getPath (io/resource server-file))
        topologies (.getPath (io/resource "topologies"))
        socket (str "tcp://127.0.0.1:" (zmq/first-free-port))
        args [(name type) server "-m" file "-s" socket "-p" topologies]
        process (start-process! args :env process-env :redirect true)
        remote-procedure (Service. type file process socket)]
    (swap! running-services assoc [type file] remote-procedure)
    remote-procedure))

(defmulti start-service! (fn [type file] type))
(defmethod start-service! :python [type file]
  (build-and-start-service type "multilang/python/filter_server.py" file))
(defmethod start-service! :node [type file]
  (build-and-start-service type "multilang/nodejs/filter_server.js" file))

(defn obtain!
  [type file]
  (if-not (running? type file)
    (start-service! type file)
    (@running-services [type file])))

(defn call
  "Initiates a Remote Procedure Call
   will start the service if not running already"
  [type file payload]
  (let [service (obtain! type file)]
    (dispatch service payload)))

(defn shutdown! []
  (doseq [services (vals @running-services)]
    (shutdown services)))
