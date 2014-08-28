/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");

  var DocumentsTable = React.createClass({
    render: function() {
      var documents = this.props.documents.map(function(document) {
        return <li>{document.name}</li>;
      });
      return (
          <ul>
          {documents}
        </ul>
      );
    }
  });

  var Project = React.createClass({
    getInitialState: function() {
      return {documents: []};
    },
    trigger: function() {
      this.refs.file.getDOMNode().click();
    },
    loadFiles: function() {
      var self = this;
      var files = this.refs.file.getDOMNode().files;
      var documents = [];
      for (var i = 0; i < files.length; ++i) {
        var file = files[i];
        if (file.type.match(/application\/(x-)?pdf|text\/pdf/)) {
          documents.push({name: file.name});
        }
      };
      this.props.project.add(documents);
      return false;
    },
    render: function() {
      return(<div>
             <DocumentsTable documents={this.state.project || []} />
             <input accept=".pdf" style={{display:"none"}} multiple="multiple" type="file" ref="file" onChange={this.loadFiles} />
             <button className="small" onClick={this.trigger}>Add documents</button>
             </div>);
    }
  });

  return Project;
});
