(ns spa.semantic.util
  (:require [cheshire.core :as json])
  (:import [com.hp.hpl.jena.rdf.model Model
            RDFNode Resource Literal]
           [com.hp.hpl.jena.query
            Query QuerySolution QueryExecution QueryExecutionFactory QueryFactory QuerySolutionMap
            ParameterizedSparqlString
            ResultSetFactory ResultSet ResultSetFormatter]))

(defn- ^String query-with-bindings
  [query bindings]
  (let [pq (ParameterizedSparqlString. ^String query)]
    (doall
     (map
      (fn [[name resource]]
        (condp instance? resource
          java.net.URL (.setIri pq ^String name ^java.net.URL resource)
          (.setLiteral pq name resource)))
      bindings))
    (.toString pq)))

(defn- ^QueryExecution query-exec
  [^String endpoint ^String query bindings]
  (QueryExecutionFactory/sparqlService
   endpoint
   ^String (query-with-bindings query bindings)))

(defn select
  [^String endpoint ^String query bindings]
  (with-open [q ^QueryExecution (query-exec endpoint query bindings)]
    (ResultSetFactory/copyResults (.execSelect q))))

(defn construct
  [^String endpoint ^String query bindings]
  (with-open [q ^QueryExecution (query-exec endpoint query bindings)]
    (.execConstruct q)))

(defn ask
  [^String endpoint ^String query bindings]
  (with-open [q ^QueryExecution (query-exec endpoint query bindings)]
    (.execAsk q)))

;; Convert ResultSet and Model
(defn result->json
  [^ResultSet result]
  (let [out (java.io.ByteArrayOutputStream.)]
    (ResultSetFormatter/outputAsJSON out result)
    (str out)))

(defn result->csv
  [^ResultSet result]
  (let [out (java.io.ByteArrayOutputStream.)]
    (ResultSetFormatter/outputAsCSV out result)
    (str out)))

(defn result->xml
  [^ResultSet result]
  (let [out (java.io.ByteArrayOutputStream.)]
    (ResultSetFormatter/outputAsXML out result)
    (str out)))

(defn result->clj
  [^ResultSet result]
  (json/decode (result->json result) true))

(defn serialize-model
  [^Model model ^String lang]
  (with-open [w (java.io.StringWriter.)]
    (.write model w lang)
    (str w)))

(defn model->rdf+xml
  [model]
  (serialize-model model "RDF/XML"))

(defn model->ttl
  [model]
  (serialize-model model "TTL"))

(defn model->json-ld
  [model]
  (serialize-model model "JSONLD"))
