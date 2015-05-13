var animax = null;

$(document).ready(function() {
    animax = new Animax(); 

    $('#segments-page').show();
    $('#segment-page').hide();

    $(".segments-overview").click(function(){
        animax.renderSegments();
        $('#segments-page').show();
        $('#segment-page').hide();
    });

    $(".add-segment").click(function(){
        animax.addSegment();
    });

    $("#segments-table").on("click",".delete-segment",function(){
        animax.deleteSegment(getIdx(this));
    });

    $("#segments-table").on("click",".playlist-segment",function(){
        animax.addToPlaylist(getIdx(this));
    });

    $("#segments-table").on("click",".duplicate-segment",function(){
        animax.duplicateSegment(getIdx(this));
    });

    $("#segments-table").on("click",".edit-segment",function(){
        $('#segments-page').hide();
        $('#segment-page').show();

        animax.editSegment(getIdx(this));
        var seg = animax.currentSegment;

        $("#segment-name").val(seg.name);
        $("#segment-duration").val(seg.duration);
        $("#segment-fps").val(seg.fps);
        $("#segment-easing").val(seg.easing);

        if(seg.loop){
          $("#segment-loop").attr('aria-pressed','true');
          $('span','#segment-loop').removeClass('glyphicon-off');
          $('span','#segment-loop').addClass('glyphicon-refresh');
        } else {
          $("#segment-loop").attr('aria-pressed','false');
          $('span','#segment-loop').removeClass('glyphicon-refresh');
          $('span','#segment-loop').addClass('glyphicon-off');
        }




        ioTargetsSetup(seg.targets);
    });

    $("#segments-table").on("mouseenter","tr",
        function(){
          $('.actions',this).show(); 
        });

    $("#segments-table").on("mouseleave","tr",
        function(){
          $('.actions',this).hide(); 
        });

    $("#playlist-table").on("mouseenter","tr",
        function(){
          $('.actions',this).show(); 
        });

    $("#playlist-table").on("mouseleave","tr",
        function(){
          $('.actions',this).hide(); 
        });

    $("#playlist-table").on("click",".remove",function(){
        animax.removeFromPlaylist(getIdx(this));
    });

    $("#playlist-table").on("click",".move-up",function(){
        animax.moveUpPlaylist(getIdx(this));
    });

    $("#playlist-table").on("click",".move-down",function(){
        animax.moveDownPlaylist(getIdx(this));
    });

    $("#play-segment").click(function(){
        ioPlaySegment(animax.exportSegmentTMP(animax.currentSegment));
        $('#play-segment').hide();
        $('#stop-segment').show();
    });

    $("#segment-loop").click(function(){


        if($(this).attr('aria-pressed') == 'false'){
            $('span','#segment-loop').removeClass('glyphicon-off');
            $('span','#segment-loop').addClass('glyphicon-refresh');
            animax.updateSegmentLoop(true);
        } else {
            $('span','#segment-loop').removeClass('glyphicon-refresh');
            $('span','#segment-loop').addClass('glyphicon-off');
            animax.updateSegmentLoop(false);
        }

    });

    $("#stop-segment").click(function(){
        ioStopSegment();

        $('#play-segment').show();
        $('#stop-segment').hide();
    });

    $("#save-segment").click(function(){
         $('#save-segment').hide();
         $('#save-loading').show();

         var seg = {
                      name:$("#segment-name").val(),
                      duration:$("#segment-duration").val(),
                      fps:$("#segment-fps").val(),
                      easing:$("#segment-easing").val(),
                      loop:($('#segment-loop').attr('aria-pressed') == 'true')
                   };

         animax.updateSegmentSettings(seg);
         
         setTimeout(function()
           {
             $('#save-segment').show();
             $('#save-loading').hide();
           },900);

    });

    $("#export-playlist").click(function(){
        $('#export-modal').modal();
        var e = animax.exportPlaylist();
        $('#exportArea').val(e);
    });

    $("#export-segment").click(function(){
        $('#exportArea').val(animax.exportSegment());
        $('#export-modal').modal();
    });

    $("#add-target").click(function(){

      $('#target-id').val(-1);
      $('#target-color').val('#ffffff');
      $('#target-name').val('');
      $('#target-pin').val('');
      $('#target-controller').val('Standard');
      $('#target-invert').val('false');
      $('#target-offset').val('0');
      $('#target-modal').modal();
    });

    $("#save-target").click(function(){
       var t = {
                  color:$('#target-color').val(),
                  name:$('#target-name').val(),
                  pin:$('#target-pin').val(),
                  controller:$('#target-controller').val(),
                  invert:($('#target-invert').val() == 'true'),
                  offset:parseInt($('#target-offset').val()),
                  visibility:true
               };

       var idx = $('#target-id').val();

       if(idx == "-1") {
        animax.addTarget(t);
       } else {
        animax.updateTarget(idx,t);
       }

       ioTargetsSetup(animax.currentSegment.targets);
       $('#target-modal').modal('hide');
    });

    $("#targets").on("click",".delete-target",function(){
        animax.removeTarget(getLiIdx(this)); 
        ioTargetsSetup(animax.currentSegment.targets);
    });

    $("#targets").on("click",".edit-target",function(){
        var t = animax.getTarget(getLiIdx(this));

        $('#target-id').val(getLiIdx(this));
        $('#target-color').val(t.color);
        $('#target-name').val(t.name);
        $('#target-pin').val(t.pin);
        $('#target-controller').val(t.controller);
        $('#target-invert').val((t.invert)? 'true':'false');
        $('#target-offset').val(t.offset);
        $('#target-modal').modal();
    });

    $("#targets").on("click",".hide-show-target",function(){
        animax.toggleVisibilityTarget(getLiIdx(this)); 
    });

    $("#targets").on("mouseenter","li",
        function(){
          $('.controls',this).show(); 
        });

    $("#targets").on("mouseleave","li",
        function(){
          $('.controls',this).hide(); 
        });

    $("#save-cuepoint").click(function(){
        animax.saveCuepoint($('#cue-point-idx').val(),$('#cue-point-ranger').val() / 100);
        $('#cuepoint-modal').modal('hide');
    });

    $("#add-cuepoint").click(function(){
        $('#cue-point-idx').val(-1);
        $('#cue-point-ranger').val(50);
        $('#cue-point-range-out').html(0.5);

        $('#cuepoint-modal').modal();
    });

    $("#cues").on("click",".edit-cue",
        function(){
        var idx = getLiIdx(this);
        var cp = animax.getCuePoint(idx);

        $('#cue-point-idx').val(idx);
        $('#cue-point-ranger').val(cp * 100);
        $('#cue-point-range-out').html(cp);
        $('#cuepoint-modal').modal();
    });

    $("#cues").on("click",".delete-cue",
        function(){
          animax.removeCuePoint(getLiIdx(this)); 
    });


    $("#cues").on("mouseenter","li",
        function(){
          $('.controls',this).show(); 
        });

    $("#cues").on("mouseleave","li",
        function(){
          $('.controls',this).hide(); 
        });


    for(var i = 0; i < Eases.length; i++){
      $('#segment-easing').append('<option>'+ Eases[i] +'</option>');
    }
});

function updateTargetValue(cueIdx,targetIdx,val){
  animax.updateTargetValue(cueIdx,targetIdx,val);
}

function updateCuePoint(idx,val){
  animax.updateCuePoint(idx,val);
}

function updatedCuePoint(idx,val){
  animax.updatedCuePoint(idx,val);
}

function updateModalCue(v){
  $('#cue-point-range-out').html(v / 100);
}
 
function graphLoaded(){
   $('#graph-loading').hide(); 
}

function toggleKeyFrameActivity(target_idx,cue_idx){
   return animax.toggleKeyFrameActivity(target_idx,cue_idx);
}

function getLiIdx(seg){
      var id = $(seg).closest("li").attr('id');
      id = id.split('_');
      id = id[id.length - 1];
      return parseInt(id);
}
function getIdx(seg){
      var id = $(seg).closest("tr").attr('id');
      id = id.split('_');
      id = id[id.length - 1];
      return parseInt(id);
}
