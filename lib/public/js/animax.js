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

var Project = function(name){
  this.name = name;
  this.segments = [];
  this.playlist = [];
  this.targets = [{name:'Servo #1',pin:9,color:'#CC3300',
                   controller:'Standard',invert:false,
                   offset:0,visibility:true}];
};

var Segment = function(name){
  this.name = name;
  this.duration = 1000;
  this.fps = 60;
  this.easing = 'linear';
  this.cuePoints = [0.0,0.25,0.50,0.75,1.0];
  this.keyFrames = [ [{degrees:0,active:false},{degrees:22.5},{degrees:0},{degrees:22.5},{degrees:0}] ];
  this.loop = false;
};

var Animax = function(){
  this.projects = [];
  this.currentSegment = null;
  this.load();
  this.renderProjects();
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

Animax.prototype.updatePlaylistLoop = function(state){
  this.currentProject.playlist.loop = state;
  this.save();
};

Animax.prototype.renderProjects = function(){
  this.currentSegment = null;

  $("#projects-table tbody").find("tr:gt(0)").remove();

  if(this.projects.length === 0){
     $("#no-projects").show();
     return;
  }

  $("#no-projects").hide();

  for(var i =0; i < this.projects.length;i++){
    var s = $('tr','#projects-template').clone();
    $('.name',s).html(this.projects[i].name);
    $(s).attr('id','prj_'+ i);

    $("#projects-table tbody").append(s);
  }
};

Animax.prototype.addProject = function(){
  var project = new Project('Project '+ new Date().getTime());
  this.projects.push(project);
  this.save();
  return (this.projects.length - 1);
};

Animax.prototype.editProject = function(idx){
  this.currentProject = this.projects[idx];
  this.currentSegment = null;
  animax.renderSegments();
  animax.renderTargets();
};

Animax.prototype.deleteProject = function(idx){
  this.projects.splice(idx,1); 
  this.renderProjects();
  this.save();
};

Animax.prototype.duplicateProject = function(idx){
  var prj = JSON.parse( JSON.stringify( this.projects[idx] ) );
  prj.name = 'Project '+ new Date().getTime();
  this.projects.push(prj);
  this.save();
  this.renderProjects();
};

Animax.prototype.exportProject = function(){
  return JSON.stringify( this.currentProject,null,3 );
};

Animax.prototype.saveProject = function(prj){
  this.currentProject.name = prj.name;
  this.save();
};

Animax.prototype.renderSegments = function(){
  $("#segments-table tbody").find("tr:gt(0)").remove();

  if(this.currentProject.segments.length === 0){
     $("#no-segments").show();
     this.renderPlaylist();
     return;
  }

  $("#no-segments").hide();

  for(var i =0; i < this.currentProject.segments.length;i++){
    var s = $('tr','#segment-template').clone();
    $('.name',s).html(this.currentProject.segments[i].name);
    $(s).attr('id','seg_'+ i);

    $("#segments-table tbody").append(s);
  }
  this.renderPlaylist();
};

Animax.prototype.syncPlaylist = function(){
  var pl = [];
  for(var i = 0; i < this.currentProject.playlist.length;i++){
    var p = this.currentProject.segments[this.currentProject.playlist[i]];
    if(!p) continue;
    pl.push(this.currentProject.playlist[i]);
  }
  this.currentProject.playlist  = pl;
};

Animax.prototype.renderPlaylist = function(){
  $("#playlist-table tbody").find("tr:gt(0)").remove();
  this.syncPlaylist();

  if(this.currentProject.playlist.length === 0){
     $("#no-playlist-item").show();
     $('button','#playlist-table').addClass('disabled');
     return;
  }

  $('button','#playlist-table').removeClass('disabled');
  $("#no-playlist-item").hide();

  var itemsInPlaylist = 0;
  for(var i = 0; i < this.currentProject.playlist.length;i++){
    var p = this.currentProject.segments[this.currentProject.playlist[i]];
    if(!p) continue;

    var s = $('tr','#playlist-template').clone();
    $('.name',s).html(p.name);
    $(s).attr('id','p_'+ i);

    if(i === 0){
      $('.move-up',s).addClass('disabled');
    }

    if(i === (this.currentProject.playlist.length - 1) ){
      $('.move-down',s).addClass('disabled');
    }

    $("#playlist-table tbody").append(s);
    itemsInPlaylist++;
  }
};

Animax.prototype.addToPlaylist = function(idx){
  this.currentProject.playlist.push(idx);
  this.renderPlaylist();
  this.save();
};

Animax.prototype.removeFromPlaylist = function(idx){
  this.currentProject.playlist.splice(idx,1);
  this.renderPlaylist();
  this.save();
};

Animax.prototype.moveUpPlaylist = function(idx){
  var temp = this.currentProject.playlist[idx - 1];
  this.currentProject.playlist[idx - 1] = this.currentProject.playlist[idx];
  this.currentProject.playlist[idx] = temp;
  this.renderPlaylist();
  this.save();
};

Animax.prototype.moveDownPlaylist = function(idx){

  var temp = this.currentProject.playlist[idx + 1];
  this.currentProject.playlist[idx + 1] = this.currentProject.playlist[idx];
  this.currentProject.playlist[idx] = temp;

  this.renderPlaylist();
  this.save();
};

Animax.prototype.addSegment = function(){
  var seg = new Segment('New Segment '+ new Date().getTime());

  //add keyframes to the new target based on existing targets
  var templateTarget = JSON.parse(JSON.stringify(seg.keyFrames[0]));
  if(this.currentProject.targets.length > 0){
    //clear the keyframes
    seg.keyFrames = [];

    for(var j = 0; j < this.currentProject.targets.length;j++){
      var kff = JSON.parse(JSON.stringify(templateTarget));
      for(var k = 0; k < kff.length; k++){
        kff[k].degrees += (j + 1) * 20; 
      }
      seg.keyFrames.push(kff);
    }
  }
  
  this.currentProject.segments.push(seg);
  this.save();
  return (this.currentProject.segments.length - 1);
};

Animax.prototype.loadSegmentGraph = function(){
  $('#graph-loading').show(); 
  this.currentSegment.targets = this.currentProject.targets; 
  window.SegmentGraph.load(this.currentSegment);
};

Animax.prototype.editSegment = function(idx){
  //load segment into editor
  this.currentSegment = this.currentProject.segments[idx];

  this.loadSegmentGraph();
  this.renderTargets();
  this.renderCuepoints();
};

Animax.prototype.toggleKeyFrameActivity = function(target_idx,cue_idx){
  var current_status = this.currentSegment.keyFrames[target_idx][cue_idx].active;
  current_status = (current_status === false)? true:false;
  this.currentSegment.keyFrames[target_idx][cue_idx].active = current_status;
  this.save();
  return { active:current_status,color:this.currentProject.targets[target_idx].color };
};

Animax.prototype.addTarget = function(t){
  this.currentProject.targets.push(t);

  //add cuepoints to existing segments
  for(var j = 0; j < this.currentProject.segments.length; j++)
  {
    var k = [];
    for(var i = 0;i < this.currentProject.segments[j].cuePoints.length;i++){
      k.push({degrees:90});
    }
    this.currentProject.segments[j].keyFrames.push(k);
  }

  this.save();
  this.renderTargets();

  if(this.currentSegment !== null) this.loadSegmentGraph();
};

Animax.prototype.updateTarget = function(idx,t){
  this.currentProject.targets[idx] = t;
  this.save();
  this.renderTargets();
};

Animax.prototype.toggleVisibilityTarget = function(idx){
  this.currentProject.targets[idx].visibility =  !this.currentProject.targets[idx].visibility;
  this.renderTargets();
  this.save();
  
  if(this.currentProject.targets[idx].visibility){
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

    for(var j = 0; j < this.currentProject.targets.length;j++) {
      var key = { degrees:90 };
      if(x != 0){
          key.degrees = this.currentSegment.keyFrames[j][ x - 1].degrees;
          if(this.currentSegment.keyFrames[j][ x - 1].active === false){
            key.active = false;
          }
      }
      this.currentSegment.keyFrames[j].splice(x,0, key );
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
  return this.currentProject.targets[idx];
};

Animax.prototype.removeTarget = function(idx){
  this.currentProject.targets.splice(idx,1); 
  if(this.currentSegment != null){
    this.currentSegment.keyFrames.splice(idx,1); 
    this.loadSegmentGraph();
  }
  this.renderTargets();
  this.save();
};

Animax.prototype.renderTargets = function(){
  $("#targets-table tbody").find("tr:gt(0)").remove();
  $("#targets-table-segment tbody").find("tr:gt(0)").remove();

  if(this.currentProject.targets.length === 0){
     $(".no-targets").show();
     return;
  }

  $(".no-targets").hide();

  for(var i = 0; i < this.currentProject.targets.length;i++){
    
    //add to u-list
    var s1 = $('tr','#target-table-template').clone();
    var s2 = $('tr','#target-table-template').clone();

    var n = this.currentProject.targets[i].name;
    n+= ' ('+ this.currentProject.targets[i].pin +')';

    $('.name',s1).html(n);
    $('.name',s2).html(n);
    $('.color',s1).css('backgroundColor',this.currentProject.targets[i].color);
    $('.color',s2).css('backgroundColor',this.currentProject.targets[i].color);
    $('.visibility span',s1).addClass(this.currentProject.targets[i].visibility? 'glyphicon-eye-open':'glyphicon-eye-close');
    $('.visibility span',s2).addClass(this.currentProject.targets[i].visibility? 'glyphicon-eye-open':'glyphicon-eye-close');

    if(!this.currentProject.targets[i].visibility){
      $(s1).addClass('no-view');
      $(s2).addClass('no-view');
    }

    $(s1).attr('id','t_'+ i);
    $("#targets-table tbody").append(s1);

    $(s2).attr('id','tt_'+ i);
    $("#targets-table-segment tbody").append(s2);
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
  var seg = JSON.parse( JSON.stringify( this.currentProject.segments[idx] ) );
  this.currentProject.segments.push(seg);
  this.save();
  this.renderSegments();
};

Animax.prototype.deleteSegment = function(idx){
  this.currentProject.segments.splice(idx,1); 
  this.renderSegments();
  this.renderPlaylist();
  this.save();
};

Animax.prototype.save = function(){

  if(typeof(Storage) !== "undefined") {
    localStorage.setItem("GoJohnnyGo",JSON.stringify({projects:this.projects}) );
  }
};

Animax.prototype.load = function(){

  if(typeof(Storage) !== "undefined") {
    var d = localStorage.getItem("GoJohnnyGo");
    if(!d) return;
    var d = JSON.parse(d);
    if(d.projects !== undefined) this.projects = d.projects;
  }
};

Animax.prototype.exportPlaylist = function(){
  
  var p = [];
  for(var i = 0;i < this.currentProject.playlist.length;i++)
  {

    var seg = this.currentProject.segments[this.currentProject.playlist[i]];
    if(!seg) continue;

    p.push( { name:seg.name,
              data:this.exportSegmentTMP(seg) 
            } );
  }
  return JSON.stringify(p,null,4);
};

Animax.prototype.exportTargets = function(){
  var targets = [];
  for(var i = 0; i < this.currentProject.targets.length;i++){
    if(!this.currentProject.targets[i].visibility) continue;
    targets.push(JSON.parse(JSON.stringify(this.currentProject.targets[i])));
  }
  return targets;
};

Animax.prototype.exportKeyFrames = function(segment){
  var keyFrames = [];
  for(var i = 0; i < segment.keyFrames.length;i++){
    var keyframe = segment.keyFrames[i];
    var cues = [];

    for(var j = 0; j < keyframe.length; j++){
        var cue_point = keyframe[j];

        if(cue_point.active === false){
          cues.push(null);
          continue;
        }


        cues.push(JSON.parse(JSON.stringify(cue_point)));
    }
    
    if(!this.currentProject.targets[i].visibility){
      continue;
    }

    keyFrames.push(JSON.parse(JSON.stringify(cues)));
  }
  return keyFrames;
};

Animax.prototype.exportSegmentTMP = function(segment){
  
  segment.cuePoints[0] = 0;
  segment.cuePoints[segment.cuePoints.length - 1] = 1;

  return {
               duration:parseInt(segment.duration),
               fps:parseInt(segment.fps),
               easing:segment.easing,
               cuePoints:segment.cuePoints,
               keyFrames:this.exportKeyFrames(segment),
               loop:segment.loop,
               targets:this.exportTargets()
            }; 
};

Animax.prototype.exportSegment = function(){
  return JSON.stringify(this.exportSegmentTMP(this.currentSegment),null,4);
};
