"use strict";

var rdf = require('rdf');
var rdfaParse = require('rdfa-template').parserFrom(require('rdfa').RDFaXHTMLParser);
var DOMParser = require('xmldom').DOMParser;
const { ResponseMessage } = require('dive-httpd');
const assert = require('assert');

module.exports.IndexRDFa = IndexRDFa;
function IndexRDFa(app){
	this.app = app;
	this.data = new rdf.Dataset;
	this.graph = new rdf.Graph;
	this.waiting = [];
}

IndexRDFa.prototype.import = function import_(route){
	var self = this;
	if(route && route.watch){
		const w = route.watch(function(resource){
			self.reindexFile(resource).then(null, function(err){
				console.error(err.stack);
			});
		});
		this.waiting.push(w);
		return w;
	}else{
		throw new Error('Route '+JSON.stringify(route.template)+' has no watch method');
	}
};

IndexRDFa.prototype.reindexFile = async function reindexFile(resource){
	var self = this;
	var graphURI = resource.uri;
	var accept = [
		'application/x.wiki.fullstack.template+xml',
		'application/xhtml+xml',
	];
	var req = {
		url: graphURI,
		method: 'GET',
		headers: {
			accept: accept.join(', '),
		},
	};
	const res = resource.render(req);
	const msg = await ResponseMessage.fromStream(res);
	assert(msg);
	assert(msg.body);
	assert(res.headers);
	// assert(res.headers['content-type']);
	var responseBody = msg.body;
	// First purge the old data
	self.data.removeMatches(null, null, null, graphURI);
	// Ensure it is a document type that we index
	if(accept.indexOf(msg.getHeader('Content-Type'))<0) return;

	var document = new DOMParser().parseFromString(responseBody, 'text/xml');
	var result = rdfaParse(graphURI, document);
	// console.log('# '+graphURI+'\n');
	// console.log(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
	// Import new data
	result.data().forEach(function(e){
		self.data.add(new rdf.Quad(e.subject, e.predicate, e.object, graphURI));
	});

	self.graph.clear();
	self.data.forEach(function(s){
		self.graph.add(new rdf.Triple(s.subject, s.predicate, s.object));
	});
};

IndexRDFa.prototype.initialize = function initialize(){
	// TODO fix this in the case something is pushed to waiting during processing
	return Promise.all(this.waiting);
};
