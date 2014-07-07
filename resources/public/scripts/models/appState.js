/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['underscore', 'Q', 'backbone', 'PDFJS', 'models/marginalia'], function(_, Q, Backbone, PDFJS, Marginalia) {
  'use strict';
  PDFJS.workerSrc = 'static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = 'static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = false;

  var AppState = Backbone.Model.extend({
    defaults: {
      activeAnnotations: {},
      textNodes: [],
      pdf: null
    },
    initialize: function() {
      var self = this;

      var marginalia = new Marginalia();
      marginalia.on("all", function(e, obj) {
        self.trigger("change:marginalia");
        self.setActiveAnnotations();
      });

      this.set('marginalia', marginalia);
    },
    setActiveAnnotations: function() {
      var self = this;
      var acc = {};
      this.get("marginalia").each(function(result) {
        var props = {
          type: result.get("id"),
          color: result.get("color"),
          active: result.get("active")
        };
        if(!props.active) return; // only consider the active ones
        _.each(result.get("annotations"), function(annotation) {
          _.each(annotation.mapping, function(node) {
            node = _.extend(node, props);
            acc[node["page-index"]] = acc[node["page-index"]] || {};
            acc[node["page-index"]][node["node-index"]] = Object.freeze(_.union(acc[node["page-index"]][node["node-index"]] || [], node));
          });
        });
      });
      this.set("activeAnnotations", Object.freeze(acc));
    },
    populateMarginalia: function(marginalia) {
      var marginaliaCollection = this.get("marginalia");
      marginaliaCollection.reset(Marginalia.prototype.parse(marginalia));
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
        var currentPdf = self.get("pdf");
        if(currentPdf && currentPdf.pdfInfo.fingerprint === pdf.pdfInfo.fingerprint) return;

        self.set({pdf: pdf, textNodes: []});
        self.get("marginalia").reset();

        self.callTopology("topologies/ebm", data).then(function(data) {
          self.populateMarginalia(data.marginalia);
        });
      });
    }
  });
  return AppState;
});
