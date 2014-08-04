(ns spa.routes.home
  (:require [compojure.core :refer :all]
            [noir.session :as session]
            [spa.routes.viewer :as viewer]
            [spa.layout :as layout]))

(defn home-page []
  (if (session/get :user-id)
    (viewer/viewer-page)
    (layout/render "home.html" {:page-type "home"
                                :logged-out? (session/flash-get :logged-out)})))

(defn about-page []
  (layout/render "about.html"))

(defroutes home-routes
  (GET "/" [] (home-page))
  (GET "/about" [] (about-page)))
