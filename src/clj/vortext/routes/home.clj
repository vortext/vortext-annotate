(ns vortext.routes.home
  (:require [compojure.core :refer :all]
            [noir.session :as session]
            [noir.response :as response]
            [vortext.layout :as layout]))

(def no-cache {"Cache-Control" "no-cache, no-store, must-revalidate"
               "Pragma" "no-cache"
               "Expires" "0"})

(defn home-page []
  (if (session/get :user-id)
    (response/redirect "/projects")
    (->> (layout/render-to-response "home.html" {:page-type "home"
                                 :logged-out? (session/flash-get :logged-out)})
       (response/set-headers no-cache))))

(defroutes home-routes
  (GET "/" [] (home-page)))
