var fs = require('fs'), path = require('path');
var movieList  = []; 

var srcDirs = [
	//"/Users/asad-rahman/Movies"
	"/Volumes/EmranWD/Movies",
	"/Volumes/EmranWD/New Movies",
	"/Volumes/EmranWD/Newer Movies"
];

var stackCount = 0;
for(var i in srcDirs){
	scanMovieDir(srcDirs[i]);	
}

function scanMovieDir(srcDir, next) {

	fs.readdir(srcDir, function(err, files){

		if(err) return false;	
		
		for(var i in files){

			var flName = files[i],
			    flPath = srcDir  + '/' +flName ;

			stackCount++;

			fs.lstat(flPath, function(err, stat){
				
				stackCount--;

				if(!stat.isSymbolicLink()){

					var data = { 
						name   : this.flName, 
						path   : this.flPath,
						isDir  : stat.isDirectory(),
						isFile : stat.isFile()
					};

					if(stat.isFile()){
						data.extension = path.extname(data.name);
						data.basename  = data.name.replace(data.extension,'')							
					}
						
					data.title = getMovieNameFromFileName(
						data.basename || data.name
					);

					movieList.push(data);
				}

				processNext();

			}.bind({flName : flName , flPath : flPath}));
		}

	});
}

function processNext(){

	if(stackCount != 0) 
		return false;

	// for(var i in movieList){
	// 	console.log("processing... ", movieList[i].title);
	// }

	fs.writeFile('data.json.txt', JSON.stringify(movieList), function (err) {
  		if (err) throw err;
  		console.log('It\'s saved!');
	});

}

function getMovieNameFromFileName(name){

	var urlReg = /www\..*\.com/ig
	name = name.replace(urlReg,"");

	var separator  = /[.,_-]/ig;
	name = name.replace(separator,' ');	

	//Remove scource infos
	var sourceKeys  = [
		"HDTV", "PDTV", "DVDRip", "DVDSCR", "DSRip",
		"CAM","R5","LINE","HD2DVD","DVD","DVD5","DVD9",
		"HRHDTV","MVCD","VCD","TS","VHSRip","BluRay","HDDVD",
		"D-THEATER","SDTV","720p","1080p","BrRip","BDRip","WORKPRINT",
		"DVD-SCREENER","TELESYNC" , "x264", 
		"scOrp", "utkuemre", "aXXo","XviD"];

	var keyReg = new RegExp(sourceKeys.join("|"), "ig")	;
	name = name.replace(keyReg,'');

	var separator  = /\[.*\]|\{.*\}|\(.*\)/
	name = name.replace(separator,'');	

	return name;
}