(ns spa.db.schema
  (:require [environ.core :refer :all]))

(def db-spec
  {:subprotocol "postgresql"
   :subname (env :database-spec)
   :user  (env :database-user)
   :password (env :database-password)})
