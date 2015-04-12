(ns vortext.security
  (:refer-clojure :exclude [compare])
  (:require
   [vortext.util :refer [parse-int]]
   [vortext.db.projects :as projects]
   [vortext.db.documents :as documents]

   [clout.core :as clout]
   [taoensso.timbre :as timbre]
   [clojurewerkz.scrypt.core :as sc]
   [ring.util.response :refer [response redirect content-type]]
   [buddy.auth.accessrules :refer (success error)]
   [buddy.auth :refer [authenticated? throw-unauthorized]]))


;; Lifted from lib-noir
;; https://github.com/noir-clojure/lib-noir/blob/master/src/noir/util/crypt.clj
(defn encrypt
  "Encrypts a string value using scrypt.
  Arguments are:
  raw (string): a string to encrypt
  :n (integer): CPU cost parameter (default is 16384)
  :r (integer): RAM cost parameter (default is 8)
  :p (integer): parallelism parameter (default is 1)
  The output of SCryptUtil.scrypt is a string in the modified MCF format:
  $s0$params$salt$key
  s0     - version 0 of the format with 128-bit salt and 256-bit derived key
  params - 32-bit hex integer containing log2(N) (16 bits), r (8 bits), and p (8 bits)
  salt   - base64-encoded salt
  key    - base64-encoded derived key"
  [raw & {:keys [n r p]
          :or {n 16384 r 8 p 1}}]
  (sc/encrypt raw n r p))

(defn compare
  "Compare a raw string with an already encrypted string"
  [raw encrypted]
  (boolean
   (if (and raw encrypted)
     (sc/verify raw encrypted))))

;;;;;;;;;;;;;;;
;; Access rules
;;;;;;;;;;;;;;;
(defn current-user
  [request]
  (get-in request [:session :identity]))

(defn match
  [request routes]
  (into {} (map #(clout/route-matches % request) routes)))

(def restricted-routes
  ["/projects/*"
   "/projects"])
(defn logged-in?
  [request]
  (not (nil? (current-user request))))

(def project-routes
  ["/projects/:project-id"
   "/projects/:project-id/*"])
(defn is-owner?
  [request]
  (let [uri-params (match request project-routes)
        project-id (get uri-params :project-id "-1")]
    (cond (= project-id "new") true
          :else (projects/has? (current-user request) (parse-int project-id)))))

(def document-routes
  ["/projects/:project-id/documents/:document-id/*"
   "/projects/:project-id/documents/:document-id"])
(defn has-document?
  [request]
  (let [uri-params (match request document-routes)
        {project-id :project-id document-id :document-id} uri-params]
    (documents/has? (parse-int project-id) document-id)))

(def rules
  [{:uris document-routes
    :handler {:and [logged-in? is-owner? has-document?]}}
   {:uris project-routes
    :handler {:and [logged-in? is-owner?]}}
   {:uris restricted-routes
    :handler logged-in?}])
