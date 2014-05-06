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
            [org.httpkit.server :refer :all]))

(defonce server (atom nil))

(defn assemble-routes []
  (->
   (routes
    (GET "/" [] (response/resource-response "index.html" {:root "public"}))
    (route/resources "/static")
    (route/not-found "Page not found"))))

(def app
  (->
   (assemble-routes)
   (handler/api)))

(defn stop-server []
  (log/info "stopping server on" (env :port) "by user request")
  (when-not (nil? @server)
    ;; graceful shutdown: wait for existing requests to be finished
    (@server :timeout 100)
    (reset! server nil))
  (log/info "… bye bye"))

(defn -main [& args]
  ;; The #' is useful, when you want to hot-reload code
  ;; You may want to take a look: https://github.com/clojure/tools.namespace
  ;; and http://http-kit.org/migration.html#reload
  (log/info "starting server, listening on" (env :port) (when (env :debug) "[DEBUG]"))
  (.addShutdownHook (Runtime/getRuntime) (Thread. (fn [] (stop-server))))
  (let [handler (if (env :debug)
                  (reload/wrap-reload app) ;; only reload when dev
                  app)]
    (reset! server (run-server handler {:port (env :port)}))))
