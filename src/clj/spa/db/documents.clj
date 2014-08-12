(ns spa.db.users
  (:refer-clojure :exclude [get])
  (:require [spa.db.schema :refer [db-spec]]
            [clojure.java.io :as io]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/documents.sql")
