/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(function (require) {
  'use strict';

  var _ = require("underscore");
  var $ = require("jQuery");
  var React = require("react");
  var TextLayerBuilder = require("helpers/textLayerBuilder");

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
      $("body").off("mouseup.minimap");
    },
    scrollTo: function(e, $minimap, $viewer) {
      var documentOffset = $minimap.offset().top;
      var offset = ((this.props.height / 2) + documentOffset);
      var y = e.pageY;
      this.setState({offset: y - offset});

      var scroll = (y - offset) * this.props.factor;
      $viewer.scrollTop(scroll);
    },
    componentDidMount: function() {
      var self = this;
      var $viewer =  this.props.$viewer;
      var $minimap = $(this.getDOMNode().parentNode);

      $viewer.on("scroll", function() {
        self.setState({offset: $viewer.scrollTop() / self.props.factor});
      });

      $("body").on("mouseup.minimap", function(e) {
        self.setState({mouseDown: false});
      });

      $minimap
        .on("mousemove", function(e) {
          if(self.state.mouseDown) {
            self.scrollTo(e, $minimap, $viewer);
          }
          return false;
        })
        .on("mousedown", function(e) {
          self.setState({mouseDown: true});
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

  var TextSegments = React.createClass({
    getInitialState: function() {
      return {annotations: {}};
    },
    componentWillReceiveProps: function(nextProps) {
      this.setState({annotations: nextProps.page.get("annotations")});
    },
    shouldComponentUpdate: function(nextProps, nextState) {
      function getNestedProperties(array, props) {
        return _.map(_.flatten(_.values(array)), function(el) { return _.pick(el, props); });
      }
      var alpha = getNestedProperties(this.state.annotations, ["id"]);
      var beta = getNestedProperties(nextState.annotations, ["id"]);
      return !_.isEqual(alpha, beta);
    },
    projectTextNodes: function(page, textLayerBuilder, factor) {
      // The basic idea here is using a sweepline to
      // project the 2D structure of the PDF onto a 1D minimap
      var self = this;
      var content = page.get("content");
      var annotations = this.state.annotations;

      var nodes = content.items.map(function(geom, idx) {
        var style = textLayerBuilder.calculateStyles(geom, content.styles[geom.fontName]);

        var elementAnnotations = annotations[idx];
        return {
          height: parseInt(style.fontSize, 10) / factor,
          position: parseInt(style.top, 10) / factor,
          color: elementAnnotations && elementAnnotations[0].color
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
            color: nextColor
          };
          segments.push(_.extend(node, nextSegment));
        } else {
          segments.push(node);
        }
      }
      return segments;
    },

    render: function() {
      var page = this.props.page;
      var raw = page.get("raw");

      var factor = this.props.factor;

      var viewport = raw.getViewport(1.0);
      var pageWidthScale = this.props.$viewer.width() / viewport.width;
      viewport = raw.getViewport(pageWidthScale);

      var textLayerBuilder = new TextLayerBuilder({viewport: viewport});
      var textNodes = this.projectTextNodes(page, textLayerBuilder, factor);

      var textSegments = textNodes.map(function(segment, idx) {
        var style = {
          "top": (Math.ceil(segment.position) | 0) + "px",
          "height": (Math.ceil(segment.height) | 0) + "px"
        };
        if(segment.color) {
          style.backgroundColor = "rgb(" + segment.color + ")";
        }
        return <div key={idx} className="text-segment" style={style} />;
      });

      return <div>{textSegments}</div>;
    }
  });

  var PageSegment = React.createClass({
    render: function() {
      var page = this.props.page;
      var raw = page.get("raw");

      var textSegments = null;
      if(page.get("state") >= RenderingStates.HAS_CONTENT) {
        textSegments = <TextSegments page={page} factor={this.props.factor} $viewer={this.props.$viewer} />;
      }
      return <div className="minimap-node" style={this.props.style}>{textSegments}</div>;
    }
  });

  var Minimap = React.createClass({
    render: function() {
      var $viewer = this.props.$viewer;
      if(!$viewer) return null; // wait for viewer to mount

      var pages = this.props.pdf.get("pages");
      var numPages = pages.length;

      // We assume that each page has the same height.
      // This is not true sometimes, but often enough for academic papers.
      var $firstPage = $viewer.find(".page:eq(0)");
      var totalHeight = $firstPage.height() * numPages;

      var offset = $viewer.offset().top;
      var factor = totalHeight / ($viewer.height() - offset);

      var pageElements = pages.map(function(page, pageIndex) {
        return <PageSegment key={pageIndex}
                            page={page}
                            $viewer={$viewer}
                            factor={factor}
                            style={{height: (totalHeight / numPages) / factor}} />;
      });

      return (<div className="minimap">
                <VisibleArea height={$viewer.height() / factor} $viewer={$viewer} factor={factor} />
                {pageElements}
              </div>);
    }
  });

  return Minimap;
});
