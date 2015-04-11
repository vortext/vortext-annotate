(ns vortext.routes.home
  (:require [compojure.core :refer :all]
            [noir.session :as session]
            [noir.response :as response]
            [vortext.http :as http]
            [vortext.layout :as layout]))

(defn home-page []
  (if (session/get :user-id)
    (response/redirect "/projects")
    (->> (layout/render-to-response
        "home.html"
        {:page-type "home"
         :logged-out? (session/flash-get :logged-out)})
       (response/set-headers http/no-cache))))

(defroutes home-routes
  (GET "/" [] (home-page)))
