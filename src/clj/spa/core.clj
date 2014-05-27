(ns spa.core
  (:gen-class)
  (:use environ.core)
  (:require [clojure.tools.logging :as log]
            [ring.middleware.reload :as reload]
            [ring.util.response :as response]
            [org.httpkit.server :refer :all]
            [compojure.core :refer :all]
            [compojure.handler :as handler]
            [compojure.route :as route]
            [org.httpkit.server :refer :all]
            [spa.middleware :refer :all]
            [spa.topologies :as topologies]
            [spa.services :as services]))

(defonce server (atom nil))

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

(defn stop-server! []
  (log/info "stopping server on" (env :port) "by user request")
  (when-not (nil? @server)
    ;; graceful shutdown: wait for existing requests to be finished
    (@server :timeout 100)
    (reset! server nil))
  (services/shutdown!)
  (shutdown-agents)
  (log/info "… bye bye"))

(defn -main [& args]
  (log/info "Starting server, listening on" (env :port) (when (env :debug) "[DEBUG]"))
  (.addShutdownHook (Runtime/getRuntime) (Thread. (fn [] (stop-server!))))
  (let [handler (if (env :debug)
                  (reload/wrap-reload app) ;; only reload when in debug
                  app)]
    (services/start!)
    (reset! server (run-server handler {:port (env :port)}))))
