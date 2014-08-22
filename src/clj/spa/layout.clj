(ns spa.layout
  (:gen-class)
  (:require [selmer.parser :as parser]
            [clojure.string :as s]
            [ring.util.response :refer [content-type response]]
            [compojure.response :refer [Renderable]]
            [environ.core :refer [env]]
            [spa.util :refer [last-commit]]
            [noir.session :as session]))

(def template-path "templates/")

(deftype RenderableTemplate [template params]
  Renderable
  (render
    [this request]
    (content-type
     (->> (assoc
            params (keyword (s/replace template #".html" "-selected"))
            "active"
            :dev (env :dev)
            :last-commit last-commit
            :servlet-context (if-let [context (:servlet-context request)]
                               (try
                                 (.getContextPath context)
                                 (catch IllegalArgumentException _ context)))
            :user-id (session/get :user-id))
        (parser/render-file (str template-path template))
        response)
     "text/html; charset=utf-8")))

(defn render [template & [params]]
  (RenderableTemplate. template params))

(defn render-to-response
  [template & [params]]
  (.render (render template params) {}))
