/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
'use strict';

require.config({
  baseUrl: '/static/scripts',
  jsx: {
    fileExtension: '.jsx'
  },
  paths: {
    'jQuery': 'vendor/jquery',
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
  var appState = new AppState();

  // Global state
  window.appState = appState;

  var FileLoader = require("jsx!components/fileLoader");
  React.renderComponent(
    FileLoader({callback: appState.loadFromData.bind(appState), accept:".pdf", mimeType: /application\/(x-)?pdf|text\/pdf/}),
    document.getElementById("file-loader")
  );

  var Viewer = require("jsx!components/viewer");
  var viewer = React.renderComponent(
    Viewer({}),
    document.getElementById("viewer")
  );

  appState.on("change:pdf", function(e, obj) {
     if(viewer.isMounted) viewer.forceUpdate();
  });


  var Results = require("jsx!components/results");
  var results = React.renderComponent(
    Results({}),
    document.getElementById("results")
  );
  appState.on("change:results", function(e,obj) {
    viewer.forceUpdate();
    results.forceUpdate();
  });

  var Minimap = require("jsx!components/minimap");

  var target = "#viewer .viewer";
  var minimap = React.renderComponent(
    Minimap({ target: target }),
    document.getElementById("minimap")
  );

  appState.on("update:textNodes", function(e, obj) {
    if(minimap.isMounted) minimap.forceUpdate();
  });

});
