(ns spa.routes.home
  (:require [compojure.core :refer :all]
            [noir.session :as session]
            [noir.response :as response]
            [spa.layout :as layout]))

(defn home-page []
  (if (session/get :user-id)
    (response/redirect "/projects")
    (layout/render "home.html" {:page-type "home"
                                :logged-out? (session/flash-get :logged-out)})))

(defn about-page []
  (layout/render "about.html"))

(defroutes home-routes
  (GET "/" [] (home-page))
  (GET "/about" [] (about-page)))
