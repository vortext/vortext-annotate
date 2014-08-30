/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var $ = require("jQuery");
  var React = require("react");
  var FileUtil = require("helpers/fileUtil");

  return React.createClass({
    loadExample: function() {
      var self = this;
      // From http://stackoverflow.com/questions/18447468/jquery-ajax-downloading-incomplete-binary-file
      var request = new XMLHttpRequest();
      request.open("GET", "/static/examples/TestDocument5.pdf", true);
      request.responseType = "arraybuffer";

      request.onload = function (e) {
        var arrayBuffer = request.response; // Note: not request.responseText
        if (arrayBuffer) {
          var byteArray = new Uint8Array(arrayBuffer);
          self.props.callback(byteArray);
        }
      };
      request.send(null);
    },
    trigger: function() {
      this.refs.file.getDOMNode().click();
    },
    loadFile: function() {
      var self = this;
      var file = this.refs.file.getDOMNode().files[0];
      if (file.type.match(this.props.mimeType)) {
        FileUtil.readFileAsBinary(file).then(function(data) {
          self.props.callback(data);
        });
      } else {
        alert("File not supported! Probably not a " + this.props.accept + " file");
      }
      return false;
    },
    render: function() {
      return(
        <div>
          <input accept={this.props.accept} style={{display:"none"}} name="file" type="file" ref="file" onChange={this.loadFile} />
          <li><a onClick={this.loadExample}>Example</a></li>
          <li><a onClick={this.trigger}>Upload</a></li>
        </div>);
    }
  });

});
