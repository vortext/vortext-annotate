(ns spa.middleware
  (:require [taoensso.timbre :as timbre]
            [environ.core :refer [env]]
            [noir.util.middleware :refer :all]
            [selmer.middleware :refer [wrap-error-page]]
            [ring.middleware.anti-forgery :refer [wrap-anti-forgery]]
            [noir-exception.core :refer [wrap-internal-error wrap-exceptions]]))

(def common-middleware
  [wrap-strip-trailing-slash
   wrap-anti-forgery])

(def development-middleware
  [wrap-error-page
   wrap-exceptions])

(def production-middleware
  [#(wrap-internal-error % :log (fn [e] (timbre/error e)))])

(defn load-middleware []
  (concat common-middleware
          production-middleware
          (when (env :dev) development-middleware)))
