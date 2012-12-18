"use strict";
var canvas = $("#viewport").get(0);
var g = canvas.getContext("2d");

var keystate = new Array();
var lastKeystate = new Array();
for (var i = 0; i < 255; i++) {
    keystate[i] = false; 
    lastKeystate[i] = false;
}

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

var keys = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    space: 32,
    ctrl: 17
};

var game = (function () {
    var ship = new Ship(new Vec2(200,300), 3);

    var asteroids = new Array();
    var bullets = new Array();

    for (var i = 0; i < 10; i++) {
        var x = 0;
        var y = 0;
        if (Math.random() > 0.5) {
            y = Math.random() * canvas.height;
            x = Math.random() > 0.5 ? 0 : canvas.width;
        } else {
            y = Math.random() > 0.5 ? 0 : canvas.height;
            x = Math.random() * canvas.width;
        }
        
        var d = Math.random() * 2 * Math.PI;
        asteroids.push(new Asteroid(new Vec2(x, y), 50, 0, new Vec2(Math.sin(d), Math.cos(d))));
    }
    
    function handleInput() {
        if (keystate[keys.up]) {
            ship.thrust(SHIP_ACCEL);
        }
        if (keystate[keys.down]) {
            ship.thrust(-SHIP_ACCEL);
        }
        if (keystate[keys.left]) {
            ship.turn(-SHIP_TURN);
        }
        if (keystate[keys.right]) {
            ship.turn(SHIP_TURN);
        }
        if (keystate[keys.space] && !lastKeystate[keys.space]) {
            bullets.push(new Bullet(ship.p, ship.a, ship.v));
        }
        for (var i = 0; i < 255; i++) {
            lastKeystate[i] = keystate[i];
        }
    }
    
    function draw() {
        g.fillStyle = "rgb(0,20,0)";
        g.fillRect(0, 0, canvas.width, canvas.height);
        
        g.strokeStyle = "rgb(255, 255, 255)";
        g.beginPath();
        ship.draw(g);
        
        $.each(asteroids, function(i, asteroid) {
            asteroid.draw(g);
        });
        
        $.each(bullets, function(i, bullet) {
            bullet.draw(g);
        });
    
        g.stroke();
    };
    
    function update() {
        ship.update();
        $.each(asteroids, function(i, asteroid) {
            asteroid.update();
            
            $.each(bullets, function(i, bullet) {
                if (bullet.collides(asteroid)) {
                    bullet.dist = -1;
                    console.log("bullet hit");
                }
            });
        
            if (asteroid.collides(ship)) {
                console.log("ship hit");
            }
        });
    
        $.each(bullets, function(i, bullet) {    
            bullet.update();
        });
        bullets = bullets.filter(function(bullet) {return bullet.dist >= 0;});
    };
    
    function tick () {
        handleInput();
        draw();
        update();
        
        requestAnimFrame(tick);
    };

    return {tick: tick};
})();

$(document).ready(function () {
    $(document).keyup(function (e) {
        keystate[e.which] = false;
    });
    $(document).keydown(function (e) {
        keystate[e.which] = true;
    });

    game.tick();
});