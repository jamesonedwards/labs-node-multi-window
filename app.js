/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), http = require('http'), path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// The node server.
var server = http.createServer(app);

// The websockets server.
// var io = require('socket.io').listen(80);
var io = require('socket.io').listen(server);

// The list of connected clients.
var clients = {};
var clientCnt = 0;

var colors = [ '#FF0000', '#BFFF00', '#045FB4', '#2EFE64', '#240B3B' ];

// Listen for connections.
io.sockets.on('connection', function(socket) {
	var id = clientCnt;

	socket.emit('msg', {
		msg : 'Connecting...you are user ' + id
	});

	// Add client to list.
	clients[id] = socket;
	console.log((new Date()) + ' Connection accepted [' + id + ']');
	clientCnt++;

	// Assign a color to this client.
	if (id < colors.length) {
		clients[id].color = {
			colorId : id,
			value : colors[id]
		};
		socket.emit('setColor', {
			color : clients[id].color.value
		});
	} else {
		socket.emit('msg', {
			msg : 'TOO MANY CLIENTS!'
		});
	}

	socket.on('shuffle', function() {
		console.log('Shuffle() called');
		io.sockets.emit('msg', {
			msg : 'Shuffle() called by user ' + id
		});

		// io.sockets.clients('ADD ROOM HERE').forEach(function (socket) { ..
		// });
		io.sockets.clients().forEach(function(socket) {
			if (socket.color.colorId == colors.length - 1) {
				socket.color.colorId = 0;
				socket.color.value = colors[socket.color.colorId];
			} else {
				socket.color.colorId++;
				socket.color.value = colors[socket.color.colorId];
			}
			socket.emit('setColor', {
				color : clients[id].color.value
			});
		});
	});

	// Listen for clients disconnecting.
	socket.on('disconnect', function() {
		delete clients[id];
		io.sockets.emit('msg', {
			msg : 'User ' + id + ' disconnected.'
		});
		// io.sockets.emit('User disconnected.');
	});
});

// Default route.
app.get('/', function(req, res) {
	res.sendfile('public/index.html');
});

server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
