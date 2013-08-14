var dp     = require('./lib/data-process'),
    schema = require('./lib/db-schema');

schema.init("mongodb://localhost/movies");

dp.getLocalMovies('data.json.txt', function(movies){

    console.log('Total movies', movies.length);

    var unsavedDBTrack = movies.length ,
        unsavedMovies = [];

    while (movies.length > 0) {

        var movie = movies.pop();

        schema.loadMachedMovie({ "local_path": movie.path }, function (err, model) {
        
            unsavedDBTrack--;

            if (err || !model) {
                //console.log(err, this);
                unsavedMovies.push(this);
            }

            if (unsavedDBTrack == 0) {
                console.log('Total unsaved', unsavedMovies.length);
                return dp.fetchMovieDetails(unsavedMovies, [], [], schema.processImdbData);
            }

        }.bind(movie));
    }
    return true;

});



