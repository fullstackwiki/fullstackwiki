var lunr = require('lunr');
var buffer = [];

var WAE = require('web-auto-extractor').default
var fs = require('fs');
var h = require('./lib/html-escape.js').escapeHTML;

var files = process.argv.slice(2);
var documents = files.map(function(v){
	var body = fs.readFileSync(v);
	var wae = WAE();
	var parsed = wae.parse(body);
	var data = parsed.rdfa['HTTP-Header'] && parsed.rdfa['HTTP-Header'][0];
	return data;
});

var idx = lunr(function () {
	this.ref('HTTP-Header-name');
	this.field('HTTP-Header-direction');
	this.field('HTTP-Header-description');
	documents.forEach(function (doc) {
		console.error(doc);
		this.add(doc);
	}, this);
});

process.stdout.write(JSON.stringify(idx));
process.stdout.write("\n");
