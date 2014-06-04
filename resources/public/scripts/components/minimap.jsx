/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */

define(['react', 'underscore', 'jQuery'], function(React, _, $) {
  'use strict';
  var VisibleArea = React.createClass({
    getInitialState: function() {
      return {
        mouseDown: false,
        offset: $(this.props.target).scrollTop() / this.props.factor
      };
    },
    componentWillUnmount: function() {
      $(this.props.target).off("scroll");
      $(this.getDOMNode().parentNode).off("mousedown mousemove");
      $(window).off("mouseup");
    },
    componentDidMount: function() {
      var self = this;
      var $target =  $(this.props.target);
      var scrollTo = function(e, offset) {
        var y = e.pageY;
        var scroll = (y - offset) * self.props.factor;
        $target.scrollTop(scroll);
      };
      $target.on("scroll", function() {
        self.setState({offset: $target.scrollTop() / self.props.factor});
      });

      $(window).on("mouseup", function(e) {
        self.setState({mouseDown: false});
      });

      var minimap = $(this.getDOMNode().parentNode);
      var DOCUMENT_OFFSET = minimap.offset().top;

      minimap
        .on("mousemove", function(e) {
          if(self.state.mouseDown) {
            var offset = (self.props.height + DOCUMENT_OFFSET / 2);
            self.setState({offset: e.pageY -  offset});
            scrollTo(e, offset);
          }
          return false;
        })
        .on("mousedown", function(e) {
          self.setState({mouseDown: true});
          var y = e.pageY;

          // Jump to mousedown position
          var offset = (self.props.height + DOCUMENT_OFFSET / 2);
          self.setState({offset: e.pageY - offset });
          scrollTo(e, offset);
          return false;

        });
    },
    render: function() {
      var style = { height: this.props.height,
                    top: this.state.offset };
      return(<div className="visible-area" style={style}></div>);
    }
  });

  var PageSegment = React.createClass({
    shouldComponentUpdate: function(nextProps) {
      return _.isEqual(nextProps.textNodes, this.props.textNodes);
    },
    calculateHeight: _.memoize(function(style) {
      style.display = "none";
      var $el = $("<div></div>").text("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").css(style);
      $(document.body).append($el);
      var height = $el.height();
      $el.remove();
      return height;
    }, function(style) { // hashFunction
      return style.fontFamily + style.fontSize;
    }),
    projectTextNodes: function(textNodes, factor) {
      // The basic idea here is using a sweepline to
      // project the 2D structure of the PDF onto a 1D minimap
      var self = this;
      var nodes = _.map(textNodes, function(node) {
        return {
          height: self.calculateHeight(node.style) / factor,
          position: parseInt(node.style.top, 10) / factor,
          color:  node.color
        };
      });

      var segments = [];
      var sortedByPosition = _.sortBy(nodes, function(n) { return n.position; });
      for(var i = 0; i < sortedByPosition.length; i++) {
        var node = sortedByPosition[i];
        if(!node) continue;
        var prevSegment = segments.slice(-1).pop(); // peek
        if(segments.length === 0) {
          segments.push(node);
          continue;
        }

        if((prevSegment.position + prevSegment.height) >= node.position) {
          prevSegment = segments.pop();
          var nextHeight =  prevSegment.height +
                ((node.height + node.position) - (prevSegment.height + prevSegment.position));
          var nextColor = prevSegment.color ? prevSegment.color : node.color;

          var nextSegment = {
            height: nextHeight,
            position: prevSegment.position,
            color: nextColor
          };
          segments.push(nextSegment);
        } else {
          segments.push(node);
        }
      }
      return segments;
    },
    render: function() {
      var textNodes = this.projectTextNodes(this.props.textNodes, this.props.factor);
      var textSegments = textNodes.map(function(segment, idx) {
        var style = {
          "top": (Math.ceil(segment.position) | 0) + "px",
          "height": (Math.ceil(segment.height) | 0) + "px"
        };
        if(segment.color) {
          style.backgroundColor = "rgb(" + segment.color + ")";
        }
        return(<div key={idx} className="text-segment" style={style} />);
      });

      return <div className="minimap-node" style={this.props.style}>{textSegments}</div>;
    }
  });

  var Minimap = React.createClass({
    getInitialState: function() {
      return {panelHeight: 0};
    },
    componentDidMount: function() {
      this.setState({panelHeight: this.getDOMNode().clientHeight});;
    },
    render: function() {
      var appState = window.appState;
      if(!appState.get("pdf").pdfInfo) return <div className="minimap no-pdf" />;

      var nodesPerPage = appState.get("textNodes");

      var pages = [];
      var $viewer = $(".viewer");
      for(var i = 0; i < nodesPerPage.length; i++) {
        var $page = $viewer.find(".page:eq(" + i + ")");
        pages.push({height: $page.height()});
      }
      var totalHeight = _.reduce(pages, function(mem, el) { return el.height + mem; }, 0);
      var factor = totalHeight / this.state.panelHeight;

      var textNodes = window.appState.get("textNodes");
      var pageElements = pages.map(function(page, idx) {
        var annotations = window.appState.get("activeAnnotations")[idx] || {};
        return <PageSegment textNodes={textNodes[idx]}
                            key={idx}
                            factor={factor}
                            style={{ height: page.height / factor}} />;
      });

      return(<div className="minimap">
               <VisibleArea height={this.state.panelHeight / factor} target={this.props.target} factor={factor} />
               {pageElements}
             </div>);
    }
  });

  return Minimap;
});
