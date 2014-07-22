/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['underscore', 'Q', 'backbone', 'PDFJS'], function(_, Q, Backbone, PDFJS) {
  'use strict';
  PDFJS.workerSrc = 'static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = 'static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = false;

  var RenderingStates = window.RenderingStates = {
    INITIAL: 0,
    RUNNING: 1,
    HAS_PAGE: 2,
    HAS_CONTENT: 3,
    FINISHED: 4
  };

  var Page = Backbone.Model.extend({
    defaults: {
      raw: null,
      content: null,
      state: RenderingStates.INITIAL
    }
  });

  var Pages = Backbone.Collection.extend({
    model: Page,
    _requestPage: function(model, pagePromise) {

      pagePromise
        .then(function(raw) {
          model.set({
            raw: raw,
            state: RenderingStates.RUNNING
          });
          return raw.getTextContent();
        })
        .then(function(content) {
          model.set({
            content: content,
            state: RenderingStates.FINISHED
          });
        });
    },
    populate: function(pdf) {
      var self  = this;
      var pages = _.map(_.range(1, pdf.numPages + 1), function(pageNr) {
        return new Page();
      });
      this.reset(pages); // set a bunch of empty pages
      _.each(pages, function(page, pageIndex) {
        page.set({ state: RenderingStates.RUNNING });
        self._requestPage(page, pdf.getPage(pageIndex + 1));
      });
    }
  });

  var PDF = Backbone.Model.extend({
    defaults: {
      binary: null,
      activeAnnotations: {},
      raw: null
    },
    initialize: function() {
      var self = this;
      var pages = new Pages();
      pages.on("change:state", function(e, obj) {
        self.trigger("change:pages", e, obj);
      });
      this.set("pages", pages);
    },
    setActiveAnnotations: function(marginalia) {
      // FIXME: ugly hack to set the active nodes based on the response JSON and selection
      var self = this;
      var acc = {};
      marginalia.each(function(result) {
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
            acc[node.pageIndex][node.nodeIndex] = _.union(acc[node.pageIndex][node.nodeIndex] || [], node);
          });
        });
      });
      this.set("activeAnnotations", acc);
    },
    loadFromData: function(data) {
      var self = this;
      this.set({ binary: data });
      PDFJS.getDocument(data).then(function(pdf) {
        self.set({ raw: pdf });
        self.get("pages").populate(pdf);
      });
    }
  });

  return PDF;
});
