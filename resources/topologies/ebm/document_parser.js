var program = require('commander');
var fs = require('fs');
var atob = require('atob');
var _ = require('underscore');
var Q = require('q');

// let PDF.js be loaded not as a module in global space.
global.window = global;
global.navigator = { userAgent: "node" };
global.PDFJS = {};
global.DOMParser = require('./domparsermock.js').DOMParserMock;

require('./pdfjs/singlefile/build/pdf.combined.js');

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
      var node = { pageIndex: i, interval: [offset, nextOffset] };
      text += (item.str + " ");
      offset = nextOffset + 1; // 1 added for the extra space in text join
      nodes.push(node);
    }
    pages.push({offset: totalLength, length: offset});
    totalLength += offset;
  }
  return { "text": text,
           "__pages": pages,
           "__nodes": nodes };
}

function handler(payload) {
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


/* --------------------
 For stand-alone usage.
 --------------------- */
function flush(data, out) {
  if(out) {
    fs.writeFile(out, data);
  } else {
    console.log(data);
  }
}

if(require.main === module) {
  program
    .option('-i, --input [input]', 'path to PDF to parse')
    .option('-o, --output [output]', 'path to output file')
    .option('-n, --noparse', 'Do no parse, return the base64 encoded pdf')
    .option('-b, --base64', 'input pdf as base64')
    .parse(process.argv);

  var pdf;
  if(program.base64) {
    var pdfData = fs.readFileSync(program.input, "binary");
    pdf = new Uint8Array(Buffer(pdfData, "base64"));
  } else {
    pdf = new Uint8Array(fs.readFileSync(program.input));
  }
  var out = program.output;
  if(program.noparse) {
    flush(new Buffer(pdf, "binary").toString("base64"), out);
  } else {
    var resultPromise = handler(pdf);
    resultPromise.then(function(result) {
      result = JSON.stringify(result);
      flush(result, out);
    });
  }
}

module.exports = handler;
