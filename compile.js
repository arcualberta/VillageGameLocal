const fs = require('fs');
const UglifyJS = require("uglify-es");

var options = {
    mangle: {
        toplevel: false,
    },
    nameCache: {}
};

var CodeSection = function(output){
	this.files = [];
	this.output = output;

	return this;
}
CodeSection.prototype.AddJavascript = function(input){
	this.files.push(input);
}
CodeSection.prototype.Compile = function(){
	console.log('Compiling ' + this.output + "...");
	fs.writeFileSync(this.output, "");
	var file = fs.openSync(this.output, 'w');

	for(var i = 0; i < this.files.length; ++i){
		console.log('Minifying ' + this.files[i]);
		var result = UglifyJS.minify(fs.readFileSync(this.files[i], "utf8"), options);

		if(result.error){
			console.log("Error: " + JSON.stringify(result.error));
		}

		fs.writeSync(file, result.code);
	}
	fs.close(file);

	console.log('Complete\n');
}

function copyFile(input, output){
	fs.writeFileSync(output, fs.readFileSync(input, "utf8"));
}

var arcEngine = new CodeSection("./Compiled/lib/arcEngine.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_constants.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_objects.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_components.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_imaging.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_dialog.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_display.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_control.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_audio.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_overlay.js");
arcEngine.AddJavascript("./Test/src/arc_engine/arc_game.js");
arcEngine.Compile()

var village = new CodeSection("./Compiled/lib/village.js");
village.AddJavascript("./Test/src/village_constants.js");
village.AddJavascript("./Test/src/village_script_functions.js");
village.AddJavascript("./Test/src/village_objects.js");
village.AddJavascript("./Test/src/village_menus.js");
village.AddJavascript("./Test/src/village_functions.js");
village.AddJavascript("./Test/src/village_map.js");
village.AddJavascript("./Test/src/village_display.js");
village.AddJavascript("./Test/module_worldAdapter.js");
village.AddJavascript("./Test/src/village_game.js");
village.Compile();


copyFile("./Test/src/jquery-1.7.2.min.js", "./Compiled/lib/jquery-1.7.2.min.js");
copyFile("./Test/src/jquery.csv-0.71.min.js", "./Compiled/lib/jquery.csv-0.71.min.js");
copyFile("./Test/src/config.js", "./Compiled/config.js");