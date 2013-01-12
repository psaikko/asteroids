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
		INVINCIBILITY: 90,
		WIDTH: 15,
		HEIGHT: 20,
		ACCELERATION: 0.15,
		TURNRATE: Math.PI*2 / 75,
		SLOWDOWN: 0.0175
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

	TITLE: {
		SWITCH_TIME: 600
	},

	UFO: {
		SIZE: {LARGE: 1, SMALL: 0},
		SPEED: [2, 1.5],
		WIDTH: [24, 40],
		HEIGHT: [18, 30],
		SHOT_COOLDOWN: 75,
		MOVEMENT: [0.005, 0.003],
		SCORE: [1000, 200],
		SPAWNRATE: 0.001
	},

	AUDIO: {
		MUTE: false,
		BEAT_MAX: 100,
		BEAT_MIN: 5,
		PLAY: function (sound, vol) {
			if (!asteroids_game.config.AUDIO.MUTE) {
				var audio = new Audio();
	            audio.src = "audio/"+sound+".wav";
	            audio.volume = vol || 1;
	            audio.play();
	        }
		}
	}
};

