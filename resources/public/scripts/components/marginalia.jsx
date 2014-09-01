/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");
  var Marked = require("marked");

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
      var text = annotation.get("content");

      var isActive = this.props.isActive;
      var content;
      if(isActive) {
        content = <a href="#" className="wrap" title="Jump to annotation" onClick={this.select}>{text}</a> ;
      } else {
        content = <span className="wrap">{text}</span>;
      }
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
                   <ul className="no-bullet annotations" style={{"maxHeight": annotationsActive ? 500 : 0}} >{annotations}</ul>
               </div>
             </div>;
    }
  });

  var Marginalia = React.createClass({
    render: function() {
      var marginalia = this.props.marginalia;
      var blocks = marginalia.map(function(marginalis, idx) {
        return <Block key={idx} marginalia={marginalia} marginalis={marginalis}  />;
      });
      return (<div>{blocks}</div>);
    }
  });

  return Marginalia;
});
