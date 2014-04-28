/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals CustomStyle, PDFFindController, scrollIntoView */



define(['underscore', 'PDFJS'], function(_, PDFJS) {
  'use strict';


  var TextLayerBuilder = function textLayerBuilder(options) {
    this.viewport = options.viewport;

    this.createElement = function(geom, styles) {
      var style = styles[geom.fontName];

      if (!/\S/.test(geom.str)) {
        return {isWhitespace: true};
      }

      var tx = PDFJS.Util.transform(this.viewport.transform, geom.transform);
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
        textElement.canvasWidth = geom.height * this.viewport.scale;
      } else {
        textElement.canvasWidth = geom.width * this.viewport.scale;
      }

      return textElement;
    };

    this.getTextContent = function(textContent) {
      var textItems = textContent.items;
      var textElements = [];
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d', {alpha: false});

      for (var i = 0; i < textItems.length; i++) {
        var textElement = this.createElement(textItems[i], textContent.styles);
        if(!textElement.isWhitespace) {
          ctx.font = textElement.style.fontSize + ' ' + textElement.style.fontFamily;
          var width = ctx.measureText(textElement.textContent).width;
          if (width <= 0) {
            textElement.isWhitespace = true;
          } else {
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
