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

    this.mult = function (scalar) {
        this.x = this.x*scalar;
        this.y = this.y*scalar;
    };

    this.wrap = function (xmin, ymin, xmax, ymax) {     
        this.x = (this.x < xmin ? this.x + xmax : this.x) % xmax;
        this.y = (this.y < ymin ? this.y + ymax : this.y) % ymax;
    };

    this.len = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
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
        this.p = this.p.plus(this.v);
        this.p.wrap(0, 0, canvas.width, canvas.height);
    };
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
    this.points.push(this.points[0]);
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
    this.points.push(new Vec2(0, -10));
    
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
    this.v = v.plus(new Vec2(Math.sin(a)*BULLET_SPEED, -Math.cos(a)*BULLET_SPEED));
    this.dist = BULLET_DISTANCE;
    this.speed = this.v.len();
    
    this.points.push(new Vec2(BULLET_LENGTH*Math.sin(a), BULLET_LENGTH*Math.cos(a)));
    this.points.push(new Vec2(-BULLET_LENGTH*Math.sin(a),-BULLET_LENGTH*Math.cos(a)));  
    
    
    this.draw = function(g) {            
        g.strokeStyle = "rgb(255, 255, 255)";
        g.moveTo(this.points[0].x + this.p.x, this.points[0].y + this.p.y);
        g.lineTo(this.points[1].x + this.p.x, this.points[1].y + this.p.y);
    };

    this.update = function(g) {
        this.dist -= this.speed;
        this.p = this.p.plus(this.v);
        this.p.wrap(0, 0, canvas.width, canvas.height);
    };
}