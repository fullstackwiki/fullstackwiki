"use strict";

const inherits = require('util').inherits;

const { Route } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteTTL, Route);
module.exports.RouteTTL = RouteTTL;
function RouteTTL(options){
	if(!(this instanceof RouteTTL)) return new RouteTTL(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteTTL.prototype.name = 'RouteTTL';
RouteTTL.prototype.contentType = 'text/turtle';
RouteTTL.prototype.prepare_match = async function prepare_match(uri){
	return true;
};
RouteTTL.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.all([ this.prepare(this.uriTemplate) ]);
};
RouteTTL.prototype.render = function render(){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	var out = new PassThrough;
	out.setHeader('Content-Type', this.contentType);
	var dataset = self.options.index.graph;
	// Object.keys(dataset.indexGPOS).forEach(function(graph){
	// 	console.log(graph);
	// 	// out.write('\n# '+baseURI+'\n');
	// 	// out.write(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
	// 	// out.write("\n");
	// });
	var bySubject = {};
	var bnodeMap = {};
	var bnodeId = 0;
	dataset.forEach(function(triple){
		bySubject[triple.subject.toNT()] = bySubject[triple.subject.toNT()] || [];
		bySubject[triple.subject.toNT()].push(triple);
	});
	function printNode(node){
		if(node.termType=='BlankNode'){
			if(bnodeMap[node]) return '_:n'+bnodeMap[node];
			bnodeMap[node] = bnodeId++;
			return '_:n'+bnodeMap[node];
		}else{
			return node.toNT();
		}
	}
	for(var k in bySubject){
		var properties = bySubject[k];
		// There must be at least one item in the array, and the subjects are all the same
		var subject = properties[0].subject;
		var sep = properties.length===1 ? ' ' : '\n\t' ;
		out.write('\n'+printNode(subject));
		properties.forEach(function(triple, i){
			var end = (i+1<properties.length) ? ' ;' : '' ;
			out.write(sep+printNode(triple.predicate)+' '+printNode(triple.object)+end);
		});
		out.write(' .\n');
	}
	out.end();
	return out.clientReadableSide;
};
RouteTTL.prototype.initialize = function initialize(){
	const self = this;
	if(self.initializeComplete) return self.initializeComplete;
	return self.options.index.initialize();
};
