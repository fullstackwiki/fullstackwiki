var parse = require('rdfa-parser')
var fs = require('fs');
var path = require('path');

var files = process.argv.slice(2);
var triples = [];
files.forEach(function(v){
	var body = fs.readFileSync(v);
	var fullpath = encodeURI(path.resolve(v));
	if(fullpath[0]!='/') fullpath = '/' + fullpath;
	var uri = 'file://'+fullpath;
	var parsed = parse.parseRDFa(body, uri);
	for (var i = 0; i < parsed.length; i++) {
		console.log(parsed[i].toString());
	}
});
