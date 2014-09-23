/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var React = require("react");

  var ProgressBar = React.createClass({
    render: function() {
      var completed = this.props.completed;
      var style = { width: (completed * 100) + "%" };
      if(completed < 1.0) {
        return(<div className="progress"> <span className="meter" style={style}></span></div>);
      } else {
        return null;
      }
    }
  });


  return ProgressBar;

});
