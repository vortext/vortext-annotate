/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'jQuery', 'underscore', 'jsx!components/minimap', 'jsx!components/page', 'jsx!components/popup'], function(React, $, _, Minimap, Page, Popup) {
  'use strict';

  var Display = React.createClass({
    getInitialState: function() {
      return {fingerprint: null, $viewer: null, popup: {x: 0, y: 0, visible: false}};
    },
    componentWillUpdate: function(nextProps, nextState) {
      var $viewer = this.state.$viewer;
      if($viewer) {
        if(nextState.fingerprint !== this.state.fingerprint) {
          $viewer.scrollTop(0);
        } else if(nextState.select !== this.state.select) {
          var delta = $viewer.find("[data-uuid*="+ nextState.select + "]").offset().top;
          var viewerHeight = $viewer.height();
          var center = (viewerHeight / 2) - (viewerHeight / 4);
          $viewer.animate({scrollTop: $viewer.scrollTop() + delta - center});
        }
      }
    },
    getSelection: function() {
      var selection = window.getSelection().getRangeAt(0);
      return selection && selection.toString() || "";
    },
    respondToSelection: function(e) {
      var selection = this.getSelection();
      // At least 3 words of at least 2 characters, separated by at most 6 non-letter chars
      if(/(\w{2,}\W{1,6}){3}/.test(selection)) {
        var offset = this.state.$viewer.scrollTop();
        this.setState({
          popup: { x: e.pageX,
                   y: offset + e.pageY,
                   visible: true },
          selection: selection
        });
      }
    },
    componentWillUnmount: function() {
      $("body").off("mouseup.popup");
    },
    componentDidMount: function() {
      var $viewer = $(this.refs.viewer.getDOMNode());
      var self = this;
      $("body").on("mouseup.popup", function() {
        self.setState({popup: { visible: false }});
      });
      this.setState({$viewer: $viewer});
    },
    emitAnnotation: function() {
      var selection = this.state.selection;
      if(selection) {
        this.props.pdf.emitAnnotation(this.state.selection);
        // Clear text selection
        window.getSelection().removeAllRanges();
        this.setState({popup: { visible: false }, selection: null});
      }
    },
    render: function() {
      var self = this;
      var pdf = this.props.pdf;

      var pagesElements = pdf.get("pages").map(function(page, pageIndex) {
        var fingerprint = self.state.fingerprint;
        return <Page page={page} key={fingerprint + pageIndex} />;
      });

      return(
        <div>
          <Minimap $viewer={this.state.$viewer} pdf={pdf} />
          <div className="viewer-container">
            <div className="viewer" onMouseUp={this.respondToSelection} ref="viewer">
               <Popup options={this.state.popup} callback={this.emitAnnotation} />
               {pagesElements}
             </div>
           </div>
        </div>);
    }
  });

  return Display;
});
