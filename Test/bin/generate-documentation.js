// Make sure you have jsdoc installed first using: npm install -g jsdoc
'use strict';

var fs = require('fs');
var exec = require('child_process').exec;

var exclude = [
	"jquery-1.7.2.min.js",
	"jquery.csv-0.71.min.js"
]

var inFolder = fs.realpathSync("../src");
var outFolder = fs.realpathSync("../doc");
var packFile = fs.realpathSync("../../package.json");

console.log("Reading files from folder: " + inFolder);
console.log("Outputing files in folder: " + outFolder);


exec("jsdoc \"" + inFolder + "\" -r -p \"" + packFile + "\" -d \"" + outFolder + "\"", function(error, stdout, stderr){
	if(error){
		console.error("Error: " + error);
	}else{
		console.log(stdout);
	}
});