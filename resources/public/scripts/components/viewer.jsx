/* -*- mode: js2; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js2-basic-offset: 2 -*- */
define(['react', 'jQuery', 'underscore', 'jsx!components/minimap', 'helpers/textLayerBuilder'], function(React, $, _, Minimap, TextLayerBuilder) {
  'use strict';

  var TextNode = React.createClass({
    shouldComponentUpdate: function(nextProps, nextState) {
      return !_.isEqual(this.props.annotations, nextProps.annotations);
    },
    render: function() {
      var p = this.props;
      var self = this;
      var o = p.textLayerBuilder.createAnnotatedElement(p.item, p.styles, p.annotations);

      if(o.isWhitespace) { return null; }

      var content;
      if(o.spans) {
        content = o.spans.map(function(s,i) {
          if(!s) return null;
          return <span key={i}>
                   <span className="pre">{s.pre}</span>
                   <span className="annotated" style={s.style} data-uuid={s.uuid}>{s.content}</span>
                   <span className="post">{s.post}</span>
                  </span>;
        });
      } else {
        content = o.textContent;
      };
      return <div style={o.style}
                  dir={o.dir}>{content}</div>;
    }
  });

  var TextLayer = React.createClass({
    getInitialState: function() {
      return {annotations: {}};
    },
    componentWillReceiveProps: function(nextProps) {
      this.setState({annotations: nextProps.page.get("annotations")});
    },
    shouldComponentUpdate: function(nextProps, nextState) {
      return !_.isEqual(nextState.annotations, this.state.annotations);
    },
    getTextLayerBuilder: function(viewport) {
      return new TextLayerBuilder({viewport: viewport});
    },
    render: function() {
      var page  = this.props.page;
      var content = page.get("content");
      var textLayerBuilder = this.getTextLayerBuilder(this.props.viewport);
      var annotations = this.state.annotations;
      var styles = content.styles;
      var textNodes = content.items.map(function (item,i) {
        return <TextNode key={i}
                         item={item}
                         annotations={annotations[i]}
                         styles={styles}
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
      this.setState({renderingState: nextProps.page.get("state")});
      if(this.props.key !== nextProps.key) {
        this.setState({isRendered: false});
      }
    },
    drawPage: function(page) {
      var self = this;
      var container = this.getDOMNode();
      var canvas = this.refs.canvas.getDOMNode();
      var ctx = canvas.getContext("2d");

      var viewport = page.getViewport(1.0);
      var pageWidthScale = container.clientWidth / viewport.width;
      viewport = page.getViewport(pageWidthScale);

      var outputScale = getOutputScale(ctx);

      canvas.width = (Math.floor(viewport.width) * outputScale.sx) | 0;
      canvas.height = (Math.floor(viewport.height) * outputScale.sy) | 0;
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

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

      // Store a refer to the renderer
      var pageRendering = page.render(renderContext);
      // Hook into the pdf render complete event
      var completeCallback = pageRendering.internalRenderTask.callback;
      pageRendering.internalRenderTask.callback = function (error) {
        completeCallback.call(this, error);
        self.setState({isRendered: true});
      };
    },
    componentDidUpdate: function(prevProps, prevState) {
      if(this.state.renderingState >= RenderingStates.HAS_PAGE && !this.state.viewport) {
        this.drawPage(this.props.page.get("raw"));
      }
    },
    render: function() {
      var textLayer = null;
      var renderingState = this.state.renderingState;
      var isLoading = !this.state.isRendered;

      if(this.state.viewport && renderingState >= RenderingStates.HAS_CONTENT) {
        textLayer = <TextLayer dimensions={this.state.dimensions}
                               viewport={this.state.viewport}
                               page={this.props.page} />;
      }
      return (
        <div className="page">
          <div className="loading" style={{opacity: isLoading ? 1 : 0}}><img src="/static/img/loader.gif" /></div>
          <canvas ref="canvas" />
          {textLayer}
        </div>);
    }
  });

  var Display = React.createClass({
    getInitialState: function() {
      return {fingerprint: null, $viewer: null};
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
          $viewer.animate({scrollTop: $viewer.scrollTop() + delta - center}, "slow");
        }
      }
    },
    getSelection: function() {
      var text = "";
      if (window.getSelection) {
        text = window.getSelection().toString();
      } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
      }
      if(text) {
        console.log(text);
      }
      return text;
    },
    componentDidMount: function() {
      var $viewer = $(this.refs.viewer.getDOMNode());
      this.setState({$viewer: $viewer});
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
             <div className="viewer" onMouseUp={self.getSelection} ref="viewer">{pagesElements}</div>
           </div>
        </div>);
    }
  });

  return Display;
});
