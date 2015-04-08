/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  require("PDFJS");

  var self = this;

  // Models
  var documentModel = new (require("spa/models/document"))();
  var marginaliaModel = new (require("spa/models/marginalia"))();

  // Components
  var Document =  React.createFactory(require("jsx!spa/components/document"));
  var Marginalia =  React.createFactory(require("jsx!spa/components/marginalia"));
  var TopBar =  React.createFactory(require("jsx!components/topBar"));

  var documentComponent = React.render(
    new Document({pdf: documentModel, marginalia: marginaliaModel}),
    document.getElementById("viewer")
  );

  var marginaliaComponent = React.render(
    Marginalia({marginalia: marginaliaModel}),
    document.getElementById("marginalia")
  );

  var topBar = React.render(
    TopBar({marginalia: marginaliaModel}),
    document.getElementById("top-bar")
  );

  // Routes
  var Router = Backbone.Router.extend({
    routes: {
      "projects/:project/documents/:fingerprint":                "view",
      "projects/:project/documents/:fingerprint/a/:annotation":  "view"
    },
    view: function(project, fingerprint, annotation) {
      marginaliaModel.reset();
      documentModel.loadFromUrl(window.location.href + "?mime=application/pdf");
    }
  });

  new Router();

  // Dispatch logic
  // Listen to model change callbacks -> trigger updates to components
  marginaliaModel.on("all", function(e, obj) {
    switch(e) {
    case "annotations:change":
      break;
    case "annotations:select":
      documentComponent.setState({select: obj});
      break;
    case "annotations:add":
    case "annotations:remove":
    case "change:description":
      marginaliaModel.save(
        function() {topBar.setState({isSaving: "saving"});},
        function() {topBar.setState({isSaving: "done"});},
        function(err) {topBar.setState({isSaving: "error"});}
      );
      documentModel.annotate(marginaliaModel.getActive());
      marginaliaComponent.forceUpdate();
      break;
    default:
      documentModel.annotate(marginaliaModel.getActive());
      marginaliaComponent.forceUpdate();
    }
  });

  documentModel.on("all", function(e, obj) {
    switch(e) {
    case "change:raw":
      documentComponent.setState({
        fingerprint: documentModel.get("fingerprint")
      });
      break;
    case "change:binary":
      marginaliaModel.reset();
      break;
    case "pages:change:state":
      if(obj.get("state") == window.RenderingStates.HAS_CONTENT) {
        documentModel.annotate(marginaliaModel.getActive());
      }
      documentComponent.forceUpdate();
      break;
    case "pages:ready":
    case "pages:change:annotations":
      documentModel.annotate(marginaliaModel.getActive());
      documentComponent.forceUpdate();
      break;
    default:
      break;
    }
  });

  Backbone.history.start({pushState: true});

  // Set initial state
  marginaliaModel.reset(marginaliaModel.parse(window.models.marginalia));

});
