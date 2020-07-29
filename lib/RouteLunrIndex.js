"use strict";

const inherits = require('util').inherits;

const { Route, ResponsePassThrough } = require('dive-httpd');
const assert = require('assert');

inherits(RouteLunrIndex, Route);
module.exports.RouteLunrIndex = RouteLunrIndex;
function RouteLunrIndex(options){
	if(!(this instanceof RouteLunrIndex)) return new RouteLunrIndex(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.index = options.index;
	this.indexData = options.index.indexData;
	this.exportName = options.exportName;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
	this.waiting = [];
}
RouteLunrIndex.prototype.name = 'RouteLunrIndex';
RouteLunrIndex.prototype.contentType = 'application/ecmascript';
RouteLunrIndex.prototype.prepare_match = async function prepare_match(uri, resolve){
	return resolve();
};
RouteLunrIndex.prototype.index = function index(){
	// This route identifies exactly one resource with no arguments
	return [{}];
};
RouteLunrIndex.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.all([ this.prepare(this.uriTemplate) ]);
};
RouteLunrIndex.prototype.render = function render(req){
	const idx = this.index && this.index.indexData;
	assert(idx);
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	var out = new ResponsePassThrough;
	out.setHeader('Content-Type', this.contentType);
	var labels = {};
	try {
		var body = '';
		if(self.exportName){
			body += 'var '+self.exportName+'=\n';
		}
		body += JSON.stringify(idx,null,"\t")+"\n";
		out.end(body);
	} catch (err){
		out.destroy(err);
	}
	return out.readableSide;
};
RouteLunrIndex.prototype.initialize = async function initialize(){
	assert(this.index);
	// await this.index.initialize();
	// TODO fix this in the case something is pushed to waiting during processing
	return Promise.all(this.waiting);
}
