
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var UAParser = require('ua-parser-js');
var parser = new UAParser();
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

// WebSocket server.
// Connect from the command line like this: wscat -c ws://127.0.0.1:8080 -p 8
var WebSocketServer = require('ws').Server, wss = new WebSocketServer({
	port : 8080
});
wss.on('connection', function(ws) {
	ws.on('message', function(message) {
		console.log('received: %s', message);
	});
	ws.send('something');
});


// Global crap.
var connections = {};

app.get('/', function(req, res) {
	var msg;
	var ua = req.headers['user-agent']; // user-agent header from an HTTP
										// request
	var device = parser.setUA(ua).getDevice();
	console.log(device);
	if (device.type === '' || device.type === undefined) {
		msg = 'Looks like you are on a desktop computer.';
	} else {
		msg = 'Looks like you are on a ' + device.type + ' device';
	}
	
	var ip = req.connection.remoteAddress;
	
	console.log('query: ' + req.query);
	console.log('params: ' + req.params);

	checkForConnectionCountReset(req.query, ua);
	
	if (connections[ua] > 0) {
		msg += handleExistingUser(ua, ip);
	} else {
		msg += handleNewUser(ua, ip);
	}
	
	msg += '<br><br>Your user-agent is ' + ua + '.';
	msg += '<br><br>Your IP address is ' + ip + '.';
	res.send(msg);
});

var checkForConnectionCountReset = function(query, ua) {
	if (query.reset == 'true') {
		connections[ua] = 0;
	}
};

var handleNewUser = function(ua, ip) {
	connections[ua] = 1;
	return '<br><br>Looks like this is your first time here.';
};

var handleExistingUser = function(ua, ip) {
	connections[ua]++;
	return '<br><br>Looks like you have been here a total of ' + connections[ua] + ' times.';
};

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
