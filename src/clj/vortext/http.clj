(ns vortext.http
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [clojure.core.async :as async :refer [close! chan go <! >!]]
            [ring.util.response :as resp]
            [cheshire.core :as json]
            [org.httpkit.server :as http]))


(timbre/refer-timbre)

(defn async
  "Long-polling/Comet handler.
   Takes a core.async chan and sends the response when available"
  [request c]
  (http/with-channel request channel
    (async/go-loop [v (<! c)]
      (http/send! channel v)
      (close! c))
    (http/on-close channel (fn [_] (async/close! c)))))


(defn as-attachment
  [response file-name]
  (resp/header
   response
   "Content-Disposition"
   (str "attachment; filename=\"" file-name "\"")))


(defn pretty-json
  [body]
  (->
   body
   (json/encode {:pretty true})
   (resp/response)
   (resp/content-type "application/json")))

(def no-cache
  {"Cache-Control" "no-cache, no-store, must-revalidate"
   "Pragma" "no-cache"
   "Expires" "0"})
