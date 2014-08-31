(ns spa.routes.document
  (:import org.apache.commons.io.IOUtils)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [taoensso.timbre :as timbre]
            [noir.util.route :refer [def-restricted-routes]]
            [noir.session :as session]
            [spa.db.documents :as documents]
            [spa.layout :as layout]))

(defn add-to-project
  [project-id req]
  (let [{temp-file :file fingerprint :fingerprint name :name} (:params req)
        file (with-open [f (io/reader (:tempfile temp-file))]
               (IOUtils/toByteArray f))]
    (documents/add-to-project! project-id fingerprint file name)
    "success"))

(defn document-page []
  (layout/render "document.html" {:bootstrap-script "document" :page-type "document"}))


(defn document-routes [project-id]
  (routes
   (POST "/" [:as req] (add-to-project project-id req))
   (GET "/:id" [id :as req] (document-page))))
