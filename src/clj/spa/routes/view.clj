(ns spa.routes.view
  (:require [compojure.core :refer :all]
            [spa.layout :as layout]))

(defroutes view-routes)

(defn viewer-page []
  (layout/render "viewer.html" {:bootstrap-script "main" :page-type "view"}))

(defroutes view-routes
  (GET "/view" [] (viewer-page))
  (GET "/view/:fingerprint" [] (viewer-page))
  (GET "/view/:fingerprint/a/:annotation" [] (viewer-page)))
