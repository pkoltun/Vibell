var util = require("util");
var http = require("http");
var rpiSensors = new require('sensors-io-rpi');
var rpiGS = rpiSensors.GStreamerSensors;
var rpiRing = rpiSensors.RingSensor;
var SensorsServer = new require('sensors-io').SensorsServer;
var SocketioServer = require("sensors-io-web").Server;

var gpioSensors = rpiSensors.GPIOSensors;

// -------------------Configuration------------------------------------------------
var clients= [/*Replace this with IPs of device which should be able to recive audio/video streams*/]; // e.g. clients= ["192.168.1.2","192.168.1.3"];

// Default port used by node app.
var port = process.env.port || 1337;

var multicastInterface ="eth0"; 

// The sound played outside when button is pressed. Empty string means that default sound is used.
var soundFile = "";

//Button gpio pin
var buttonPin = 27;

//Door lock pin
var doorLockPin = 17;

var audioCodec ="raw";

//--END-------------------

var serverPair = SocketioServer.configureSimpleServers(http, port, true);
var sensorsServer = serverPair.sensorsServer;
var server = serverPair.httpServer;

if (clients.length === 0){
		console.log("Please edit app.js and provide IPs of clients.")
	return;
}

var getClientsString = function( port ){
    var result = clients[0]+":"+port;
    for ( i = 1; i<clients.length; i++){
        result += "," + clients[i]+":"+port;
    }
    return result;
}

var outGPIO = new gpioSensors.OutGPIOSensor(false, doorLockPin);

// Auto switch off out gpio sensor after 3000 ms
 
var changeState = function () {
    var lastState = outGPIO.getLastAvaliableState();
    var newState = {
        on: false
    }
    if (lastState.on) {
        outGPIO.setState(newState);
    }
}

setInterval(changeState, 3000);

var button = new gpioSensors.InGPIOSensor(buttonPin);

var camera = new rpiGS.Camera(null, true, null);
var speaker = new rpiGS.Speaker(null, true, null);
var mic = new rpiGS.Microphone(null, true, null);
var ring = new rpiRing.Ring();

camera.setState( { on: true,multicastIface: multicastInterface, clients: getClientsString(5000) });
mic.setState({ on:true, multicastIface: multicastInterface, clients: getClientsString(5001), audioCodec: audioCodec});
speaker.setState({ on:true, multicastIface: multicastInterface, clients: getClientsString(5002), audioCodec: audioCodec});
ring.setState({ multicastIface: multicastInterface});

if ( soundFile !== ""){
	ring.setState( {soundFile: soundFile});
}

sensorsServer.addSensor(camera, 'camera');
sensorsServer.addSensor(speaker, 'speaker');
sensorsServer.addSensor(mic, 'mic');
sensorsServer.addSensor(outGPIO, 'outPin');
sensorsServer.addSensor(button, 'button');
sensorsServer.addSensor(ring, 'ring');
server.listen(port);
