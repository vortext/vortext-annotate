(ns spa.middleware
  (:require [clojure.tools.logging :as log]
            [clojure.string :refer [upper-case]]
            [cheshire.core :as json]
            [ring.util.response :refer :all]
            [compojure.core :refer :all]
            [spa.util :as util]))

(defn- wrap-exception
  [_ e]
  (log/error (.getMessage e))
  (.printStackTrace e)
  (json/encode e))

(defn wrap-exception-handler
   " Middleware to handle exceptions thrown by the underlying code.

   - Returns `HTTP/400` when `InvalidArgumentException` was thrown,
     e.g. missing JSON arguments.
   - Returns `HTTP/500` for all unhandled thrown `Exception`."
  [handler]
  (fn [req]
    (try
      (handler req)
      (catch IllegalArgumentException e
        (->
          (response (wrap-exception req e))
          (status 400)))
      (catch Exception e
        (->
          (response (wrap-exception req e))
          (status 500))))))

(defn wrap-request-logger
  "Logs the request"
  [handler]
  (fn [req]
    (let [{remote-addr :remote-addr request-method :request-method uri :uri} req]
      (log/debug remote-addr (upper-case (name request-method)) uri)
      (handler req))))

(defn wrap-response-logger
  "Logs the response and the `Exception` body when one was present"
  [handler]
  (fn [req]
    (let [response (handler req)
          {remote-addr :remote-addr request-method :request-method uri :uri} req
          {status :status body :body} response]
      (if (instance? Exception body)
        (log/warn body remote-addr (upper-case (name request-method)) uri "->" status body)
        (log/debug remote-addr (upper-case (name request-method)) uri "->" status))
      response)))
