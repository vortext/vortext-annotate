(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :url "https://github.com/joelkuiper/spa"
  :license {:name "GNU General Public License (GPL) v3"
            :url "https://www.gnu.org/copyleft/gpl.html"}
  :java-source-paths ["services/gen-java" "src/main/java"]
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/tools.cli "0.3.1"]
                 [ch.qos.logback/logback-classic "1.1.2"]
                 [org.clojure/tools.logging "0.2.6"]

                 [prismatic/plumbing "0.2.2"]

                 [thrift-clj "0.2.1"]
                 [org.clojure/core.async "0.1.298.0-2a82a1-alpha"]
                 [http-kit "2.1.18"]])
