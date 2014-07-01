var program = require('commander');
var fs = require('fs');
var atob = require('atob');
var _ = require('underscore');
var Q = require('q');
var ProtoBuf = require("protobufjs");

// let PDF.js be loaded not as a module in global space.
global.window = global;
global.navigator = { userAgent: "node" };
global.PDFJS = {};
global.DOMParser = require('./domparsermock.js').DOMParserMock;

require('./pdfjs/singlefile/build/pdf.combined.js');

PDFJS.disableWorker = true;

var builder = ProtoBuf.loadProtoFile(__dirname + "/SpaDoc.proto"), // somehow must be an absolute path
    spa = builder.build("ebm.spa"),
    Document = spa.Document;

function textContentToDocument(content) {
  var nodes = [];
  var pages = [];
  var text = "";

  var totalLength = 0;
  for (var i = 0; i < content.length; i++) {
    var offset = 0;
    var page = content[i];
    var items = page.items;
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var nextOffset = offset + item.str.length;
      var node = { page_index: i,
		   node_index: j,
		   interval: { lower: totalLength + offset,
			       upper: totalLength + nextOffset }};
      text += (item.str + " ");
      offset = nextOffset + 1; // 1 added for the extra space in text join
      nodes.push(node);
    }
    pages.push({ offset: totalLength, length: offset });
    totalLength += offset;
  }
  return new Document({ "text": text,
			"pages": pages,
			"nodes": nodes });
}

function convertToDocument(payload) {
  return PDFJS.getDocument(payload).then(function (pdf) {
    var pages = _.map(_.range(1, pdf.numPages + 1), function(pageNr) {
      return pdf.getPage(pageNr);
    });

    return Q.all(_.invoke(pages, "then", function(page) {
      return page.getTextContent();
    })).then(function(contents) {
      return textContentToDocument(contents);
    });
  });
};

function handler(payload) {
  var pdf = new Uint8Array(Buffer(payload, "binary"));
  var document = convertToDocument(pdf);
  return document.then(function(doc) {
    return doc.toBuffer();
  });
}

module.exports = handler;
