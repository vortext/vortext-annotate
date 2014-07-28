(ns spa.app
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [go <! >!]]
            [ring.util.response :as response]
            [org.httpkit.server :as http]
            [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [spa.middleware :refer :all]
            [spa.topologies :as topologies]))

(defn topology-handler
  [name request]
  (let [c (topologies/process name request)]
    (http/with-channel request channel
      (async/go-loop [v (<! c)]
        (http/send! channel (:sink v)))
      (http/on-close channel (fn [_] (async/close! c))))))

(defn base
  []
  (response/resource-response "index.html" {:root "public"}))

(defn assemble-routes []
  (->
   (routes
    (POST "/topologies/:name" [name :as request] (topology-handler name request))
    (GET "/" [] (base))
    (GET "/view/:fingerprint" []  (base))
    (GET "/view/:fingerprint/a/:annotation" [] (base))
    (route/resources "/static")
    (route/not-found "Page not found"))))

(def app
  (->
   (assemble-routes)
   (handler/api)
   (wrap-request-logger)
   (wrap-exception-handler)
   (wrap-response-logger)))
