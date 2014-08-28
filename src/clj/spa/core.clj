(ns spa.core
  (:gen-class)
  (:require [clojure.tools.cli :refer [parse-opts]]
            [clojure.string :as str]
            [ring.middleware.reload :as reload]
            [environ.core :refer [env]]
            [org.httpkit.server :as http-kit]
            [spa.handler :refer [app init! destroy!]]))

(def cli-options
  [["-p" "--port PORT" "Port number"
    :default (env :port)
    :parse-fn #(Integer/parseInt %)
    :validate [#(< 0 % 0x10000) "Must be a number between 0 and 65536"]]
   ["-d" "--dev" "Run server in development mode, will attempt to hot reload code"
    :default (Boolean/valueOf (env :dev))
    :default-desc "false"
    :flag true]
   ["-h" "--help"]])

(defn usage [options-summary]
  (->> ["Runs the server"
      ""
      "Usage: program-name [options] action"
      ""
      "Actions:"
      "  start    Start a new HTTP server"
      ""
      "Options:"
      options-summary]
     (str/join \newline)))

(defn error-msg [errors]
  (str "The following errors occurred while parsing your command:\n\n"
       (str/join \newline errors)))

(defn exit [status msg]
  (println msg)
  (System/exit status))

(defn -main [& args]
  (let [{:keys [options arguments errors summary]} (parse-opts args cli-options)]
    ;; Handle help and error conditions
    (cond
     (:help options) (exit 0 (usage summary))
     (not= (count arguments) 1) (exit 1 (usage summary))
     errors (exit 1 (error-msg errors)))
    ;; Execute program with options
    (case (first arguments)
      "start" (do (http-kit/run-server
                   (if (:dev options) (reload/wrap-reload app) app) {:port (:port options)})
                  (init!)
                  (.addShutdownHook (Runtime/getRuntime) (Thread. (fn [] (destroy!)))))
      (exit 1 (usage summary)))))
