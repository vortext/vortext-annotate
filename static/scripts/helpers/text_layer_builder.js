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

'use strict';

/**
 * TextLayerBuilder provides text-selection
 * functionality for the PDF. It does this
 * by creating overlay divs over the PDF
 * text. This divs contain text that matches
 * the PDF text they are overlaying. This
 * object also provides for a way to highlight
 * text that is being searched for.
 */
var TextLayerBuilder = function textLayerBuilder(options) {
  this.layoutDone = false;
  this.divContentDone = false;
  this.textDivs = [];

  this.viewport = options.viewport;
  this.pageIdx = options.pageIndex;

  this.setupRenderLayoutTimer = function textLayerSetupRenderLayoutTimer() {
    // Rendering is done in React, so we don't care here.
    // Original implementation delayed painting if the user was scrolling
    this.renderLayer();
  };

  this.renderLayer = function textLayerBuilderRenderLayer() {
    var textDivs = this.textDivs;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', {alpha: false});

    for (var i = 0, ii = textDivs.length; i < ii; i++) {
      var textDiv = textDivs[i];
      if ('isWhitespace' in textDiv) {
        continue;
      }

      ctx.font = textDiv.style.fontSize + ' ' + textDiv.style.fontFamily;
      var width = ctx.measureText(textDiv.textContent).width;
      if (width <= 0) {
        textDiv.isWhitespace = true;
        continue;
      } else {
        var textScale = textDiv.canvasWidth / width;
        var rotation = textDiv.angle;
        var transform = 'scale(' + textScale + ', 1)';
        transform = 'rotate(' + rotation + 'deg) ' + transform;

        CustomStyle.setProp('transform', textDiv, transform);
        CustomStyle.setProp('transformOrigin', textDiv, "0% 0%");
      }
    }

    this.renderingDone = true;
  };

  this.getRenderedElements = function() {
    return this.textDivs;
  };

  this.appendText = function textLayerBuilderAppendText(geom, styles) {
    var style = styles[geom.fontName];

    if (!/\S/.test(geom.str)) {
      this.textDivs.push({isWhitespace: true});
      return;
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

    this.textDivs.push(textElement);
  };

  this.setTextContent = function textLayerBuilderSetTextContent(textContent) {
    this.textContent = textContent;

    var textItems = textContent.items;
    for (var i = 0; i < textItems.length; i++) {
      this.appendText(textItems[i], textContent.styles);
    }
    this.divContentDone = true;

    this.setupRenderLayoutTimer();
  };

  this.convertMatches = function textLayerBuilderConvertMatches(matches) {
    // NOT IMPLEMENTED
    return;
  };

  this.renderMatches = function textLayerBuilder_renderMatches(matches) {
    // NOT IMPLEMENTED
    return;
  };

  this.updateMatches = function textLayerUpdateMatches() {
    // NOT IMPLEMENTED
    return;
  };
};
