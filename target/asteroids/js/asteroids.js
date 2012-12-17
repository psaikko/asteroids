"use strict";
var canvas = $("#viewport").get(0);
var g = canvas.getContext("2d");
var ASTEROID_POINTS = 12;
var BULLET_LENGTH = 4;
var SHIP_ACCEL = 0.1;
var SHIP_TURN = Math.PI*2 / 100;
var BULLET_SPEED = 2;

var keystate = new Array();
for (var i = 0; i < 255; i++) keystate[i] = false;

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

function Vec2(x, y) {
    this.x = x;
    this.y = y;
    
    this.plus = function (other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    };

    this.minus = function (other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    };

    this.cross = function (other) {
        return this.x*other.y - this.y*other.x;
    };
}

function intersects(v1,v2,v3,v4) {
    var p = v1;
    var r = v2.minus(v1);
    var q = v3;
    var s = v4.minus(v3);
    if (r.cross(s) === 0)
        return False;
    var t = q.minus(p).cross(s) / r.cross(s);
    var u = q.minus(p).cross(r) / r.cross(s);
    return (Math.abs(t) < 1 && Math.abs(u) < 1);
}

function GameObject(p, a, v) {
    this.points = new Array();
    this.p = p;
    this.a = a;
    this.v = v;
    
    this.draw = function(g) {
        g.save();
        g.translate(this.p.x, this.p.y);
        g.rotate(this.a);

        g.strokeStyle = "rgb(255, 255, 255)";
        g.moveTo(this.points[0].x, this.points[0].y);
        for (var i = 1; i < this.points.length; i++) {
            g.lineTo(this.points[i].x, this.points[i].y);
        }
        g.lineTo(this.points[0].x, this.points[0].y);
        g.stroke();

        g.translate(this.p.x, this.p.y);
        g.rotate(this.a);

        g.restore();
    };

    this.update = function(g) {
        this.p = this.p.plus(this.v);
    }
}

Asteroid.prototype = new GameObject();
Asteroid.constructor = Asteroid;
function Asteroid(p, r, a, v) {
    this.p = p;
    this.r = r;
    this.a = a;
    this.v = v;

    for (var i = 0; i < ASTEROID_POINTS; i++) {
        this.points.push(new Vec2(
            r * Math.sin(i * 2 * Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3,
            r * Math.cos(i * 2 * Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3
        ));
    }
};

Ship.prototype = new GameObject();
Ship.constructor = Ship;
function Ship(p, lives) {
    this.p = p;
    this.a = 0;
    this.lives = lives;
    this.v = new Vec2(0,0);
    
    this.points.push(new Vec2(0, -10));
    this.points.push(new Vec2(5, 5));
    this.points.push(new Vec2(0, 0));
    this.points.push(new Vec2(-5, 5));
    
    this.thrust = function (amount) {
        this.v = this.v.plus(new Vec2(amount*Math.sin(this.a), -amount*Math.cos(this.a)));
    };

    this.turn = function (amount) {
        this.a = (this.a + amount) % (Math.PI * 2);
    };
}

Bullet.prototype = new GameObject();
Bullet.constructor = Bullet;
function Bullet(p, a, v) {
    this.p = p;
    this.a = a;
    this.v = v;
    
    this.points.push(new Vec2(0,BULLET_LENGTH/2));
    this.points.push(new Vec2(0,-BULLET_LENGTH/2));  
}

var game = (function () {
    var ship = new Ship(new Vec2(200,300), 3);

    var asteroids = new Array();
    var bullets = new Array();
    asteroids.push(new Asteroid(new Vec2(400, 300), 50, 0, new Vec2(0, 0)));
 
    
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
        if (keystate[keys.space]) {
            bullets.push(new Bullet(ship.p, ship.a, BULLET_SPEED));
        }
    }
    
    function draw() {
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.fillStyle = "rgb(0,20,0)";
        g.fillRect(0, 0, canvas.width, canvas.height);
        
        ship.draw(g);
        $.each(asteroids, function(i, asteroid) {
            asteroid.draw(g);
        });
        $.each(bullets, function(i, bullet) {
            bullet.draw(g);
        });
    };
    
    function update() {
        ship.update();
        $.each(asteroids, function(i, asteroid) {
            //asteroid.update();
        });
        $.each(bullets, function(i, bullet) {
            bullet.update();
        });
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