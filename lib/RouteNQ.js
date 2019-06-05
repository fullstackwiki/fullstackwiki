
"use strict";

const inherits = require('util').inherits;

const { Route, StreamResource } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteNQ, Route);
module.exports.RouteNQ = RouteNQ;
function RouteNQ(options){
	if(!(this instanceof RouteNQ)) return new RouteNQ(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteNQ.prototype.name = 'RouteNQ';
RouteNQ.prototype.contentType = 'application/n-quads';
RouteNQ.prototype.prepare = function prepare(match){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	return Promise.resolve(new StreamResource(self, {match}));
};
RouteNQ.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.all([ this.prepare(this.uriTemplate), ]);
};
RouteNQ.prototype.render = function render(){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	var out = new PassThrough;
	out.setHeader('Content-Type', this.contentType);
	out.body = '';
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
