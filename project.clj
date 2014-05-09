(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :url "https://github.com/joelkuiper/spa"
  :main spa.core
  :source-paths ["src" "src/main/clojure"]
  :java-source-paths ["src/main/java"] ; Java source is stored separately.
  :license {:name "GNU General Public License (GPL) v3"
            :url "https://www.gnu.org/copyleft/gpl.html"}
  :plugins [[lein-environ "0.5.0"]]
  :env {:debug true
        :port 8080}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/tools.cli "0.3.1"]
                 [org.clojure/tools.logging "0.2.6"]
                 [org.clojure/core.async "0.1.298.0-2a82a1-alpha"]
                 [org.clojure/tools.reader "0.8.4"]
                 [ch.qos.logback/logback-classic "1.1.2"]

                 [environ "0.5.0"]

                 [http-kit "2.1.18"]
                 [compojure "1.1.5"]
                 [ring/ring-devel "1.2.1"]
                 [cheshire "5.3.1"]

                 [org.zeromq/jeromq "0.3.3"]
                 [org.zeromq/cljzmq "0.1.4" :exclusions [org.zeromq/jzmq]]

                 [prismatic/plumbing "0.2.2"]])
