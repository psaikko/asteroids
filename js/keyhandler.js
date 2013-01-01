var asteroids_game = asteroids_game || {};

asteroids_game.keyhandler = (function () {
    var codes = {
    	up: 38,
        w: 87,
    	left: 37,
        a: 65,
    	right: 39,
        d: 68,
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

    onKeyup = function (e) {
        state[e.which] = false;
        e.preventDefault();
    }

    onKeydown = function (e) {
        state[e.which] = true;
        e.preventDefault();
    }

    isKeydown = function(keyname) {
    	return state[codes[keyname]];
    }

	isKeypress = function(keyname) {
		return state[codes[keyname]] && !lastState[codes[keyname]];
	}

	tick = function() {
		lastState = state.slice();
	}

    return {
        onKeyup: onKeyup,
        onKeydown: onKeydown,
        isKeydown: isKeydown,
        isKeypress: isKeypress,
        tick: tick
    };
})();