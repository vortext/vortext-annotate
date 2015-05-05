(defproject spa "0.1.0-SNAPSHOT"
  :description "Mozilla PDF.js based viewer for machine learning and information retrieval on text documents"
  :license {:name "GNU General Public License v3.0"
            :url "http://www.gnu.org/licenses/gpl-3.0.txt"
            :year 2015
            :key "gpl-3.0"}
  :url "https://github.com/vortext/"
  :main vortext.core
  :source-paths ["src/clj"]
  :java-source-paths ["src/java"]
  :plugins [[lein-license "0.1.3"]
            [lein-environ "1.0.0"]]
  :env {:database-spec "//localhost:5432/spa"
        :database-user "spa"
        :database-password "develop"

        :port 8080
        :dev true}

  :uberjar-name "vortext.jar"
  :profiles {:production {:env {:dev false}}
             :uberjar {:omit-source true
                       :env {:dev false
                             :production true}

                       :aot :all}}
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
                 [prone "0.8.1"]
                 [bouncer "0.3.2"]

                 [im.chit/cronj "1.4.3"]

                 [environ "1.0.0"]

                 [http-kit "2.1.19"]
                 [compojure "1.3.3"]

                 ;; JSON
                 [cheshire "5.4.0"]

                 [buddy "0.5.2"]
                 [ring/ring-defaults "0.1.4"]
                 [ring/ring-session-timeout "0.1.0"]
                 [ring-middleware-format "0.5.0"]
                 [noir-exception "0.2.5"]
                 [clojurewerkz/scrypt "1.2.0"]

                 ;; PDF
                 [org.apache.pdfbox/pdfbox "1.8.9"]
                 [org.bouncycastle/bcprov-jdk16 "1.46"] ; crypto


                 ;; Database connectivity
                 [yesql "0.5.0-rc2"]
                 [postgresql/postgresql "9.3-1102.jdbc41"]
                 [ragtime "0.3.8"] ; migrations
                 ])
