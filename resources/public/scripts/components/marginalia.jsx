/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");
  var Marked = require("marked");


  function truncate(str, length, truncateStr) {
    if (str == null) return '';
    str = String(str); truncateStr = truncateStr || '…';
    length = ~~length;
    if(str.length > length) {
      var truncated = str.substr(0, length);
      return truncated + truncateStr;
    } else {
      return str;
    }
  }

  var Annotation = React.createClass({
    destroy: function() {
      this.props.annotation.destroy();
    },
    select: function(annotation) {
      this.props.annotation.select();
    },
    toggleHighlight: function() {
      this.props.annotation.highlight();
    },
    render: function() {
      var annotation = this.props.annotation;
      var text = truncate(annotation.get("content"), 100);

      var isActive = this.props.isActive;
      var content = isActive ? <a href="#" title="Jump to annotation" onClick={this.select}>{text}</a> : text;
      var trashcan = <img className="trashcan icon" src="/static/img/trash-o_777777_14.png" alt="delete" title="Delete" />;

      return <li>
               <p className="text-left" onMouseEnter={this.toggleHighlight} onMouseLeave={this.toggleHighlight}>
                 {content}
                 {isActive ? <a href="#" onClick={this.destroy}>{trashcan}</a> : null}
               </p>
             </li>;
    }
  });

  var Block = React.createClass({
    getInitialState: function() {
      return { annotationsActive: false };
    },
    toggleActivate: function(e) {
      var marginalia = this.props.marginalia;
      marginalia.setActive(this.props.marginalis);
    },
    foldAnnotations: function() {
      this.setState({annotationsActive: !this.state.annotationsActive});
    },
    render: function() {
      var marginalis = this.props.marginalis;
      var description = marginalis.get("description");
      var isActive = marginalis.get("active");
      var annotationsActive = this.state.annotationsActive;
      var style = {
        "backgroundColor": isActive ? "rgb(" + marginalis.get("color") + ")" : "inherit",
        "color": isActive ? "white" : "inherit"
      };

      var annotations = marginalis.get("annotations").map(function(annotation, idx) {
        return <Annotation annotation={annotation} isActive={isActive} key={idx} />;
      });

      return <div className="block">
               <h4>
                 <a onClick={this.toggleActivate} style={style}>{marginalis.get("title")} </a>
               </h4>
               <div className="content">
                 <div className="description" dangerouslySetInnerHTML={{__html: Marked(description)}} />
                   <div className="divider"><a href="#" onClick={this.foldAnnotations}> {annotationsActive ? "▾" : "▸"}  annotations ({annotations.length})</a></div>
                   <ul className="annotations no-bullet" style={{"maxHeight": annotationsActive ? 1000 : 0, "overflow": "hidden"}} >{annotations}</ul>
               </div>
             </div>;
    }
  });

  var Marginalia = React.createClass({
    getInitialState: function() {
      return { progress: {completed: 0, message: "", state: NaN}};
    },
    render: function() {
      var progress = this.state.progress;
      var isError = _.has(this.state, "error");

      if(isError) {
        var error = this.state.error;
        return (
            <div className="alert-box alert">
              <div dangerouslySetInnerHTML={{__html: Marked(error.message)}} />
            </div>
        );
      }

      var marginalia = this.props.marginalia;
      var isLoading = progress.state === "loading";
      var progressPercent = progress && progress.completed < 1.0 ? progress.completed * 100 + "%" : "";
      var message = <span style={{fontSize: "x-small"}}>{isLoading ? progress.message + " " + progressPercent : ""}</span>;
      var blocks = marginalia.map(function(marginalis, idx) {
        return <Block key={idx} marginalia={marginalia} marginalis={marginalis}  />;
      });
      return (
        <div>
          {blocks}
          <div className="loading" style={{display: isLoading ? "block" : "none"}}><img src="/static/img/loader.gif" /><br />{message}</div>
        </div>);
    }
  });

  return Marginalia;
});
