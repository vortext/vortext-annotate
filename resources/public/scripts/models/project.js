/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var Backbone = require("backbone");

  var Document = Backbone.Model.extend({
    defaults: {
      name: null
    }
  });

  var Project = Backbone.Collection.extend({
    model: Document
  });

  return Project;
});
