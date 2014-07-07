/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2 -*- */
define(['jQuery', 'underscore', 'react', 'marked'], function($, _, React, Marked) {
  'use strict';

  var Block = React.createClass({
    toggleActivate: function(e) {
      var result = this.props.result;
      var isActive = !result.get("active");
      result.set({"active": isActive});
    },
    render: function() {
      var result = this.props.result;
      var description = result.get("description");
      var isActive = result.get("active");
      var style = {
        "backgroundColor": isActive ? "rgb(" + result.get("color") + ")" : "inherit",
        "color": isActive ? "white" : "inherit"
      };

      return(<div className="block">
               <h4>
                 <a onClick={this.toggleActivate} style={style}> {result.get("title")} </a>
               </h4>
               <div className="content">
                 <div className="description" dangerouslySetInnerHTML={{__html: Marked(description)}} />
               </div>
             </div>);
    }
  });

  var Marginalia = React.createClass({
    render: function() {
      var marginalia = window.appState.get("marginalia");
      var self = this;
      var blocks = marginalia && marginalia.map(function(result, idx) {
        return (<Block key={result.id} result={result} />);
      });
      return(<div>{blocks}</div>);
    }
  });

  return Marginalia;
});
