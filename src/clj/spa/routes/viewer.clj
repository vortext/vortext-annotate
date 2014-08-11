(ns spa.routes.viewer
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [compojure.route :as route]
            [noir.util.route :refer [def-restricted-routes]]
            [noir.session :as session]
            [spa.layout :as layout]))

(defn viewer-page []
  (layout/render "viewer.html" {:bootstrap-script "main" :page-type "view"}))

(def-restricted-routes viewer-routes
  (GET "/view/" [] (viewer-page)))
