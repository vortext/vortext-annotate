/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  return function() {
    var self = this;

    // Models
    var projectModel = new (require("models/project"))();

    // Components
    var Project = require("jsx!components/project");

    var projectComponent = React.renderComponent(
      Project({project: projectModel}),
      document.getElementById("project")
    );

    // Dispatch logic
    // Listen to model change callbacks -> trigger updates to components
    projectModel.on("all", function(e, obj) {
      projectComponent.setState({project: projectModel.toJSON()});
    });

  };
});
