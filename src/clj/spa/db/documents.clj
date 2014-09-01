(ns spa.db.documents
  (:refer-clojure :exclude [get assoc! dissoc!])
  (:require [spa.db.schema :refer [db-spec]]
            [spa.db.projects :as projects]
            [cheshire.core :as json]
            [taoensso.timbre :as timbre]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/documents.sql")

(defn get
  ([fingerprint] (first (get-document db-spec fingerprint)))
  ([fingerprint project-id]
     (jdbc/with-db-transaction [connection db-spec]
       (let [document (first (get-document connection fingerprint))
             marginalia (:marginalia (first (get-marginalia connection fingerprint project-id)))]
         (assoc document :marginalia (json/decode (.getValue marginalia)))))))

(defn assoc!
  [document-id project-id]
  (assoc-document! db-spec document-id project-id))

(defn dissoc!
  [document-id project-id]
  (dissoc-document! db-spec document-id project-id))

(defn has?
  [project-id document-id]
  (:exists (first (has-document? db-spec document-id project-id))))

(defn ^:private populate-marginalia
  [db project-id fingerprint]
  (let [categories (projects/get-categories db project-id)
        marginalia {:marginalia (map (fn [c] {:title (:title c)}) categories)}]
    (create-marginalia! db fingerprint project-id (json/encode marginalia))))

(defn insert-in-project!
  [project-id fingerprint file name]
  (jdbc/with-db-transaction [connection db-spec]
    (let [id (create-document<! connection fingerprint file name project-id)]
      (populate-marginalia connection project-id fingerprint)
      id)))

(defn get-by-project
  [project-id]
  (documents-by-project db-spec project-id))
