var http = require('http');
var nodeStatic = require('node-static');
var file = new(nodeStatic.Server)();

// adjust to deal with heroku
var app = http.createServer(function(req, res) {
  file.serve(req, res);
}).listen(process.env.PORT || 2013);
var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket) {
  // push server log messages to client
  function log(){
    var arr = [">>> Message from server:"];
    for (var i = 0; i < arguments.length; i++) {
      arr.push(arguments[i]);
    }
    socket.emit('log', arr);
  }

  socket.on('message', function (message) {
    log('Got message: ', message);
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    var numClients = io.sockets.clients(room).length;
    log('Room ' + room + ' has ' + numClients + ' client(s)');
    log('Request to create or join room ' + room);

    if (numClients == 0){
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients == 1) {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room);
    } else { // max two clients
      socket.emit('full', room);
    }

    socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
    socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
  });
});

