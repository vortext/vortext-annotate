/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jquery");
  var React = require("react");

  var ProgressBar = require("jsx!components/progressBar");
  var Modal = require("jsx!components/modal");

  var RemoveButton = React.createClass({
    getInitialState: function() {
      return { confirm: false };
    },
    remove: function() {
      this.setState({ confirm: true });
    },
    destroy: function() {
      this.props.model.remove(this.props.document.fingerprint);
      this.setState({ confirm: false });
    },
    cancel: function() {
      this.setState({ confirm: false });
    },
    render: function() {
      var modal =
            (<Modal>
               <p className="lead">
               Are you sure you want to remove {this.props.document.name}?
               </p>
               <p>This cannot be undone.</p>
               <a onClick={this.destroy}></a>
               <br /><br />
               <input type="button" onClick={this.cancel} className="button small secondary" value="Cancel"></input>
               &nbsp;
               <input type="button" onClick={this.destroy} className="button small alert" value="Remove"></input>
             </Modal>);
      var confirm = this.state.confirm ? modal : null;
      var trashcan = <img className="trashcan icon" src="/static/img/trash-o_777777_14.png" alt="remove" />;
      return <div>{confirm}<a onClick={this.remove}>{trashcan}</a></div>;
    }
  });

  var Document = React.createClass({
    render: function() {
      var document = this.props.document;

      var progressBar;
      if(document._progress) {
        progressBar = <ProgressBar completed={document._progress.completed} />;
      }

      var remove = <RemoveButton document={this.props.document} model={this.props.model} />;

      var uri = window.location.href + "/documents/" + document.fingerprint;
      var title = !progressBar ? <a href={uri}>{document.name}</a> : document.name;
      var progress = progressBar ? <td width="280">{progressBar}</td> : <td></td>;
      return(
        <tr>
          <td>{title}</td>
          {progress}
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
      var documentElements = !_.isEmpty(documents) ? documents : <tr><td colSpan="3" className="text-center">No documents in project</td></tr>;
      return (
         <table className="large-12 columns">
          <thead>
            <th>Title</th>
            <th></th>
            <th></th>
          </thead>
          <tbody>
          {documentElements}
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
