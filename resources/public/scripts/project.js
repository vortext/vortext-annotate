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
    'JSXTransformer': 'vendor/JSXTransformer',
    'backbone': 'vendor/backbone',
    'PDFJS': 'vendor/pdfjs/pdf'
  },
  shim: {
    'jQuery': { exports : 'jQuery' },
    'underscore': { exports : '_' },
    "backbone": {
      deps: ["jQuery", "underscore"],
      exports: "Backbone"
    },
    'PDFJS': {
      exports: 'PDFJS',
      deps: ['vendor/pdfjs/generic/web/compatibility', 'vendor/ui_utils'] }
  },
  urlArgs: LAST_COMMIT
});

define(function (require) {
  require('PDFJS'); // attaches to window

  PDFJS.workerSrc = '/static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = '/static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = !Modernizr.webgl;

  var Dispatcher = require("dispatchers/project");
  window.dispatcher = new Dispatcher();

  var Backbone = require("backbone");

  var _sync = Backbone.sync;
  Backbone.sync = function(method, model, options){
    options.beforeSend = function(xhr){
      xhr.setRequestHeader('X-CSRF-Token', CSRF_TOKEN);
    };
    return _sync(method, model, options);
  };
});
