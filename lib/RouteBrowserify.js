"use strict";

var inherits = require('util').inherits;
var browserify = require('browserify');

var { Route, Resource, ResponsePassThrough } = require('dive-httpd');


inherits(RouteBrowserify, Route);
module.exports.RouteBrowserify = RouteBrowserify;
function RouteBrowserify(opts){
	if(!(this instanceof RouteBrowserify)) return new RouteBrowserify(opts);
	this.uriTemplate = opts.uriTemplate;
	this.filepath = opts.filepath;
	this.exportName = opts.exportName;
	this.mediatype = opts.mediatype || 'application/ecmascript';
	this.name = 'Browserify('+this.filepath+' as '+this.exportName+')';
}
RouteBrowserify.prototype.name = 'RouteBrowserify';
RouteBrowserify.prototype.process = function handleRequestStatic(req, res){
	var filepath = this.filepath;
	var mediatype = this.mediatype;
	res.setHeader('Content-Type', mediatype);
	var b = browserify({
		entries: this.filepath,
		debug: !!this.exportName,
		standalone: this.exportName,
	});
	var out = new PassThrough;
	out.setHeader('Content-Type', this.mediatype);
	b.bundle().pipe(out);
	return new Promise.resolve(out);
};
RouteBrowserify.prototype.index = function index(req, res){
	return [{}];
};
RouteBrowserify.prototype.listing = function listing(req, res){
	return Promise.resolve([{}]);
};
