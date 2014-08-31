/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  return function() {
    var self = this;

    // Models
    var documentModel = new (require("models/document"))();
    var marginaliaModel = new (require("models/marginalia"))();

    // Components
    var Viewer = require("jsx!components/viewer");
    var Marginalia = require("jsx!components/marginalia");

    var viewerComponent = React.renderComponent(
      Viewer({pdf: documentModel}),
      document.getElementById("viewer")
    );

    var marginaliaComponent = React.renderComponent(
      Marginalia({marginalia: marginaliaModel}),
      document.getElementById("marginalia")
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

    this.router = new Router();

    // Dispatch logic
    // Listen to model change callbacks -> trigger updates to components
    marginaliaModel.on("all", function(e, obj) {
      switch(e) {
      case "annotations:select":
        var fingerprint = documentModel.get("fingerprint");
        viewerComponent.setState({select: obj});
        //self.router.navigate("view/" + fingerprint + "/a/" + obj);
        break;
      case "annotations:change":
        break;
      default:
        documentModel.setActiveAnnotations(marginaliaModel);
        marginaliaComponent.forceUpdate();
      }
    });

    documentModel.on("all", function(e, obj) {
      switch(e) {
      case "change:raw":
        var fingerprint = obj.changed.raw.pdfInfo.fingerprint;
        //self.router.navigate("view/" + fingerprint);
        viewerComponent.setState({
          fingerprint: fingerprint
        });
        break;
      case "change:binary":
        // FIXME
        marginaliaModel.reset();
        break;
      case "annotation:add":
        var model = marginaliaModel.findWhere({"active": true}).get("annotations");
        model.add(obj);
        break;
      case "pages:change:state":
        viewerComponent.forceUpdate();
        break;
      case "pages:change:annotations":
        var annotations = marginaliaModel.pluck("annotations");
        var highlighted = _.find(annotations, function(annotation) { return annotation.findWhere({highlighted: true});});
        viewerComponent.setProps({highlighted: highlighted && highlighted.findWhere({highlighted: true})});
        break;
      default:
        break;
      }
    });

    Backbone.history.start({pushState: true});

    return this;
  };
});
