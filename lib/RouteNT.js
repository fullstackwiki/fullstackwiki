
"use strict";

const inherits = require('util').inherits;

const { Route, StreamResource } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteNT, Route);
module.exports.RouteNT = RouteNT;
function RouteNT(options){
	if(!(this instanceof RouteNT)) return new RouteNT(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteNT.prototype.name = 'RouteNT';
RouteNT.prototype.contentType = 'application/n-triples';
RouteNT.prototype.prepare = function prepare(match){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new StreamResource(self, {match}));
};
RouteNT.prototype.listing = function listing(routes){
	// This route identifies exactly one resource with no arguments
	return Promise.resolve([{}]);
};
RouteNT.prototype.render = function render(){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	var out = new PassThrough;
	out.setHeader('Content-Type', this.contentType);
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
