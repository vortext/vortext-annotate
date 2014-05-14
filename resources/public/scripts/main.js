/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
'use strict';

require.config({
  baseUrl: '/static/scripts',
  jsx: {
    fileExtension: '.jsx'
  },
  paths: {
    'jQuery': 'vendor/jquery',
    'jQuery.injectCSS': 'vendor/jquery.injectCSS',
    'underscore': 'vendor/underscore',
    'Q': 'vendor/q',
    'react': 'vendor/react',
    'marked': 'vendor/marked',
    'JSXTransformer': 'vendor/JSXTransformer',
    'backbone': 'vendor/backbone',
    'PDFJS': 'vendor/pdfjs/pdf'
  },
  shim: {
    'jQuery': { exports : 'jQuery' },
    'underscore': { exports : '_' },
    "backbone": {
      deps: ["jQuery", "underscore"],
      exports: "Backbone" },
    'PDFJS': {
      exports: 'PDFJS',
      deps: ['vendor/pdfjs/generic/web/compatibility', 'vendor/ui_utils'] }
  }
});

define(function (require) {
  var React = require("react");
  var _ = require("underscore");
  var AppState = require("models/appState");
  var ResultsState = require("models/results");

  var appState = new AppState();
  var resultsState = new ResultsState();

  var FileLoader = require("jsx!components/fileLoader");
  React.renderComponent(
    FileLoader({model: appState, mimeType: /application\/(x-)?pdf|text\/pdf/}),
    document.getElementById("file-loader")
  );

  var Viewer = require("jsx!components/viewer");
  var viewer = React.renderComponent(
    Viewer({pdf: {}, results: resultsState, appState: appState }),
    document.getElementById("viewer")
  );

  var Results = require("jsx!components/results");
  var results = React.renderComponent(
    Results({results: resultsState}),
    document.getElementById("results")
  );

  resultsState.on("all", function(e, obj) {
    viewer.forceUpdate();
    results.forceUpdate();
  });

  var Minimap = require("jsx!components/minimap");

  var target = "#viewer .viewer";
  var minimap = React.renderComponent(
    Minimap({model: appState, target: target }),
    document.getElementById("minimap")
  );

  appState.on("update:textNodes", _.debounce(function(e, obj) {
    minimap.forceUpdate();
  }, 50));

  var $ = require("jQuery");
  appState.on("change:pdf", function(e, pdf) {
    $(target).scrollTop(0);
    viewer.setProps({pdf: pdf});
    resultsState.reset();
  });
});
