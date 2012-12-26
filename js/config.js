var asteroids_game = asteroids_game || {};

asteroids_game.config = {
	ASTEROID: {
		POINTS: [8,10,12],
		VELOCITY: 1,
		SIZE: {LARGE: 2, MEDIUM: 1, SMALL: 0},
		RADIUS: [10,20,50],
		FRAGMENTS: [0, 2, 2],
		SCORE: [100, 50, 20],
		MIN_COUNT: 3,
		MAX_COUNT: 12
	},

	SHIP: {
		WIDTH: 15,
		HEIGHT: 20,
		ACCELERATION: 0.15,
		TURNRATE: Math.PI*2 / 60,
		SLOWDOWN: 0.02
	},

	BULLET: {
		SPEED: 4,
		DISTANCE: 600,
		LENGTH: 4,
		COUNT: 10
	},

	EXPLOSION: {
		PARTICLES: [30, 120, 270],
		ENERGY: [1,2,3],
		DURATION: [20, 30, 40]
	},

	AUDIO: {
		BEAT_MAX: 100,
		BEAT_MIN: 5
	}
};

