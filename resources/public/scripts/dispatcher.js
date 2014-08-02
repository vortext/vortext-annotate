/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");
  var _ = require("underscore");

  return function() {
    var self = this;

    // Models
    var PDFModel = new (require("models/pdf"))();
    var marginaliaModel = new (require("models/marginalia"))();
    var topologiesModel = new (require("models/topologies"))();

    // Components
    var Viewer = require("jsx!components/viewer");
    var FileLoader = require("jsx!components/fileLoader");
    var Marginalia = require("jsx!components/marginalia");

    var fileLoaderComponent = React.renderComponent(
      FileLoader({
        callback: PDFModel.loadFromData.bind(PDFModel),
        accept:".pdf",
		    mimeType: /application\/(x-)?pdf|text\/pdf/
      }),
      document.getElementById("file-loader")
    );

    var viewerComponent = React.renderComponent(
      Viewer({pdf: PDFModel}),
      document.getElementById("viewer")
    );

    var marginaliaComponent = React.renderComponent(
      Marginalia({marginalia: marginaliaModel}),
      document.getElementById("marginalia")
    );

    // Routes
    var Router = Backbone.Router.extend({
      routes: {
        "view/:fingerprint":                "view",
        "view/:fingerprint/a/:annotation":  "view"
      },
      view: function(fingerprint, annotation) {
        console.log(fingerprint, annotation);
      }
    });

    this.router = new Router();

    // Dispatch logic
    // Listen to model change callbacks -> trigger updates to components
    marginaliaModel.on("all", function(e, obj) {
      switch(e) {
      case "annotations:select":
        var fingerprint = PDFModel.get("fingerprint");
        viewerComponent.setState({select: obj});
        self.router.navigate("view/" + fingerprint + "/a/" + obj);
        break;
      case "annotations:change":
        break;
      default:
        PDFModel.setActiveAnnotations(marginaliaModel);
        marginaliaComponent.forceUpdate();
      }
   });

    PDFModel.on("all", function(e, obj) {
      switch(e) {
      case "change:raw":
        var fingerprint = obj.changed.raw.pdfInfo.fingerprint;
        self.router.navigate("view/" + fingerprint);
        viewerComponent.setState({
          fingerprint: fingerprint
        });
        break;
      case "change:binary":
        marginaliaModel.reset();
        marginaliaComponent.setState({progress: "running"});
        topologiesModel.fetch("ebm", obj.changed.binary)
          .then(
            function(data) {
              marginaliaModel.reset(marginaliaModel.parse(data.marginalia));
              marginaliaComponent.setState({progress: "done"});
            },
            function(error) {
              marginaliaComponent.setState({progress: "failed"});
            },
            function(progress) {
              marginaliaComponent.setState({progress: progress});
            }
          );
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
  };
});
