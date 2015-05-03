var express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	server = require('http').Server(app),
	io = require('socket.io').listen(server),
	port = 5000,
	consolePrefix = 'Server: ';

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

//var felix = require('./Felix/index.js');
//felix(app, io);

io.sockets.on('connection', function(socket) {
	console.log(consolePrefix + 'Socket io is connected.');
});

server.listen(port, function() {
  console.log(consolePrefix + 'Listening on ' + port);
});
