/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
/* From http://stackoverflow.com/questions/22677931/react-js-onchange-event-for-contenteditable */
define(function (require) {
  'use strict';

  var React = require("react");

  var ContentEditable = React.createClass({
    render: function(){
      return <div
        onBlur={this.emitChange}
        contentEditable
        dangerouslySetInnerHTML={{__html: this.props.html}}></div>;
    },
    shouldComponentUpdate: function(nextProps){
      return nextProps.html !== this.getDOMNode().innerHTML;
    },
    emitChange: function(){
      var html = this.getDOMNode().innerHTML;
      if (this.props.onChange && html !== this.lastHtml) {
        this.props.onChange({
          target: {
            value: html
          }
        });
      }
      this.lastHtml = html;
    }
  });

  return ContentEditable;

});
