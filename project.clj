(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :url "https://github.com/joelkuiper/spa"
  :main spa.core
  :source-paths ["src/clj" "resource/topologies"]
  :java-source-paths ["src/java" "resources/topologies"]
  :license {:name "GNU General Public License (GPL) v3"
            :url "https://www.gnu.org/copyleft/gpl.html"}
  :plugins [[lein-environ "0.5.0"]]
  :env {:debug false
        :broker-socket "tcp://127.0.0.1:6667"
        :default-timeout 2500,
        :heartbeat-interval 2500,
        :reconnect-timeout 2500,
        :port 8080}
  :profiles {:dev {:dependencies [[peridot "0.3.0"]]}}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/tools.cli "0.3.1"]
                 [org.clojure/tools.logging "0.3.0"]
                 [ch.qos.logback/logback-classic "1.1.2"]

                 [environ "0.5.0"]

                 [http-kit "2.1.18"]
                 [compojure "1.1.5"]
                 [ring/ring-devel "1.3.0"]

                 [prismatic/plumbing "0.3.2"]

                 ;; serialization libraries
                 [com.google.protobuf/protobuf-java "2.5.0"]
                 [org.flatland/protobuf "0.8.1"]
                 [cheshire "5.3.1"]

                 [org.zeromq/jeromq "0.3.4"]
                 [org.zeromq/cljzmq "0.1.4" :exclusions [org.zeromq/jzmq]]])
