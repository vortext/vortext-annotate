(ns vortext.routes.project
  (:import org.apache.commons.io.IOUtils
           java.util.zip.ZipOutputStream
           java.util.zip.ZipEntry
           java.io.ByteArrayOutputStream)
  (:require [compojure.core :refer :all]
            [clojure.java.jdbc :as jdbc]
            [clojure.java.io :as io]
            [ring.util.response :as resp]
            [taoensso.timbre :as timbre]
            [vortext.util :refer [breadcrumbs temp-file parse-int]]
            [vortext.http :as http]
            [vortext.security :refer [current-user]]
            [vortext.routes.document :as document]
            [vortext.db.projects :as projects]
            [vortext.db.documents :as documents]
            [vortext.layout :as layout]))

(timbre/refer-timbre)

(defn overview-page
  [request]
  (layout/render "projects/overview.html"
                 {:breadcrumbs (breadcrumbs (:uri request) ["Projects"])
                  :projects (projects/for-user (current-user request))}))

(defn edit-existing
  [id request]
  (if-let [project (projects/get id)]
    (layout/render "projects/edit.html"
                   {:project-id id
                    :project project
                    :dispatcher "project"
                    :breadcrumbs (breadcrumbs (:uri request) ["Projects" (:title project) "Edit"])})
    (resp/not-found (str "could not find project " id))))

(defn create-new
  [request]
  (layout/render "projects/edit.html"
                 {:breadcrumbs (breadcrumbs (:uri request) ["Projects"  "Create new"])
                  :dispatcher "project"
                  :project-id "new"}))

(defn edit-page
  [id request]
  (if (= id "new")
    (create-new request)
    (edit-existing (parse-int id) request)))

(defn handle-edit
  [id {:keys [params] :as request}]
  (let [{:keys [title description]} params
        categories (clojure.string/split (:categories params) #",")]
    (if (= id "new")
      (let [new-project (projects/create! (current-user request) title description categories)]
        (resp/redirect (str "/projects/" new-project)))
      (do
        (projects/edit! (parse-int id) title description categories)
        (resp/redirect (str "/projects/" id))))))

(defn view
  [id request]
  (let [project (projects/get id)]
    (layout/render "projects/view.html"
                   {:dispatcher "documents"
                    :breadcrumbs (breadcrumbs (:uri request) ["Projects"  (:title project)])
                    :documents (documents/get-by-project id)
                    :project project})))

;; Export project to ZIP Archive
(defmacro ^:private with-entry
  [zip entry-name & body]
  `(let [^ZipOutputStream zip# ~zip]
     (.putNextEntry zip# (ZipEntry. ~entry-name))
     ~@body
     (flush)
     (.closeEntry zip#)))

(defn export-as-pdf
  [id request]
  (let [project (projects/get id)
        documents (documents/get-by-project id :marginalia true)]
    (with-open [output (ByteArrayOutputStream.)
                zip (ZipOutputStream. output)]
      (doall (map (fn [document]
                    (with-open [doc (document/highlight document)]
                      (with-entry zip (:name document)
                        (io/copy doc zip)))) documents))
      (.finish zip)
      (http/as-attachment
       (resp/response (io/input-stream (.toByteArray output)))
       (str (:title project) ".zip")))))

(defn export-marginalia
  [id request]
  (let [project (projects/get id)
        documents (documents/get-by-project id :marginalia true)
        marginalia (map #(select-keys % [:marginalia :name :fingerprint]) documents)]
    (timbre/debug documents)
    (http/as-attachment
     (http/pretty-json marginalia)
     (str (:title project) ".json"))))

;;;;;;;;;;;;;;;
;; Routes
;;;;;;;;;;;;;;;
(defroutes project-routes
  (context "/projects" []
           (GET "/" [:as request]
                (overview-page request))
           (context "/:project-id" [project-id]
                    (GET "/" [:as request]
                         (view (parse-int project-id) request))
                    (POST "/" [:as request]
                          (handle-edit project-id request))
                    (GET "/edit" [:as request]
                         (edit-page project-id request))
                    (GET "/export/:type" [type :as request]
                         (let [project (parse-int project-id)]
                           (case type
                             "pdf"  (export-as-pdf project request)
                             "json" (export-marginalia project request))))
                    (context "/documents" []
                             (document/document-routes (parse-int project-id))))))
