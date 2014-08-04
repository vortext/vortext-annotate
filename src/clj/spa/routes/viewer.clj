(ns spa.routes.viewer
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [compojure.route :as route]
            [noir.util.route :refer [def-restricted-routes]]
            [spa.db.core :as db]
            [noir.session :as session]
            [spa.layout :as layout]))

(defroutes viewer-routes)

(defn viewer-page []
  (layout/render "viewer.html" {:bootstrap-script "main" :page-type "view"}))

(def-restricted-routes viewer-routes
  (GET "/view/" [] (viewer-page))
  (GET "/view/:fingerprint" [] (viewer-page))
  (GET "/view/:fingerprint/a/:annotation" [] (viewer-page))

  (GET "/document/:fingerprint" [fingerprint]
       (let [document (db/get-document fingerprint)]
         (if document
           {:status 200
            :body (clojure.java.io/input-stream (:file document))
            :headers {"Content-Type" "application/pdf"}}
           (route/not-found "Page not found"))))
  (GET "/document/:fingerprint/marginalia" [fingerprint]
       (let [marginalis (db/get-marginalis (session/get :user-id) fingerprint)]
         (if marginalis
           {:status 200
            :body (:marginalis marginalis)
            :headers {"Content-Type" "application/json"}}
           (route/not-found "Page not found")))))
