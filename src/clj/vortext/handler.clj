(ns vortext.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [taoensso.timbre :as timbre]
            [taoensso.timbre.appenders.rotor :as rotor]
            [environ.core :refer [env]]
            [vortext.session :as session]
            [vortext.middleware :refer [development-middleware production-middleware]]
            [vortext.routes.auth :refer [auth-routes]]
            [vortext.routes.home :refer [home-routes]]
            [vortext.routes.project :refer [project-routes]]
            [cronj.core :as cronj]))

(defroutes
  base-routes
  (route/not-found "Page not found"))

(defn init!
  "init will be called once when app is deployed as a servlet on an
  app server such as Tomcat put any initialization code here"
  []
  (timbre/set-config!
   [:appenders :rotor]
   {:enabled? true
    :async? false
    :fn rotor/appender-fn})
  (timbre/set-config!
   [:shared-appender-config :rotor]
   {:path "vortext.log", :max-size (* 512 1024) :backlog 10})
  (if (env :dev) (selmer.parser/cache-off!))
  (cronj/start! session/cleanup-job)
  (timbre/info "started successfully"))

(defn destroy!
  "destroy will be called when your application
  shuts down, put any clean up code here"
  []
  (timbre/info "spa is shutting down...")
  (cronj/shutdown! session/cleanup-job)
  (shutdown-agents)
  (timbre/info "shutdown complete!"))

(def app
  (-> (routes
      auth-routes
      project-routes
      home-routes
      base-routes)
     development-middleware
     production-middleware))
