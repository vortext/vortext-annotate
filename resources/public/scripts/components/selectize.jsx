/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var React = require("react");
  var $ = require("jQuery");

  require("selectize");

  var Selectize = React.createClass({
    componentWillUnmount: function() {
      $(this.refs.el.getDOMNode()).selectize.destroy();
    },
    componentDidMount: function() {
      $(this.refs.el.getDOMNode()).selectize(this.props.options);
    },
    render: function() {
      return(<input name={this.props.name} type="hidden" ref="el" value={this.props.value} />);
    }
  });

  return Selectize;
});
