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

      $(this.getDOMNode().parentNode)
        .on("mousemove", function(e) {
          if(self.state.mouseDown) {
            var offset = (self.props.height / 2);
            self.setState({offset: e.pageY -  offset});
            scrollTo(e, offset);
          }
        })
        .on("mousedown", function(e) {
          self.setState({mouseDown: true});
          var y = e.pageY;

          // Jump to mousedown position
          var offset = (self.props.height / 2);
          self.setState({offset: e.pageY - offset});
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
    projectTextNodes: function(textNodes, factor) {
      // The basic idea here is using a sweepline to
      // project the 2D structure of the PDF onto a 1D minimap
      var nodes = _.map(textNodes, function(node) {
        var $node = $(node);
        return {
          height: node.clientHeight / factor,
          position: $node.position().top / factor,
          color:  node.dataset.color,
          annotations: node.dataset.annotations
        };
      });

      var segments = [];
      var sortedByPosition = _.sortBy(nodes, function(n) { return n.position; });
      for(var i = 0; i < sortedByPosition.length; i++) {
        var node = sortedByPosition[i];
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
            color: nextColor,
            annotations: _.union(node.annotations, prevSegment.annotations)
          };
          segments.push(nextSegment);
        } else {
          segments.push(node);
        }
      }
      return segments;
    },
    render: function() {
      return <div className="minimap-node" style={this.props.style} />;
    }
  });

  var Minimap = React.createClass({
    componentDidMount: function() {
      this.setState({panelHeight: this.getDOMNode().clientHeight});;
    },
    render: function() {
      var self = this;
      var appState = window.appState;
      var pdfInfo = appState.get("pdf").pdfInfo;
      if(!pdfInfo)  { return <div className="minimap no-pdf" />; }

      var numPages =  pdfInfo.numPages;
      var nodesPerPage = appState.get("textNodes");

      var pages = [];
      var $viewer = $(".viewer");
      for(var i = 0; i < nodesPerPage.length; i++) {
        var $page = $viewer.find(".page:eq(" + i + ")");
        pages.push({height: $page.height()});
      }
      var totalHeight = _.reduce(pages, function(mem, el) { return el.height + mem; }, 0);
      var factor = totalHeight / this.state.panelHeight;

      var pageElements = pages.map(function(page, idx) {
       // var textNodes = self.projectTextNodes(page.textNodes, factor);
       // var textSegments = textNodes.map(function(segment, idx) {
       //   var style = {
       //     "top": Math.ceil(segment.position) + "px",
       //     "height": Math.ceil(segment.height) + "px"
       //   };
       //   if(segment.color) {
       //     style.backgroundColor = "rgb(" + segment.color + ")";
       //   }
       //   return(<div key={idx} className="text-segment" style={style} />);
       // });
        return <PageSegment key={idx} style={{ height: page.height / factor}} />;
      });

      return(<div className="minimap">
             <VisibleArea height={this.state.panelHeight / factor} target={this.props.target} factor={factor} />
             {pageElements}
             </div>);
    }
  });

  return Minimap;
});
