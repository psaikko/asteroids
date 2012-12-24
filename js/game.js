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

$(document).ready(function () {
    $(document).keyup(function (e) {
        asteroids_game.keys.state[e.which] = false;
    });
    $(document).keydown(function (e) {
        asteroids_game.keys.state[e.which] = true;
    });

    asteroids_game.engine.start();
});

var asteroids_game = asteroids_game || {};

asteroids_game.keys = new (function () {
    this.up = 38;
    this.down = 40;
    this.left = 37;
    this.right = 39;
    this.space = 32;
    this.ctrl = 17;
    this.esc = 27;

    this.state = new Array();
    this.lastState = new Array();

    for (var i = 0; i < 255; i++) {
        this.state[i] = false; 
        this.lastState[i] = false;
    }

    this.keyup = function (e) {
        this.state[e.which] = false;
    }

    this.keydown = function (e) {
        this.state[e.which] = true;
    }
})();

asteroids_game.engine = new (function () {
    var g = $("#viewport").get(0).getContext("2d");
    // 'imports'
    var keys = asteroids_game.keys;
    var Ship = asteroids_game.objects.Ship;
    var Asteroid = asteroids_game.objects.Asteroid;
    var Vec2 = asteroids_game.objects.Vec2;
    var Text = asteroids_game.text.Text;
    var textLength = asteroids_game.text.textLength;
    var CFG = asteroids_game.config;

    var end = false;
    var score = 0;
    var ship = new Ship(new Vec2(g.canvas.width / 2, g.canvas.height / 2), 15, 20, 3);
    var level;

    var asteroids; var explosions;
    var beatFrequency; var beatCooldown; var beatNum; var beat_delta;

    function initLevel(lvl) {
        level = lvl;
        asteroids = new Array();
        explosions = new Array();

        beatFrequency = CFG.AUDIO.BEAT_MAX;
        beatCooldown = beatFrequency;
        beatNum = 0;

        var asteroid_count = CFG.ASTEROID.MIN_COUNT + level;
        beat_delta = (CFG.AUDIO.BEAT_MAX - CFG.AUDIO.BEAT_MIN) / (asteroid_count*7 - 1);

        for (var i = 0; i < asteroid_count; i++) {
            var x = 0; var y = 0;
            if (Math.random() > 0.5) {
                y = Math.random() * g.canvas.height;
                x = Math.random() > 0.5 ? 0 : g.canvas.width;
            } else {
                y = Math.random() > 0.5 ? 0 : g.canvas.height;
                x = Math.random() * g.canvas.width;
            }     
            var d = Math.random() * 2 * Math.PI;

            asteroids.push(new Asteroid(new Vec2(x, y), CFG.ASTEROID.SIZE['LARGE'], 0, new Vec2(Math.sin(d), Math.cos(d))));
        }
    }  
    
    function handleInput() {
        if (keys.state[keys.up]) {
            ship.thrust(CFG.SHIP.ACCELERATION);
        }
        if (keys.state[keys.left]) {
            ship.turn(-CFG.SHIP.TURNRATE);
        }
        if (keys.state[keys.right]) {
            ship.turn(CFG.SHIP.TURNRATE);
        }
        if (keys.state[keys.space] && !keys.lastState[keys.space]) {
            ship.fire();
        }
        if (keys.state[keys.ctrl] && !keys.lastState[keys.ctrl]) {
            ship.p = new Vec2(Math.random()*g.canvas.width, Math.random()*g.canvas.height);
        }
        if (keys.state[keys.esc]) {
            end = true;
        }
        keys.lastState = keys.state.slice();
    }
    
    function draw() {
        g.fillStyle = "rgb(0,20,0)";
        g.fillRect(0, 0, g.canvas.width, g.canvas.height);
        
        g.strokeStyle = "rgb(255, 255, 255)";
        g.beginPath();

        ship.draw(g);
        
        $.each(asteroids, function(i, asteroid) {
            asteroid.draw(g);
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
        if (asteroids.length > 0 && beatCooldown++ > beatFrequency) {
            var src = "audio/beat"+(beatNum+1)+".wav";
            var audio = new Audio();
            audio.src = src;
            audio.volume = 0.4;
            audio.play();

            beatNum = (beatNum + 1) % 2;
            beatCooldown = 0;
        }

        var obj_update = function(obj) { obj.update(); };
        var obj_alive = function(obj) { return obj.isAlive(); };

        ship.update();

        ship.bullets.forEach(function (bullet) {
            asteroids.forEach(function (asteroid) {
                if (bullet.p.subtract(asteroid.p).magnitude() < 2*asteroid.r) {
                    if (bullet.collides(asteroid)) {
                        bullet.kill();
                        asteroid.kill();
                    }
                }
            });
        });
    
        asteroids.forEach(obj_update);
        explosions.forEach(obj_update);

        asteroids.filter(function (asteroid) { return !asteroid.isAlive(); })
                .map(function (destroyed) {
                    var audio = new Audio();
                    audio.src = "audio/explosion.wav";
                    audio.volume = 0.5;
                    audio.play();

                    beatFrequency -= beat_delta;
                    score += CFG.ASTEROID.SCORE[destroyed.size];
                    explosions.push(destroyed.createExplosion());
                    return destroyed.createFragments()
                ;})
                .forEach(function (fragments) { asteroids = asteroids.concat(fragments); });

        asteroids = asteroids.filter(obj_alive);

        explosions = explosions.filter(obj_alive);
 
        if (asteroids.length == 0) {
            initLevel(level + 1);
        } 
    };
    
    function tick () {
        handleInput();
        draw();
        update();
        if (!end) requestAnimFrame(tick);
    };

    this.start = function () { 
        initLevel(0);
        tick();
    };
})();

