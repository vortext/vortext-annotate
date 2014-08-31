(ns spa.routes.document
  (:import org.apache.commons.io.IOUtils)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [taoensso.timbre :as timbre]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [spa.util :refer [breadcrumbs]]
            [spa.db.documents :as documents]
            [spa.db.projects :as projects]
            [spa.layout :as layout]))

(defn add-to-project
  [project-id req]
  (let [{fingerprint :fingerprint name :name} (:params req)
        temp-file (get-in req [:multipart-params "file" :tempfile])
        file (with-open [f (io/input-stream temp-file)]
               (IOUtils/toByteArray f))]
    (try
      (do
        (documents/add-to-project! project-id fingerprint file name)
        {:success true})
      (catch Exception e (timbre/warn e) {:success false}))))

(defn document-page [document project req]
  (layout/render "document.html" {:bootstrap-script "document"
                                  :breadcrumbs (breadcrumbs (:uri req) ["Projects" (:title project) (:name document)])
                                  :page-type "view"}))

(defn dispatch [m req]
  (let [accept  (get (:headers req) "accept")
        mime    (get (:query-params req) "mime")
        match?  (fn [pattern expr] (re-find (re-pattern (str "^" pattern)) expr))
        accept? (fn [expr] (or (match? mime expr) (match? accept expr)))
        key     (cond
                 (accept? "text/html")       :html
                 (accept? "application/pdf") :pdf
                 :else                       :default)]
    ((key m))))

(defn get-document
  [project-id document-id req]
  (let [document (documents/get document-id)]
    (dispatch {:pdf (fn [] (io/input-stream (:file document)))
               :html (fn [] (document-page document (projects/get project-id) req))
               :default (fn [] "…")} req)))

(defn remove-document
  [project-id document-id]
  (do
    (documents/dissoc! document-id project-id)
    {:deleted document-id}))

(defn document-routes [project-id]
  (routes
   (POST "/" [:as req] (restricted (add-to-project project-id req)))
   (DELETE "/:document-id" [document-id :as req] (restricted (remove-document project-id document-id)))
   (GET "/:document-id" [document-id :as req] (restricted (get-document project-id document-id req)))))
