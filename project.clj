(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :url "https://github.com/joelkuiper/spa"
  :main spa.core
  :source-paths ["src/clj"]
  :java-source-paths ["src/java"]
  :license {:name "GNU General Public License (GPL) v3"
            :url "https://www.gnu.org/copyleft/gpl.html"}
  :plugins [[lein-environ "0.5.0"]]
  :env {:debug true
        :broker-socket "tcp://127.0.0.1:6667"
        :port 8080}
  :profiles {:dev {:dependencies [[peridot "0.3.0"]]}}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/tools.cli "0.3.1"]
                 [org.clojure/tools.logging "0.2.6"]
                 [ch.qos.logback/logback-classic "1.1.2"]

                 [environ "0.5.0"]

                 [http-kit "2.1.18"]
                 [compojure "1.1.5"]
                 [ring/ring-devel "1.2.1"]
                 [cheshire "5.3.1"]

                 [org.zeromq/jeromq "0.3.3"]
                 [org.zeromq/cljzmq "0.1.4" :exclusions [org.zeromq/jzmq]]

                 [prismatic/plumbing "0.2.2"]])
