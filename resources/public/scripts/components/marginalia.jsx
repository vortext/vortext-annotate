/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2 -*- */
define(['jQuery', 'underscore', 'react', 'marked'], function($, _, React, Marked) {
  'use strict';

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
    toggleActivate: function(e) {
      var marginalia = this.props.marginalia;
      marginalia.setActive(this.props.marginalis);
    },
    render: function() {
      var marginalis = this.props.marginalis;
      var description = marginalis.get("description");
      var isActive = marginalis.get("active");

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
                 {annotations.length > 0 ? <div className="divider">annotations</div> : null}
                 <ul className="annotations no-bullet">{annotations}</ul>
               </div>
             </div>;
    }
  });

  var Marginalia = React.createClass({
    getInitialState: function() {
      return { progress: null };
    },
    render: function() {
      var progress = this.state.progress;
      var isError = progress === "failed";

      if(isError) {
        var error = this.state.error;
        return (
            <div className="alert-box alert" style={{"color": "white"}}>
            <div dangerouslySetInnerHTML={{__html: Marked(error.message)}} />
            </div>
        );
      }

      var isLoading = progress && progress !== "done";
      var marginalia = this.props.marginalia;
      var progressPercent = progress && progress.progress !== 1.0 ? progress.progress * 100 + "%" : "";
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
