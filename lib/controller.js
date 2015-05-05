module.exports = function(app, io) {
	var bodyParser = require('body-parser'),
		five = require('johnny-five'),
		board = new five.Board();

	app.use(bodyParser.json());

  var TARGETS = null;
  var SERVOS =[];
  var animation = null;

  var loadTargets = function(targets){
      SERVOS = [];
      
      for(var i = 0; i < targets.length;i++){
        SERVOS.push( new five.Servo({
                                  id:targets[i].name,
                                  pin: targets[i].pin,
                                  fps: 100,
                                  isInverted: false,
                                  range:[0,180],
                                  specs: { speed:five.Servo.Continuous.speeds["@5.0V"] }
                             }));
      }
  }

	io.sockets.on('connection', function(socket) {

		console.log('Socket io is ready.');

    board.on('ready', function() {
      console.log('Board ready');
      socket.emit('status',{status:(board.isReady)?'ok':'ko',boardType:board.type,boardPort:board.port});
    });

		socket.on('status', function(action) {
      console.log('status request');
      socket.emit('status',{status:(board.isReady)?'ok':'ko',boardType:board.type,boardPort:board.port});
    });

		socket.on('targets', function(action) {
      console.log('loading targets:');
      TARGETS = action;
      loadTargets(TARGETS);
    });

		socket.on('rotate', function(action) {
      SERVOS[action.target_idx].to(action.degrees);
    });

		socket.on('animate', function(action) {
      animation = new five.Animation(new five.Servo.Array(SERVOS));

      action.oncomplete = function() { 
                                        loadTargets(TARGETS);
                                        socket.emit('completed');
                                     }
      animation.enqueue(action);
    });

		socket.on('stop', function(action) {
      loadTargets(TARGETS);
      animation.stop();
    });

	});
}
