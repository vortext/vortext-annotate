/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2 -*- */
define(['jQuery', 'underscore', 'react', 'marked'], function($, _, React, Marked) {
  'use strict';

  function truncate(str, length, truncateStr) {
    if (str == null) return '';
    str = String(str); truncateStr = truncateStr || '…';
    length = ~~length;
    if(str.length > length) {
      var truncated = str.substr(0, length);
      truncated = truncated.substr(0, Math.min(truncated.length, truncated.lastIndexOf(" ")));
      return truncated + truncateStr;
    } else {
      return str;
    }
  }

  var Annotation = React.createClass({
    render: function() {
      var annotation = this.props.annotation;
      var text = truncate(annotation.get("content"), 250);
      return <li data-uuid={annotation.get("uuid")}><p className="text-left">{text}</p></li>;
    }
  });

  var Block = React.createClass({
    toggleActivate: function(e) {
      var marginalis = this.props.marginalis;
      var isActive = !marginalis.get("active");
      marginalis.set({"active": isActive});
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
        return <Annotation annotation={annotation} key={idx} />;
      });

      return <div className="block">
               <h4>
                 <a onClick={this.toggleActivate} style={style}> {marginalis.get("title")} </a>
               </h4>
               <div className="content">
                 <div className="description" dangerouslySetInnerHTML={{__html: Marked(description)}} />
                 <ul className="annotations square">{annotations}</ul>
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
      var isLoading = progress && progress !== "done";
      var blocks = this.props.marginalia.map(function(marginalis, idx) {
        return <Block key={marginalis.id} marginalis={marginalis} />;
      });
      return (
        <div>
          {blocks}
          <div className="loading" style={{display: isLoading ? "block" : "none"}}><img src="static/img/loader.gif" /></div>
        </div>);
    }
  });

  return Marginalia;
});
