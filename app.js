var util = require("util");
var http = require("http");
var rpiSensors = new require('sensors-io-rpi');
var rpiGS = rpiSensors.GStreamerSensors;
var rpiRing = rpiSensors.RingSensor;
var SensorsServer = new require('sensors-io').SensorsServer;
var SocketioServer = require("sensors-io-web").Server;

var gpioSensors = rpiSensors.GPIOSensors;

// -------------------Configuration------------------------------------------------
// Default port used by node app.
var port = process.env.port || 1337;
// Linux audio input and output device.
var inputDevice = "plughw:Set";
var outputDevice = "plughw:Set";

// The sound played outside when button is pressed. Empty string means that default sound is used.
var soundFile = "";

//Button gpio pin
var buttonPin = 27;

//Door lock pin
var doorLockPin = 17;

//--END-------------------

var serverPair = SocketioServer.configureSimpleServers(http, port, true);
var sensorsServer = serverPair.sensorsServer;
var server = serverPair.httpServer;


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

var camera = new rpiGS.Camera();
var speaker = new rpiGS.Speaker(null, true, null);
var mic = new rpiGS.Microphone();
var ring = new rpiRing.Ring();

camera.setState( { on: true });// start camera  
mic.setState({ device: inputDevice});
speaker.setState({ device: outputDevice});
ring.setState({ device: outputDevice});

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
