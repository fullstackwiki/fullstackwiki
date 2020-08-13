
"use strict";

const inherits = require('util').inherits;

const { Route, ResponsePassThrough } = require('dive-httpd');

inherits(RouteSearchResults, Route);
module.exports.RouteSearchResults = RouteSearchResults;
function RouteSearchResults(options){
	if(!(this instanceof RouteSearchResults)) return new RouteSearchResults(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteSearchResults.prototype.name = 'RouteSearchResults';
RouteSearchResults.prototype.contentType = 'text/plain';
RouteSearchResults.prototype.prepare_match = async function prepare_match(uri){
	return true;
};
RouteSearchResults.prototype.index = function index(){
	// This route identifies exactly one resource with no arguments
	return [{}];
};
RouteSearchResults.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.all([ this.prepare({}) ]);
};
RouteSearchResults.prototype.render = function render(resource, req){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	const out = new ResponsePassThrough;
	const q = resource.params.q;
	out.setHeader('Content-Type', this.contentType);
	out.end(`${JSON.stringify(resource.params)}\r\n`);
	return out.readableSide;
};
RouteSearchResults.prototype.initialize = async function initialize(){
	if(!this.index) throw new Error('expected `index` to be a Lunr index');
};
