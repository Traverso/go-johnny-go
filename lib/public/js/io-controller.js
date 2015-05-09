var socket = io.connect('//localhost:5000');
var isConnected = false;

$(document).ready(function() {
  socket.emit('status');
});

socket.on('status',function(data){
  if(!data.status || data.status !='ok') {
     $('.status-disconnected').show();
     $('.status-connected').hide();
     isConnected = false;
  }
  else {
     $('#board-info').html(data.boardType +' '+ data.boardPort); 
     $('.status-disconnected').hide();
     $('.status-connected').show();
     isConnected = true;
  }
});

socket.on('completed',function(data){
  $('#play-segment').show();
  $('#stop-segment').hide();
});

function ioUpdatePose(cue_idx){
    if(!isConnected) return;
    var pose = [];
    var keys = animax.currentSegment.keyFrames;
    for(var i = 0; i < keys.length;i++){
      pose.push(keys[i][cue_idx]);
    }
    socket.emit('pose',pose);
}
function ioTargetsSetup(targets){
    if(!isConnected) return;
    socket.emit('targets',targets);
}

function ioUpdateDegrees(target_idx,deg){
    if(!isConnected) return;
    socket.emit('rotate',{target_idx:target_idx,degrees:deg});
}

function ioPlaySegment(animation){
    if(!isConnected) return;
    socket.emit('animate',animation);
}

function ioStopSegment(){
    if(!isConnected) return;
    socket.emit('stop');
}
