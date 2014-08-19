(ns spa.routes.document
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [compojure.route :as route]
            [noir.util.route :refer [def-restricted-routes]]
            [noir.session :as session]
            [spa.layout :as layout]))

(defn document-page []
  (layout/render "document.html" {:bootstrap-script "document" :page-type "document"}))
