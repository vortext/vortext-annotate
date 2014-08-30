(ns spa.routes.project
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [ring.util.response :as response]
            [noir.response :refer [redirect]]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [taoensso.timbre :as timbre]
            [spa.routes.document :as document]
            [spa.db.projects :as projects]
            [spa.layout :as layout]))

(defn parse-int [s] (Integer. (re-find  #"\d+" s )))

(defn current-user [] (session/get :user-id))

(defn overview-page []
  (layout/render "projects/overview.html"
                 {:projects (projects/for-user (current-user))}))

(defn edit-existing
  [project-id]
  (if-let [project (projects/get project-id)]
    (layout/render "projects/edit.html" {:project-id project-id
                                         :project project})
    (response/not-found (str "could not find project " project-id))))

(defn create-new []
  (layout/render "projects/edit.html" {:project-id "new"}))

(defn edit-page
  [id req]
  (if (= id "new")
    (create-new)
    (edit-existing (parse-int id))))

(defn handle-edit
  [id {:keys [params] :as req}]
  (let [{:keys [title description]} params]
    (if (= id "new")
      (let [new-project (projects/create! (current-user) title description)]
        (redirect (str "/projects/" (:projects_id new-project))))
      (do
        (projects/edit! (parse-int id) title description)
        (redirect (str "/projects/" id))))))

(defn view
  [id]
  (layout/render "projects/view.html"
                 {:bootstrap-script "project"
                  :project (projects/get (parse-int id))}))

(defroutes project-routes
  (context "/projects" []
           (GET "/" [] (restricted (overview-page)))
           (GET "/:id" [id] (restricted (view id)))
           (POST "/:id/add-document" [id :as req] (restricted (document/add-to-project id req)))
           (GET "/edit/:id" [id :as req] (restricted (edit-page id req)))
           (POST "/edit/:id" [id :as req] (restricted (handle-edit id req)))))

;;;;;;;;;;;;;;;
;; Access rules
;;;;;;;;;;;;;;;

(defn logged-in? [req]
  (not (nil? (current-user))))

(defn is-owner? [req]
  (let [project-id (get-in req [:params :id])]
    (if (and project-id (not= project-id "new"))
      (projects/has? (current-user) (parse-int project-id))
      true)))

(def project-access
  [{:uris ["/projects/:id" "/projects/edit/:id" "/projects/:id/*"] :rules [logged-in? is-owner?]}
   {:uris ["/projects" "/projects/*"] :rules [logged-in?]}])
