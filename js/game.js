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
    $(document).keyup(asteroids_game.keyhandler.onKeyup);
    $(document).keydown(asteroids_game.keyhandler.onKeydown);
    asteroids_game.engine.start();
});

var asteroids_game = asteroids_game || {};

asteroids_game.engine = (function () {
    var g = $("#viewport").get(0).getContext("2d");
    // 'imports'
    var keys = asteroids_game.keyhandler;
    var Ship = asteroids_game.objects.Ship;
    var Asteroid = asteroids_game.objects.Asteroid;
    var Vec2 = asteroids_game.objects.Vec2;
    var Text = asteroids_game.text.Text;
    var textLength = asteroids_game.text.textLength;
    var CFG = asteroids_game.config;

    var game_over = false;
    var highscore_entry = null;
    var highscore_list  = 0;
    var title_screen = 0;

    var score = 0;
    var lastScore = 0;
    var life_counter = 0;
    var ship;
    var level;

    var asteroids; var explosions;
    var beatFrequency; var beatCooldown; var beatNum; var beat_delta;

    var obj_update = function(obj) { obj.update(); };
    var obj_alive = function(obj) { return obj.isAlive(); };
    var obj_draw = function(obj) { return obj.draw(g); };

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
            var x = 0; 
            var y = 0;
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
    
    function startGame() {
        game_over = false;
        highscore_entry = null;
        highscore_list  = 0;
        title_screen = 0;

        score = 0;
        life_counter = 0;
        ship = new Ship(new Vec2(g.canvas.width / 2, g.canvas.height / 2), CFG.SHIP.WIDTH, CFG.SHIP.HEIGHT, 3);

        initLevel(0);
    }

    function handleInput() {
        if(ship && ship.isAlive()) {
            if (keys.isKeydown('up'))       ship.thrust();
            if (keys.isKeydown('left'))     ship.turnLeft();
            if (keys.isKeydown('right'))    ship.turnRight();          
            if (keys.isKeypress('space'))   ship.fire();
            if (keys.isKeypress('ctrl')) {
                ship.p = new Vec2(Math.random()*g.canvas.width, Math.random()*g.canvas.height);
            }
        }

        if (highscore_entry) {            
            if (keys.isKeypress('right')) {         
                highscore_entry.name[highscore_entry.i] += 1;
                highscore_entry.name[highscore_entry.i] %= asteroids_game.text.characters.length;
            }
            if (keys.isKeypress('left')) {
                highscore_entry.name[highscore_entry.i] -= 1;
                if (highscore_entry.name[highscore_entry.i] < 0)
                    highscore_entry.name[highscore_entry.i] += asteroids_game.text.characters.length
            }
            if (keys.isKeypress('ctrl')) {
                highscore_entry.i += 1;
                if (highscore_entry.i == 3) {
                    var name = highscore_entry.name.map(function (c) { 
                        return asteroids_game.text.characters[c]; 
                    }).join('');
                    asteroids_game.scores.postHighscore(name ,score)
                    highscore_entry = null;
                    highscore_list = 600;
                }
            }         
        }

        if (highscore_list || title_screen) {
            if (keys.isKeypress('space')) {
                startGame();
            }
        }
              
        keys.tick();
    }
    
    function draw() {
        g.fillStyle = "rgb(0,15,0)";
        g.fillRect(0, 0, g.canvas.width, g.canvas.height);
        
        g.strokeStyle = "rgb(255, 255, 255)";
        g.beginPath();

        if (!game_over) {
            ship.draw(g);      
            asteroids.forEach(obj_draw);
            explosions.forEach(obj_draw);
        }
        drawUI();
    
        g.stroke();
        /* 
        var image = g.getImageData(0, 0, g.canvas.width, g.canvas.height);
        var imageData = image.data;
        var h = g.canvas.height;
        var w = g.canvas.width;
        var tmp = new Array(w*h*4);
        var i = w * h; 
    
        while(--i) {
            if (4*i % (8*w) > 4*w) {
                imageData[4*i+0] *= 0.4;
                imageData[4*i+1] *= 0.4;
                imageData[4*i+2] *= 0.4;
            }
        }
        g.putImageData(image, 0, 0);
        */
    };
    
    function drawUI() {
        
        var char_w = CFG.SHIP.WIDTH; 
        var char_h = CFG.SHIP.HEIGHT;


        if (ship) {
            var scoreString = score > 0 ? ""+score : "00";
            var scoreText = new Text(scoreString, char_w, char_h);
            scoreText.x = (new Text("999999999", char_w, char_h)).measure().w - scoreText.measure().w;
            scoreText.y = 10;
            scoreText.draw(g);

            for (var i = 0; i < ship.lives; i++) {
                new Ship(new Vec2(125 + CFG.SHIP.WIDTH*i, 2*10+char_h+15), CFG.SHIP.WIDTH, CFG.SHIP.HEIGHT, 0).draw(g);
            }

            if (ship.lives === 0) {
                new Text("game over", char_w, char_h, 300, 300).draw(g);
            }
        }

        if (highscore_entry) {
            var i = 0;

            new Text("your score is one of the ten best", char_w, char_h, 30, 110+(30*i++)).draw(g);
            new Text("please enter your initials", char_w, char_h, 30, 110+(30*i++)).draw(g);
            new Text("push rotate to select letter", char_w, char_h, 30, 110+(30*i++)).draw(g);
            new Text("push hyperspace when letter is correct", char_w, char_h, 30, 110+(30*i++)).draw(g);

            var name = highscore_entry.name.map(function (c) { 
                return c > 0 ? asteroids_game.text.characters[c] : '_';
            }).join('');

            new Text(name, 60, 80, 300, 300).draw(g);
        }

        if (highscore_list) {
            var titleText = new Text("highscores", char_w, char_h);
            titleText.y = 70;
            titleText.x = 400 - titleText.measure().w / 2;
            titleText.draw(g);

            var top = asteroids_game.scores.getTopScores();
            var highscoreLen = top[0].score.toString().length;
            var highscoreText = new Text(" 1  "+top[0].score.toString()+"  AAA", char_w, char_h);;
            for (var i = 0; i < top.length; i++) {
                var num = (i < 9 ? ' ' : '') + (i+1);
                var scorePadding = (new Array(highscoreLen + 3 - top[i].score.toString().length)).join(' ');
                var scoreText = new Text(num+scorePadding+top[i].score+'  '+top[i].name, char_w, char_h);
                scoreText.y = 100+30*(i+1);
                scoreText.x = 400 - highscoreText.measure().w / 2;
                scoreText.draw(g);
            }
            if (highscore_list % 120 > 60) {
                var blinkText = new Text("push fire to play", char_w, char_h);
                blinkText.x = 400 - blinkText.measure().w / 2;
                blinkText.y = 460;
                blinkText.draw(g);
            }
            if (!--highscore_list)
                title_screen = 600;
        }

        if (title_screen) {
            var titleText = new Text("ASTEROIDS", 3*char_w, 3*char_h);
            titleText.y = 200;
            titleText.x = 400 - titleText.measure().w / 2;
            titleText.draw(g);
            if (title_screen % 120 > 60) {
                var blinkText = new Text("push fire to play", char_w, char_h);
                blinkText.x = 400 - blinkText.measure().w / 2;
                blinkText.y = 460;
                blinkText.draw(g);
            }
            if (!--title_screen)
                highscore_list = 600;
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
            if (ship.isAlive() && !ship.isInvincible() && ship.collides(asteroid)) {
                asteroid.kill(); 
                explosions.push(ship.createExplosion());   
                ship.kill();
                ship.lives--;
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
 
        if (asteroids.length == 0 && explosions.length == 0) {
            initLevel(level + 1);
        }

        if (!ship.isAlive() && explosions.length == 0) {
            if (ship.lives < 1) {
                game_over = true;
                ship = null;
                if (asteroids_game.scores.isHighscore(score)) {
                    highscore_entry = {i: 0, name: [0, 0, 0]};
                } else {
                    highscore_list = 600;
                }
            } else {
                ship = new Ship(new Vec2(g.canvas.width / 2, g.canvas.height / 2), CFG.SHIP.WIDTH, CFG.SHIP.HEIGHT, ship.lives);
            }
        }   
    };
    
    function tick () {
        handleInput();
        draw();
        if (!game_over) update();
              
        requestAnimFrame(tick);
    };

    return {
        start:  
            function () { 
                game_over = true;
                title_screen = 600;
                tick(); 
            }
    };
})();