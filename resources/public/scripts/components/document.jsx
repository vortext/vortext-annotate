/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");
  var Popup = require("jsx!components/popup");
  var Minimap = require("jsx!components/minimap");
  var Page = require("jsx!components/page");
  var TextUtil = require("helpers/textUtil");

  var Document = React.createClass({
    getInitialState: function() {
      return {fingerprint: null,
              $viewer: null,
              popup: {x: 0, y: 0, visible: false}};
    },
    componentWillUpdate: function(nextProps, nextState) {
      var $viewer = this.state.$viewer;
      if($viewer) {
        if(nextState.fingerprint !== this.state.fingerprint) {
          $viewer.scrollTop(0);
        } else if(nextState.select !== this.state.select) {
          var delta = $viewer.find("[data-uuid*="+ nextState.select + "]").offset().top;
          var viewerHeight = $viewer.height();
          var center = viewerHeight / 2;
          $viewer.animate({scrollTop: $viewer.scrollTop() + delta - center});
        }
      }
    },
    componentWillReceiveProps: function(nextProps) {
      this.respondToHighlight(nextProps.highlighted);
    },
    respondToHighlight: function(highlighted) {
      window.clearTimeout(this.timeout);
      if(highlighted) {
        var $el = this.state.$viewer.find("[data-uuid*="+highlighted.get("uuid")+"]");
        if($el.length === 0) return;
        var boundingBox = { top: $el.offset().top, left: $el.offset().left, width: $el.width()};
        var position = this.calculatePopupCoordinates(boundingBox);
        var self = this;
        this.timeout = _.delay(function(self) {
          self.setState({
            popup: {
              x: position.x,
              y: position.y,
              title: "Remove annotation",
              sprite: "popup trash",
              action: highlighted.destroy.bind(highlighted),
              visible: true}});
        }, 750, this);
      } else {
        this.timeout = _.delay(function(self) {
          self.setState({popup: _.extend(self.state.popup, {visible: false})});
        }, 750, this);
      }
    },
    calculatePopupCoordinates: function(boundingBox, e) {
      var $viewer = this.state.$viewer;
      var $popup = this.state.$popup;

      var offsetFromTop = 45;
      var boxTop = boundingBox.top + $viewer.scrollTop() - offsetFromTop;
      var boxLeft = boundingBox.left + $viewer.scrollLeft();
      var popupWidth = $popup.outerWidth();
      var popupHeight = $popup.outerHeight();

      var left = Math.min(Math.max(e && e.pageX || 0, boxLeft+popupWidth/2), boxLeft+boundingBox.width-popupWidth/2);
      return { x: left | 0, y: boxTop - 2.0 * popupHeight | 0};
    },
    getSelection: function() {
      var selection = window.getSelection();
      if(selection.type === "None" || !selection.getRangeAt(0)) return "";

      var range = selection.getRangeAt(0);
      var strArr = [];

      var childNodes = range.cloneContents().childNodes;
      for (var i = 0, len = childNodes.length; i < len; i++) {
        strArr.push(childNodes[i].textContent);
      }
      return strArr;
    },
    respondToSelection: function(e) {
      var selection = this.getSelection();
      // At least 3 words of at least 2 characters, separated by at most 6 non-letter chars
      if(/(\w{2,}\W{1,6}){3}/.test(selection.join(" "))) {
        var selectionBox = window.getSelection().getRangeAt(0).getBoundingClientRect();
        var position = this.calculatePopupCoordinates(selectionBox, e);

        this.setState({
          popup: {
            action: this.emitAnnotation,
            sprite: "popup pencil",
            title: "Annotate this",
            x: position.x,
            y: position.y,
            visible: true },
          selection: { pattern: selection.join(""),
                       display: TextUtil.normalize(selection.join(" "))
                     }
        });
      }
    },
    componentWillUnmount: function() {
      $("body").off("mouseup.popup");
    },
    componentDidMount: function() {
      var $viewer = $(this.refs.viewer.getDOMNode());
      var $popup = $(this.refs.popup.getDOMNode());
      var self = this;
      $("body").on("mouseup.popup", function() {
        self.setState({popup: _.extend(self.state.popup, {visible: false})});
      });
      this.setState({$viewer: $viewer, $popup: $popup});
    },
    emitAnnotation: function() {
      this.props.pdf.emitAnnotation(this.state.selection);
      // Clear text selection
      window.getSelection().removeAllRanges();
      this.setState({selection: null});
    },
    render: function() {
      var self = this;
      var pdf = this.props.pdf;

      var pagesElements = pdf.get("pages").map(function(page, pageIndex) {
        var fingerprint = self.state.fingerprint;
        return (<Page page={page} key={fingerprint + pageIndex} />);
      });

      return(
        <div>
          <Minimap $viewer={this.state.$viewer} pdf={pdf} />
          <div className="viewer-container">
            <div className="viewer" onMouseUp={this.respondToSelection} ref="viewer">
               <Popup options={this.state.popup} action={this.emitAnnotation} ref="popup" />
               {pagesElements}
             </div>
           </div>
        </div>);
    }
  });

  return Document;
});
