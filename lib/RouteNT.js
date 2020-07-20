
"use strict";

const inherits = require('util').inherits;

const { Route, Resource, ResponsePassThrough } = require('dive-httpd');

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
RouteNT.prototype.prepare_match = async function prepare_match(uri, resolve){
	return resolve();
};
RouteNT.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.all([ this.prepare(this.uriTemplate), ]);
};
RouteNT.prototype.render = function render(){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	var out = new ResponsePassThrough;
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
	return out.clientReadableSide;
};
RouteNT.prototype.initialize = function initialize(){
	const self = this;
	if(self.initializeComplete) return self.initializeComplete;
	return self.options.index.initialize();
};
