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

function GameObject(p, a, v) {
    this.points = new Array();
    this.p = p;
    this.a = a;
    this.v = v;
    
    this.draw = function(g) {
       
        g.save();
        g.translate(this.p.x, this.p.y);
        g.rotate(this.a);

        g.beginPath();
        g.strokeStyle = "rgb(255, 255, 255)";
        g.moveTo(this.points[0].x, this.points[0].y);
        for (var i = 1; i < this.points.length; i++) {
            g.lineTo(this.points[i].x, this.points[i].y);
        }
        g.stroke();
        
        g.restore();
    };

    this.update = function(g) {
        this.p = this.p.add(this.v);
        this.p.wrap(0, 0, canvas.width, canvas.height);
    };

    this.collides = function(other) {
        var points1 = this.points.map(function (point) {return point.rotate(this.a).add(this.p); }, this);
        var points2 = other.points.map(function (point) {return point.rotate(other.a).add(other.p); });
        
        for (var i = 0; i < points1.length - 1; i++) {
            for (var j = 0; j < points2.length - 1; j++) {
                if (intersects(points1[i],points1[i+1],points2[j],points2[j+1]))
                    return true;
            }
        }
        return false;
    };
}

Asteroid.prototype = new GameObject();
Asteroid.constructor = Asteroid;
function Asteroid(p, r, a, v) {
    this.p = p;
    this.r = r;
    this.a = a;
    this.v = v;
    
    this.points = new Array();
    for (var i = 0; i < ASTEROID_POINTS; i++) {
        this.points.push(new Vec2(
            r * Math.sin(i * 2 * Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3,
            r * Math.cos(i * 2 * Math.PI / ASTEROID_POINTS) + (1 - Math.random() * 2) * r / 3
        ));
    }
    this.points.push(this.points[0]);
};

Ship.prototype = new GameObject();
Ship.constructor = Ship;
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
}

Bullet.prototype = new GameObject();
Bullet.constructor = Bullet;
function Bullet(p, a, v) {
    this.p = p;
    this.a = a;
    this.v = new Vec2(Math.sin(a)*BULLET_SPEED, -Math.cos(a)*BULLET_SPEED);
    this.dist = BULLET_DISTANCE;
    this.speed = this.v.magnitude();
    
    this.points = new Array();
    this.points.push(new Vec2(0, BULLET_LENGTH/2));
    this.points.push(new Vec2(0, -BULLET_LENGTH/2));  
    
    this.draw = function(g) {            
        g.strokeStyle = "rgb(255, 255, 255)";
        var tmp = this.points[0].rotate(this.a).add(this.p);
        g.moveTo(tmp.x, tmp.y);
        tmp = this.points[1].rotate(this.a).add(this.p);
        g.lineTo(tmp.x, tmp.y);
    };

    this.update = function(g) {
        this.dist -= this.speed;
        this.p = this.p.add(this.v);
        this.p.wrap(0, 0, canvas.width, canvas.height);
    };
}