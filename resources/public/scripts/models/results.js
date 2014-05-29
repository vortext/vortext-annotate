/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(['jQuery', 'underscore', 'Q', 'backbone'], function($, _, Q, Backbone) {
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
    return str ? str.replace(/ /g, "-").toLowerCase() : null;
  };

  var Result = Backbone.Model.extend({
    defaults: {
      id: null,
      description: null,
      color: null,
      title: null,
      active: false,
      annotations: []
    }
  });

  var Results = Backbone.Collection.extend({
    model: Result,
    parse: function(raw) {
      var data = _.clone(raw);
      _.each(data, function(result, idx) {
        var id = result.id || toClassName(result.title);
        result.active = idx == 0 ? true : false;
        result.id = id;
        result.color = colors[idx % colors.length];
      });
      return data;
    }
  });

  return Results;
});
