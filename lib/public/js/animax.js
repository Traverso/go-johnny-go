var Eases = [
              'linear',
              'inQuad',
              'outQuad',
              'inOutQuad',
              'inCube',
              'outCube',
              'inOutCube',
              'inQuart',
              'outQuart',
              'inOutQuart',
              'inQuint',
              'outQuint',
              'inOutQuint',
              'inSine',
              'outSine',
              'inOutSine',
              'inExpo',
              'outExpo',
              'inOutExpo',
              'inCirc',
              'outCirc',
              'inOutCirc',
              'inBack',
              'outBack',
              'inOutBack',
              'inBound',
              'outBounce',
              'inOutBounce'
            ];
var Segment = function(name){
  this.name = name;
  this.duration = 1000;
  this.fps = 60;
  this.easing = 'linear';
  this.cuePoints = [0.0,0.25,0.50,0.75,1.0];
  this.targets = [{name:'Servo #1',pin:9,color:'#CC3300',
                   controller:'Standard',invert:false,
                   offset:0,visibility:true}];
  this.keyFrames = [ [{degrees:0},{degrees:45},{degrees:130},{degrees:45},{degrees:0}] ];
  this.loop = false;
};

var Animax = function(){
  this.segments = [];
  this.playlist = [];

  this.load();
  this.renderSegments();
};

Animax.prototype.updateSegmentSettings = function(seg){
  this.currentSegment.name = seg.name;
  this.currentSegment.duration = seg.duration;
  this.currentSegment.fps = seg.fps;
  this.currentSegment.easing = seg.easing;
  this.currentSegment.loop = seg.loop;
  this.save();
};

Animax.prototype.updateSegmentLoop = function(state){
  this.currentSegment.loop = state;
  this.save();
};


Animax.prototype.renderSegments = function(){
  $("#segments-table tbody").find("tr:gt(0)").remove();

  if(this.segments.length === 0){
     $("#no-segments").show();
     this.renderPlaylist();
     return;
  }

  $("#no-segments").hide();

  for(var i =0; i < this.segments.length;i++){
    var s = $('tr','#segment-template').clone();
    $('.name',s).html(this.segments[i].name);
    $(s).attr('id','seg_'+ i);

    $("#segments-table tbody").append(s);
  }
  this.renderPlaylist();
};

Animax.prototype.renderPlaylist = function(){
  $("#playlist-table tbody").find("tr:gt(0)").remove();
  if(this.playlist.length === 0){
     $("#no-playlist-item").show();
     $('button','#playlist-table').addClass('disabled');
     return;
  }

  $('button','#playlist-table').removeClass('disabled');
  $("#no-playlist-item").hide();

  for(var i = 0; i < this.playlist.length;i++){
    var s = $('tr','#playlist-template').clone();
    $('.name',s).html(this.playlist[i].name);
    $(s).attr('id','p_'+ i);

    if(i === 0){
      $('.move-up',s).addClass('disabled');
    }

    if(i === (this.playlist.length - 1) ){
      $('.move-down',s).addClass('disabled');
    }

    $("#playlist-table tbody").append(s);

  }
};

Animax.prototype.addToPlaylist = function(idx){
  this.playlist.push(this.segments[idx]);
  this.renderPlaylist();
  this.save();
};

Animax.prototype.removeFromPlaylist = function(idx){
  this.playlist.splice(idx,1);
  this.renderPlaylist();
  this.save();
};

Animax.prototype.moveUpPlaylist = function(idx){
  var temp = this.playlist[idx - 1];
  this.playlist[idx - 1] = this.playlist[idx];
  this.playlist[idx] = temp;
  this.renderPlaylist();
  this.save();
};

Animax.prototype.moveDownPlaylist = function(idx){

  var temp = this.playlist[idx + 1];
  this.playlist[idx + 1] = this.playlist[idx];
  this.playlist[idx] = temp;

  this.renderPlaylist();
  this.save();
};

Animax.prototype.allTargets = function(){
  var tgs = [];
  var pins = {};

  for(var i = 0; i < this.segments.length;i++){
    for(var j = 0; j < this.segments[i].targets.length;j++)
    {
        var t = this.segments[i].targets[j];
        if(pins[t.pin]) continue;

        pins[t.pin] = true;
        tgs.push(JSON.parse(JSON.stringify(t)));
    }
  }
  return tgs;
};

Animax.prototype.addSegment = function(){
  var seg = new Segment('New Segment');
  var targets = this.allTargets();
  if(targets.length !== 0) seg.targets = targets;

  this.segments.push(seg);
  this.save();
  this.renderSegments();
};

Animax.prototype.loadSegmentGraph = function(){
  $('#graph-loading').show(); 
  window.SegmentGraph.load(this.currentSegment);
};

Animax.prototype.editSegment = function(idx){
  //load segment into editor
  this.currentSegment = this.segments[idx];

  this.loadSegmentGraph();
  this.renderTargets();
  this.renderCuepoints();
};

Animax.prototype.addTarget = function(t){
  this.currentSegment.targets.push(t);
  var k = [];
  for(var i = 0;i < this.currentSegment.cuePoints.length;i++){
    k.push({degrees:90});
  }
  this.currentSegment.keyFrames.push(k);
  this.save();
  this.renderTargets();
  this.loadSegmentGraph();
};

Animax.prototype.updateTarget = function(idx,t){
  this.currentSegment.targets[idx] = t;
  this.save();
  this.renderTargets();
};

Animax.prototype.toggleVisibilityTarget = function(idx){
  this.currentSegment.targets[idx].visibility =  !this.currentSegment.targets[idx].visibility;
  this.renderTargets();
  this.save();
  
  if(this.currentSegment.targets[idx].visibility){
    window.SegmentGraph.showTarget(this.currentSegment,idx);
  } else {
    window.SegmentGraph.hideTarget(this.currentSegment,idx);
  }
};

Animax.prototype.saveCuepoint = function(idx,val){
  //normalize the value, check that it don't conflict with an existing cue
  for(var i = 0; i < this.currentSegment.cuePoints.length;i++){
    var c = this.currentSegment.cuePoints[i];
    var min = c - 0.05;
    var max = c + 0.05;
    
    if(val >= min && val <= max){ 

      //conflict
      if(val < c || val === 1){
        val = min;
        break;
      }

      if(val > c || val === 0){
        val = max;
        break;
      }

      if(val === c){
        val = (val > 0.5)? min:max;
        break;
      }
    }
  }

  if(idx < 0){ 
    //add cue
    this.currentSegment.cuePoints.push(val);
  } else { 
    //update
    this.currentSegment.cuePoints[idx] = val;
  }
  this.currentSegment.cuePoints.sort(function(a,b){return a-b;});

  if(idx < 0){ 
    //add KeyFrames for the existing targets
    var x = this.currentSegment.cuePoints.indexOf(val);
    for(var j = 0; j < this.currentSegment.targets.length;j++) {
      this.currentSegment.keyFrames[j].splice(x,0, { degrees: 90 });
    }
  }

  this.save();
  this.renderCuepoints();
  this.loadSegmentGraph();
};

Animax.prototype.getCuePoint = function(idx){
  return this.currentSegment.cuePoints[idx];
};

Animax.prototype.updateTargetValue = function(cueIdx,targetIdx,val){
  this.currentSegment.keyFrames[targetIdx][cueIdx].degrees = val;
  this.save();
};

Animax.prototype.getTarget = function(idx){
  return this.currentSegment.targets[idx];
};

Animax.prototype.removeTarget = function(idx){
  this.currentSegment.targets.splice(idx,1); 
  this.currentSegment.keyFrames.splice(idx,1); 
  this.save();
  this.renderTargets();
  this.loadSegmentGraph();
};

Animax.prototype.renderTargets = function(){
  $("#target-list").find("li:gt(0)").remove();

  if(this.currentSegment.targets.length === 0){
     $("#no-targets").show();
     return;
  }

  $("#no-targets").hide();

  for(var i = 0; i < this.currentSegment.targets.length;i++){
    var s = $('li','#target-template').clone();
    var n = this.currentSegment.targets[i].name;
    n+= ' ('+ this.currentSegment.targets[i].pin +')';
    $('.name',s).html(n);
    $('.color',s).css('backgroundColor',this.currentSegment.targets[i].color);
    $('.visibility span',s).addClass(this.currentSegment.targets[i].visibility? 'glyphicon-eye-open':'glyphicon-eye-close');
    if(!this.currentSegment.targets[i].visibility) $(s).addClass('no-view');

    $(s).attr('id','t_'+ i);
    $("#target-list").append(s);
  }
};

Animax.prototype.renderCuepoints = function(){

  $("#cue-list").find("li:gt(0)").remove();

  if(this.currentSegment.cuePoints.length === 0){
     $("#no-cuepoint").show();
     return;
  }

  $("#no-cuepoint").hide();

  for(var i = 0; i < this.currentSegment.cuePoints.length;i++){
    var s = $('li','#cuepoint-template').clone();
    $('.name',s).html(this.currentSegment.cuePoints[i]);
    $(s).attr('id','c_'+ i);
    $("#cue-list").append(s);
  }
};

Animax.prototype.updatedCuePoint = function(idx,val){
    if(val > 1) val = 1;
    this.currentSegment.cuePoints[idx] = val;
    this.save();
};

Animax.prototype.updateCuePoint = function(idx,val){
    $('.name','#c_'+ idx).html(val);
};

Animax.prototype.removeCuePoint = function(idx){
  this.currentSegment.cuePoints.splice(idx,1); 
  //remove the keyframes from the cuepoint
  for(var i = 0; i < this.currentSegment.keyFrames.length; i++)
  {
    this.currentSegment.keyFrames[i].splice(idx,1);
  }
  this.renderCuepoints();
  this.save();
  this.loadSegmentGraph();
};

Animax.prototype.duplicateSegment = function(idx){
  var seg = JSON.parse( JSON.stringify( this.segments[idx] ) );
  this.segments.push(seg);
  this.save();
  this.renderSegments();
};

Animax.prototype.deleteSegment = function(idx){
  this.segments.splice(idx,1); 
  this.renderSegments();
  this.save();
};

Animax.prototype.save = function(){

  if(typeof(Storage) !== "undefined") {
    var d = { segments:this.segments, playlist: this.playlist };
    localStorage.setItem("Animax",JSON.stringify(d) );
  }
};

Animax.prototype.load = function(){

  if(typeof(Storage) !== "undefined") {
    var d = localStorage.getItem("Animax");
    if(!d) return;
    d = JSON.parse(d);
    this.segments = d.segments;
    this.playlist = d.playlist;
  }
};

Animax.prototype.exportPlaylist = function(){
  
  var p = [];
  for(var i = 0;i < this.playlist.length;i++)
  {
    p.push( { name:this.playlist[i].name,
              data:this.exportSegmentTMP(this.playlist[i]) 
            } );
  }
  return JSON.stringify(p);
};

Animax.prototype.exportSegmentTMP = function(segment){

  return {
               duration:parseInt(segment.duration),
               fps:parseInt(segment.fps),
               easing:segment.easing,
               cuePoints:segment.cuePoints,
               keyFrames:segment.keyFrames,
               loop:segment.loop
            }; 
};

Animax.prototype.exportSegment = function(){
  return JSON.stringify(this.exportSegmentTMP(this.currentSegment));
};
