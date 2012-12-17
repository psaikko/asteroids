"use strict";
var canvas = $("#viewport").get(0);
var g = canvas.getContext("2d");
var ASTEROID_POINTS = 12;

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
    
    function plus(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    function minus(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    function cross(other) {
        return this.x*other.y - this.y*other.x;
    }
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

function Drawable(p, a) {
    this.points = new Array();
    this.p = p;
    this.a = a;
    
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

        g.restore();
    };
}

Asteroid.prototype = new Drawable();
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

Ship.prototype = new Drawable();
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
}

Bullet.prototype = new Drawable();
Bullet.constructor = Bullet;
function Bullet(p, a, v) {
    this.p = p;
    this.a = a;
    this.v = v;
    
    this.points.push
}

var a = new Asteroid(new Vec2(400, 300), 50, 0, new Vec2(0, 0));
var s = new Ship(new Vec2(200,300), 3);

g.fillStyle = "rgb(0,20,0)";
g.fillRect(0, 0, canvas.width, canvas.height);
a.draw(g);
s.draw(g);

$(document).ready(function () {
    $(document).keyup(function () {
        
    });
    $(document).keydown(function () {
        
    });
});