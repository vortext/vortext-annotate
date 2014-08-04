(ns spa.db.core
  (:require [spa.db.schema :as schema]
            [korma.core :refer :all]
            [korma.db :refer [defdb transaction]]))

(defdb db schema/db-spec)

(declare users documents marginalia)

(defentity documents)
(defentity users)

(defentity marginalia
  (belongs-to users)
  (belongs-to documents))

(defn create
  [entity fields]
  (insert entity (values fields)))

(defn get-one
  [entity id]
  (first (select entity
                 (where {:id id})
                 (limit 1))))

(def create-user (partial create users))
(def create-document (partial create documents))
(def create-marginalis (partial create marginalia))

(def get-user (partial get-one users))
(def get-document (partial get-one documents))
(def get-marginalis (partial get-one marginalia))

(defn update-user
  [id first-name last-name email]
  (update users
  (set-fields {:first_name first-name
               :last_name last-name
               :email email})
  (where {:id id})))

(defn get-marginalis
  [user-id document-id]
  (first (select marginalia
                 (where {:documents_id document-id :users_id user-id})
                 (limit 1))))

(defn update-marginalis
  [user-id document-id marginalis]
  (update marginalia
          (set-fields {:marginalis marginalis})
          (where {:user_id user-id :document_id document-id})))

(defn has-marginalis?
  [user-id document-id]
  (> (count (get-marginalis user-id document-id)) 0))

(defn store-document
  [user-id document-id file marginalis]
  (transaction
   (if-not (get-document document-id)
     (create-document {:id document-id :file file}))
   (when (not (has-marginalis? user-id document-id))
     (create-marginalis {:users_id user-id :documents_id document-id :marginalis marginalis}))))
