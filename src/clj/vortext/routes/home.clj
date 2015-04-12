(ns vortext.routes.home
  (:require [compojure.core :refer :all]
            [ring.util.response :refer [response redirect]]
            [vortext.http :as http]
            [taoensso.timbre :as timbre]
            [vortext.security :as security]
            [vortext.layout :as layout]))

(defn home-page
  [request]
  (if (security/current-user request)
    (redirect "/projects")
    (layout/render
     "home.html"
     {:page-type "home"
      :logged-out? (get-in request [:flash :logged-out])})))

(defroutes home-routes
  (GET "/" [:as request] (home-page request)))
