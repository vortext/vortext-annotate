/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'underscore', 'helpers/textLayerBuilder'], function(React, _, TextLayerBuilder) {
  'use strict';

  var TextNode = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
      return !_.isEqual(nextProps.annotations, this.props.annotations);
    },
    flushToState: function(item, o) {
      var textNodes = window.appState.get("textNodes");
      textNodes[item._pageIndex] = textNodes[item._pageIndex] || [];
      textNodes[item._pageIndex][item._index] = o;
    },
    render: function() {
      var p = this.props;
      var o = p.textLayerBuilder.createAnnotatedElement(p.item, p.styles, p.annotations);
      if(!o || o.isWhitespace) { return <div />; }
      this.flushToState(p.item, o);

      var content;
      if(o.spans) {
        content = o.spans.map(function(s,i) {
          if(!s) return <span key={"no_" + i} />;
          return(<span key={i}>
                   <span className="pre">{s.pre}</span>
                   <span className="annotated" style={s.style}>{s.content}</span>
                   <span className="post">{s.post}</span>
                 </span>);
        });
      } else {
        content = o.textContent;
      };
      return <div style={o.style}
                  dir={o.dir}
                  data-color={o.color}
                  data-annotations={o.annotations}>
        {content}</div>;
    }
  });

  var TextLayer = React.createClass({
    getInitialState: function() {
      return { content: {items: [], styles: {}}};
    },
    componentWillMount: function() {
      var self = this;
      this.props.page.getTextContent().then(function(content) {
        self.setState({ content: content });
      });
    },
    shouldComponentUpdate: function(nextProps, nextState) {
      var hasPage = nextProps.page ? true : false;
      var hadContent = this.state.content.items.length > 0;
      var hasContent = nextState.content.items.length > 0;
      var hasNewAnnotations = !_.isEqual(this.props.annotations, nextProps.annotations);
      return (hasPage && !hadContent) || (hasPage && hasContent && hasNewAnnotations);
    },
    componentDidUpdate: function() {
      var pageIndex = this.props.page.pageIndex;
      var textNodes = window.appState.get("textNodes")[pageIndex];
      if(textNodes && textNodes.length > 0) {
        window.appState.trigger("update:textNodes");
      }
    },
    render: function() {
      var page = this.props.page;
      var textLayerBuilder = new TextLayerBuilder({ viewport: page._viewport });
      var textContent = this.state.content;
      var annotations = this.props.annotations;
      var textNodes = textContent.items.map(function (item,i) {
        item._pageIndex = page.pageIndex;
        item._index = i;
        return <TextNode key={i}
                         item={item}
                         annotations={annotations[i]}
                         styles={textContent.styles}
                         textLayerBuilder={textLayerBuilder} />;
      });
      return <div style={this.props.dimensions} className="textLayer">{textNodes}</div>;
    }
  });


  var Page = React.createClass({
    getInitialState: function() {
      return {page: null};
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
      page._viewport = viewport;

      this.setState({ dimensions: { width: canvas.width + "px", height: canvas.height + "px" }});

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
    shouldRepaint: function(other) {
      return other.key !== this.props.key;
    },
    componentDidUpdate: function(prevProps, prevState) {
      if(this.state.page && (!prevState.page || this.shouldRepaint(prevProps))) {
        this.drawPage(this.state.page);
      }
    },
    componentWillMount: function() {
      var self = this;
      this.props.page.then(function(page) {
        self.setState({ page: page });
      });
    },
    render: function() {
      var page = this.state.page;
      var textLayer;
      if(page) {

        textLayer = <TextLayer dimensions={this.state.dimensions}
                               page={page}
                               key={"text_" + this.props.key}
                               annotations={this.props.annotations} />;
      } else {
        textLayer = <div key={"text_" + this.props.key} />;
      };
        return (
            <div className="page">
              <canvas key={"canvas_" + this.props.key} ref="canvas" />
              {textLayer}
            </div>);

    }
  });

  var Display = React.createClass({
    getInitialState: function() {
      return {
        pdf: null,
        annotations: []
      };
    },
    render: function() {
      var self = this;
      var pdf = this.state.pdf;
      if(!(pdf && pdf.pdfInfo)) return <div />;

      var fingerprint = pdf.pdfInfo.fingerprint;

      var pages = _.map(_.range(1, pdf.numPages + 1), function(pageNr) {
        return pdf.getPage(pageNr);
      });
      var pagesElements = pages.map(function (page, i) {
        var annotations = self.state.annotations[i] || {};
        return <Page page={page} key={fingerprint + i} annotations={annotations} />;
      });
      return(<div className="viewer-container">
               <div className="viewer">{pagesElements}</div>
             </div>);
    }
  });

  return Display;
});
