(ns spa.routes.document
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [compojure.route :as route]
            [taoensso.timbre :as timbre]
            [noir.util.route :refer [def-restricted-routes]]
            [noir.session :as session]
            [spa.layout :as layout]))

(defn add-to-project
  [project-id req]
  (timbre/debug req)
  "True true")

(defn document-page []
  (layout/render "document.html" {:bootstrap-script "document" :page-type "document"}))
