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
        asteroids_game.keyhandler.onKeyup(e);
    });
    $(document).keydown(function (e) {
        asteroids_game.keyhandler.onKeydown(e);
    });

    asteroids_game.engine.start();
});

var asteroids_game = asteroids_game || {};

asteroids_game.engine = new (function () {
    var g = $("#viewport").get(0).getContext("2d");
    // 'imports'
    var keys = asteroids_game.keyhandler;
    var Ship = asteroids_game.objects.Ship;
    var Asteroid = asteroids_game.objects.Asteroid;
    var Vec2 = asteroids_game.objects.Vec2;
    var Text = asteroids_game.text.Text;
    var textLength = asteroids_game.text.textLength;
    var CFG = asteroids_game.config;

    var end = false;
    var score = 0;
    var life_counter = 0;
    var ship = new Ship(new Vec2(g.canvas.width / 2, g.canvas.height / 2), CFG.SHIP.WIDTH, CFG.SHIP.HEIGHT, 3);
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
        if (keys.isKeydown('up')) {
            ship.thrust();
        }
        if (keys.isKeydown('left')) {
            ship.turnLeft();
        }
        if (keys.isKeydown('right')) {
            ship.turnRight();
        }
        if (keys.isKeypress('space')) {
            ship.fire();
        }
        if (keys.isKeypress('ctrl')) {
            ship.p = new Vec2(Math.random()*g.canvas.width, Math.random()*g.canvas.height);
        }
        if (keys.isKeydown('esc')) {
            end = true;
        }
        keys.tick();
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
        var char_w = CFG.SHIP.WIDTH; 
        var char_h = CFG.SHIP.HEIGHT;
        var x = textLength("999999999", char_w) - textLength(scoreString, char_w);
        var y = 5;
        var scoreText = new Text(scoreString, x, y, char_w, char_h);
        scoreText.draw(g);

        for (var i = 0; i < ship.lives; i++) {
            new Ship(new Vec2(125 + CFG.SHIP.WIDTH*i, 2*y+char_h+10), CFG.SHIP.WIDTH, CFG.SHIP.HEIGHT, 0).draw(g);
        }
    }

    function update() {
        if (life_counter > 10000) {
            life_counter -= 10000;
            ship.lives++;
            CFG.AUDIO.PLAY('1up', 0.5);
        }

        if (asteroids.length > 0 && beatCooldown++ > beatFrequency) {
            CFG.AUDIO.PLAY('beat'+(beatNum+1), 0.4);
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

        asteroids.forEach(function (asteroid) {
            if (!ship.isInvincible() && ship.collides(asteroid)) {
                asteroid.kill();    
                ship.lives--;       
                if (ship.lives < 1)
                    end = true;
                else
                    ship = new Ship(new Vec2(g.canvas.width / 2, g.canvas.height / 2), CFG.SHIP.WIDTH, CFG.SHIP.HEIGHT, ship.lives);
            }
        });

        asteroids.forEach(obj_update);
        explosions.forEach(obj_update);

        asteroids.filter(function (asteroid) { return !asteroid.isAlive(); })
                .map(function (destroyed) {
                    CFG.AUDIO.PLAY('explosion', 0.5);
                    beatFrequency -= beat_delta;
                    score += CFG.ASTEROID.SCORE[destroyed.size];
                    life_counter += CFG.ASTEROID.SCORE[destroyed.size];
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
        if (!end) 
            handleInput();
        draw();
        update();
        if (!(end && explosions.length == 0)) 
            requestAnimFrame(tick);
        else {
            g.beginPath();
            new Text("game over", 300, 300, 15, 20).draw(g);
            g.stroke();
        }
    };

    this.start = function () { 
        initLevel(0);
        tick();
    };
})();