/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  var Backbone = require("backbone");
  var React = require("react");

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
      case "select":
        var fingerprint = PDFModel.get("fingerprint");
        viewerComponent.setState({select: obj});
        self.router.navigate("view/" + fingerprint + "/a/" + obj);
        break;
      default:
        PDFModel.setActiveAnnotations(marginaliaModel);
        marginaliaComponent.forceUpdate();
      }
   });

    PDFModel
      .on("change:raw", function(e, obj) {
        var fingerprint = obj.pdfInfo.fingerprint;
        self.router.navigate("view/" + fingerprint);
        viewerComponent.setState({
          fingerprint: fingerprint
        });
      })
      .on("change:binary", function(e, obj) {
        marginaliaModel.reset();
        marginaliaComponent.setState({progress: "running"});
        topologiesModel.fetch("ebm", obj)
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
      })
      .on("change:pages", function(e, obj) {
        viewerComponent.forceUpdate();
      })
      .on("change:annotations", function(e, obj) {
        viewerComponent.forceUpdate();
      });

    Backbone.history.start({pushState: true});
  };
});
