/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var React = require("react");
  var _ = require("underscore");

  var Modal = require("jsx!components/modal");

  var ExportButton = React.createClass({
    getInitialState: function() {
      return { visible: false };
    },
    close: function() {
      this.setState({ visible: false });
    },
    open: function() {
      this.setState({ visible: true });
    },
    exportJSON: function() {
      window.location = window.location + "/export/json";
      this.close();
    },
    exportPDF: function() {
      window.location = window.location + "/export/pdf";
      this.close();
    },
    render: function() {
      var modal =
            (<Modal top={this.props.top}>
               <p className="lead">
                 Please select the export format
               </p>
               <button onClick={this.exportJSON} className="button"><i className="fa fa-file-code-o"></i> JSON</button>
               &nbsp;
               <button onClick={this.exportPDF} className="button"><i className="fa fa-file-pdf-o"></i> PDF</button>
               &nbsp;
               <button onClick={this.close} className="button secondary">Cancel</button>
             </Modal>);
      var dialog = this.state.visible ? modal : null;
      return <span>{dialog}<button className={this.props.class} onClick={this.open}>Export</button></span>;
    }
  });

  return ExportButton;
});
