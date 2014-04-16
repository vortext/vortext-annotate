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
      var document = result.get("document");

      console.log(Marked(document));
      return(<div className="block">
               <h4>
                 <a onClick={this.toggleActivate} className={result.get("active") ? result.id + "_header" : ""}>
                   {result.get("name")}
                 </a>
               </h4>
               <div className="content">
                 <div className="document" dangerouslySetInnerHTML={{__html: Marked(document)}} />
               </div>
             </div>);
    }
  });

  var Results = React.createClass({
    render: function() {
      var results = this.props.results;
      var self = this;
      var blocks = results && results.map(function(result, idx) {
        return (<Block key={result.id} result={result} />);
      });
      return(<div>{blocks}</div>);
    }
  });

  return Results;
});
