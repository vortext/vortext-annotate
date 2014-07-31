(ns spa.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [spa.middleware :refer [load-middleware]]
            [spa.session-manager :as session-manager]
            [noir.response :refer [redirect]]
            [ring.util.response :as response]
            [noir.util.middleware :refer [app-handler]]
            [compojure.route :as route]
            [taoensso.timbre :as timbre]
            [taoensso.timbre.appenders.rotor :as rotor]
            [environ.core :refer [env]]
            [spa.routes.topology :refer [topology-routes]]
            [cronj.core :as cronj]
            [spa.services :as services]))

(defn base
  []
  (response/resource-response "index.html" {:root "public"}))

(defroutes
  app-routes
  (GET "/" [] (base))
  (GET "/view/:fingerprint" []  (base))
  (GET "/view/:fingerprint/a/:annotation" [] (base))
  (route/resources "/static")
  (route/not-found "Page not found"))

(defn init
  "init will be called once when app is deployed as a servlet on an
  app server such as Tomcat put any initialization code here"
  []
  (timbre/set-config!
    [:appenders :rotor]
    {:min-level :info,
     :enabled? true,
     :async? false,
     :max-message-per-msecs nil,
     :fn rotor/appender-fn})
  (timbre/set-config!
    [:shared-appender-config :rotor]
    {:path "spa.log", :max-size (* 512 1024), :backlog 10})
  (services/start!)
  (cronj/start! session-manager/cleanup-job)
  (timbre/info "spa started successfully"))

(defn destroy
  "destroy will be called when your application
   shuts down, put any clean up code here"
  []
  (timbre/info "spa is shutting down...")
  (services/shutdown!)
  (cronj/shutdown! session-manager/cleanup-job)
  (shutdown-agents)
  (timbre/info "shutdown complete!"))

(def app
 (app-handler
   [topology-routes app-routes]
   :middleware (load-middleware)
   :session-options {:timeout (* 60 30), :timeout-response (redirect "/")}
   :access-rules []))
