(ns spa.db.projects
  (:refer-clojure :exclude [get])
  (:require [spa.db.schema :refer [db-spec]]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/projects.sql"
  {:connection db-spec})

(defn has?
  [user-id project-id]
  (:exists (first (has-project? {:user user-id :project project-id}))))

(defn get
  [project-id]
  (jdbc/with-db-transaction [tx db-spec]
    (let [project (first (get-project {:project project-id} {:connection tx}))
          categories (get-categories {:project project-id} {:conncetion tx})]
      (assoc project :categories categories))))

(defn for-user
  [user-id]
  (select-projects-by-user {:user user-id}))

(defn insert-categories!
  [db project-id categories]
  (doall (map #(insert-category!
                (assoc {:project project-id} :title %) db) categories)))

(defn create!
  [user-id title description categories]
  (jdbc/with-db-transaction [tx db-spec]
    (let [project-id (:projects_id (create-project<!
                                    {:title title
                                     :description description
                                     :user user-id} {:connection tx}))]
      (insert-categories! {:connection tx} project-id categories)
      project-id)))

(defn edit!
  [project-id title description categories]
  (jdbc/with-db-transaction [tx db-spec]
    (let [c {:connection tx}]
      (delete-categories! {:project project-id} c)
      (insert-categories! c project-id categories)
      (edit-project! {:title title
                      :description description
                      :project project-id} c))))
