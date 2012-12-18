function Vec2(x, y) {
    this.x = x;
    this.y = y;
    
    this.add = function (other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    };

    this.subtract = function (other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    };

    this.cross = function (other) {
        return this.x*other.y - this.y*other.x;
    };

    this.multiply=  function (scalar) {
        return new Vec2(this.x*scalar, this.y*scalar);
    };

    this.wrap = function (xmin, ymin, xmax, ymax) {     
        this.x = (this.x < xmin ? this.x + xmax : this.x) % xmax;
        this.y = (this.y < ymin ? this.y + ymax : this.y) % ymax;
    };

    this.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    this.rotate = function (a) {
        return new Vec2(this.x*Math.cos(a) - this.y*Math.sin(a),
                        this.x*Math.sin(a) + this.y*Math.cos(a));
    };
}

function intersects(v1,v2,v3,v4) {
    var p = v1;
    var r = v2.subtract(v1);
    var q = v3;
    var s = v4.subtract(v3);
    if (r.cross(s) === 0)
        return False;
    var t = q.subtract(p).cross(s) / r.cross(s);
    var u = q.subtract(p).cross(r) / r.cross(s);
    return (t > 0 && t < 1 && u > 0 && u < 1);
}

GameObject = {   
    draw: function(g) {    
        var projected = this.points.map(this.project, this);
        
        g.moveTo(projected[0].x, projected[0].y);
        for (var i = 1; i < projected.length; i++) {
            g.lineTo(projected[i].x, projected[i].y);
        }       
    },
    collides: function(other) {
        var points1 = this.points.map(this.project, this);
        var points2 = other.points.map(other.project, other);
        
        for (var i = 0; i < points1.length - 1; i++) {
            for (var j = 0; j < points2.length - 1; j++) {
                if (intersects(points1[i],points1[i+1],points2[j],points2[j+1]))
                    return true;
            }
        }
        return false;
    },
    update: function() {
        this.p = this.p.add(this.v);
        this.p.wrap(0, 0, canvas.width, canvas.height);
    },

    project: function(point) {
        return point.rotate(this.a).add(this.p);
    }
};

Asteroid.prototype = GameObject;
function Asteroid(p, r, a, v) {
    this.p = p;
    this.r = r;
    this.a = a;
    this.v = v;
    
    this.points = new Array();
    for (var i = 0; i < ASTEROID_POINTS; i++) {
        this.points.push(new Vec2(
            r * Math.sin(i * 2*Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3,
            r * Math.cos(i * 2*Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3
        ));
    }
    this.points.push(this.points[0]);
};

Ship.prototype = GameObject;
function Ship(p, lives) {
    this.p = p;
    this.a = 0;
    this.lives = lives;
    this.v = new Vec2(0,0);
    
    this.points = new Array();
    this.points.push(new Vec2(0, -10));
    this.points.push(new Vec2(5, 5));
    this.points.push(new Vec2(0, 0));
    this.points.push(new Vec2(-5, 5));
    this.points.push(new Vec2(0, -10));
    
    this.thrust = function (amount) {
        this.v = this.v.add(new Vec2(amount*Math.sin(this.a), -amount*Math.cos(this.a)));
    };

    this.turn = function (amount) {
        this.a = (this.a + amount) % (Math.PI * 2);
    };

    this.update = function(g) {
        GameObject.update.call(this);
        this.v = this.v.multiply(1-SHIP_SLOW);
    };
}

Bullet.prototype = GameObject;
function Bullet(p, a, v) {
    this.p = p;
    this.a = a;
    this.v = v.add(new Vec2(Math.sin(a)*BULLET_SPEED, -Math.cos(a)*BULLET_SPEED));
    this.dist = BULLET_DISTANCE;
    this.speed = this.v.magnitude();
    
    this.points = new Array();
    this.points.push(new Vec2(0, BULLET_LENGTH/2));
    this.points.push(new Vec2(0, -BULLET_LENGTH/2));  

    this.update = function(g) {
        GameObject.update.call(this);
        this.dist -= this.speed;
    };

    this.collides = function(other) {
        var tail = this.project(this.points[0]);
        var nextHead = this.project(this.points[1]).add(this.v);
        var otherPoints = other.points.map(other.project, other);
        
        for (var i = 0; i < otherPoints.length - 1; i++) {
            if (intersects(otherPoints[i],otherPoints[i+1],tail,nextHead))
                return true;
        }
        return false;
    };
}