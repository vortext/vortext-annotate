/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");

  var ProgressBar = require("jsx!components/progressBar");

  var RemoveButton = React.createClass({
    remove: function() {
      this.props.model.remove(this.props.document.fingerprint);
    },
    render: function() {
      var trashcan = <img className="trashcan icon" src="/static/img/trash-o_777777_14.png" alt="remove" title="Remove from project" />;
      return <a onClick={this.remove}>{trashcan}</a>;
    }
  });

  var Document = React.createClass({
    render: function() {
      var document = this.props.document;

      var progressBar;
      if(document._progress && document._progress.completed < 1.0) {
        progressBar = <ProgressBar completed={document._progress.completed} />;
      }

      var remove = <RemoveButton document={this.props.document} model={this.props.model} />;

      var uri = window.location.href + "/documents/" + document.fingerprint;
      return(
        <tr>
          <td>{!progressBar ? <a href={uri}>{document.name}</a> : document.name}</td>
          {progressBar ? <td width="400">{progressBar}</td> : <td></td>}
          <td>{remove}</td>
        </tr>);
    }
  });

  var DocumentsTable = React.createClass({
    render: function() {
      var self = this;
      var documents = this.props.documents.map(function(document, i) {
        return <Document document={document} key={i} model={self.props.model} />;
      });
      return (
         <table className="large-12 columns">
          <thead>
            <th>Title</th>
            <th></th>
            <th></th>
          </thead>
          <tbody>
          {documents}
          </tbody>
        </table>
      );
    }
  });

  var Documents = React.createClass({
    getInitialState: function() {
      return {documents: []};
    },
    trigger: function() {
      this.refs.file.getDOMNode().click();
    },
    selectFiles: function() {
      var self = this;
      var files = this.refs.file.getDOMNode().files;
      var documents = [];
      for (var i = 0; i < files.length; ++i) {
        var file = files[i];
        if (file.type.match(/application\/(x-)?pdf|text\/pdf/)) {
          documents.push(file);
        }
      };
      this.props.documents.upload(documents);
      return false;
    },
    render: function() {
      return(<div>
             <DocumentsTable documents={this.state.documents || []} model={this.props.documents} />
             <input accept=".pdf" style={{display:"none"}} multiple="multiple" type="file" ref="file" onChange={this.selectFiles} />
             <button className="small" onClick={this.trigger}>Add documents</button>
             </div>);
    }
  });

  return Documents;
});
