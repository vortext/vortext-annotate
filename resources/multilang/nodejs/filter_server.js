var program = require('commander');
var fs = require('fs');
var zmq = require('zmq');
var path_module = require('path');

program
  .version(process.env.SPA_VERSION || "<I HAVE NO MASTER>")
  .option('-m, --module [module]', 'The module to use as handler for messages')
  .option('-s, --socket [socket]', 'The ZeroMQ socket to listen on')
  .option('-p, --path [path]', 'Path where to look for modules', path_module.join(__dirname, '../../topologies'))
  .parse(process.argv);


var path = path_module.join(program.path, program.module);
var handler = require(path);

function runServer(handler) {
  var socket = zmq.socket('rep');

  socket.bind(program.socket, function(err) {
    if (err) throw err;
    console.log('Hail to the king! on %s', program.socket);

    socket.on('message', function(data) {
      var message = data.toString();
      var response = handler(message);
      socket.send(response);
    });
  });
}

runServer(handler);
