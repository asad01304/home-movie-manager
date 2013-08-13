var fs = require('fs'),
    pmt = require('prompt'),
    imdb = require('imdb-api');

var tmdb = require('tmdb')
    .init({apikey: '8c98ce13209445180a4b4a9ae4cc0d19'});
;


//Define DB Schema & Models
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/movies');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('Connected with MongoDB');
});


var movieScema = mongoose.Schema({
    imdb_id: String,
    imdb_url: String,
    genres: Array,
    languages: Array,
    country: String,
    votes: Number,
    rating: Number,
    runtime: String,
    title: String,
    year: String,
    local_path: String,
    file_name: String
})

var MovieModel = mongoose.model('Movie', movieScema);

//Settings for fail recovery
var failRecovery = true;
var instantFailRecovery = true;

//read local movie locations
fs.readFile('data.json.txt', 'utf8', function (err, data) {

    if (err) {
        throw err;
    }

//Filter out already saved locations
    var movies = JSON.parse(data);
    return filterUnSavedMovies(movies);
});


function filterUnSavedMovies(movies, next) {

    var unsavedDBTrack = movies.length ,
        unsavedMovies = [];

    while (movies.length > 0) {

        var movie = movies.pop();

        mongoose.model('Movie', movieScema)
            .findOne({ "local_path": movie.path }, function (err, model) {

            unsavedDBTrack--;

            if (err || !model) {
                unsavedMovies.push(this);
            }

            if (unsavedDBTrack == 0) {
                return fetchMovieDetails(unsavedMovies, [], [], processImdbData);
            }

        }.bind(movie));
    }
    return true;
}


function fetchMovieDetails(movies, tmdbMovies, failCases, next) {

    if (!movies.length) {
        return (next)(tmdbMovies, failCases);
    }

    var movie = movies.pop();
    var name = (movie.title) ?
        movie.title : movie.name;

    //tmdb.Movie.search({query: name}, function(err,res) {
    imdb.getReq({ name: name }, function (err, res) {

        if (!res || (res[0] && res[0] == 'Nothing found.'  )) {

            if (failRecovery && instantFailRecovery) {

                console.log('Attention: Could not process', name);

                pmt.start();
                pmt.get(['title'], function (err, result) {

                    if (result.title == '[break]') {

                        movies.length       = 0;
                        failRecovery        = false;
                        instantFailRecovery = false;


                        return fetchMovieDetails(movies, tmdbMovies, failCases, next);

                    }

                    if (err) console.log(err);

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

            //console.log('Success:', name);

            movie.tmdb = res;
            tmdbMovies.push(movie);

            return fetchMovieDetails(movies, tmdbMovies, failCases, next);
        }

    });


}

function processImdbData(tmdbMovies, failCases) {

    if (failRecovery && !instantFailRecovery) {

        instantFailRecovery = true;
        console.log('processing fails..');

        return fetchMovieDetails(failCases, tmdbMovies, [], processImdbData);
    }

    var dbTracking = 0;
    for (var i in tmdbMovies) {

        dbTracking += 2;

        var data = tmdbMovies[i].tmdb;
        data.localpath = tmdbMovies[i].path;
        data.fileName = tmdbMovies[i].name;

        console.log(data.imdbid);

        var MovieModel = mongoose.model('Movie', movieScema);

        MovieModel.findOne({

            "imdb_id"    : data.imdbid,
            "local_path" : data.localpath

        }, function (err, model) {

            dbTracking--;

            if (!model) {
                var model = new MovieModel({})
                console.log('Saving.. ', this.imdbid);
            } else {
                console.log('Updating.. ', this.imdbid);
            }

            model = setModelData(model, this);
            model.save(function (err) {

                dbTracking--;

                if (err) {
                    throw err;
                }

                if (dbTracking == 0) {
                    mongoose.disconnect();
                }

            });

        }.bind(data));
    }
}

function setModelData(model, data) {

    model.imdb_id    = data.imdbid;
    model.imdb_url   = data.imdburl;
    model.genres     = data.genres.split(",");
    model.languages  = data.languages.split(",");
    model.country    = data.country;
    model.votes      = parseInt(data.votes);
    model.rating     = parseFloat(data.rating);
    model.runtime    = data.runtime;
    model.title      = data.title;
    model.year       = data.year;
    model.local_path = data.localpath;
    model.file_name  = data.fileName;

    return model;
}

