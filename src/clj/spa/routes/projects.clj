(ns spa.routes.projects
  (:require [compojure.core :refer :all :include-macros true]
            [taoensso.timbre :as timbre]
            [ring.util.response :as response]
            [noir.response :refer [redirect]]
            [noir.util.route :refer [restricted]]
            [noir.session :as session]
            [taoensso.timbre :as timbre]
            [spa.routes.viewer :as viewer]
            [spa.db.projects :as projects]
            [spa.layout :as layout]))

(defn parse-int [s] (Integer. (re-find  #"\d+" s )))

(defn current-user [] (session/get :user-id))

(defn overview-page []
  (layout/render "projects/overview.html"
                 {:projects (projects/for-user (current-user))}))

(defn get-project
  "Gets the project if the project_id belongs to the user_id"
  [user-id project-id]
  (when (projects/has? user-id project-id)
    (projects/get project-id)))

(defn edit-existing
  [project-id]
  (if-let [project (get-project (current-user) project-id)]
    (layout/render "projects/edit.html" {:project-id project-id
                                         :project project})
    (response/not-found (str "could not find project " project-id " for you"))))

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
      (do
        (projects/create! (current-user) title description)
        (redirect "/"))
      (do
        (projects/edit! (parse-int id) title description)
        (redirect "/")))))

(defroutes projects-routes
  (context "/projects" []
           (GET "/" [] (restricted (overview-page)))
           (GET "/edit/:id" [id :as req] (restricted (edit-page id req)))
           (POST "/edit/:id" [id :as req] (restricted (handle-edit id req)))))
