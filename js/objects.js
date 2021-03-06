var asteroids_game = asteroids_game || {};

asteroids_game.objects = (function () {
    var canvas = $("#viewport").get(0);
    var CFG = asteroids_game.config;

    var obj_update = function(obj) { obj.update(); };
    var obj_alive = function(obj) { return obj.isAlive(); };

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
            return false;
        var qsp = q.subtract(p);
        var t = qsp.cross(s) / rxs;
        var u = qsp.cross(r) / rxs;
        return (t > 0 && t < 1 && u > 0 && u < 1);
    }

    var GameObject = {
        killed: false,
        kill: function() {
            this.killed = true;
        },
        isAlive: function() {
            return !this.killed;
        },
        draw: function(g) {
            var projected = this.points.map(this.project, this);
            g.moveTo(projected[0].x, projected[0].y);
            for (var i = 1; i < projected.length; i++) {
                g.lineTo(projected[i].x, projected[i].y);
            }
        },
        collides: function(other) {
            var poly1 = this.points.map(this.project, this);
            var poly2 = other.points.map(other.project, other);
            for (var i = 0; i < poly1.length - 1; i++) {
                for (var j = 0; j < poly2.length - 1; j++) {
                    if (intersects(poly1[i], poly1[i + 1], poly2[j], poly2[j + 1]))
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
        },
        createExplosion: function() {
            return new Explosion(this);
        },
        closeTo: function(other) {
            return this.p.subtract(other.p).magnitude() < 2*other.r;
        }
    };

    Asteroid.prototype = GameObject;
    function Asteroid(p, size, a, v) {
        this.p = p;
        this.r = CFG.ASTEROID.RADIUS[size];
        this.a = a;
        this.v = v;
        this.size = size;
        this.points = new Array();

        for (var i = 0; i < CFG.ASTEROID.POINTS[size]; i++) {
            this.points.push(new Vec2(
                this.r * Math.sin(i * 2 * Math.PI / CFG.ASTEROID.POINTS[size]) + (1 - Math.random() * 2) * this.r / 4,
                this.r * Math.cos(i * 2 * Math.PI / CFG.ASTEROID.POINTS[size]) + (1 - Math.random() * 2) * this.r / 4
            ));
        }
        this.points.push(this.points[0]);

        this.createFragments = function() {
            var fragments = new Array();
            for (var i = 0; i < CFG.ASTEROID.FRAGMENTS[this.size]; i++)
                fragments.push(new Asteroid(this.p, this.size - 1, 0, this.v.rotate((Math.random() * 2 - 1) * 2 * Math.PI / 4).multiply(Math.random() + 1)));
            return fragments;
        };
    }

    function Explosion(obj) {
        var time = CFG.EXPLOSION.DURATION[obj.size] || 100;
        var energy = CFG.EXPLOSION.ENERGY[obj.size] || 3;
        var particles = CFG.EXPLOSION.PARTICLES[obj.size] || 120;
        var debris = new Array();

        for (var i = 0; i < particles; i++) {
            var a = 2 * Math.PI * Math.random();
            var dir = new Vec2(Math.sin(a), Math.cos(a));
            debris.push(new Particle(obj.p.add(dir.multiply(obj.r*Math.random())),
                    dir.multiply(Math.random() * energy).add(obj.v),
                    [new Vec2(0, 0), dir.multiply(2)],
                    Math.random() * time));
        }

        if (obj.model) {
            var pts = obj.model;
            for (var i = 0; i < pts.length; i += 2) {  
                var particlePoints = pts.slice(i, i + 2);   
                debris.push(new Particle(obj.p, 
                    pts[i].add(pts[i + 1]).rotate(obj.a).normalize().add(obj.v),  
                    particlePoints, 
                    time, 
                    obj.a,
                    0.99));   
            }
        }

        time++;

        this.draw = function(g) {
            debris.forEach(function(particle) { particle.draw(g); });
        };
        this.update = function() {
            time--;
            debris.forEach(function(particle) { particle.update(); });
            debris = debris.filter(function(particle) { return particle.isAlive(); });
        };

        this.isAlive = function() {
            return GameObject.isAlive.call(this) && time > 0;
        };
    }

    Particle.prototype = GameObject;
    function Particle(p, v, points, time, a, dv) {
        this.p = p;
        this.v = v;
        this.points = points;       
        this.a = a || 0;
        this.dv = dv || 1;

        this.update = function() {
            this.v = this.v.multiply(this.dv);
            time--;
            GameObject.update.call(this);
        };

        this.isAlive = function() {
            return GameObject.isAlive.call(this) && time > 0;
        };
    }

    Ship.prototype = GameObject;
    function Ship(p, w, h, lives) {
        this.p = p;
        this.a = 0;
        this.r = Math.max(w, h);
        this.lives = lives;
        this.v = new Vec2(0, 0);
        this.points = [new Vec2(0, -1), new Vec2(1, 1), new Vec2(-1, 1), new Vec2(0, -1)];
        this.bullets = new Array();

        this.model = [new Vec2(0, -1), new Vec2(1, 1),
                     new Vec2(-1, 1), new Vec2(0, -1),
                     new Vec2(-0.75, 0.5), new Vec2(0.75, 0.5)];
        var firePoints = [new Vec2(-0.5, 0.5), new Vec2(0,1),
                          new Vec2(0.5, 0.5), new Vec2(0,1)];
        var showFire = false;
        var inv = CFG.SHIP.INVINCIBILITY;

        var scale = function(point) {
            point.x = point.x * w/2; 
            point.y = point.y * h/2;
        };

        this.points.forEach(scale);
        this.model.forEach(scale);
        firePoints.forEach(scale);
        
        var engineCooldown = 0;

        this.isInvincible = function() {
            return inv > 0;
        };

        this.thrust = function() {
            if (engineCooldown++ > 10) {
                engineCooldown = 0;           
                CFG.AUDIO.PLAY('engine', 0.5);
                showFire = true;
            }  
                
            this.v = this.v.add(new Vec2(CFG.SHIP.ACCELERATION * Math.sin(this.a), -CFG.SHIP.ACCELERATION * Math.cos(this.a)));
        };

        this.turnLeft = function() {
            this.a = (this.a - CFG.SHIP.TURNRATE) % (Math.PI * 2);
        };

        this.turnRight = function() {
            this.a = (this.a + CFG.SHIP.TURNRATE) % (Math.PI * 2);
        };

        this.fire = function() {
            if (this.bullets.length < CFG.BULLET.COUNT) {
                CFG.AUDIO.PLAY('fire');
                this.bullets.push(new Bullet(this.p, this.a, this.v));
            }
        };

        this.update = function() {
            if (inv > 0)
                inv--;
            showFire = false;
            GameObject.update.call(this);
            this.v = this.v.multiply(1 - CFG.SHIP.SLOWDOWN);

            this.bullets.forEach(obj_update);
            this.bullets = this.bullets.filter(obj_alive);
        };

        this.draw = function(g) {
            this.bullets.forEach(function (bullet) { bullet.draw(g); });
            if (!this.isAlive())  
                return;
            if (inv > 0 && inv % 30 > 15)
                return;
            var projected = this.model.map(this.project, this);
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
    function Bullet(p, a, v, l) {
        var length = l || CFG.BULLET.LENGTH;
        this.p = p;
        this.a = a;
        this.v = v.add(new Vec2(Math.sin(a) * CFG.BULLET.SPEED, -Math.cos(a) * CFG.BULLET.SPEED));
        this.speed = this.v.magnitude();
        this.points = [new Vec2(0, length / 2), new Vec2(0, -length / 2)];
        var dist = 0;

        this.update = function() {
            GameObject.update.call(this);
            dist += this.speed;
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

        this.isAlive = function() {
            return GameObject.isAlive.call(this) && dist < CFG.BULLET.DISTANCE;
        };
    }

    Ufo.prototype = GameObject;
    function Ufo(p, v, size) {
        this.p = p;
        this.v = v;
        this.a = 0;
        this.d = v.x;
        this.size = size;
        var w = CFG.UFO.WIDTH[size];
        var h = CFG.UFO.HEIGHT[size];
        this.r = Math.max(w, h);
        
        var audio = new Audio();
        audio.src = "audio/ufo"+size+".wav";
        var vol = 0.25;
        audio.volume = CFG.AUDIO.MUTE ? 0 : vol;

        var audioLooper = function () {
            this.currentTime = 0;
            this.volume = CFG.AUDIO.MUTE ? 0 : vol;
            this.play();
        }

        audio.addEventListener('ended', audioLooper);
        audio.play();

        this.points = [
            new Vec2(-1*w/2  ,0),
            new Vec2(-0.5*w/2,-0.5*h/2),
            new Vec2(-0.4*w/2,-1*h/2),
            new Vec2(0.4*w/2 ,-1*h/2),
            new Vec2(0.5*w/2 ,-0.5*h/2),
            new Vec2(1*w/2   ,0),
            new Vec2(0.5*w/2 ,0.5*h/2),
            new Vec2(-0.5*w/2,0.5*h/2),
            new Vec2(-1*w/2  ,0)
        ];

        this.bullets = new Array();

        var cooldown = 0;

        this.update = function(ship) {
            this.p = this.p.add(this.v);
            this.p.y = (this.p.y < 0 ? this.p.y + canvas.height : this.p.y) % canvas.height;
            if (this.d < 0) {
                if (this.p.x < 0)
                    this.kill();
            } else {
                if (this.p.x > canvas.width)
                    this.kill();
            }
            if (Math.random() < CFG.UFO.MOVEMENT[size]) {
                var newAngle = Math.PI / 3 - Math.random() * Math.PI / 1.5 +
                               ((this.d < 0) ? Math.PI : 2 * Math.PI);
                this.v = (new Vec2(Math.cos(newAngle), Math.sin(newAngle))).multiply(CFG.UFO.SPEED[size]);
            }
            if (--cooldown < 0) {
                CFG.AUDIO.PLAY('ufo_shot', 0.3);
                cooldown = CFG.UFO.SHOT_COOLDOWN;
                var bulletAngle;
                if (size == 0 && ship.isAlive()) {
                    bulletAngle = Math.atan2(ship.p.y - this.p.y, ship.p.x - this.p.x) + Math.PI / 2;
                } else {
                    bulletAngle = Math.random() * 2 * Math.PI;
                }

                this.bullets.push(new Bullet(this.p, bulletAngle, new Vec2(0, 0)));
            }
            this.bullets.forEach(obj_update);
            this.bullets = this.bullets.filter(obj_alive);
        }

        this.draw = function(g) {
            GameObject.draw.call(this, g);
            this.bullets.forEach(function (bullet) { bullet.draw(g); });
            var pts = this.points.map(this.project, this);
            g.moveTo(pts[5].x, pts[5].y);
            g.lineTo(pts[8].x, pts[8].y);
            g.moveTo(pts[1].x, pts[1].y);
            g.lineTo(pts[4].x, pts[4].y);
        }

        this.kill = function() {
            GameObject.kill.call(this);
            audio.removeEventListener('ended', audioLooper);
        }
    }

    return {
        Asteroid: Asteroid,
        Ship: Ship,
        Vec2: Vec2,
        Ufo: Ufo
    };
})();