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
        var s = {
                  id:targets[i].name,
                  pin: targets[i].pin,
                  fps: 100,
                  isInverted: targets[i].invert,
                  offset: targets[i].offset,
                  controller:targets[i].controller,
                  range:[0,180],
                  specs: { speed:five.Servo.Continuous.speeds["@5.0V"] }
                };

        if(s.controller == 'PCA9685') s.address = 0x40;

        SERVOS.push( new five.Servo(s) );
      }
  };

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

		socket.on('pose', function(action) {
      for(var i = 0; i < action.length;i++){
         if(action[i] === null) continue;
         SERVOS[i].to(action[i].degrees,500);
      }
    });

		socket.on('rotate', function(action) {
      SERVOS[action.target_idx].to(action.degrees);
    });

		socket.on('animate', function(action) {
      loadTargets(action.targets);
      animation = new five.Animation(new five.Servo.Array(SERVOS));

      action.oncomplete = function() { 
                                        loadTargets(TARGETS);
                                        socket.emit('completed');
                                        console.log('animation completed');
                                     };
      animation.enqueue(action);
    });

		socket.on('stop', function(action) {
      loadTargets(TARGETS);
      animation.stop();
    });

	});
};
