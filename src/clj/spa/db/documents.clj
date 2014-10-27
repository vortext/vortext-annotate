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

(defn get
  ([document-id]
     (let [sql "SELECT file FROM documents WHERE id = ?"
           tx (doto (jdbc/get-connection db-spec)
                (.setAutoCommit false))
           statement (jdbc/prepare-statement tx sql :fetch-size 1)]
       (.setString statement 1 document-id)
       (with-open [results (.executeQuery statement)]
         (when (.next results)
           (.getBinaryStream (.getBlob results "file"))))))
  ([document-id project-id]
     (first (get-for-project {:project project-id :document document-id}))))

(defn assoc!
  [document-id project-id]
  (assoc-document! {:document document-id
                    :project project-id}))

(defn dissoc!
  [document-id project-id]
  (let [args {:document document-id
              :project project-id}]
    (jdbc/with-db-transaction [tx db-spec]
      (dissoc-document! args {:connection tx}))))

(defn has?
  [project-id document-id]
  (:exists (first (has-document? {:document document-id
                                  :project project-id}))))

(defn insert-in-project!
  [project-id document-id ^java.io.File file name]
  (jdbc/with-db-transaction [tx db-spec]
    (when-not (every? :exists (exists-document? {:id document-id}))
      (insert-document! {:id document-id :file (.getAbsolutePath file)}))
    (assoc-document! {:document document-id :project project-id :name name})))

(defn get-by-project
  [project-id]
  (documents-by-project {:project project-id}))
