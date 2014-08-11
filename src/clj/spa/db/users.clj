(ns spa.db.users
  (:refer-clojure :exclude [get])
  (:require [spa.db.schema :refer [db-spec]]
            [clojure.java.io :as io]
            [yesql.core :refer [defquery defqueries]]
            [clojure.java.jdbc :as jdbc]))

(defqueries "sql/users.sql")

(def create! (partial create-user! db-spec))
(def update! (fn [id first_name last_name email]
               ((partial update-user! db-spec) first_name last_name email id)))
(def get (comp first (partial get-user db-spec)))
