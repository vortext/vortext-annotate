(ns spa.core-test
  (:require [clojure.test :refer :all]
            [peridot.core :refer :all]
            [spa.services :as services]
            [spa.core :refer :all]))

(use-fixtures :once
  (fn [f]
    (services/start!)
    (f)
    (services/shutdown!)))

(deftest test-root
  (-> (session app)
     (request "/")))

(deftest test-example-topology
  (is (= "6" (-> (session app)
              (request "/topologies/example"
                       :request-method :post
                       :content-type "application/text"
                       :body (.getBytes "2" "UTF-8"))
              :response
              :body))))
