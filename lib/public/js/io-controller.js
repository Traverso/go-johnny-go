var socket = io.connect('//localhost:5000');

$(document).ready(function() {
      socket.emit('status');
});

socket.on('status',function(data){
  if(!data.status || data.status !='ok') {
     $('.status-disconnected').show();
     $('.status-connected').hide();
  }
  else {
     $('#board-info').html(data.boardType +' '+ data.boardPort); 
     $('.status-disconnected').hide();
     $('.status-connected').show();
  }
});

socket.on('completed',function(data){
  $('#play-segment').show();
  $('#stop-segment').hide();
});


function ioTargetsSetup(targets){
    socket.emit('targets',targets);
}

function ioUpdateDegrees(target_idx,deg){
    socket.emit('rotate',{target_idx:target_idx,degrees:deg});
}

function ioPlaySegment(animation){
    socket.emit('animate',animation);
}

function ioStopSegment(){
    socket.emit('stop');
}
