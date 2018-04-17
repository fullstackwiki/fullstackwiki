
// This file called by Makefile to generate ../web/search-index.js

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
	console.error(v, parsed);
	if(!data) data = {};
	return {
		id: v,
		label: data['HTTP-Header-name'],
		description: parsed.metatags.description && parsed.metatags.description[0],
		direction: data['HTTP-Header-direction'],
	};
});

var idx = lunr(function () {
	this.ref('id');
	this.field('label');
	this.field('description');
	this.field('direction');
	documents.forEach(function (doc) {
		this.add(doc);
	}, this);
});

process.stdout.write(JSON.stringify(idx));
process.stdout.write("\n");
