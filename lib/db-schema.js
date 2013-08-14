//Define DB Schema & Models
var mongoose = require('mongoose');
var db = null;

function init(conf){

	mongoose.connect(conf);

	db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback() { console.log('Connected with MongoDB'); });
}

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
});

var MovieModel = mongoose.model('Movie', movieScema);

function setModelData(model, data) {

	if(!parseFloat(data.rating)){
		data.rating = 0;
	}

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

function loadMachedMovie(rule, callback){
	mongoose.model('Movie', movieScema).findOne(rule, callback);
}

function processImdbData(tmdbMovies, failCases) {

    var dbTracking = 0;
    for (var i in tmdbMovies) {

        dbTracking += 2;

        var data = tmdbMovies[i].tmdb;
        data.localpath = tmdbMovies[i].path;
        data.fileName = tmdbMovies[i].name;

        var MovieModel = mongoose.model('Movie', movieScema);

        MovieModel.findOne({

            "imdb_id"    : data.imdbid,
            "local_path" : data.localpath

        }, function (err, model) {

            dbTracking--;

            if (!model) {
                var model = new MovieModel({})
                console.log('Saving.. ', this.imdbid, this.title);
            } else {
                console.log('Updating.. ', this.imdbid, this.title);
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


module.exports.movieScema = movieScema;
module.exports.MovieModel = MovieModel;


module.exports.init = init;
module.exports.loadMachedMovie = loadMachedMovie;
module.exports.processImdbData = processImdbData;


