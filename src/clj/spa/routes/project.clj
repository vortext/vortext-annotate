(ns spa.routes.project
  (:require [compojure.core :refer :all]
            [clojure.java.jdbc :as jdbc]
            [ring.util.response :as response]
            [noir.response :refer [redirect]]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [taoensso.timbre :as timbre]
            [spa.util :refer [breadcrumbs]]
            [spa.routes.document :as document]
            [spa.db.projects :as projects]
            [spa.db.documents :as documents]
            [spa.layout :as layout]))

(timbre/refer-timbre)

(defn parse-int [s] (Integer. (re-find  #"\d+" s )))

(defn current-user [] (session/get :user-id))

(defn overview-page
  [req]
  (layout/render "projects/overview.html"
                 {:breadcrumbs (breadcrumbs (:uri req) ["Projects"])
                  :projects (projects/for-user (current-user))}))

(defn edit-existing
  [project-id req]
  (if-let [project (projects/get project-id)]
    (layout/render "projects/edit.html"
                   {:project-id project-id
                    :project project
                    :dispatcher "project"
                    :breadcrumbs (breadcrumbs (:uri req) ["Projects" (:title project) "Edit"])})
    (response/not-found (str "could not find project " project-id))))

(defn create-new [req]
  (layout/render "projects/edit.html"
                 {:breadcrumbs (breadcrumbs (:uri req) ["Projects"  "Create new"])
                  :dispatcher "project"
                  :project-id "new"}))

(defn edit-page
  [id req]
  (if (= id "new")
    (create-new req)
    (edit-existing (parse-int id) req)))

(defn handle-edit
  [id {:keys [params] :as req}]
  (let [{:keys [title description]} params
        categories (clojure.string/split (:categories params) #",")]
    (if (= id "new")
      (let [new-project (projects/create! (current-user) title description categories)]
        (redirect (str "/projects/" new-project)))
      (do
        (projects/edit! (parse-int id) title description categories)
        (redirect (str "/projects/" id))))))

(defn view
  [id req]
  (let [project-id (parse-int id)
        project (projects/get project-id)]
    (layout/render "projects/view.html"
                   {:dispatcher "documents"
                    :breadcrumbs (breadcrumbs (:uri req) ["Projects"  (:title project)])
                    :documents (documents/get-by-project project-id)
                    :project project})))

(defroutes project-routes
  (context "/projects" []
           (GET "/" [:as req]
                (restricted (overview-page req)))
           (context "/:project-id" [project-id]
                    (GET "/" [:as req]
                         (restricted (view project-id req)))
                    (POST "/" [:as req]
                          (restricted (handle-edit project-id req)))
                    (GET "/edit" [:as req]
                         (restricted (edit-page project-id req)))
                    (context "/documents" []
                             (document/document-routes (parse-int project-id))))))
;;;;;;;;;;;;;;;
;; Access rules
;;;;;;;;;;;;;;;
(defn logged-in? [req]
  (not (nil? (current-user))))

(defn is-owner? [req]
  (let [project-id (get-in req [:params :project-id])]
    (if (and project-id (not= project-id "new"))
      (projects/has? (current-user) (parse-int project-id))
      true)))

(defn has-document? [req]
  (let [{project-id :project-id document-id :document-id} (:params req)]
    (documents/has? (parse-int project-id) document-id)))

(def project-access
  [{:uris ["/projects/:project-id/documents/:document-id"] :rules [logged-in? is-owner? has-document?]}
   {:uris ["/projects/:project-id" "/projects/:project-id/*"] :rules [logged-in? is-owner?]}
   {:uris ["/projects" "/projects/*"] :rules [logged-in?]}])
