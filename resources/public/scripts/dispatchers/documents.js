/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  require("PDFJS");

  PDFJS.workerSrc = '/static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = '/static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = !Modernizr.webgl;

  // Models
  var documentsModel = new (require("models/documents"))();

  // Components
  var Documents = require("jsx!components/documents");

  var documentsComponent = React.renderComponent(
    Documents({documents: documentsModel}),
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
