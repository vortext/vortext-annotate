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

function handler(payload) {
  return PDFJS.getDocument(payload).then(function (pdf) {
    var pages = _.map(_.range(1, pdf.numPages + 1), function(pageNr) {
      return pdf.getPage(pageNr);
    });

    return Q.all(_.invoke(pages, "then", function(page) {
      return page.getTextContent().then(function(content) {
        return content;
      });
    }));
  });
};

if(require.main === module) {
  program
    .option('-i, --input [input]', 'path to PDF to parse')
    .option('-o, --output [output]', 'path to output file')
    .parse(process.argv);

  var pdf = new Uint8Array(fs.readFileSync(program.input));
  var out = program.output;
  var resultPromise = handler(pdf);
  resultPromise.then(function(result) {
    result = JSON.stringify(result);
    if(out) {
      fs.writeFile(out, result);
    } else {
      console.log(result);
    }
  });
}

module.exports = handler;
