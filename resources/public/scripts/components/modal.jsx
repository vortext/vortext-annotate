/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */

define(function (require) {
  'use strict';

  var React = require("react");
  var _ = require("underscore");

  var Modal = React.createClass({
    render: function() {
      var style = {
        display: "block",
        opacity: 1.0,
        visibility: "visible"
      };
      var modalStyle = _.extend({top: this.props.top || "-90px"}, style);
      return(
        <div>
          <div className="reveal-modal-bg" style={style} />
          <div style={modalStyle} className="reveal-modal open" data-reveal="true">
          {this.props.children}
          </div>
        </div>);
    }
  });

  return Modal;
});
