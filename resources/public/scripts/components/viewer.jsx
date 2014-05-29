/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'underscore', 'helpers/textLayerBuilder'], function(React, _, TextLayerBuilder) {
  'use strict';

  var TextLayer = React.createClass({
    shouldComponentUpdate: function(nextProps) {
      return nextProps.page ? true : false;
    },
    componentWillReceiveProps: function(nextProps) {
      var self = this;
      var page = nextProps.page;
      var pageIndex = page.pageInfo.pageIndex;
      // 1. Get annotations for active marginalia
      var activeAnnotations = this.props.appState.get("activeAnnotations")[pageIndex] || {};

      // 2. Get text layer nodes with annotations
      page.getTextContent().then(function(content) {
        var options = { viewport: page._viewport, annotations: activeAnnotations };
        var textLayerBuilder = new TextLayerBuilder(options);
        var newTextContent = textLayerBuilder.getTextContent(content);

        var textContents = self.props.appState.get("textContents");
        textContents.remove(textContents.at(pageIndex));
        textContents.add([newTextContent], {at: pageIndex});
        self.forceUpdate();
      });
    },
    render: function() {
      var page = this.props.page;
      if(!page) { return <div className="noPage" />; };

      var pageIndex = page.pageInfo.pageIndex;
      var textContents =  this.props.appState.get("textContents").at(pageIndex);
      if(!textContents) { return <div className="noText" />; };

      var textNodes = textContents.values().map(function (o,i) {
        if(o.isWhitespace) { return null; }
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
        return <div style={o.style} dir={o.dir} key={i}>{content}</div>;
      });
      return <div style={this.props.dimensions} className="textLayer">{textNodes}</div>;
    }
  });


  var Page = React.createClass({
    drawPage: function(page) {
      var container = this.getDOMNode();
      var canvas = this.refs.canvas.getDOMNode();
      var ctx = canvas.getContext("2d", {alpha: false});

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

      this.setState({dimensions: { width: canvas.width + "px", height: canvas.height + "px"}});

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
      return other.fingerprint !== this.props.fingerprint;
    },
    getInitialState: function() {
      return {page: null};
    },
    componentDidUpdate: function(prevProps, prevState) {
      if(!prevState.page || this.shouldRepaint(prevProps)) {
        this.drawPage(this.state.page);
      }
    },
    componentWillMount: function() {
      var self = this;
      this.props.page.then(function(page) {
        self.setState({page: page});
      });
    },
    render: function() {
      return (
          <div className="page">
            <canvas ref="canvas" />
            <TextLayer dimensions={this.state.dimensions} page={this.state.page} appState={this.props.appState} />
          </div>);
    }
  });

  var Display = React.createClass({
    render: function() {
      var self = this;
      var pdf = this.props.appState.get("pdf");
      if(!pdf) return <div />;
      var fingerprint = pdf.pdfInfo.fingerprint;

      var pages = _.map(_.range(1, pdf.numPages + 1), function(pageNr) {
        return pdf.getPage(pageNr);
      });
      var pagesElements = pages.map(function (page, i) {
        var key = fingerprint + i;
        return <Page page={page} fingerprint={fingerprint} appState={self.props.appState} key={key} />;
      });
      return(<div className="viewer-container">
               <div className="viewer">{pagesElements}</div>
             </div>);
    }
  });

  return Display;
});
