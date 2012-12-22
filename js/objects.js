function Vec2(x, y) {
    this.x = x;
    this.y = y;
    this.add = function(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    };
    this.subtract = function(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    };
    this.cross = function(other) {
        return this.x * other.y - this.y * other.x;
    };
    this.multiply = function(scalar) {
        return new Vec2(this.x * scalar, this.y * scalar);
    };
    this.wrap = function(xmin, ymin, xmax, ymax) {
        this.x = (this.x < xmin ? this.x + xmax : this.x) % xmax;
        this.y = (this.y < ymin ? this.y + ymax : this.y) % ymax;
    };
    this.magnitude = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    this.rotate = function(a) {
        return new Vec2(this.x * Math.cos(a) - this.y * Math.sin(a),
                this.x * Math.sin(a) + this.y * Math.cos(a));
    };
    this.normalize = function() {
        return this.multiply(1 / this.magnitude());
    };
}

function intersects(p, p2, q, q2) {
    var r = p2.subtract(p);
    var s = q2.subtract(q);
    var rxs = r.cross(s);
    if (rxs === 0)
        return False;
    var qsp = q.subtract(p);
    var t = qsp.cross(s) / rxs;
    var u = qsp.cross(r) / rxs;
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
                if (intersects(points1[i], points1[i + 1], points2[j], points2[j + 1]))
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
function Asteroid(p, size, a, v) {
    this.p = p;
    this.r = ASTEROID_RADIUS[size];
    this.a = a;
    this.v = v;
    this.size = size;
    this.hp = ASTEROID_HP[size];
    this.points = new Array();
    for (var i = 0; i < ASTEROID_POINTS[size]; i++) {
        this.points.push(new Vec2(
                this.r * Math.sin(i * 2 * Math.PI / ASTEROID_POINTS[size]) + (1 - Math.random() * 2) * this.r / 4,
                this.r * Math.cos(i * 2 * Math.PI / ASTEROID_POINTS[size]) + (1 - Math.random() * 2) * this.r / 4
                ));
    }
    this.points.push(this.points[0]);
    this.createFragments = function() {
        var fragments = new Array();
        for (var i = 0; i < ASTEROID_FRAGMENTS[this.size]; i++)
            fragments.push(new Asteroid(this.p, this.size - 1, 0, this.v.rotate((Math.random() * 2 - 1) * 2 * Math.PI / 4).multiply(Math.random() + 1)));
        return fragments;
    };
}

function Explosion(obj) {
    this.time = EXPLOSION_DURATION[obj.size];
    var debris = new Array();
    /*
    var pts = obj.points;
    for (var i = 0; i < pts.length - 1; i++) {
        var ppts = pts.slice(i, i + 2);
        ppts.push(ppts[0].add(ppts[1]).multiply(1 / 3));
        ppts.push(ppts[0]);
        debris.push(new Particle(obj.p,
                ppts[0].add(ppts[1]).normalize().add(obj.v),
                ppts,
                Math.random() * EXPLOSION_DURATION));
    }
*/
    for (var i = 0; i < EXPLOSION_PARTICLES[obj.size]; i++) {
        var a = 2 * Math.PI * Math.random();
        var dir = new Vec2(Math.sin(a), Math.cos(a));
        debris.push(new Particle(obj.p.add(dir.multiply(obj.r*Math.random())),
                dir.multiply(Math.random() * EXPLOSION_ENERGY[obj.size]).add(obj.v),
                [new Vec2(0, 0), dir.multiply(2)],
                Math.random() * EXPLOSION_DURATION[obj.size]));
    }

    this.getDebris = function() {
        return debris;
    };
    this.draw = function(g) {
        debris.forEach(function(particle) {
            particle.draw(g);
        });
    };
    this.update = function() {
        this.time--;
        debris.forEach(function(particle) {
            particle.update();
        });
        debris = debris.filter(function(d) {
            return d.time > 0;
        });
    };
}

Particle.prototype = GameObject;
function Particle(p, v, points, time) {
    this.p = p;
    this.v = v;
    this.a = 0;
    this.points = points;
    this.time = time;
    this.update = function() {
        this.time--;
        GameObject.update.call(this);
    };
}

Ship.prototype = GameObject;
function Ship(p, w, h, lives) {
    this.p = p;
    this.a = 0;
    this.lives = lives;
    this.v = new Vec2(0, 0);
    this.points = [new Vec2(0, -1), new Vec2(1, 1), new Vec2(-1, 1), new Vec2(0, -1)];

    var model = [new Vec2(0, -1), new Vec2(1, 1),
                 new Vec2(-1, 1), new Vec2(0, -1),
                 new Vec2(-0.75, 0.5), new Vec2(0.75, 0.5)];
    var firePoints = [new Vec2(-0.5, 0.5), new Vec2(0,1),
                      new Vec2(0.5, 0.5), new Vec2(0,1)];
    var showFire = false;

    var scale = function(point) {
        point.x = point.x * w/2; 
        point.y = point.y * h/2;
    };

    this.points.forEach(scale);
    model.forEach(scale);
    firePoints.forEach(scale);

    this.thrust = function(amount) {
        if (Math.random() < SHIP_ENGINE_FLICKER)
            showFire = true;
        this.v = this.v.add(new Vec2(amount * Math.sin(this.a), -amount * Math.cos(this.a)));
    };
    this.turn = function(amount) {
        this.a = (this.a + amount) % (Math.PI * 2);
    };
    this.update = function() {
        showFire = false;
        GameObject.update.call(this);
        this.v = this.v.multiply(1 - SHIP_SLOW);
    };

    this.draw = function(g) {
        var projected = model.map(this.project, this);
        for (var i = 0; i < projected.length; i += 2) {
            g.moveTo(projected[i].x, projected[i].y);
            g.lineTo(projected[i + 1].x, projected[i + 1].y);
        }
        if (showFire) {
            var fire = new Particle(this.p, null, firePoints, 0);
            fire.a = this.a;
            fire.draw(g);
        }
    };
}

Bullet.prototype = GameObject;
function Bullet(p, a, v) {
    this.p = p;
    this.a = a;
    this.v = v.add(new Vec2(Math.sin(a) * BULLET_SPEED, -Math.cos(a) * BULLET_SPEED));
    this.dist = BULLET_DISTANCE;
    this.speed = this.v.magnitude();
    this.points = new Array();
    this.points.push(new Vec2(0, BULLET_LENGTH / 2));
    this.points.push(new Vec2(0, -BULLET_LENGTH / 2));
    this.update = function() {
        GameObject.update.call(this);
        this.dist -= this.speed;
    };
    this.collides = function(other) {
        var tail = this.project(this.points[0]);
        var nextHead = this.project(this.points[1]).add(this.v);
        var otherPoints = other.points.map(other.project, other);
        for (var i = 0; i < otherPoints.length - 1; i++) {
            if (intersects(otherPoints[i], otherPoints[i + 1], tail, nextHead))
                return true;
        }
        return false;
    };
}