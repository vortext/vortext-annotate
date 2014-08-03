/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'jQuery', 'underscore', 'jsx!components/minimap', 'helpers/textLayerBuilder'], function(React, $, _, Minimap, TextLayerBuilder) {
  'use strict';

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
      var image = options.image || this.props.image;
      var title = options.title || this.props.title;
      return <span onMouseEnter={this.setVisible} onMouseLeave={this.setHidden} className="tooltip tip-top annotate" onClick={action} style={style}>
	      <img src={image} title={title} />
	      <span className="nub"></span></span>;
    }
  });

  return Popup;

});
