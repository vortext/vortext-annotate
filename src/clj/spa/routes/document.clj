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
            [spa.pdf.highlight :refer [highlight-document]]
            [spa.pdf.normalize :refer [normalize-document]]
            [spa.db.documents :as documents]
            [spa.db.projects :as projects]
            [clojure.core.async :as async :refer [chan go <! >!]]
            [spa.http :as http]
            [spa.layout :as layout]))

(timbre/refer-timbre)

(defn insert!
  [project-id req]
  (let [{fingerprint :fingerprint name :name} (:params req)
        temp-file (get-in req [:multipart-params "file" :tempfile])
        pdf (normalize-document temp-file)]
    {:document (documents/insert-in-project! project-id fingerprint pdf name)}))

(defn insert-in-project
  [project-id req]
  (let [c (chan)]
    (go
      (>! c (insert! project-id req)))
    (http/async req c)))

(defn document-page [document project req]
  (layout/render "document.html"
                 {:dispatcher "document"
                  :marginalia (:marginalia document)
                  :name (:name document)
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

(defn display
  [project-id document-id req]
  (dispatch {:pdf (fn [] (io/input-stream (:file (documents/get document-id))))
             :html (fn [] (document-page
                          (documents/get document-id project-id)
                          (projects/get project-id) req))
             :default (fn [] "…")} req))

(defn delete
  [project-id document-id]
  {:document (documents/dissoc! document-id project-id)})

(defn update
  [project-id document-id req]
  (let [marginalia (get-in req [:params :data])]
    {:document (documents/update! project-id document-id marginalia)}))

(defn ^:private extend-deeply-with
  "Extends the maps in seq alpha of the form [[{} ...] [{} ...] ...]
   with the keys from beta of the form [{} ... {}]. alpha and beta must have the same length."
  [alpha beta]
  (map-indexed (fn [idx psi] (map (fn [omega] (merge (nth beta idx) omega)) psi)) alpha))

(defn highlight
  "Highlights the annotations directly within the pdf.
   Requires a document map with both the :file and the :marginalia present.
   Returns a closed InputStream with the highlighted PDF"
  [document]
  (let [marginalia (clojure.walk/keywordize-keys (get-in document [:marginalia "marginalia"]))
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
      (try
        (do
          (highlight-document input output (map format-highlight highlights))
          (io/input-stream (.toByteArray output)))
        (catch Exception e (do (warn e) input)))))) ;; just return the document on fail

(defn export
  [project-id document-id]
  (highlight (documents/get document-id project-id)))

;;;;;;;;;;;;;;;
;; Routes
;;;;;;;;;;;;;;;
(defn document-routes [project-id]
  (routes
   (POST "/" [:as req]
         (restricted (insert-in-project project-id req)))
   (PUT "/:document-id" [document-id :as req]
        (restricted (update project-id document-id req)))
   (DELETE "/:document-id" [document-id :as req]
           (restricted (delete project-id document-id)))
   (GET "/:document-id" [document-id :as req]
        (restricted (display project-id document-id req)))
   (GET "/:document-id/export" [document-id :as req]
        (restricted (export project-id document-id)))))
