var CURRENT_SEGMENT = null;
var Y_DELTA = 45; 
var G_WIDTH = 835;
var Y_PADDING = 10;
var Y_POS = 0;
var G_PAD_X = 50;
var G_PAD_Y = 55;
var CUEPOINTS = {};

var DRAG_ID = null;
var DRAG_DELTA = null;
var DRAG_X_CONSTRAINS = {x1:0,x2:0};
var DRAG_LINE_LEFT = null;
var DRAG_LINE_RIGHT = null;
var DRAG_Y_CONSTRAINS = {y1:0,y2:0};
var DRAG_CUE_VALUE = 0;

tool.distanceThreshold = 4;

window.SegmentGraph = {
  load: function(seg){ 
    project.clear();
    paper.view.setViewSize(900,310);
    graphFrame();
    CURRENT_SEGMENT = seg;
    renderSegment(CURRENT_SEGMENT);

    setTimeout(function()
    {
      window.graphLoaded();
    },400);
  }
};

function updatePose(cue_idx){
    window.ioUpdatePose(cue_idx);
}

function updateTargetPoint(target_idx,y){
    var deg = targetToDegreeValue(y);
    var t = targetIDX(DRAG_ID);
    window.ioUpdateDegrees(t,deg);
}

function updateCuePoint(cueName,val){
   var idx = cueIDX(cueName);
   CURRENT_SEGMENT.cuePoints[idx] = val;
   window.updateCuePoint(idx,val);
}

function onMouseDown(event){
  var hit = project.hitTest(event.point);
  if(!hit) return;

  DRAG_DELTA = event.point;

  if(isCuePointName(hit.item.name)){
    DRAG_ID = hit.item.name;
    var r = new RegExp('^' + DRAG_ID);
    var items = project.getItems({ name:r });

    //find constrains
    var current_cue = currentCueValue(hit.item.name,CURRENT_SEGMENT.cuePoints);
    var prev_cue = prevCueValue(hit.item.name,CURRENT_SEGMENT.cuePoints);
    var next_cue = nextCueValue(hit.item.name,CURRENT_SEGMENT.cuePoints);

    DRAG_X_CONSTRAINS.x1 = cueValueToX(prev_cue); 
    DRAG_X_CONSTRAINS.x2 = cueValueToX(next_cue);

    if(current_cue != 0) DRAG_X_CONSTRAINS.x1 += 28;
    if(current_cue != 1) DRAG_X_CONSTRAINS.x2 -= 28;

    var n = cueIDX(DRAG_ID); 
    var r = new RegExp('^L_' + n);
    DRAG_LINE_LEFT = project.getItems({ name:r });
    r = new RegExp('^L_'+ (n+1));
    DRAG_LINE_RIGHT = project.getItems({ name:r });

    updatePose(n);

    return;
  }

  if(isTargetName(hit.item.name)){
    DRAG_ID = hit.item.name;
    var n = cueIDX(DRAG_ID); 
    var t = targetIDX(DRAG_ID);

    var r = new RegExp('^L_' + n +'_T_'+ t);
    DRAG_LINE_LEFT = project.getItems({ name:r });

    r = new RegExp('^L_'+ (n+1) +'_T_'+ t);
    DRAG_LINE_RIGHT = project.getItems({ name:r });

    DRAG_Y_CONSTRAINS.y1 = Y_DELTA + 5;
    DRAG_Y_CONSTRAINS.y2 = ((Y_DELTA + Y_PADDING) * 5) + 0.5;

    updateTargetPoint(DRAG_ID,event.point.y);

    return;
  }

  if(isTargetLine(hit.item.name)){
    //modal for target line
    return;
  }
}

function onMouseDrag(event){
  if(!DRAG_ID) return;

  if(isTargetName(DRAG_ID)){
    //check constrains 
    if(event.point.y < DRAG_Y_CONSTRAINS.y1) return;
    if(event.point.y > DRAG_Y_CONSTRAINS.y2) return;

    var r = new RegExp('^' + DRAG_ID);
    var items = project.getItems({ name:r });

    updateTargetPoint(DRAG_ID,event.point.y);

    for(var i = 0;i < items.length;i++){
        items[i].position.y = event.point.y;
    }

    //drag lines
    if(DRAG_LINE_LEFT){
      for(var i = 0; i < DRAG_LINE_LEFT.length;i++){
        var np = new Point(DRAG_LINE_LEFT[i].segments[1].point.x,event.point.y);
        DRAG_LINE_LEFT[i].segments[1].point = np;
      }
    }

    if(DRAG_LINE_RIGHT){
      for(var i = 0; i < DRAG_LINE_RIGHT.length;i++){
        var np = new Point( DRAG_LINE_RIGHT[i].segments[0].point.x,event.point.y);
        DRAG_LINE_RIGHT[i].segments[0].point = np;
      }
    }
    return;
  }
  
  if(isCuePointName(DRAG_ID)){
    //check constrains 
    if(event.point.x < DRAG_X_CONSTRAINS.x1) return;
    if(event.point.x > DRAG_X_CONSTRAINS.x2) return;

    var r = new RegExp('^' + DRAG_ID);
    var items = project.getItems({ name:r });

    for(var i = 0;i < items.length;i++){
        items[i].position.x = event.point.x;
        if(isCueLabel(items[i].name)){
          //updateCueValue
          DRAG_CUE_VALUE = pointToCueValue(event.point); 
          updateCuePoint(DRAG_ID,DRAG_CUE_VALUE);
          items[i].content = DRAG_CUE_VALUE; 
        }
    }

    //drag line
    if(DRAG_LINE_LEFT){
      for(var i = 0; i < DRAG_LINE_LEFT.length;i++){
        var np = new Point(event.point.x, DRAG_LINE_LEFT[i].segments[1].point.y);
        DRAG_LINE_LEFT[i].segments[1].point = np;
      }
    }

    if(DRAG_LINE_RIGHT){
      for(var i = 0; i < DRAG_LINE_RIGHT.length;i++){
        var np = new Point(event.point.x, DRAG_LINE_RIGHT[i].segments[0].point.y);
        DRAG_LINE_RIGHT[i].segments[0].point = np;
      }
    }
  }
}

function onMouseUp(event){

  if(isTargetName(DRAG_ID)){
    var r = new RegExp('^' + DRAG_ID);
    var items = project.getItems({ name:r });
    
    var y = 0;
    for(var i = 0;i < items.length;i++){
        y = items[i].position.y; 
    }
    var n = cueIDX(DRAG_ID); 
    var t = targetIDX(DRAG_ID);
    var deg = targetToDegreeValue(y);
    window.updateTargetValue(n,t,deg);
  }

  if(isCuePointName(DRAG_ID)){
    var n = cueIDX(DRAG_ID); 
    window.updatedCuePoint(n,pointToCueValue(event.point));
  }

  DRAG_ID = null;
  DRAG_LINE_LEFT = null;
  DRAG_LINE_RIGHT = null;
  DRAG_CUE_VALUE = 0;
}

function isCuePointName(name) {
  return /^c_\d+_$/.test(name);
}

function isTargetName(name){
  return /^c_\d+_t_\d+$/.test(name);
}

function isTargetLine(name){
  return false;
  //return /^c_\d+_t_\d+$/.test(name);
}

function targetIDX(name){
  var n = name.split('_');
  n = n[n.length - 1];
  return parseInt(n);
}

function cueIDX(cue_name){
  var n = cue_name.replace('c_','');
  n = n.split('_')[0];
  return parseInt(n);
}

function currentCueValue(cue_name,cuePoints){
  var n = cueIDX(cue_name); 

  for(var i = 0; i < cuePoints.length;i++){
    if(i == n) return cuePoints[i];
  }
  return 0;
}

function prevCueValue(cue_name,cuePoints){
  var n = cueIDX(cue_name); 

  for(var i = 0; i < cuePoints.length;i++){
    if(i == n){ //current cue
      if(i == 0 || i == 1) return 0;
      return cuePoints[ i - 1];
    }
  }
  return 0;
}

function nextCueValue(cue_name,cuePoints){
  var n = cue_name.replace('c_','');
  n = parseInt(n);

  for(var i = 0; i < cuePoints.length;i++){
    if(i == n){ //curren point
      if(i >= (cuePoints.length - 1)) return 1;
      return cuePoints[ i + 1];
    }
  }
  return 1;
}

function isCueLabel(id){
  return (id.indexOf('_x_') > 0);
}

function renderSegment(segment){
  renderCuepoints(segment.cuePoints);

  for(var i = 0; i < segment.keyFrames.length;i++){
    if(!segment.targets[i].visibility) continue;
    renderTarget(i,segment.cuePoints,segment.keyFrames[i],segment.targets[i].color);
  }
}

function renderCuepoints(cuePoints){
  var CUE_WIDTH = 30;
  var T_H = (Y_DELTA + Y_PADDING) * 4;
  var cueLayer = new Layer();

  for(var i = 0;i < cuePoints.length;i++){
    var cuePoint = cuePoints[i];
    var x = mapping(cuePoint,0,1,0,G_WIDTH);
    x += G_PAD_X;

    var p = new Point(x - (CUE_WIDTH/2),Y_DELTA);
    var rect = new Rectangle(p,new Size(CUE_WIDTH,(T_H + 40)));
    var corner = new Size(4,4);
    var path = new Path.Rectangle(rect,corner);

    path.style = {
      fillColor: '#e3e3e3',
      strokeWidth:0
    };

    path.opacity = 0.25;
    path.name = 'c_'+ i +'_';

    //render the cuepoint value
    var text = new PointText(new Point(x,(Y_DELTA - 5)));
    text.justification = 'center';
    text.fillColor = '#999';
    text.content = cuePoint;

    text.name = path.name +'x_'+ i;

    path.onMouseEnter = function(event){

      if(DRAG_ID != null && DRAG_ID != this.name) return;
      this.opacity = 0.75;
      document.body.style.cursor = "pointer";
    }

    path.onMouseLeave = function(event){

      if(DRAG_ID != null && DRAG_ID == this.name) return;
      this.opacity = 0.25;
      document.body.style.cursor = "default";
    }
  }
}

function targetToDegreeValue(y){
  y = y - (Y_DELTA + 5);
  var g_height = (Y_DELTA + Y_PADDING) * 5 - (Y_DELTA + 5);
  //console.log('h:'+ g_height +',y:'+ y);
  var deg = mapping(y,0,g_height,0,180);
  deg = 180 - deg;
  return Math.round(deg);
}

function pointToCueValue(p){
  var x = p.x - G_PAD_X;
  var p = mapping(x,0,G_WIDTH,0,1);
  return Math.round(p * 100) / 100;
}

function cueValueToX(cue){
  var x = mapping(cue,0,1,0,G_WIDTH);
  return x + G_PAD_X;
}

function renderTarget(target_id,cuePoints,keyFrames,color){
  var T_H = (Y_DELTA + Y_PADDING) * 4;
  var prev_point = null;

  var lineLayer = new Layer();
  var dotLayer = new Layer();

  for(var i = 0;i < cuePoints.length;i++){
    var cuePoint = cuePoints[i];
    var keyFrame = keyFrames[i];

    var x = mapping(cuePoint,0,1,0,G_WIDTH);
    var y = mapping(keyFrame.degrees,0,180,0,T_H);

    //reverse the point
    y = Math.abs((y - T_H));

    x += G_PAD_X;
    y += G_PAD_Y;

    var p = new Point(x,y);

    if(prev_point != null){
      var path = new Path();
      path.moveTo(prev_point);
      path.lineTo(p);

      path.style = {
          strokeColor: color,
          strokeWidth: 5
      };
      path.name = 'L_'+ i +'_T_'+ target_id;
      lineLayer.addChild(path);
    }

    var c = new Path.Circle(p,8);
    c.style = {
      fillColor: 'white',
      strokeColor: color,
      strokeWidth: 5 
    };

    c.onMouseEnter = function(event){
      if(DRAG_ID != null && DRAG_ID != this.name) return;
      this.fillColor = color;
      document.body.style.cursor = "pointer";
    }

    c.onMouseLeave = function(event){
      if(DRAG_ID != null && DRAG_ID == this.name) return;
      this.fillColor= 'white';
      document.body.style.cursor = "default";
    }

    c.name = 'c_'+ i +'_t_'+ target_id;
    dotLayer.addChild(c);
    prev_point = p; 
  }
}

function graphFrame(){

  for(var i = 1; i < 6; i++){
    var path = new Path();

    path.strokeColor = '#e3e3e3';
    if(i==5) path.strokeColor = '#000';

    Y_POS = i * (Y_DELTA + Y_PADDING);

    //render graphs horizontal lines
    var start = new Point(G_PAD_X,Y_POS);
    path.moveTo(start);
    path.lineTo(start + [G_WIDTH,0]);

    //render labels on y axis
    var text = new PointText(new Point((G_PAD_X - 20), (Y_POS) + 4));
    text.justification = 'right';
    text.fillColor = 'black';
    text.content = ( 180 - ((i-1) * Y_DELTA));
  }

  var X_DELTA = G_WIDTH / 4;

  //render labels on x axis
  for(var i = 0; i < 5;i++){
    var X_POS = i * X_DELTA; 
    var text = new PointText(new Point((X_POS + (G_PAD_X)), (Y_POS + 25)));
    text.justification = 'center';
    text.fillColor = 'black';
    text.content = (i * 25)/ 100;
  }
}

function mapping(n, in_min , in_max , out_min , out_max ) {
    return ( n - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}
