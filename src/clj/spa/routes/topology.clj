(ns spa.routes.topology
  (:require [compojure.core :refer :all]
            [clojure.core.async :as async :refer [go <! >!]]
            [spa.topologies :as topologies]
            [org.httpkit.server :as http]))

(defn topology-handler
  [name request]
  (let [c (topologies/process name request)]
    (http/with-channel request channel
      (async/go-loop [v (<! c)]
        (http/send! channel (:sink v)))
      (http/on-close channel (fn [_] (async/close! c))))))

(defroutes topology-routes
  (POST "/topologies/:name" [name :as request] (topology-handler name request)))
