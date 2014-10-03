(ns spa.middleware
  (:require [taoensso.timbre :as timbre]
            [environ.core :refer [env]]
            [noir.util.middleware :refer :all]
            [selmer.middleware :refer [wrap-error-page]]
            [ring.middleware.anti-forgery :refer [wrap-anti-forgery]]
            [ring.middleware.format :refer [wrap-restful-format]]
            [noir-exception.core :refer [wrap-internal-error wrap-exceptions]]))

(def common-middleware
  [wrap-strip-trailing-slash
   wrap-anti-forgery
   wrap-restful-format])

(def development-middleware
  [wrap-error-page
   wrap-exceptions])

(def production-middleware
  [#(wrap-internal-error % :log (fn [e] (timbre/error e)))])

(defn load-middleware []
  (concat common-middleware
          (when (env :dev) development-middleware)
          production-middleware))
