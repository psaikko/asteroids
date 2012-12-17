"use strict";
var canvas = $("#viewport").get(0);
var g = canvas.getContext("2d");
var ASTEROID_POINTS = 12;

function vec2(x, y) {
    this.x = x;
    this.y = y;
    
    function plus(other) {
        return new vec2(this.x + other.x, this.y + other.y);
    }

    function minus(other) {
        return new vec2(this.x - other.x, this.y - other.y);
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

function asteroid(p, r, a, v) {
    this.p = p;
    this.r = r;
    this.a = a;
    this.v = v;
    var points = new Array();

    for (var i = 0; i < ASTEROID_POINTS; i++) {
        points.push(new vec2(
            r * Math.sin(i * 2 * Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3,
            r * Math.cos(i * 2 * Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3
        ));
    }

    this.draw = function(g) {
        g.save();
        g.translate(this.p.x, this.p.y);
        g.rotate(a);

        g.strokeStyle = "rgb(255, 255, 255)";
        g.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            g.lineTo(points[i].x, points[i].y);
        }
        g.lineTo(points[0].x, points[0].y);
        g.stroke();

        g.restore();
    };

    this.intersects = function(start, end) {
        var p = start;
        var r = end - start;
    };
};

var a = new asteroid(new vec2(400, 300), 50, 0, new vec2(0, 0));

g.fillStyle = "rgb(0,20,0)";
g.fillRect(0, 0, canvas.width, canvas.height);
a.draw(g);
