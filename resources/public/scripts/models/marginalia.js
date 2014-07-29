/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(['underscore', 'backbone'], function(_, Backbone) {
  'use strict';

  var colors = // from Cynthia Brewer (ColorBrewer)
        [[102,166,30],
         [230,171,2],
         [117,112,179],
         [27,158,119],
         [217,95,2],
         [231,41,138],
         [166,118,29],
         [27,158,119],
         [217,95,2],
         [117,112,179],
         [231,41,138],
         [102,166,30],
         [230,171,2],
         [166,118,29],
         [102,102,102]];

  function toClassName(str) {
    return str.replace(/ /g, "-").toLowerCase();
  };

  var Annotation =  Backbone.Model.extend({
    defaults: {
      uuid: null,
      label: "",
      type: "",
      highlighted: false,
      content: "",
      mapping: {}
    },
    highlight: function() {
      var highlighted = !this.get("highlighted");
      this.set({ highlighted: highlighted });
    },
    select: function() {
      this.trigger("select", this.get("uuid"));
    }
  });

  var Annotations = Backbone.Collection.extend({
    model: Annotation
  });

  var Marginalis = Backbone.Model.extend({
    defaults: {
      id: null,
      description: null,
      color: null,
      title: null,
      active: false
    },
    initialize: function(data) {
      var self = this;
      var annotations = new Annotations(data.annotations);
      this.set("annotations", annotations);
      annotations.on("all", function(e, obj)  {
        self.trigger(e, obj);
      });
    }
  });

  var Marginalia = Backbone.Collection.extend({
    model: Marginalis,
    parse: function(data, options) {
      _.each(data, function(marginalis, idx) {
        var id = marginalis.id || toClassName(marginalis.title);
        marginalis.active = idx === 0;
        marginalis.id = id;
        marginalis.color = colors[idx % colors.length];
      });
      return data;
    }
  });

  return Marginalia;
});
