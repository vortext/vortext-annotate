/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'underscore', 'helpers/textLayerBuilder'], function(React, _, TextLayerBuilder) {
  'use strict';

  var TextNode = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
      return !_.isEqual(this.props.annotations, nextProps.annotations);
    },
    render: function() {
      var p = this.props;
      var o = p.textLayerBuilder.createAnnotatedElement(p.item, p.styles, p.annotations);
      if(!o || o.isWhitespace) { return null; }

      var content;
      if(o.spans) {
        content = o.spans.map(function(s,i) {
          if(!s) return <span key={"no_" + i} />;
          return <span key={i}>
                   <span className="pre">{s.pre}</span>
                   <span className="annotated" style={s.style}>{s.content}</span>
                   <span className="post">{s.post}</span>
                  </span>;
        });
      } else {
        content = o.textContent;
      };
      return <div style={o.style}
                  dir={o.dir}
                  data-color={o.color}
                  data-annotations={o.annotations}>{content}</div>;
    }
  });

  var TextLayer = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
      return !_.isEqual(this.props.annotations, nextProps.annotations);
    },
    getTextLayerBuilder: function(viewport) {
      return new TextLayerBuilder({ viewport: viewport });
    },
    render: function() {
      var page  = this.props.page;
      var content = page.get("content");
      var textLayerBuilder = this.getTextLayerBuilder(this.props.viewport);
      var annotations = this.props.annotations;
      var textNodes = content.items.map(function (item,i) {
        return <TextNode key={i}
                         item={item}
                         annotations={annotations[i]}
                         styles={content.styles}
                         textLayerBuilder={textLayerBuilder} />;
      });
      return <div style={this.props.dimensions} className="textLayer">{textNodes}</div>;
    }
  });

  var Page = React.createClass({
    getInitialState: function() {
      return {
        isRendered: false,
        renderingState: RenderingStates.INITIAL
      };
    },
    componentWillReceiveProps: function(nextProps) {
      this.setState({ renderingState: nextProps.page.get("state") });
      if(this.props.key !== nextProps.key) {
        this.setState({ isRendered: false });
      }
    },
    drawPage: function(page) {
      var container = this.getDOMNode();
      var canvas = this.refs.canvas.getDOMNode();
      var ctx = canvas.getContext("2d", { alpha: false });

      var viewport = page.getViewport(1.0);
      var pageWidthScale = container.clientWidth / viewport.width;
      viewport = page.getViewport(pageWidthScale);

      var outputScale = getOutputScale(ctx);

      canvas.width = (Math.floor(viewport.width) * outputScale.sx) | 0;
      canvas.height = (Math.floor(viewport.height) * outputScale.sy) | 0;
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      // Add the viewport so it's known what it was originally drawn with.
      canvas._viewport = viewport;

      this.setState({
        viewport: viewport,
        dimensions: { width: canvas.width + "px",
                      height: canvas.height + "px" }});

      ctx._scaleX = outputScale.sx;
      ctx._scaleY = outputScale.sy;

      if (outputScale.scaled) {
        ctx.scale(outputScale.sx, outputScale.sy);
      }
      var renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      page.render(renderContext);
    },
    componentDidUpdate: function(prevProps, prevState) {
      if(this.state.renderingState >= RenderingStates.HAS_PAGE && !this.state.isRendered) {
        this.drawPage(this.props.page.get("raw"));
        this.setState({ isRendered: true });
      }
    },
    render: function() {
      var textLayer = <div />;
      if(this.state.isRendered && this.state.renderingState >= RenderingStates.HAS_CONTENT) {
        textLayer = <TextLayer dimensions={this.state.dimensions}
                               viewport={this.state.viewport}
                               page={this.props.page}
                               annotations={this.props.annotations} />;
      }
      return (
        <div className="page">
          <canvas ref="canvas" />
          {textLayer}
        </div>);
    }
  });

  var Display = React.createClass({
    getInitialState: function() {
      return {
        annotations: [],
        pdf: null
      };
    },
    render: function() {
      var self = this;
      var pdf = this.state.pdf;
      if(!pdf) return null;
      var raw = pdf.get("raw");

      var fingerprint = raw.pdfInfo.fingerprint;

      var pagesElements = pdf.get("pages").map(function(page, pageIndex) {
        var annotations = self.state.annotations[pageIndex] || {};
        return <Page page={page} key={fingerprint + pageIndex} annotations={annotations} />;
      });

      return(<div className="viewer-container">
               <div className="viewer">{pagesElements}</div>
             </div>);
    }
  });

  return Display;
});
