(ns spa.util
  (:require [cheshire.generate :refer [add-encoder remove-encoder]]
            [cheshire.core :refer :all])
  (:import [com.fasterxml.jackson.core JsonGenerator]))

(add-encoder java.lang.Exception
             (fn [^Exception e ^JsonGenerator jg]
               (.writeStartObject jg)
               (.writeFieldName jg "exception")
               (.writeString jg (.getName (class e)))
               (.writeFieldName jg "message")
               (.writeString jg (.getMessage e))
               (.writeEndObject jg)))
