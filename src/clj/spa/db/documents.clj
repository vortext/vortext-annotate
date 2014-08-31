(ns spa.db.documents
  (:refer-clojure :exclude [get])
  (:require [spa.db.schema :refer [db-spec]]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/documents.sql")


(defn get
  [fingerprint]
  (first (get-document db-spec fingerprint)))

(defn has?
  [project-id document-id]
  (:exists (first (has-document? db-spec document-id project-id))))

(defn add-to-project!
  [project-id fingerprint file name]
  (create-document<! db-spec fingerprint file name project-id))

(defn get-by-project
  [project-id]
  (documents-by-project db-spec project-id))
