/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */

define(['react', 'underscore', 'jQuery', 'helpers/textLayerBuilder'], function(React, _, $, TextLayerBuilder) {
  'use strict';

  var VisibleArea = React.createClass({
    getInitialState: function() {
      return {
        mouseDown: false,
        offset: this.props.$viewer.scrollTop() / this.props.factor
      };
    },
    componentWillUnmount: function() {
      this.props.$viewer.off("scroll");
      $(this.getDOMNode().parentNode).off("mousedown mousemove");
      $(window).off("mouseup");
    },
    scrollTo: function(e, $minimap, $viewer) {
      var document_offset = $minimap.offset().top;
      var offset = ((this.props.height / 2) + document_offset);
      var y = e.pageY;
      this.setState({ offset: y - offset });

      var scroll = (y - offset) * this.props.factor;
      $viewer.scrollTop(scroll);
    },
    componentDidMount: function() {
      var self = this;
      var $viewer =  this.props.$viewer;
      $viewer.on("scroll", function() {
        self.setState({ offset: $viewer.scrollTop() / self.props.factor });
      });

      $(window).on("mouseup", function(e) {
        self.setState({ mouseDown: false });
      });

      var $minimap = $(this.getDOMNode().parentNode);

      $minimap
        .on("mousemove", function(e) {
          if(self.state.mouseDown) {
            self.scrollTo(e, $minimap, $viewer);
          }
          return false;
        })
        .on("mousedown", function(e) {
          self.setState({ mouseDown: true });
          // Jump to mousedown position
          self.scrollTo(e, $minimap, $viewer);
          return false;
        });
    },
    render: function() {
      var style = { height: this.props.height,
                    top: this.state.offset };
      return <div className="visible-area" style={style}></div>;
    }
  });

  var PageSegment = React.createClass({
    projectTextNodes: function(page, textLayerBuilder, factor) {
      // The basic idea here is using a sweepline to
      // project the 2D structure of the PDF onto a 1D minimap
      var self = this;
      var content = this.props.page.get("content");
      var annotations = this.props.page.get("annotations");

      var nodes = content.items.map(function(geom, idx) {
        var style = textLayerBuilder.calculateStyles(geom, content.styles[geom.fontName]);

        var elementAnnotations = annotations[idx];
        return {
          height: parseInt(style.fontSize, 10) / factor,
          position: parseInt(style.top, 10) / factor,
          color: elementAnnotations && elementAnnotations[0].color || null
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
      var page = this.props.page;
      var textSegments = [];

      if(page.get("state") >= RenderingStates.HAS_CONTENT) {
        var factor = this.props.factor;

        var viewport = page.get("raw").getViewport(1.0);
        var pageWidthScale = this.props.$viewer.width() / viewport.width;
        viewport = page.get("raw").getViewport(pageWidthScale);

        var textLayerBuilder = new TextLayerBuilder({ viewport: viewport });
        var textNodes = this.projectTextNodes(page, textLayerBuilder, factor);

        textSegments = textNodes.map(function(segment, idx) {
          var style = {
            "top": (Math.ceil(segment.position) | 0) + "px",
            "height": (Math.ceil(segment.height) | 0) + "px"
          };
          if(segment.color) {
            style.backgroundColor = "rgb(" + segment.color + ")";
          }
          return <div key={idx} className="text-segment" style={style} />;
        });
      }
      return <div className="minimap-node" style={this.props.style}>{textSegments}</div>;
    }
  });

  var Minimap = React.createClass({
    render: function() {
      var viewer = this.props.viewer;
      if(!viewer) return null; // wait for viewer to mount
      var $viewer = $(viewer);
      var pages = this.props.pdf.get("pages");
      var numPages = pages.length;

      // We assume that each page has the same height.
      // This is not true sometimes, but often enough for academic papers.
      var $page = $viewer.find(".page:eq(0)");
      var totalHeight = $page.height() * numPages;

      var offset = $viewer.offset().top;
      var factor = totalHeight / ($viewer.height() - offset);

      var pageElements = pages.map(function(page, pageIndex) {
        return <PageSegment key={pageIndex}
                            page={page}
                            $viewer={$viewer}
                            factor={factor}
                            style={{ height: (totalHeight / numPages) / factor }} />;
      });

      return (<div className="minimap">
                <VisibleArea height={$viewer.height() / factor} $viewer={$viewer} factor={factor} />
                {pageElements}
              </div>);
    }
  });

  return Minimap;
});
