(ns spa.core-test
  (:require [clojure.test :refer :all]
            [peridot.core :refer :all]
            [spa.app :refer [app]]
            [spa.services :as services]
            [spa.core :refer :all]))

(use-fixtures :once
  (fn [f]
    (services/start!)
    (f)
    (services/shutdown!)))

(deftest test-root
  (let [response (-> (session app)
                    (request "/")
                    :response)]
    (is (= 200 (:status response)))))

(deftest test-example-topology
  (let [response (-> (session app)
              (request "/topologies/example"
                       :request-method :post
                       :content-type "application/text"
                       :body (.getBytes "2" "UTF-8"))
              :response)]
    (is (= 200 (:status response)))
    (is (= "result:6" (:body response)))))

(deftest test-missing-topology
  (let [response (-> (session app)
                    (request "/topologies/missing"
                             :request-method :post)
                    :response)]
    (is (= 400 (:status response)))))
