/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['underscore', 'Q', 'backbone', 'PDFJS', 'models/annotation'], function(_, Q, Backbone, PDFJS, Annotation) {
  'use strict';
  PDFJS.workerSrc = '/static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = '/static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = !Modernizr.webgl;

  var pseudoUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

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
      annotations: {},
      content: null,
      state: RenderingStates.INITIAL
    }
  });

  var Pages = Backbone.Collection.extend({
    model: Page,
    __requestPage: function(model, pagePromise) {
      return pagePromise
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
          return content;
        });
    },
    __buildCache: function() {
      this.__cache = { totalLength: 0, nodes: [], pages: [], text: "" };
    },
    __appendCache: function(pageIndex, pageContent) {
      var totalLength = this.__cache.totalLength;
      var offset = 0;
      var items = pageContent.items;
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var nextOffset = offset + item.str.length;
        var node = { pageIndex: pageIndex,
		                 nodeIndex: j,
		                 interval: { lower: totalLength + offset,
			                           upper: totalLength + nextOffset }};
        this.__cache.text += (item.str + "\n");
        offset = nextOffset + 1; // 1 added for the extra space in text join
        this.__cache.nodes.push(node);
      }
      this.__cache.pages.push({ offset: totalLength, length: offset });
      this.__cache.totalLength += offset;
    },
    getAnnotation: function(str) {
      var lower = this.__cache.text.indexOf(str);
      var upper = lower + str.length;
      var mapping = [];

      var nodes =  this.__cache.nodes;
      var pages = this.__cache.pages;
      var nrNodes = nodes.length;
      for(var i = 0; i < nrNodes; ++i) {
        var node = nodes[i];
        if(node.interval.lower < upper && lower < node.interval.upper) {
          var pageOffset = pages[node.pageIndex].offset;
          var interval = {lower: node.interval.lower - pageOffset, upper: node.interval.upper - pageOffset};
          mapping.push(_.extend(node, {range: _.clone(interval), interval: _.clone(interval)}));
        }
      }
      if(!_.isEmpty(mapping)) {
        mapping[0].range.lower = lower - pages[mapping[0].pageIndex].offset;
        mapping[mapping.length - 1].range.upper = upper - pages[mapping[mapping.length - 1].pageIndex].offset;

        return new Annotation({
          content: str,
          mapping: mapping,
          uuid: pseudoUUID()
        });
      }
      return null;
    },
    populate: function(pdf) {
      var self  = this;

      this.__buildCache();

      var pageQueue = _.range(0, pdf.numPages);
      var pages = _.map(pageQueue, function(pageNr) {
        return new Page();
      });
      this.reset(pages); // set a bunch of empty pages

      var process = function(arr) {
        if(arr.length === 0) return;
        var pageIndex = _.first(arr);
        var page = pages[pageIndex];
        page.set({state: RenderingStates.RUNNING});
        var p = self.__requestPage(page, pdf.getPage(pageIndex + 1));
        p.then(function(content) {
          process(_.rest(arr));
          self.__appendCache(pageIndex, content);
        });
      };
      process(pageQueue);
    }
  });

  var PDF = Backbone.Model.extend({
    defaults: {
      fingerprint: null,
      binary: null,
      raw: null
    },
    initialize: function() {
      var self = this;
      var pages = new Pages();
      this.set("pages", pages);
      pages.on("all", function(e, obj) {
        self.trigger("pages:" + e, obj);
      });
    },
    emitAnnotation: function(str) {
      var annotation = this.get("pages").getAnnotation(str);
      this.trigger("annotation:add", annotation);
    },
    setActiveAnnotations: function(marginalia) {
      // FIXME: ugly hack to set the active nodes based on the response JSON and selection
      var annotations = {};
      var self = this;
      marginalia.each(function(marginalis) {
        if(!marginalis.get("active")) return; // only consider the active ones
        var m =  marginalis.toJSON();
        marginalis.get("annotations").each(function(annotation) {
          var a =  annotation.toJSON();
          annotation.get("mapping").forEach(function(node) {
            node = _.extend(_.clone(node), m, a);
            annotations[node.pageIndex] = annotations[node.pageIndex] || {};
            annotations[node.pageIndex][node.nodeIndex] = _.union(annotations[node.pageIndex][node.nodeIndex] || [], node);
          });
        });
      });

      this.get("pages").map(function(page, pageIndex) {
        page.set({annotations: annotations[pageIndex] || {}});
      });
    },
    loadFromData: function(data) {
      var self = this;
      this.set({binary: data});
      PDFJS.getDocument(data).then(function(pdf) {
        self.set({raw: pdf, fingerprint: pdf.pdfInfo.fingerprint});
        self.get("pages").populate(pdf);
      });
    }
  });

  return PDF;
});
