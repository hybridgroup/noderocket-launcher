var express = require('express');
var app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server, {log:false});
var j5 = require("johnny-five");

var Launcher = require('./launcher/launcher');

app.use(express.static('www'));
app.use(express.bodyParser());

server.listen(8082);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/openFill', function (req, res) {
    l1.openFill();
    res.send(200);
});

app.get('/closeFill', function (req, res) {
    l1.closeFill();
    res.send(200);
});

app.get('/launch', function (req, res) {
    l1.launch();
    res.send(200);
});

app.get('/pressure', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ pressure: l1.getPressure() }));
});

app.post('/fillTo', function (req, res) {
    console.log("Filling To: " + JSON.stringify(req.body));
    l1.fillTo(req.body.pressure, false);
});

var board = new j5.Board();

var l1 = new Launcher({
    pressureSensorPin: "A2",
    fillValvePin: 3,
    launchValvePin: 2,
    dataInterval: 200,
    maxPsi: 120,
    holdAfterLaunch: 500,
    board: board,
    pressure: {
        slope: -0.46511,
        yint: -96.133
    }
});

var linkSocket = function (socket, launcher) {

    // Emit launcher ready
    launcher.on('launcher-ready', function(data) {
        socket.emit('ready', data);
    });

    // Emit launcher data
    launcher.on('launcher-data', function(data) {
        socket.emit('data', data);
    });

    // Emit launch valve data
    launcher.on('launchValve', function(data) {
        socket.emit('launchValve', data);
    });

    // Emit fill valve data
    launcher.on('fillValve', function(data) {
        socket.emit('fillValve', data);
    });

    socket.on('openFill', function(){
        console.log('openFill');
        launcher.openFill()
    });

    socket.on('closeFill', function(){
        console.log('closeFill');
        launcher.closeFill()
    });

    socket.on('openLaunch', function(){
        console.log('openLaunch');
        launcher.openLaunch()
    });

    socket.on('closeLaunch', function(){
        console.log('closeLaunch');
        launcher.closeLaunch()
    });

    socket.on('fillAndLaunch', function(psi) {
        console.log('fillAndLaunch');
        launcher.fillTo(psi, true);
    });

    socket.on('fillTo', function(psi){
        console.log('fill to ' + psi );
        launcher.fillTo(psi);
    });

    socket.on('fill', function(){
        console.log('fill');
        launcher.fill()
    });

    socket.on('launch', function() {
        console.log('launch');
        launcher.launch();
    });

    socket.on('reset', function() {
        launcher.reset();
    })
};

// Socket IO configuration
io.sockets.on('connection', function (socket) {
    socket.emit('hello');

    socket.on('start', function(data) {
        console.log(data);
        linkSocket(socket, l1);
    });
});


