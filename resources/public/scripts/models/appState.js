/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['underscore', 'backbone', 'PDFJS', 'models/results'], function(_, Backbone, PDFJS, Results) {
  'use strict';
  PDFJS.workerSrc = 'static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = 'static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = false;

  var AppState = Backbone.Model.extend({
    defaults: {
      data: null,
      activeAnnotations: {},
      textNodes: [],
      pdf: {}
    },
    initialize: function() {
      var self = this;

      var results = new Results();
      results.on("all", function(e, obj) {
        self.setActiveAnnotations();
        self.trigger("change:results");
      });

      this.set('results', results);
    },
    setActiveAnnotations: function() {
      var self = this;
      var acc = {};
      this.get("results").each(function(result) {
        var props = {
          type: result.get("id"),
          color: result.get("color"),
          active: result.get("active")
        };
        if(!props.active) return; // only consider the active ones
        _.each(result.get("annotations"), function(annotation) {
          _.each(annotation.mapping, function(node) {
            node = _.extend(node, props);
            acc[node.pageIndex] = acc[node.pageIndex] || {};
            acc[node.pageIndex][node.node] = _.union(acc[node.pageIndex][node.node] || [], _.clone(node));
          });
        });
      });
      this.set("activeAnnotations", Object.freeze(acc));
    },
    populateResults: function(results) {
      var resultsCollection = this.get("results");
      resultsCollection.reset(Results.prototype.parse(results));
    },
    loadFromData: function(data) {
      var self = this;
      this.get("results").reset();

      PDFJS.getDocument(data).then(function(pdf) {
        self.set({pdf: pdf, textNodes: []});
      });

      var topologyURI = "topologies/ebm";
      var xhr = new XMLHttpRequest();
      xhr.open("POST", topologyURI, true);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.onload = function (e) {
        if (xhr.status >= 200 && xhr.status < 400) {
          var data = JSON.parse(xhr.responseText);
          self.set('pageOffsets', data.pages);
          self.populateResults(data.marginalia);
        } else {
          // handle error
        }
      };
      xhr.addEventListener("progress", function(e) {
        // normalize position attributes across XMLHttpRequest versions and browsers
        var position = e.position || e.loaded;
        var total = e.totalSize || e.total;
        // report progress
      });

      xhr.send(data);

    }
  });
  return AppState;
});
