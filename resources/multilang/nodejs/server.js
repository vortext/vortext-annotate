var program = require('commander');
var fs = require('fs');
var Q = require('q');
var path_module = require('path');
var Worker = require('./worker');

program
  .version(process.env.SPA_VERSION || "<I HAVE NO MASTER>")
  .option('-m, --module [module]', 'The module to use as handler for messages')
  .option('-s, --socket [socket]', 'The ZeroMQ socket to listen on')
  .option('-n, --name [name]', 'The service name')
  .option('-p, --path [path]', 'Path where to look for modules', path_module.join(__dirname, '../../topologies'))
  .parse(process.argv);


var path = path_module.join(program.path, program.module);
var handler = require(path);

function runServer(handler) {
  var worker = new Worker(program.socket, program.name);
  worker.start();

  worker.on('request', function(req, rep) {
    var result;
    try {
      result = handler(req);
      Q.when(result, function(data) {
        rep.reply(data);
      }, function(err) {
        rep.reply(err);
      });
    } catch (err) {
      console.error("Failed to process", err);
      result = JSON.stringify({cause: "Error: " + err});
      rep.reply(result);
    }
  });

}

runServer(handler);
