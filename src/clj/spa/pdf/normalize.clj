(ns spa.pdf.normalize
  (:import java.io.InputStream
           java.io.ByteArrayOutputStream
           org.apache.commons.io.IOUtils)
  (:require [clojure.java.shell :refer [sh]]
            [clojure.java.io :as io]
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
    (sh "gs"
        "-q"
        "-dPARANOIDSAFER" ; do not allow access to the filesystem
        "-dPDFA=2" ; convert to PDF/A-2
        "-dFastWebView" ; linearize document
        "-dBATCH" "-dNOPAUSE"
        "-sDEVICE=pdfwrite" out in)))

(defn normalize-document
  "Normalizes a PDF document to PDF/A-2 compatbible using GhostScript.
   Returns a byte array with the normalized PDF."
  [^InputStream input]
  (let [^java.io.File in-file (temp-file)
        ^java.io.File out-file (temp-file)
        pdf (atom nil)]
    (io/copy input in-file)
    (pdf->pdf-a in-file out-file)
    (with-open [f (io/input-stream out-file)]
      (reset! pdf (IOUtils/toByteArray f)))
    (.delete in-file)
    (.delete out-file)
    @pdf))
