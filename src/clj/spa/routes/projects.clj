(ns spa.routes.projects
  (:require [compojure.core :refer :all :include-macros true]
            [taoensso.timbre :as timbre]
            [noir.util.route :refer [restricted def-restricted-routes]]
            [noir.session :as session]
            [taoensso.timbre :as timbre]
            [spa.routes.viewer :as viewer]
            [spa.layout :as layout]))

(defn overview-page []
  (layout/render "projects/overview.html"))

(defn edit-page [req]
  (layout/render "projects/edit.html"))

(defroutes projects-routes
  (context "/projects" []
           (GET "/" [] (restricted (overview-page)))
           (GET "/edit" [:as req] (restricted (edit-page req)))
           (GET "/view" [] (restricted (viewer/viewer-page)))))
