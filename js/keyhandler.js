var asteroids_game = asteroids_game || {};

asteroids_game.keyhandler = new (function () {
    var codes = {
    	up: 38,
    	down: 40,
    	left: 37,
    	right: 39,
    	space: 32,
    	ctrl: 17,
    	esc: 27
    };

    var state = new Array();
    var lastState = new Array();

    for (var i = 0; i < 255; i++) {
        state[i] = false; 
        lastState[i] = false;
    }

    this.onKeyup = function (e) {
        state[e.which] = false;
    }

    this.onKeydown = function (e) {
    	console.log(e.which)
        state[e.which] = true;
    }

    this.isKeydown = function(keyname) {
    	return state[codes[keyname]];
    }

	this.isKeypress = function(keyname) {
		return state[codes[keyname]] && !lastState[codes[keyname]];
	}

	this.tick = function() {
		lastState = state.slice();
	}
})();