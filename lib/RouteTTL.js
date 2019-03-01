
"use strict";

const inherits = require('util').inherits;
const mapPromise = require('bluebird').map;

const rdfa = require('rdfa');
const parse = rdfa.RDFaXHTMLParser.parse;
const { DOMParser } = require('xmldom');
const { handleRequest, Route, Resource } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteTTL, Route);
module.exports.RouteTTL = RouteTTL;
function RouteTTL(options){
	if(!(this instanceof RouteTTL)) return new RouteTTL(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	Route.call(this);
}
RouteTTL.prototype.name = 'RouteTTL';
RouteTTL.prototype.ResourceRDFGraph = ResourceRDFGraph;
RouteTTL.prototype.prepare = function prepare(match, euri, queryMap){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new self.ResourceRDFGraph(self, euri, match, self.options));
};
RouteTTL.prototype.index = function index(routes){
	// This route identifies exactly one resource with no arguments
	return [{}];
};

inherits(ResourceRDFGraph, Resource);
module.exports.ResourceRDFGraph = ResourceRDFGraph;
function ResourceRDFGraph(route, euri, match, options){
	if(!(this instanceof ResourceRDFGraph)) return new ResourceRDFGraph(route, euri, match);
	this.route = route;
	this.euri = euri;
	this.match = match;
	this.options = options;
}
ResourceRDFGraph.prototype.render = function render(req, res, route, euri, queryMap, serverOptions){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	var out = new PassThrough;
	out.setHeader('Content-Type', 'text/turtle');
	var dataset = self.options.index.data;
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
		})
		out.write(' .\n');
	}
	out.end();
	return out;
};
