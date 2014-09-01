(ns spa.db.projects
  (:refer-clojure :exclude [get])
  (:require [spa.db.schema :refer [db-spec]]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/projects.sql")

(defn has?
  [user-id project-id]
  (:exists (first (has-project? db-spec user-id project-id))))

(defn get
  [project-id]
  (jdbc/with-db-transaction [connection db-spec]
    (let [project (first (get-project connection project-id))
          categories (get-categories connection project-id)]
      (assoc project :categories categories))))

(defn for-user
  [user-id]
  (select-projects-by-user db-spec user-id))

(defn create!
  [user-id title description]
  (create-project<! db-spec title description user-id))

(defn edit!
  [id title description]
  (edit-project! db-spec title description id))
