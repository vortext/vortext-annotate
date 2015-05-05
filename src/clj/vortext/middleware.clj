(ns vortext.middleware
  (:require [vortext.session :as session]
            [vortext.security :as security]
            [vortext.util :refer [in-dev?]]
            [taoensso.timbre :as timbre]
            [selmer.middleware :refer [wrap-error-page]]
            [prone.middleware :refer [wrap-exceptions]]
            [ring.util.response :refer [redirect]]
            [ring.middleware.defaults :refer [site-defaults wrap-defaults]]
            [ring.middleware.session-timeout :refer [wrap-idle-session-timeout]]
            [noir-exception.core :refer [wrap-internal-error]]
            [ring.middleware.session.memory :refer [memory-store]]
            [ring.middleware.format :refer [wrap-restful-format]]
            [buddy.auth.accessrules :refer [wrap-access-rules]]
            [buddy.auth.middleware :refer [wrap-authentication wrap-authorization]]
            [buddy.auth.backends.session :refer [session-backend]]))

(defn development-middleware [handler]
  (if in-dev?
    (-> handler
       wrap-error-page
       wrap-exceptions)
    handler))

(def auth-backend
  (session-backend))

(defn production-middleware [handler]
  (-> handler
     (wrap-access-rules {:rules security/rules :redirect "/"})
     (wrap-authentication auth-backend)
     (wrap-authorization auth-backend)
     wrap-restful-format
     (wrap-idle-session-timeout
      {:timeout (* 60 30)
       :timeout-response (redirect "/")})
     (wrap-defaults
      (->
       site-defaults
       (assoc-in [:static :resources] (if in-dev? "public" "build"))
       (assoc-in [:session :store] (memory-store session/mem))))
     (wrap-internal-error :log #(timbre/error %))))
