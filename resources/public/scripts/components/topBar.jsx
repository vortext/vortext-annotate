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
      var style = {
        display: this.state.isSaving ? "block" : "none",
        marginTop: "1.125em"
      };
      return(
          <div>
            <li><a href={window.location.href + "/export"} download={window.models.filename}>Export</a></li>
            <li><span style={style} className="label secondary">saving …</span></li>
          </div>
      );
    }
  });

  return TopBar;
});
