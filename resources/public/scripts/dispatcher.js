/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */

define(function (require) {
  return function() {
    var React = require("react");

    var AppState = require("models/appState");
    var appState = new AppState();

    // Global state
    window.appState = appState;

    // Components
    var Viewer = require("jsx!components/viewer");
    var FileLoader = require("jsx!components/fileLoader");
    var Marginalia = require("jsx!components/marginalia");
    var Minimap = require("jsx!components/minimap");

    var fileLoaderComponent = React.renderComponent(
      FileLoader({accept:".pdf",
		  mimeType: /application\/(x-)?pdf|text\/pdf/}),
      document.getElementById("file-loader")
    );

    var viewerComponent = React.renderComponent(
      Viewer({}),
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

    appState.on("change:pdf", function(e, obj) {
      viewerComponent.setState({
	pdf: appState.get("pdf")
      });
    });

    appState.on("change:activeAnnotations", function(e, obj) {
      viewerComponent.setState({
	annotations: appState.get("activeAnnotations")
      });
    });

    appState.on("change:marginalia", function(e,obj) {
      marginaliaComponent.forceUpdate();
    });

    appState.on("update:textNodes", function(e, obj) {
      minimapComponent.forceUpdate();
    });
  };
});
