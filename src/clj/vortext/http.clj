(ns vortext.http
  (:require [compojure.core :refer :all]
            [taoensso.timbre :as timbre]
            [clojure.core.async :as async :refer [close! chan go <! >!]]
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
