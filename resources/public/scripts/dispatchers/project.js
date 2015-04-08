/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  var Selectize = React.createFactory(require("jsx!components/selectize"));

  var project = window.models.project;
  var categories = _.pluck(project && project.categories, "title").join(",");

  var categoriesComponent = React.render(
    new Selectize({
      name: "categories",
      value: categories,
      options: {
        delimiter: ",",
        persist: false,
        create: true
      }
    }),
    document.getElementById("categories")
  );


});
