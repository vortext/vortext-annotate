(ns spa.db.documents
  (:refer-clojure :exclude [get assoc! dissoc!])
  (:require [spa.db.schema :refer [db-spec]]
            [spa.db.projects :as projects]
            [cheshire.core :as json]
            [taoensso.timbre :as timbre]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/documents.sql")

(defn json-decode
  "Decodes a JSON org.postgresql.util.PGobject to a Clojure map"
  [^:org.postgresql.util.PGobject obj]
  (json/decode (.getValue obj)))

(defn get
  ([fingerprint]
     (first (get-document db-spec fingerprint)))
  ([fingerprint project-id]
     (let [document (first (get-document-with-marginalia db-spec fingerprint project-id))]
       (assoc document :marginalia (json-decode (:marginalia document))))))

(defn assoc!
  [document-id project-id]
  (assoc-document! db-spec document-id project-id))

(defn dissoc!
  [document-id project-id]
  (jdbc/with-db-transaction [connection db-spec]
    (dissoc-document! connection document-id project-id)
    (delete-marginalia! connection document-id project-id)))

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
  [project-id & {:keys [marginalia] :or {marginalia false}}]
  (if marginalia
    (let [documents (documents-by-project-with-marginalia db-spec project-id)]
      (map #(assoc % :marginalia (json-decode (:marginalia %))) documents))
    (documents-by-project db-spec project-id)))

(defn update!
  [project-id document-id marginalia]
  (update-marginalia! db-spec marginalia document-id project-id))
