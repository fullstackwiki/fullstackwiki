var WAE = require('web-auto-extractor').default
var fs = require('fs');

var files = process.argv.slice(2);
var results = files.map(function(v){
	var body = fs.readFileSync(v);
	var wae = WAE();
	var parsed = wae.parse(body);
	return parsed;
});
console.log(JSON.stringify(results, null, "\t"));
