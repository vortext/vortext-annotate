/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var React = require("react");

  var Link = React.createClass({
    render: function() {
      return(<li><a onClick={this.props.callback}>{this.props.text}</a></li>);
    }
  });

  return Link;
});
