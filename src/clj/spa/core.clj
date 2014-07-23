(ns spa.core
  (:import [ch.qos.logback.classic Level Logger]
           [org.slf4j LoggerFactory MDC])
  (:require [clojure.tools.logging :as log]
            [clojure.tools.cli :refer [parse-opts]]
            [clojure.string :as str]
            [ring.middleware.reload :as reload]
            [environ.core :refer [env]]
            [org.httpkit.server :refer :all]
            [org.httpkit.server :refer :all]
            [spa.app :refer [app]]
            [spa.topologies :as topologies]
            [spa.services :as services]))

(defonce server (atom nil))

(def logger ^ch.qos.logback.classic.Logger (LoggerFactory/getLogger Logger/ROOT_LOGGER_NAME))

(defn set-log-level!
  "Pass keyword :error :info :debug"
  [level]
  (case level
    :debug (.setLevel logger Level/DEBUG)
    :info (.setLevel logger Level/INFO)
    :error (.setLevel logger Level/ERROR)))

(defn stop-server! []
  (log/info "Stopping server on" (env :port) "by user request")
  (when-not (nil? @server)
    ;; graceful shutdown: wait for existing requests to be finished
    (@server :timeout 100)
    (reset! server nil))
  (shutdown-agents)
  (services/shutdown!)
  (log/info "… bye bye"))

(defn start-server! [port debug?]
  (let [handler (if debug?
                  (do (set-log-level! :debug)
                      (reload/wrap-reload app)) ;; only reload when in debug
                  (do (set-log-level! :info)
                      app))]
    (log/info "Starting server, listening on" port (str "[DEBUG:" debug? "]"))
    (.addShutdownHook (Runtime/getRuntime) (Thread. (fn [] (stop-server!))))
    (services/start!)
    (reset! server (run-server handler {:port port}))))

(def cli-options
  [["-p" "--port PORT" "Port number"
    :default (env :port)
    :parse-fn #(Integer/parseInt %)
    :validate [#(< 0 % 0x10000) "Must be a number between 0 and 65536"]]
   ["-d" "--debug" "Run server in debug mode, will attempt to hot reload code"
    :default (Boolean/valueOf (env :debug))
    :default-desc "false"
    :flag true]
   ["-h" "--help"]])

(defn usage [options-summary]
  (->> ["Runs the Spá server, a system for serving polyglot processing topologies over HTTP"
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
      "start" (start-server! (:port options) (:debug options))
      (exit 1 (usage summary)))))
