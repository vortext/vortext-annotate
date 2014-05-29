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
      pageOffsets: [],
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
      this.on("change:data", function(e,data) {
        self.loadFromData(data);
      });
    },
    setActiveAnnotations: function() {
      var self = this;
      var pageOffsets = this.get("pageOffsets");
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
      // substract pageOffset from each nodes' interval and range
      _.each(acc, function(page) {
        _.each(page, function(annotation) {
          _.each(annotation, function(node)  {
            var pageOffset = pageOffsets[node.pageIndex].offset;
            var substract = function(vec, num) {
              return _.map(_.clone(vec), function(x) { return  x - num; });
            };
            node.range = substract(node.range, pageOffset);
            node.interval = substract(node.interval, pageOffset);
          });
        });
      });
      this.set("activeAnnotations", acc);
    },
    populateResults: function(results) {
      var resultsCollection = this.get("results");
      resultsCollection.reset(Results.prototype.parse(results));
    },
    loadFromData: function(data) {
      var self = this;
      this.get("results").reset();

      PDFJS.getDocument(data).then(function(pdf) {
        self.set({pdf: pdf, textNodes: [], pageOffsets: []});
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
