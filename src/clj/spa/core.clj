(ns spa.core
  (:gen-class)
  (:import [ch.qos.logback.classic Level Logger]
           [org.slf4j LoggerFactory MDC])
  (:require [clojure.tools.logging :as log]
            [ring.middleware.reload :as reload]
            [environ.core :refer [env]]
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

(def logger ^ch.qos.logback.classic.Logger (LoggerFactory/getLogger Logger/ROOT_LOGGER_NAME))

(defn set-log-level!
  "Pass keyword :error :info :debug"
  [level]
  (case level
    :debug (.setLevel logger Level/DEBUG)
    :info (.setLevel logger Level/INFO)
    :error (.setLevel logger Level/ERROR)))

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
  (let [debug? (Boolean/valueOf (env :debug))
        handler (if debug?
                  (do
                    (set-log-level! :debug)
                    (reload/wrap-reload app)) ;; only reload when in debug
                  (do
                    (set-log-level! :info)
                    app))]
    (log/info "Starting server, listening on" (env :port) (str "[DEBUG:" debug? "]"))
    (.addShutdownHook (Runtime/getRuntime) (Thread. (fn [] (stop-server!))))
    (services/start!)
    (reset! server (run-server handler {:port (env :port)}))))
