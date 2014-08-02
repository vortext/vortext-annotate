/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'jQuery', 'underscore', 'jsx!components/minimap', 'jsx!components/page', 'jsx!components/popup'], function(React, $, _, Minimap, Page, Popup) {
  'use strict';

  var Display = React.createClass({
    getInitialState: function() {
      return {fingerprint: null,
              $viewer: null,
              highlightPopup: {x: 0, y: 0, visible: false},
              annotationPopup: {x: 0, y: 0, visible: false}};
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
    componentWillReceiveProps: function(nextProps) {
      this.respondToHighlight(nextProps.highlighted);
    },
    respondToHighlight: function(highlighted) {
      if(highlighted) {
        window.clearTimeout(this.timeout);
        var $el = this.state.$viewer.find("[data-uuid*="+highlighted.get("uuid")+"]");
        var boundingBox = { top: $el.offset().top, left: $el.offset().left, width: $el.width()};
        var position = this.calculatePopupCoordinates(boundingBox);
        this.setState({
          highlightPopup: {
            x: position.x,
            y: position.y,
            action: highlighted.destroy.bind(highlighted),
            visible: true }});
      } else {
        this.timeout = _.delay(function(self) {
          var newPopup = _.extend(self.state.highlightPopup, {visible: false});
          self.setState({highlightPopup: newPopup});
        }, 500, this);
      }
    },
    getSelection: function() {
       return window.getSelection().getRangeAt(0);
    },
    calculatePopupCoordinates: function(boundingBox, e) {
      var $viewer = this.state.$viewer;
      var $popup = this.state.$popup;

      var boxTop = boundingBox.top + $viewer.scrollTop();
      var boxLeft = boundingBox.left + $viewer.scrollLeft();
      var popupWidth = $popup.outerWidth();
      var popupHeight = $popup.outerHeight();

      var left = Math.min(Math.max(e && e.pageX || 0, boxLeft+popupWidth/2), boxLeft+boundingBox.width-popupWidth/2);
      return { x: left | 0, y: boxTop - 2.25 * popupHeight | 0};

    },
    respondToSelection: function(e) {
      var selection = this.getSelection();
      // At least 3 words of at least 2 characters, separated by at most 6 non-letter chars
      if(/(\w{2,}\W{1,6}){3}/.test(selection.toString())) {

        var selectionBox = selection.getBoundingClientRect();
        var position = this.calculatePopupCoordinates(selectionBox, e);

        this.setState({
          annotationPopup: {
            x: position.x,
            y: position.y,
            visible: true },
          selection: selection.toString()
        });
      }
    },
    componentWillUnmount: function() {
      $("body").off("mouseup.popup.annotate");
    },
    componentDidMount: function() {
      var $viewer = $(this.refs.viewer.getDOMNode());
      var $popup = $(this.refs.popup.getDOMNode());
      var self = this;
      $("body").on("mouseup.popup.annotate", function() {
        self.setState({annotationPopup: { visible: false }});
      });
      this.setState({$viewer: $viewer, $popup: $popup});
    },
    emitAnnotation: function() {
      var selection = this.state.selection;
      if(selection) {
        this.props.pdf.emitAnnotation(this.state.selection);
        // Clear text selection
        window.getSelection().removeAllRanges();
        this.setState({annotatePopup: { visible: false }, selection: null});
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
               <Popup options={this.state.annotationPopup} image="/static/img/pencil_ffffff_18.png" action={this.emitAnnotation} ref="popup" />
               <Popup options={this.state.highlightPopup} image="/static/img/trash-o_ffffff_18.png" ref="popup2" />
               {pagesElements}
             </div>
           </div>
        </div>);
    }
  });

  return Display;
});
