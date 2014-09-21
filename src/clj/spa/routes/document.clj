(ns spa.routes.document
  (:import org.apache.commons.io.IOUtils
           java.io.ByteArrayOutputStream)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [taoensso.timbre :as timbre]
            [ring.util.response :as resp]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [spa.util :refer [breadcrumbs]]
            [spa.pdf.helper :as pdf-helper]
            [spa.db.documents :as documents]
            [spa.db.projects :as projects]
            [spa.layout :as layout]))

(defn json-response
  [m]
  (resp/content-type (resp/response (json/encode m)) "text/plain"))

(defn insert-in-project
  [project-id req]
  (let [{fingerprint :fingerprint name :name} (:params req)
        temp-file (get-in req [:multipart-params "file" :tempfile])
        file (with-open [f (io/input-stream temp-file)]
               (IOUtils/toByteArray f))]
    (documents/insert-in-project! project-id fingerprint file name)
    (json-response {:id fingerprint})))

(defn document-page [document project req]
  (layout/render "document.html" {:dispatcher "document"
                                  :marginalia (:marginalia document)
                                  :breadcrumbs (breadcrumbs (:uri req)
                                                            ["Projects" (:title project) (:name document)])
                                  :page-type "view"}))

(defn dispatch [m req]
  (let [accept  (get (:headers req) "accept")
        mime    (get (:query-params req) "mime")
        match?  (fn [pattern expr] (not (nil? (re-find (re-pattern (str "^" pattern)) expr))))
        accept? (fn [pattern] (if mime (match? pattern mime) (match? pattern accept)))
        key     (cond
                 (accept? "text/html")       :html
                 (accept? "application/pdf") :pdf
                 :else                       :default)]
    ((key m))))

(defn get-document
  [project-id document-id req]
  (dispatch {:pdf (fn [] (io/input-stream (:file (documents/get document-id))))
             :html (fn [] (document-page
                          (documents/get document-id project-id)
                          (projects/get project-id) req))
             :default (fn [] "…")} req))

(defn remove-document
  [project-id document-id]
  (documents/dissoc! document-id project-id)
  (json-response {:id document-id}))

(defn update-marginalia
  [project-id document-id req]
  (let [marginalia (get-in req [:params :data])]
    (documents/update! project-id document-id marginalia)
    (json-response (:id document-id))))

(defn extend-deeply-with
  "Extends the maps in seq alpha of the form [[{} ...] [{} ...] ...]
   with the keys from beta of the form [{} ... {}]. alpha and beta must have the same length."
  [alpha beta]
  (map-indexed (fn [idx psi] (map (fn [omega] (merge (nth beta idx) omega)) psi)) alpha))

(defn export-document
  [project-id document-id req]
  (let [document (documents/get document-id project-id)
        marginalia (clojure.walk/keywordize-keys (get-in document [:marginalia "marginalia"]))
        annotations (map :annotations marginalia)
        meta (map #(select-keys % [:title :description :color]) marginalia)
        highlights (flatten (extend-deeply-with annotations meta))
        format-highlight (fn [h]
                           (let [highlight (clojure.set/rename-keys
                                            (select-keys h [:color :content])
                                            {:content :pattern})]
                             (assoc highlight :content (str (:title h) "\n\n" (:description h)))))]
    (with-open
        [input (io/input-stream (:file document))
         output (ByteArrayOutputStream.)]
      (pdf-helper/highlight-document input output (map format-highlight highlights))
      (io/input-stream (.toByteArray output)))))

(defn document-routes [project-id]
  (routes
   (POST "/" [:as req]
         (restricted (insert-in-project project-id req)))
   (PUT "/:document-id" [document-id :as req]
        (restricted (update-marginalia project-id document-id req)))
   (DELETE "/:document-id" [document-id :as req]
           (restricted (remove-document project-id document-id)))
   (GET "/:document-id" [document-id :as req]
        (restricted (get-document project-id document-id req)))
   (GET "/:document-id/export" [document-id :as req]
        (restricted (export-document project-id document-id req)))))
