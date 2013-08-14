var fs = require('fs'),
    pmt = require('prompt'),
    imdb = require('imdb-api');

var failRecovery = true;
var instantFailRecovery = false;

function setRecoveryMode (isRecover, isInstantRecover){
	failRecovery = isRecover;
	instantFailRecovery = isInstantRecover;
}

function recoverFailCasesNow (){

	return failRecovery && instantFailRecovery;
}

function recoverFailCasesEnd(){
	return failRecovery && !instantFailRecovery;
}

function turnOnFailRecovery(){
	setRecoveryMode(true, true);
}

function turnOffFailRecovery(){
	setRecoveryMode(false, false);
}

function getLocalMovies(file, next){

	fs.readFile(file, 'utf8', function (err, data) {

	    if (err) {
	        throw err;
	    }

	    var movies = JSON.parse(data);
	    return next(movies);
	});
}

function fetchMovieDetails(movies, tmdbMovies, failCases, next) {

    if (!movies.length) {

    	if (recoverFailCasesEnd()) {

    		console.log('Success:fail=', tmdbMovies.length, failCases.length);

        	turnOnFailRecovery();
        	return fetchMovieDetails(failCases, tmdbMovies, [], next);
    	}

        return (next)(tmdbMovies, failCases);
    
    }

    var movie = movies.pop();
    var name = (movie.title) ?
        movie.title : movie.name;
    
    //var name = "Autograph";

    imdb.getReq({ name: name }, function (err, res) {
    	console.log(res);

        if (!res || (res[0] && res[0] == 'Nothing found.'  )) {

        	console.log('data not found', name);

            if (recoverFailCasesNow()){

                console.log('Attention: Could not process', name);

                pmt.start();
                pmt.get(['title'], function (err, result) {

                    if (result.title == '[break]') {

                        movies.length = 0;
                        turnOffFailRecovery();
                        failCases.push(movie);
                        return fetchMovieDetails(movies, tmdbMovies, failCases, next);

                    }

                    if (result.title == '[escape]') {

                        console.log('escaping...');

                        failCases.push(movie);
                        return fetchMovieDetails(movies, tmdbMovies, failCases, next);
                    }

                    movie.title = result.title;
                    movies.push(movie);

                    return fetchMovieDetails(movies, tmdbMovies, failCases, next);

                });

                return false;

            } else {

                failCases.push(movie);
                return fetchMovieDetails(movies, tmdbMovies, failCases, next);
            }

        } else {

        	console.log('data found', name);
            movie.tmdb = res;
            tmdbMovies.push(movie);
            return fetchMovieDetails(movies, tmdbMovies, failCases, next);
        }

    });
}

module.exports.getLocalMovies    = getLocalMovies;
module.exports.fetchMovieDetails = fetchMovieDetails;
module.exports.setRecoveryMode   = setRecoveryMode ;

