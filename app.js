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
var io = require('socket.io').listen(server);

// The list of connected clients.
var clients = {};
var clientCnt = 0;

// The static list of colors.
var colors = [ '#FBEFEF', '#F8E0E0', '#F6CECE', '#F5A9A9', '#F78181', '#FA5858', '#FE2E2E', '#FF0000', '#DF0101', '#B40404', '#8A0808', '#610B0B', '#3B0B0B', '#2A0A0A', '#190707' ];

// The namespace ("room") to use for incomming connections.
// var socketNamespace = '';

// Default route.
app.get('/', function(req, res) {
	res.sendfile('public/index.html');

	// if (req.query.ns === '' || req.query.ns === undefined) {
	// socketNamespace = '';
	// } else {
	// socketNamespace = req.query.ns;
	// }
});

// Listen for connections.
io.sockets.on('connection', function(socket) {
	console.log('Connecting a client.');
	var id = clientCnt;
	console.log('Connecting client id.');

	socket.emit('msg', {
		msg : 'Connecting...you are user ' + id
	});

	socket.emit('setClientId', {
		clientId : id
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

	// Listen for color shift.
	socket.on('shiftColors', function() {
		console.log('Shuffle() called');
		io.sockets.emit('msg', {
			msg : 'Shuffle() called by user ' + id
		});

		io.sockets.clients().forEach(function(sock) {
			if (sock.color.colorId == colors.length - 1) {
				sock.color.colorId = 0;
				sock.color.value = colors[sock.color.colorId];
			} else {
				sock.color.colorId++;
				sock.color.value = colors[sock.color.colorId];
			}
			sock.emit('setColor', {
				color : sock.color.value
			});
		});
	});

	// Listen for reset.
	socket.on('resetConnections', function() {
		console.log('ResetConnections() called');
		// Reset all connections.
		clientCnt = 0;
		clients = {};
		io.sockets.clients().forEach(function(sock) {
			sock.emit('msg', {
				msg : 'Closing all sockets.'
			});
			sock.disconnect();
		});
	});

	// Listen for clients disconnecting.
	socket.on('disconnect', function() {
		console.log('Disconnecting client ' + id);
		delete clients[id];
		io.sockets.emit('msg', {
			msg : 'User ' + id + ' disconnected.'
		});
	});
});

server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
