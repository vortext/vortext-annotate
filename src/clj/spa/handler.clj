(ns spa.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [spa.middleware :refer [load-middleware]]
            [spa.session-manager :as session-manager]
            [noir.session :as session]
            [noir.response :refer [redirect]]
            [noir.util.middleware :refer [app-handler]]
            [compojure.route :as route]
            [taoensso.timbre :as timbre]
            [taoensso.timbre.appenders.rotor :as rotor]
            [selmer.parser :as parser]
            [environ.core :refer [env]]
            [spa.routes.topology :refer [topology-routes]]
            [spa.routes.auth :refer [auth-routes]]
            [spa.routes.home :refer [home-routes]]
            [spa.routes.projects :refer [projects-routes]]
            [spa.flake :as flake]
            [cronj.core :as cronj]
            [ring.middleware.anti-forgery :refer [*anti-forgery-token*]]
            [spa.services :as services]))

(defroutes
  app-routes
  (route/resources "/static")
  (route/not-found "Page not found"))

(defn init!
  "init will be called once when app is deployed as a servlet on an
  app server such as Tomcat put any initialization code here"
  []
  (timbre/set-config!
   [:appenders :rotor]
   {:enabled? true,
    :async? false,
    :fn rotor/appender-fn})
  (timbre/set-config!
   [:shared-appender-config :rotor]
   {:path "spa.log", :max-size (* 512 1024), :backlog 10})
  (services/start!)
  (flake/init!)
  (if (env :dev) (parser/cache-off!))
  (parser/add-tag! :csrf-token (fn [_ _] *anti-forgery-token*))
  (cronj/start! session-manager/cleanup-job)
  (timbre/info "spa started successfully"))

(defn destroy!
  "destroy will be called when your application
  shuts down, put any clean up code here"
  []
  (timbre/info "spa is shutting down...")
  (services/shutdown!)
  (cronj/shutdown! session-manager/cleanup-job)
  (shutdown-agents)
  (timbre/info "shutdown complete!"))

(def web-routes
  [auth-routes
   topology-routes
   projects-routes
   home-routes
   app-routes])

(defn user-access [req]
  (not (nil? (session/get :user-id))))

(def app
  (app-handler
   web-routes
   :middleware (load-middleware)
   :session-options {:timeout (* 60 30), :timeout-response (redirect "/")}
   :access-rules [{:uri "/topology/*" :rule user-access}
                  {:uri "/projects/*" :rule user-access}]))
