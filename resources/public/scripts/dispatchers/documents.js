/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  var PDFJS = require("PDFJS");
  var PDFJSUrl = require.toUrl('PDFJS');

  PDFJS.cMapUrl = PDFJSUrl.replace(/\/pdf$/, '') + '/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = false;

  PDFJS.workerSrc = PDFJSUrl + ".worker.js";

  // Models
  var documentsModel = new (require("models/documents"))();

  // Components
  var Documents = React.createFactory(require("jsx!components/documents"));

  var documentsComponent = React.render(
    new Documents({documents: documentsModel}),
    document.getElementById("documents")
  );

  // Dispatch logic
  // Listen to model change callbacks -> trigger updates to components
  documentsModel.on("all", function(e, obj) {
    documentsComponent.setState({documents: documentsModel.toJSON()});
  });

  // Set initial state
  documentsModel.reset(window.models.documents);

});
