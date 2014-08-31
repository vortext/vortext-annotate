/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");

  var ProgressBar = require("jsx!components/progressBar");

  var Document = React.createClass({
    render: function() {
      var document = this.props.document;

      var progressBar;
      if(document._progress) {
        progressBar = <ProgressBar completed={document._progress.completed} />;
      }

      var uri = window.location.href + "/documents/" + document.fingerprint;
      return(
        <tr>
          <td><a href={uri}>{document.name}</a></td>
          {progressBar ? <td width="400">{progressBar}</td> : <td></td>}
        </tr>);
    }
  });

  var DocumentsTable = React.createClass({
    render: function() {
      var documents = this.props.documents.map(function(document, i) {
        return <Document document={document} key={i} />;
      });
      return (
         <table className="large-12 columns">
          <thead>
            <th>Title</th>
            <th></th>
          </thead>
          <tbody>
          {documents}
          </tbody>
        </table>
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
      this.props.project.upload(documents);
      return false;
    },
    render: function() {
      return(<div>
             <DocumentsTable documents={this.state.project || []} />
             <input accept=".pdf" style={{display:"none"}} multiple="multiple" type="file" ref="file" onChange={this.selectFiles} />
             <button className="small" onClick={this.trigger}>Add documents</button>
             </div>);
    }
  });

  return Project;
});
