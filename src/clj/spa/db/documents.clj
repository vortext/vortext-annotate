(ns spa.db.documents
  (:refer-clojure :exclude [get])
  (:require [spa.db.schema :refer [db-spec]]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/documents.sql")
