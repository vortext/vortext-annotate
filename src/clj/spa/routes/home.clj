(ns spa.routes.home
  (:require [compojure.core :refer :all]
            [noir.session :as session]
            [spa.routes.view :as view]
            [spa.layout :as layout]))

(defn home-page []
  (if (session/get :user-id)
    (view/viewer-page)
    (layout/render "home.html" {:logged-out? (session/flash-get :logged-out)})))

(defn about-page []
  (layout/render "about.html"))

(defroutes home-routes
  (GET "/" [] (home-page))
  (GET "/about" [] (about-page)))
