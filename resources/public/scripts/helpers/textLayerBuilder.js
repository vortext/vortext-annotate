/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(['underscore', 'PDFJS'], function(_, PDFJS) {
  'use strict';


  var TextLayerBuilder = function textLayerBuilder(options) {
    var viewport = options.viewport;
    var annotations = options.annotations;

    var createElement = function(geom, styles) {
      var style = styles[geom.fontName];

      if (!/\S/.test(geom.str)) {
        return {isWhitespace: true};
      }

      var tx = PDFJS.Util.transform(viewport.transform, geom.transform);
      var angle = Math.atan2(tx[1], tx[0]);
      if (style.vertical) {
        angle += Math.PI / 2;
      }
      var fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
      var fontAscent = (style.ascent ? style.ascent * fontHeight :
                        (style.descent ? (1 + style.descent) * fontHeight : fontHeight));

      var fragmentStyles = {
        fontSize: fontHeight + "px",
        fontFamily: style.fontFamily,
        left: (tx[4] + (fontAscent * Math.sin(angle))) + 'px',
        top: (tx[5] - (fontAscent * Math.cos(angle))) + 'px'
      };

      var textElement = {
        fontNam:  geom.fontName,
        angle:  angle * (180 / Math.PI),
        style: fragmentStyles,
        textContent: geom.str
      };

      if (style.vertical) {
        textElement.canvasWidth = geom.height * viewport.scale;
      } else {
        textElement.canvasWidth = geom.width * viewport.scale;
      }

      return textElement;
    };


    var projectAnnotations = function(textElement, annotations) {
      if(!annotations) {
        textElement.spans = null;
      } else {
        textElement.color = annotations[0].color;
        textElement.annotations = _.pluck(annotations, "type");

        var sorted = _.sortBy(annotations, function(ann) {// sorted by range offset
          return ann.range[0];
        });

        var spans = sorted.map(function(ann, i) {
          var previous = sorted[i - 1];

          if(previous && previous.range[0] >= ann.range[0] && previous.range[1] >= ann.range[1]) {
            return null;
          }
          var next = sorted[i + 1];

          var text = textElement.textContent,
              start = previous ? text.length + (previous.range[1] - previous.interval[1]) : 0,
              left = ann.range[0] - ann.interval[0],
              right = text.length + (ann.range[1] - ann.interval[1]),
              end = next ?  right : text.length,
              style = { "backgroundColor": "rgba(" + ann.color.join(",") + ",0.2)" };

          return {
            pre: text.slice(start, left),
            content:text.slice(left, right),
            post: text.slice(right, end),
            style: style
          };
        });
        textElement.spans = spans;
      }
    };

    this.getTextContent = function(textContent) {
      var textItems = textContent.items;
      var textElements = [];
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      for (var i = 0; i < textItems.length; i++) {
        var textElement = createElement(textItems[i], textContent.styles);
        if(!textElement.isWhitespace) {
          ctx.font = textElement.style.fontSize + ' ' + textElement.style.fontFamily;
          var width = ctx.measureText(textElement.textContent).width;
          if (width <= 0) {
            textElement.isWhitespace = true;
          } else {
            projectAnnotations(textElement, annotations[i]);

            var textScale = textElement.canvasWidth / width;
            var rotation = textElement.angle;
            var transform = 'scale(' + textScale + ', 1)';
            transform = 'rotate(' + rotation + 'deg) ' + transform;

            CustomStyle.setProp('transform', textElement, transform);
            CustomStyle.setProp('transformOrigin', textElement, "0% 0%");
          }
        }
        textElements.push(textElement);
      };

      return textElements;
    };

  };

  return TextLayerBuilder;
});
