(ns spa.routes.document
  (:import org.apache.commons.io.IOUtils)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [taoensso.timbre :as timbre]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [spa.db.documents :as documents]
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

(defn document-page []
  (layout/render "document.html" {:bootstrap-script "document" :page-type "view"}))

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
  (dispatch {:pdf (fn [] (io/input-stream (:file (documents/get document-id))))
             :html (fn [] (document-page))
             :default (fn [] "…")} req))


(defn document-routes [project-id]
  (routes
   (POST "/" [:as req] (restricted (add-to-project project-id req)))
   (GET "/:document-id" [document-id :as req] (restricted (get-document project-id document-id req)))))
