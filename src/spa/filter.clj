(ns spa.filter
  (:import java.net.ServerSocket)
  (:require [thrift-clj.core :as thrift]))

(def registered-services (atom #{}))

(defn ephemeral-port
  "Returns first free ephemeral port"
  []
  (with-open [ss (ServerSocket. 0)]
    (.getLocalPort ss)))

(thrift/import
  (:types [spa.services.structs Document])
  (:clients spa.services.services.Filter))

(defn ping-service []
  (with-open [c (thrift/connect! Filter ["localhost" 9090] :protocol :binary)]
    (Filter/ping c)
    true))
