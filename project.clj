(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :license {:name "GNU General Public License (GPL) v3"
            :url "https://www.gnu.org/copyleft/gpl.html"}
  :url "https://github.com/joelkuiper/spa"
  :main vortext.core
  :source-paths ["src/clj"]
  :java-source-paths ["src/java"]
  :plugins [[lein-environ "1.0.0"]]
  :env {:database-spec "//localhost:5432/spa"
        :database-user "spa"
        :database-password "develop"

        :port 8080
        :dev true}
  :profiles {:production {:env {:dev false}}
             :uberjar {:aot :all}}
  :jvm-opts ["-server" "-Djava.awt.headless=true"]
  :aliases {"migrate" ["trampoline" "run" "-m" "vortext.db.migrations" "migrate"]
            "rollback" ["trampoline" "run" "-m" "vortext.db.migrations" "rollback"]}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/tools.cli "0.3.1"]
                 [org.clojure/core.async "0.1.303.0-886421-alpha"]

                 [log4j "1.2.17" :exclusions [javax.mail/mail
                                              javax.jms/jms
                                              com.sun.jdmk/jmxtools
                                              com.sun.jmx/jmxri]]
                 [com.taoensso/timbre "3.4.0"]
                 [selmer "0.8.2"]
                 [commons-io/commons-io "2.4"]

                 [im.chit/cronj "1.4.3"]
                 [lib-noir "0.9.9"]
                 [noir-exception "0.2.3"]

                 [environ "1.0.0"]

                 [http-kit "2.1.19"]
                 [compojure "1.3.3"]
                 [ring/ring-devel "1.3.2"]
                 [ring/ring-anti-forgery "1.0.0"]

                 ;; JSON
                 [cheshire "5.4.0"]

                 ;; PDF
                 [org.apache.pdfbox/pdfbox "1.8.9"]
                 [org.bouncycastle/bcprov-jdk16 "1.46"] ; crypto

                 ;; Database connectivity
                 [yesql "0.5.0-beta2"]
                 [postgresql/postgresql "9.3-1102.jdbc41"]
                 [ragtime "0.3.8"] ; migrations
                 ])
