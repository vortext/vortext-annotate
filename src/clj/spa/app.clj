(ns spa.app
  (:require [clojure.tools.logging :as log]
            [ring.util.response :as response]
            [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [spa.middleware :refer :all]
            [spa.topologies :as topologies]))

(defn assemble-routes []
  (->
   (routes
    (POST "/topologies/:name" [name :as req]
          (topologies/process name req))
    (GET "/" [] (response/resource-response "index.html" {:root "public"}))
    (route/resources "/static")
    (route/not-found "Page not found"))))

(def app
  (->
   (assemble-routes)
   (handler/api)
   (wrap-request-logger)
   (wrap-exception-handler)
   (wrap-response-logger)))
