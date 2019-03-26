
"use strict";

const inherits = require('util').inherits;
const mapPromise = require('bluebird').map;

const rdfa = require('rdfa');
const parse = rdfa.RDFaXHTMLParser.parse;
const { DOMParser } = require('xmldom');
const { handleRequest, Route, Resource } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteNT, Route);
module.exports.RouteNT = RouteNT;
function RouteNT(options){
	if(!(this instanceof RouteNT)) return new RouteNT(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	Route.call(this);
}
RouteNT.prototype.ResourceRDFGraph = ResourceRDFGraph;
RouteNT.prototype.name = 'RouteNT';
RouteNT.prototype.prepare = function prepare(match, euri, queryMap){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new self.ResourceRDFGraph(self, euri, match, self.options));
};
RouteNT.prototype.listing = function listing(routes){
	// This route identifies exactly one resource with no arguments
	return Promise.resolve([{}]);
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
	dataset.forEach(function(triple){
		out.write(triple.toNT()+'\n');
	});
	out.end();
	return out;
};
