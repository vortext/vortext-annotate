/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  require('PDFJS'); // attaches to window

  var Q = require("Q");
  var _ = require("underscore");
  var Backbone = require("backbone");
  var Annotation = require("models/annotation");

  PDFJS.workerSrc = '/static/scripts/vendor/pdfjs/pdf.worker.js';
  PDFJS.cMapUrl = '/static/scripts/vendor/pdfjs/generic/web/cmaps/';
  PDFJS.cMapPacked = true;
  PDFJS.disableWebGL = !Modernizr.webgl;

  var guid = function() {
    // RFC4122 version 4 compliant
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  var escapeRegExp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/gm, "\\$&");
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
    _requestPage: function(model, pagePromise) {
      return pagePromise
        .then(function(raw) {
          model.set({
            raw: raw,
            state: RenderingStates.HAS_PAGE
          });
          return raw.getTextContent();
        })
        .then(function(content) {
          model.set({
            content: content,
            state: RenderingStates.HAS_CONTENT
          });
          return content;
        });
    },
    _buildAggregate: function() {
      this._aggregate = { totalLength: 0, nodes: [], pages: [], text: "" };
    },
    _appendAggregate: function(pageIndex, pageContent) {
      var totalLength = this._aggregate.totalLength;
      var offset = 0;
      var items = pageContent.items;
      for (var j = 0; j < items.length; j++) {
        var item = items[j];

        var str = item.str;
        var nextOffset = offset + str.length;
        var node = { pageIndex: pageIndex,
		                 nodeIndex: j,
		                 interval: { lower: totalLength + offset,
			                           upper: totalLength + nextOffset }};
        this._aggregate.text += str;
        offset = nextOffset;
        this._aggregate.nodes.push(node);
      }
      this._aggregate.pages.push({ offset: totalLength, length: offset });
      this._aggregate.totalLength += offset;
    },
    getAnnotations: function(matchStr, displayStr) {
      var self = this;
      var pattern = new RegExp(escapeRegExp(matchStr), "g");

      var annotations = [];
      var aggregate =  self._aggregate;

      var match;
      while((match = pattern.exec(aggregate.text)) !== null) {
        var lower = match.index;
        var upper = lower + match[0].length;

        var mapping = [];

        var nodes =  aggregate.nodes;
        var pages = aggregate.pages;
        var nrNodes = nodes.length;
        for(var i = 0; i < nrNodes; ++i) {
          var node = _.clone(nodes[i]);
          if(node.interval.lower < upper && lower < node.interval.upper) {
            var pageOffset = pages[node.pageIndex].offset;
            var interval = { lower: node.interval.lower - pageOffset,
                             upper: node.interval.upper - pageOffset};
            mapping.push(_.extend(node, { range: _.clone(interval),
                                          interval: _.clone(interval)}));
          }
        }
        if(!_.isEmpty(mapping)) {
          mapping[0].range.lower = lower - pages[mapping[0].pageIndex].offset;
          mapping[mapping.length - 1].range.upper = upper - pages[mapping[mapping.length - 1].pageIndex].offset;
        }
        annotations.push(new Annotation({
          content: displayStr,
          mapping: mapping,
          uuid: guid()
        }));
      }
      return annotations;
    },
    populate: function(pdf) {
      var self  = this;

      this._buildAggregate();

      var pageQueue = _.range(0, pdf.numPages);
      var pages = _.map(pageQueue, function(pageNr) {
        return new Page();
      });
      this.reset(pages, {silent: true}); // set a bunch of empty pages

      var process = function(arr) {
        if(arr.length === 0) {
          self.trigger("ready");
          return;
        }
        var pageIndex = _.first(arr);
        var page = pages[pageIndex];
        page.set({state: RenderingStates.RUNNING});
        var p = self._requestPage(page, pdf.getPage(pageIndex + 1));
        p.then(function(content) {
          process(_.rest(arr));
          self._appendAggregate(pageIndex, content);
        });
      };
      process(pageQueue);
    }
  });

  var Document = Backbone.Model.extend({
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
    emitAnnotation: function(selection) {
      var annotations = this.get("pages").getAnnotations(selection.pattern, selection.display);
      this.trigger("annotation:add", annotations);
    },
    setActiveAnnotations: function(marginalia) {
      // FIXME: UGLY HACK to set the active nodes based on the response JSON and selection
      var annotations = {};
      var self = this;
      marginalia.each(function(marginalis) {
        if(!marginalis.get("active")) return; // only consider the active ones
        var m =  marginalis.toJSON();
        marginalis.get("annotations").each(function(annotation) {
          var a =  annotation.toJSON();
          annotation.get("mapping").forEach(function(node) {
            var element = _.extend(_.clone(node), m, a);
            element.highlight = annotation.highlight.bind(annotation);
            element.destroy = annotation.destroy.bind(annotation);
            element.select = annotation.select.bind(annotation);

            annotations[node.pageIndex] = annotations[node.pageIndex] || {};
            annotations[node.pageIndex][node.nodeIndex] = _.union(annotations[node.pageIndex][node.nodeIndex] || [], element);
          });
        });
      });

      this.get("pages").map(function(page, pageIndex) {
        page.set({annotations: annotations[pageIndex] || {}});
      });
    },
    loadFromUrl: function(url) {
      var self = this;
      PDFJS.getDocument(url).then(function(pdf) {
        self.set({binary: null, raw: pdf, fingerprint: pdf.pdfInfo.fingerprint});
        self.get("pages").populate(pdf);
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

  return Document;
});
