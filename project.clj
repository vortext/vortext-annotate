(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :license {:name "GNU General Public License (GPL) v3"
            :url "https://www.gnu.org/copyleft/gpl.html"}
  :url "https://github.com/joelkuiper/spa"
  :main spa.core
  :source-paths ["src/clj" "resource/topologies"]
  :java-source-paths ["src/java" "resources/topologies"]
  :plugins [[lein-environ "0.5.0"]]
  :env {:broker-socket "tcp://127.0.0.1:6667"
        :default-timeout 2500,
        :heartbeat-interval 2500,
        :reconnect-timeout 2500,

        :database-spec "//localhost:5432/spa"
        :database-user "spa"
        :database-password "develop"

        :port 8080
        :dev true}
  :profiles {:uberjar {:aot :all}
             :production {:env {:dev false}}}
  :jvm-opts ["-server"]
  :aliases {"migrate" ["trampoline" "run" "-m" "spa.db.migrations" "migrate"]
            "rollback" ["trampoline" "run" "-m" "spa.db.migrations" "rollback"]}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/core.async "0.1.303.0-886421-alpha"]
                 [org.clojure/tools.cli "0.3.1"]

                 [log4j "1.2.17" :exclusions [javax.mail/mail
                                              javax.jms/jms
                                              com.sun.jdmk/jmxtools
                                              com.sun.jmx/jmxri]]
                 [com.taoensso/timbre "3.2.1"]
                 [selmer "0.6.9"]

                 [im.chit/cronj "1.0.1"]
                 [lib-noir "0.8.4"]
                 [noir-exception "0.2.2"]

                 [environ "0.5.0"]
                 [org.blancas/kern "0.7.0"]

                 [http-kit "2.1.18"]
                 [compojure "1.1.5"]
                 [ring/ring-devel "1.3.0"]
                 [ring/ring-anti-forgery "1.0.0"]

                 [prismatic/plumbing "0.3.3"]

                 ;; serialization libraries
                 [org.flatland/protobuf "0.8.1"]
                 [cheshire "5.3.1"]

                 ;; Database connectivity
                 [korma "0.3.2"]
                 [postgresql/postgresql "9.1-901-1.jdbc4"]
                 [ragtime "0.3.6"] ; migrations

                 ;; ZeroMQ
                 [org.zeromq/jeromq "0.3.4"]
                 [org.zeromq/cljzmq "0.1.4" :exclusions [org.zeromq/jzmq]]])
