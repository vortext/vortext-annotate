/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'jQuery', 'underscore', 'jsx!components/minimap', 'helpers/textLayerBuilder'], function(React, $, _, Minimap, TextLayerBuilder) {
  'use strict';

  var Popup = React.createClass({
    render: function() {
      var options = this.props.options;
      var style = {
	display: options.visible ? "block" : "none",
	top: options.y - 34, // minus height
	left: options.x - 45 // minus width
      };
      return <span className="tooltip annotate" onClick={this.props.callback} style={style}>
	<img src="/static/img/pencil_ffffff_18.png" title="Annotate this" />
	<span className="nub"></span></span>;
    }
  });

  return Popup;

});
