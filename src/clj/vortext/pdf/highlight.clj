(ns vortext.pdf.highlight
  (:require [clojure.string :as s]
            [taoensso.timbre :as timbre])
  (:import vortext.TextHighlight
           java.util.regex.Pattern
           org.apache.commons.io.IOUtils
           org.apache.pdfbox.pdmodel.PDDocument
           org.apache.pdfbox.pdfparser.PDFParser
           org.apache.pdfbox.pdmodel.graphics.color.PDGamma
           org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation
           org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationTextMarkup))

(timbre/refer-timbre)

(defn ^PDGamma rgb-to-gamma
  [[r g b]]
  (doto (PDGamma.)
    (.setR (float (/ r 255)))
    (.setG (float (/ g 255)))
    (.setB (float (/ b 255)))))

(defn ^PDDocument parse-document
  "Creates a parsed PDDocument from the input stream.
   Does not close the input stream."
  [^java.io.InputStream input]
  (let [parser (PDFParser. input)]
    (.parse parser)
    (PDDocument. (.getDocument parser))))

(defn ^:private highlight
  "Creates a highlight with {color, description, pattern}"
  [^TextHighlight highlighter highlight]
  (let [annotations (.highlightDefault highlighter (:pattern highlight))]
    (doall (map (fn [^PDAnnotationTextMarkup a]
                  (.setConstantOpacity a (float 0.3))
                  (.setColour a (rgb-to-gamma (:color highlight)))
                  (.setContents a (:content highlight))) annotations))))

(defn highlight-document
  [input output highlights]
  (let [document (parse-document input)
        highlighter (doto (TextHighlight. "UTF-8")
                      (.setSkipAllWhitespace true)
                      (.setNormalizeText true)
                      (.initialize document))]
    (doall (map (fn [h] (highlight highlighter h)) highlights))
    (.setAllSecurityToBeRemoved document true)
    (.save document output)
    (.close document)
    output))
