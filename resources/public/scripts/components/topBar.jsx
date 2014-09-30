/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var React = require("react");
  var _ = require("underscore");

  var TopBar = React.createClass({
    getInitialState: function() {
      return { isSaving: false };
    },
    render: function() {
      var saving = this.state.isSaving;
      var style = {
        display: saving ? "block" : "none",
        marginTop: "1.125em"
      };

      var savingBar;
      switch(saving) {
      case "done":
        savingBar = null;
        break;
      case "saving":
        savingBar = <li><span style={style} className="label secondary">saving …</span></li>;
        break;
      case "error":
        savingBar = <li><span style={style} className="label alert">error saving!</span></li>;
        break;
      }
      return(
          <div>
            <li><a href={window.location.href + "/export"} download={window.models.filename}>Export</a></li>
            {savingBar}
          </div>
      );
    }
  });

  return TopBar;
});
