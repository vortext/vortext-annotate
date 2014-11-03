(ns spa.semantic.sparql
  (:require [cheshire.core :as json])
  (:import
   [java.net URL URI]
   [com.hp.hpl.jena.graph Node]
   [com.hp.hpl.jena.update
    Update UpdateAction
    UpdateFactory UpdateProcessor
    UpdateRequest UpdateExecutionFactory]
   [com.hp.hpl.jena.rdf.model Model
    RDFNode Resource Literal]
   [com.hp.hpl.jena.query
    Query QuerySolution QueryExecution
    QueryExecutionFactory QueryFactory QuerySolutionMap
    ParameterizedSparqlString
    ResultSetFactory ResultSet ResultSetFormatter]))

(defn query-with-bindings
  [query bindings]
  (let [pq (ParameterizedSparqlString. ^String query)]
    (doall
     (map
      (fn [[name resource]]
        (condp instance? resource
          URL (.setIri pq ^String name ^URL resource)
          URI (.setIri pq ^String name ^String (str resource))
          Node (.setParam pq ^String name ^Node resource)
          RDFNode (.setParam pq ^String name ^RDFNode resource)
          (.setLiteral pq name resource)))
      bindings))
    (.toString pq)))

(defn- query-exec
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

(defn describe
  [^String endpoint ^String query bindings]
  (with-open [q ^QueryExecution (query-exec endpoint query bindings)]
    (.execDescribe q)))

(defn ask
  [^String endpoint ^String query bindings]
  (with-open [q ^QueryExecution (query-exec endpoint query bindings)]
    (.execAsk q)))

(defn update
  [^String endpoint ^String query bindings]
  (let [q (query-with-bindings query bindings)
        ^UpdateRequest update (UpdateFactory/create q)
        ^UpdateProcessor processor (UpdateExecutionFactory/createRemote update endpoint)]
    (.execute processor)))

(defn output-stream []
  (java.io.ByteArrayOutputStream.))

;; Convert ResultSet
(defn result->json
  [^ResultSet result]
  (let [^java.io.OutputStream out (output-stream)]
    (ResultSetFormatter/outputAsJSON out result)
    (str out)))

(defn result->csv
  [^ResultSet result]
  (let [^java.io.OutputStream out (output-stream)]
    (ResultSetFormatter/outputAsCSV out result)
    (str out)))

(defn result->xml
  [^ResultSet result]
  (let [^java.io.OutputStream out (output-stream)]
    (ResultSetFormatter/outputAsXML out result)
    (str out)))

(defn result->clj
  [^ResultSet result]
  (json/decode (result->json result) true))

(defn result->model
  [^ResultSet result]
  (ResultSetFormatter/toModel result))

;; Convert model
(defn serialize-model
  [^Model model ^String lang]
  (with-open [w (java.io.StringWriter.)]
    (.write model w lang)
    (str w)))

(defn model->rdf+xml [^Model model] (serialize-model model "RDF/XML"))
(defn model->ttl [^Model model] (serialize-model model "TTL"))
(defn model->json-ld [^Model model] (serialize-model model "JSONLD"))
