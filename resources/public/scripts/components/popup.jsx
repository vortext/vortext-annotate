/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var React = require("react");

  var Popup = React.createClass({
    getInitialState: function() {
      return {visible: false};
    },
    setVisible: function() {
      this.setState({visible: true});
    },
    setHidden: function() {
      this.setState({visible: false});
    },
    render: function() {
      var options = this.props.options;
      var style = {
	      display: options.visible || this.state.visible ? "block" : "none",
	      top: options.y,
	      left: options.x
      };
      var action = options.action || this.props.action;
      var title = options.title || this.props.title;
      return <span onMouseEnter={this.setVisible} onMouseLeave={this.setHidden} className="tooltip tip-top annotate" onClick={action} style={style} title={title}>
        <div className={options.sprite} />
	      <span className="nub"></span></span>;
    }
  });

  return Popup;

});
