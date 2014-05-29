/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['jQuery', 'backbone', 'PDFJS', 'models/results'], function($, Backbone, PDFJS, Results) {
  'use strict';
  PDFJS.workerSrc = 'static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = 'static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = false;

  var AppState = Backbone.Model.extend({
    initialize: function() {
      var self = this;
      var results = new Results();

      results.on("all", function(e, obj) {
        self.trigger("change:results");
      });

      this.set('results', results);
      this.on("change:data", function(e,data) {
        self.loadFromData(data);
      });
    },
    defaults: {
      data: null,
      pageOffsets: [],
      pdf: {}
    },
    populateResults: function(results) {
      var resultsCollection = this.get("results");
      resultsCollection.reset(Results.prototype.parse(results));
    },
    loadFromData: function(data) {
      var self = this;

      PDFJS.getDocument(data).then(function(pdf) {
        self.set({pdf: pdf, textNodes: []});
      });

      var topologyURI = "topologies/ebm";
      var request = new XMLHttpRequest();
      request.open("POST", topologyURI, true);
      request.setRequestHeader('Content-Type', 'application/pdf');
      request.onload = function (e) {
        if (request.status >= 200 && request.status < 400) {
          var data = JSON.parse(request.responseText);
          self.set('pageOffsets', data.pages);
          self.populateResults(data.marginalia);
        } else {
          // handle error
        }
      };

      request.send(data);

    }
  });
  return AppState;
});
