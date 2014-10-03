(ns spa.db.documents
  (:refer-clojure :exclude [get assoc! dissoc!])
  (:require [spa.db.schema :refer [db-spec]]
            [spa.db.projects :as projects]
            [cheshire.core :as json]
            [taoensso.timbre :as timbre]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(timbre/refer-timbre)

(defqueries "sql/documents.sql"
  {:connection db-spec})

(defn json-decode
  "Decodes a JSON org.postgresql.util.PGobject to a Clojure map"
  [^:org.postgresql.util.PGobject obj]
  (json/decode (.getValue obj)))

(defn get
  ([document-id]
     (first (get-document {:document document-id})))
  ([document-id project-id]
     (let [document (first (get-document-with-marginalia
                            {:document document-id
                             :project project-id}))]
       (assoc document :marginalia (json-decode (:marginalia document))))))

(defn assoc!
  [document-id project-id]
  (assoc-document! {:document document-id
                    :project project-id}))

(defn dissoc!
  [document-id project-id]
  (let [args {:document document-id
              :project project-id}]
    (jdbc/with-db-transaction [tx db-spec]
      (dissoc-document! args {:connection tx})
      (delete-marginalia! args {:connection tx}))))

(defn has?
  [project-id document-id]
  (:exists (first (has-document? {:document document-id
                                  :project project-id}))))

(defn ^:private populate-marginalia
  [db project-id document-id]
  (let [categories (projects/get-categories {:project project-id} db)
        marginalia {:marginalia (map (fn [c] {:title (:title c)}) categories)}]
    (when (empty? (get-marginalia {:document document-id :project project-id} db))
      (create-marginalia! {:document document-id
                           :project project-id
                           :marginalia (json/encode marginalia)}
                          db))))

(defn insert-in-project!
  [project-id document-id file name]
  (jdbc/with-db-transaction [tx db-spec]
    (let [id (create-document<! {:document document-id
                                 :file file
                                 :name name
                                 :project project-id} {:connection tx})]
      (populate-marginalia {:connection tx} project-id document-id)
      id)))

(defn get-by-project
  [project-id & {:keys [marginalia] :or {marginalia false}}]
  (if marginalia
    (let [documents (documents-by-project-with-marginalia {:project project-id})]
      (map #(assoc % :marginalia (json-decode (:marginalia %))) documents))
    (documents-by-project {:project project-id})))

(defn update!
  [project-id document-id marginalia]
  (update-marginalia! {:marginalia marginalia
                       :document document-id
                       :project project-id}))
