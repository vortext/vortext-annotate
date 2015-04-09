(ns vortext.db.users
  (:refer-clojure :exclude [get])
  (:require [vortext.db.schema :refer [db-spec]]
            [clojure.java.io :as io]
            [yesql.core :refer [defquery defqueries]]
            [taoensso.timbre :as timbre]
            [clojure.java.jdbc :as jdbc]))

(timbre/refer-timbre)

(defqueries "sql/users.sql"
  {:connection db-spec})

(defn create!
  [id pass]
  (create-user! {:id id :pass pass}))

(defn update!
  [id first-name last-name email]
  (update-user! {:id id
                 :first first-name
                 :last last-name
                 :email email}))

(defn get
  [id]
  (first (get-user {:id id})))
