/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  'use strict';

  function setStates(components, newState) {
    components.forEach(function(component) {
      component.setState(newState);
    });
  }

  return function() {
    var React = require("react");

    // Models
    var PDFModel = new (require("models/pdf"))();
    var marginaliaModel = new (require("models/marginalia"))();
    var topologiesModel = new (require("models/topologies"))();

    // Components
    var Viewer = require("jsx!components/viewer");
    var FileLoader = require("jsx!components/fileLoader");
    var Marginalia = require("jsx!components/marginalia");
    var Minimap = require("jsx!components/minimap");

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
      Marginalia({}),
      document.getElementById("marginalia")
    );

    var minimapComponent = React.renderComponent(
      Minimap({ target: "#viewer .viewer" }),
      document.getElementById("minimap")
    );

    marginaliaModel.on("all", function(e, obj) {
      PDFModel.setActiveAnnotations(marginaliaModel);
      marginaliaComponent.setState({
        marginalia: marginaliaModel
      });
    });

    PDFModel
      .on("change:binary", function(e, obj) {
        marginaliaModel.reset();
        topologiesModel.call("topologies/ebm", obj).then(function(data) {
          marginaliaModel.reset(marginaliaModel.parse(data.marginalia));
        });
      })
      .on("change:raw", function(e, obj) {
        viewerComponent.setState({ pdf: PDFModel });
      })
      .on("change:pages", function(e, obj) {
        viewerComponent.setState({ pdf: PDFModel });
      })
      .on("change:activeAnnotations", function(e, obj) {
        setStates([viewerComponent], { annotations: obj });
      });

  };
});
