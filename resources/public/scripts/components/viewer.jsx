/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'underscore','Q', 'jQuery', 'helpers/textLayerBuilder'], function(React, _, Q, $, TextLayerBuilder) {
  'use strict';

  var TextLayer = React.createClass({
    getInitialState: function() {
      return {content: []};
    },
    componentWillReceiveProps: function(nextProps) {
      var self = this;
      var page = nextProps.page;
      page.getTextContent().then(function(content) {
        var textLayerBuilder = new TextLayerBuilder({viewport: page._viewport});
        var textContent = textLayerBuilder.getTextContent(content);
        self.setState({content: textContent});
      });
    },
    render: function() {
      var textNodes = this.state.content.map(function (o,i) {
        return <div style={o.style} dir={o.dir} key={i}> {o.textContent} </div>;
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
      page._viewport = viewport;

      var outputScale = getOutputScale(ctx);

      canvas.width = (Math.floor(viewport.width) * outputScale.sx) | 0;
      canvas.height = (Math.floor(viewport.height) * outputScale.sy) | 0;
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      this.setState({dimensions: { width: canvas.width + "px", height: canvas.height + "px"}});

      // Add the viewport so it's known what it was originally drawn with.
      canvas._viewport = viewport;

      ctx._scaleX = outputScale.sx;
      ctx._scaleY = outputScale.sy;

      if (outputScale.scaled) {
        ctx.scale(outputScale.sx, outputScale.sy);
      }
      var renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      //var textLayerBuilder = new TextLayerBuilder(renderContext);
      //self.setState({content: textLayerBuilder.getTextContent(content)});

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
            <canvas ref="canvas"></canvas>
            <TextLayer dimensions={this.state.dimensions} page={this.state.page}></TextLayer>
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
      var pagesElements = pages.map(function (page, idx) {
        var key = fingerprint + idx;
        return <Page page={page} fingerprint={fingerprint} appState={self.props.appState} key={key} />;
      });
      return(<div className="viewer-container">
               <div className="viewer">{pagesElements}</div>
             </div>);
    }
  });

  return Display;
});
