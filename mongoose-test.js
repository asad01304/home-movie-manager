var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/movies');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('Connected with MongoDB');
});

var movieScema = mongoose.Schema({
  imdb_id   : String,
  imdb_url  : String,
  genres    : Array,
  languages : Array,
  country   : String,
  votes     : Number,
  rating    : Number,
  runtime   : String,
  title     : String,
  year      : String,
  local_path: String,
  file_name : String
})

var MovieModel = mongoose.model('Movie', movieScema);


MovieModel.findOne({ "imdb_id": "tt0162222"}, function(err, model){
	
	console.log(model);
	model.title = 'Cast Q';
	 model.save(function(){
	 	 	mongoose.disconnect();
	 })
	
	
});




//mongoose.disconnect();