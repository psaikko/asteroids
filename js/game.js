"use strict";

window.requestAnimFrame = (function(){
    return window.requestAnimationFrame       || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(callback, element){
        window.setTimeout(callback, 1000 / 60);
    };
})();

$(window).resize(function () {
    var w = $(window).width();
    var h = $(window).height();
    var canvas = $('#viewport').get(0);
    var scale = Math.max(canvas.width / Math.min(w, h*canvas.width/canvas.height), 1);
    $('#canvasdiv').width(canvas.width/scale).height(canvas.height/scale);
    $('#viewport').width(canvas.width/scale).height(canvas.height/scale);
});

$('#mute').change(function () {
    asteroids_game.config.AUDIO.MUTE = $(this)[0].checked;
});

$(document).ready(function () {
    $(window).resize();
    $(document).keyup(asteroids_game.keyhandler.onKeyup);
    $(document).keydown(asteroids_game.keyhandler.onKeydown);
    asteroids_game.engine.tick();
});