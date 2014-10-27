(ns spa.routes.document
  (:import org.apache.commons.io.IOUtils
           java.io.ByteArrayOutputStream)
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [clojure.core.async :as async :refer [go chan <!! >!!]]
            [cheshire.core :as json]
            [taoensso.timbre :as timbre]
            [ring.util.response :as resp]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [spa.util :refer [breadcrumbs]]
            [spa.http :as http]
            [spa.pdf.highlight :refer [highlight-document]]
            [spa.pdf.normalize :refer [normalize-document]]
            [spa.db.documents :as documents]
            [spa.db.projects :as projects]
            [clojure.core.async :as async :refer [chan go <! >!]]
            [spa.layout :as layout]))

(timbre/refer-timbre)

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

(defn insert!
  [project-id req]
  (let [{fingerprint :fingerprint name :name} (:params req)
        temp-file (get-in req [:multipart-params "file" :tempfile])
        document (normalize-document temp-file)
        response (chan)]
    (go
      (documents/insert-in-project! project-id fingerprint document name)
      (.delete document)
      (.delete temp-file)
      (>! response {:document fingerprint}))
    response))

(defn insert-in-project
  [project-id req]
  (http/async req (insert! project-id req)))

(defn document-page [document project req]
  (layout/render "document.html"
                 {:dispatcher "document"
                  :name (:name document)
                  :breadcrumbs (breadcrumbs (:uri req)
                                            ["Projects" (:title project) (:name document)])
                  :page-type "view"}))

(defn display
  [project-id document-id req]
  (dispatch {:pdf (fn [] (documents/get document-id))
             :html (fn [] (document-page
                          (documents/get document-id project-id)
                          (projects/get project-id) req))
             :default (fn [] "…")} req))

(defn delete
  [project-id document-id]
  {:document (documents/dissoc! document-id project-id)})

(defn update
  [project-id document-id req])

(defn highlight
  [document])

(defn export
  [project-id document-id])

;;;;;;;;;;;;;;;
;; Routes
;;;;;;;;;;;;;;;
(defn document-routes [project-id]
  (routes
   (POST "/" [:as req]
         (restricted (insert-in-project project-id req)))
   (DELETE "/:document-id" [document-id :as req]
           (restricted (delete project-id document-id)))
   (GET "/:document-id" [document-id :as req]
        (restricted (display project-id document-id req)))))
