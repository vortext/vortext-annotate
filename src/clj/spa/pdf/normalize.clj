(ns spa.pdf.normalize
  (:import java.io.InputStream
           java.io.ByteArrayOutputStream
           org.apache.commons.io.IOUtils)
  (:require [clojure.java.shell :refer [sh]]
            [clojure.java.io :as io]
            [clojure.core.async :as async :refer [go chan <! >!]]
            [taoensso.timbre :as timbre]))

(timbre/refer-timbre)

(defn- temp-file
  ([] (temp-file "spa" nil))
  ([prefix suffix]
     (doto (java.io.File/createTempFile prefix suffix)
       (.deleteOnExit))))

(defn- pdf->pdf-a
  [^java.io.File input-file ^java.io.File output-file]
  (let [in (.getAbsolutePath input-file)
        out (str "-sOutputFile=" (.getAbsolutePath output-file))]
    ["gs"
     "-q"
     "-dPARANOIDSAFER" ; do not allow access to the filesystem
     "-dSAFER"
     "-dNOOUTERSAVE"
     "-dPDFA=2" ; convert to PDF/A-2
     "-dPDFACompatibilityPolicy=1"
     "-dFastWebView" ; linearize document (although to-be ignored by PDF/A compliant viewers)
     "-sColorConversionStrategy=CMYK"
     "-dBATCH" "-dNOPAUSE"
     "-sDEVICE=pdfwrite" out in]))

(defn normalize-document
  "Normalizes a PDF document to be PDF/A-2 compliant using GhostScript.
  Returns a temporary file with the converted document"
  [^java.io.File in-file]
  (let [^java.io.File out-file (temp-file)]
    (pdf->pdf-a in-file out-file)
    (apply sh (pdf->pdf-a in-file out-file))
    out-file))
