(ns vortext.layout
  (:gen-class)
  (:require [selmer.parser :as parser]
            [clojure.string :as s]
            [ring.util.response :refer [content-type response]]
            [ring.middleware.anti-forgery :refer [*anti-forgery-token*]]
            [compojure.response :refer [Renderable]]
            [environ.core :refer [env]]
            [vortext.security :as security]
            [vortext.util :refer [last-commit]]))

(def template-path "templates/")

(deftype RenderableTemplate [template params]
  Renderable
  (render [this request]
    (content-type
     (->> (assoc params
               :page template
               :dev (env :dev)
               :user-id (security/current-user request)
               :last-commit last-commit
               :csrf-token *anti-forgery-token*
               :servlet-context
               (if-let [context (:servlet-context request)]
                 ;; If we're not inside a serlvet environment (for
                 ;; example when using mock requests), then
                 ;; .getContextPath might not exist
                 (try (.getContextPath context)
                      (catch IllegalArgumentException _ context))))
        (parser/render-file (str template-path template))
        response)
     "text/html; charset=utf-8")))

(defn render [template & [params]]
  (RenderableTemplate. template params))

(defn render-to-response
  [template & [params]]
  (.render (render template params) {}))
