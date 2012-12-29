var asteroids_game = asteroids_game || {};

asteroids_game.scores = (function () {
	Parse.initialize("MDD8uIh4RlDshLecwPWJktMH5B3FxsR0qOhxBaNg", "RD3c9PjSD3dAqPwJ0BxBsdR9tqojc2ebrjNLG5HI");
	var Highscore = Parse.Object.extend("Highscore");
	var HighscoreCollection = Parse.Collection.extend({
		model: Highscore
	});
	var scores = new HighscoreCollection();
	scores.fetch({
		success: function(collection) {
			
		},
		error: function(collection, error) {
			console.log(JSON.stringify(error));
		}
	});
	scores.comparator = function(object) {
		return -object.get("score");
	};
	scores.sort();

	getTopScores = function() {
		var top = [];
		for (var i = 0; i < 10 && i < scores.toArray().length; i++) {
			top.push({
				name: scores.at(i).get("name"),
				score: scores.at(i).get("score")
			});
		}
		return top;
	}

	isHighscore = function(score) {
		return scores.toArray().length < 10 || 
			   score > scores.at(9).get("score");
	}

	update = function() {
		scores.fetch();
	}

	postHighscore = function(name, score) {
		if (isHighscore(score)) {
			scores.create({name: name, score: score});
		}
	}

	return {
		getTopScores: getTopScores,
		isHighscore: isHighscore,
		update: update,
		postHighscore: postHighscore
	};
})();