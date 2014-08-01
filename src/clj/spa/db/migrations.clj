(ns spa.db.migrations
  (:gen-class)
  (:require [environ.core :refer :all]
            [ragtime.main :as ragtime]))

(def db-spec (str "jdbc:postgresql:" (env :database-spec)
                  "?user=" (env :database-user)
                  "&password=" (env :database-password)))

(def migrations "ragtime.sql.files/migrations")

(defn -main [& args]
  (apply ragtime/-main
         "-r" "ragtime.sql.database"
         "-d" db-spec
         "-m" migrations
         args))
