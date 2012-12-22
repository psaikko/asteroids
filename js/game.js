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
    var score = 0;
    var ship = new Ship(new Vec2(canvas.width / 2, canvas.height / 2), 3);

    var asteroids = new Array();
    var bullets = new Array();
    var explosions = new Array();

    var beatFrequency = BEAT_MAX;
    var beatCooldown = beatFrequency;
    var beatNum = 0;

    var engineSound = new Audio();
    engineSound.src = "audio/engine.wav";
    engineSound.volume = 0.5;
    var engineSoundCooldown = 0;

    var asteroid_count = 3;
    var total_asteroids = asteroid_count*7;
    var beat_delta = (BEAT_MAX - BEAT_MIN) / (total_asteroids - 1);

    for (var i = 0; i < 3; i++) {
        var x = 0; var y = 0;
        if (Math.random() > 0.5) {
            y = Math.random() * canvas.height;
            x = Math.random() > 0.5 ? 0 : canvas.width;
        } else {
            y = Math.random() > 0.5 ? 0 : canvas.height;
            x = Math.random() * canvas.width;
        }     
        var d = Math.random() * 2 * Math.PI;

        asteroids.push(new Asteroid(new Vec2(x, y), ASTEROID_SIZE['LARGE'], 0, new Vec2(Math.sin(d), Math.cos(d))));
    }
    
    function handleInput() {
        if (keystate[keys.up]) {
            if (engineSoundCooldown++ > 3) {
                engineSoundCooldown = 0;
                engineSound.play();
            }   
            ship.thrust(SHIP_ACCEL);
        }
        if (keystate[keys.left]) {
            ship.turn(-SHIP_TURN);
        }
        if (keystate[keys.right]) {
            ship.turn(SHIP_TURN);
        }
        if (keystate[keys.space] && !lastKeystate[keys.space]) {
            if (bullets.length < BULLET_COUNT) {
                var audio = new Audio();
                audio.src = "audio/fire.wav";
                audio.play();
                bullets.push(new Bullet(ship.p, ship.a, ship.v));
            }
        }
        if (keystate[keys.ctrl] && !lastKeystate[keys.ctrl]) {
            ship.p = new Vec2(Math.random()*canvas.width, Math.random()*canvas.height);
        }
        lastKeystate = keystate.slice();
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
    
        $.each(explosions, function(i, explosion) {
            explosion.draw(g);
        });
    
        drawUI();
    
        g.stroke();
    };
    
    function drawUI() {
        var scoreString = score > 0 ? ""+score : "00";
        var char_w = 15;
        var char_h = 20;
        var x = textLength("999999999", char_w) - textLength(scoreString, char_w);
        var y = 10;
        var scoreText = new Text(scoreString, x, y, char_w, char_h);
        scoreText.draw(g);
    }

    function update() {
        
        ship.update();
        var fragments = new Array();
        $.each(asteroids, function(i, asteroid) {
            asteroid.update();
            
            $.each(bullets, function(i, bullet) {
                if (bullet.p.subtract(asteroid.p).magnitude() <2*asteroid.r) {
                    if (bullet.collides(asteroid)) {
                        bullet.dist = -1;
                        asteroid.hp = asteroid.hp -1;
                        if (asteroid.hp == 0) {
                            var audio = new Audio();
                            audio.src = "audio/explosion.wav";
                            audio.volume = 0.5;
                            audio.play();

                            beatFrequency -= beat_delta;
                            score += ASTEROID_SCORE[asteroid.size];
                        }
                    }
                }
            });
        
            if (asteroid.collides(ship)) {
                //explosions.push(new Explosion(ship));
                //ship = new Ship(new Vec2(canvas.width / 2, canvas.height / 2), 3);
            }
        });
    
        $.each(bullets, function(i, bullet) {     
            bullet.update();
        });
    
        $.each(explosions, function(i, explosion) {
            explosion.update();
        });
    
        bullets = bullets.filter(function(bullet) {return bullet.dist >= 0;});
        asteroids.filter(function (asteroid) {return asteroid.hp <= 0;})
                 .map(function (destroyed) {explosions.push(new Explosion(destroyed));
                                            return destroyed.createFragments();})
                 .forEach(function (fragments) {asteroids = asteroids.concat(fragments);});
        asteroids = asteroids.filter(function(asteroid) {return asteroid.hp > 0;});
        explosions = explosions.filter(function(explosion) {return explosion.time > 0;});
    };
    
    function tick () {
        if (asteroids.length && beatCooldown++ > beatFrequency) {
            //beat[beatNum].play();
            var src = "audio/beat"+(beatNum+1)+".wav";
            var audio = new Audio();
            audio.src = src;
            audio.volume = 0.4;
            audio.play();

            beatNum = (beatNum + 1) % 2;
            beatCooldown = 0;
        }


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