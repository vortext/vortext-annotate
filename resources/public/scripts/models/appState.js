/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['underscore', 'Q', 'backbone', 'PDFJS', 'models/results'], function(_, Q, Backbone, PDFJS, Results) {
  'use strict';
  PDFJS.workerSrc = 'static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = 'static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = false;

  var AppState = Backbone.Model.extend({
    defaults: {
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
            acc[node.pageIndex][node.node] = Object.freeze(_.union(acc[node.pageIndex][node.node] || [], node));
          });
        });
      });
      this.set("activeAnnotations", Object.freeze(acc));
    },
    populateResults: function(results) {
      var resultsCollection = this.get("results");
      resultsCollection.reset(Results.prototype.parse(results));
    },
    callTopology: function(uri, data) {
      var deferred = Q.defer();
      var xhr = new XMLHttpRequest();
      xhr.open("POST", uri, true);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.onload = function (e) {
        if (xhr.status >= 200 && xhr.status < 400) {
          var data = JSON.parse(xhr.responseText);
          deferred.resolve(data);
        } else {
          deferred.reject(data);
        }
      };

      xhr.send(data);
      return deferred.promise;
    },
    loadFromData: function(data) {
      var self = this;

      PDFJS.getDocument(data).then(function(pdf) {
        if(self.get("pdf").pdfInfo && self.get("pdf").pdfInfo.fingerprint === pdf.pdfInfo.fingerprint) return;

        self.set({pdf: pdf, textNodes: []});
        self.get("results").reset();

        self.callTopology("topologies/ebm", data).then(function(data) {
          self.populateResults(data.marginalia);
        });

      });

    }
  });
  return AppState;
});
