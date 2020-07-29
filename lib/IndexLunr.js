"use strict";

const lunr = require('lunr');
const { DOMParser } = require('xmldom');
const assert = require('assert');

module.exports.IndexLunr = IndexLunr;
function IndexLunr(app){
	if(!(this instanceof IndexLunr)) return new IndexLunr(options);
	this.app = app;
	this.building = 0;
	this.waiting = [];
}
IndexLunr.prototype.name = 'IndexLunr';

IndexLunr.prototype.import = function import_(route){
	if(!route) throw new Error('Expected route');
	if(!route.watch) throw new Error('Expected `route` to have method `watch`');
	// FIXME don't overwrite previous route / accept multiple routes
	this.route = route;
	const self = this;
	this.building++;

	const w = route.watch(function(resource){
		self.reindexFile(resource).then(null, function(err){
			console.error(err.stack);
		});
	});
	this.waiting.push(w);

	return w.then(function(){
		self.building--;
		if(self.building===0) self.rebuildIndex();
	});
};

IndexLunr.prototype.reindexFile = async function reindexFile(resource){
	if(this.building===0) self.rebuildIndex();
};


IndexLunr.prototype.rebuildIndex = async function rebuildIndex(){
	var route = this.route;
	if(!route) throw new Error('expected route');
	const labels = {};
	const list = await route.listing();
	const documents = await Promise.all(list.map(async function(resource){
		if(!resource || !resource.uri){
			console.error('Unknown URI', resource);
			return;
		}
		var req = {
			uri: resource.uri,
			method: 'GET',
			headers: {
				'Accept': 'application/xhtml+xml'
			},
		};
		const res = await resource.renderString(req);
		// var ct = res.getHeader('Content-Type');
		const xml = new DOMParser().parseFromString(res.body);
		const title = xml.getElementsByTagName('title')[0].textContent;
		const body = xml.getElementsByTagName('body')[0].textContent;
		//console.log(res.statusCode, uri, title);
		return {
			// FIXME: use a better to-relative method
			id: resource.uri.replace('http://fullstack.wiki/', ''),
			title: title.replace(/ ?\| Fullstack\.wiki$/, ''),
			body: body,
			//description: parsed.metatags.description && parsed.metatags.description[0],
		};
	}));
	var idx = lunr(function(){
		//this.metadataWhitelist.push('position');
		this.ref('id');
		this.field('title', {boost: 8});
		this.field('body');
		documents.forEach(function (doc) {
			if(!doc) return;
			this.add(doc);
			labels[doc.id] = doc.title;
		}, this);
	}).toJSON();
	// call toJSON so we get a plain object and not an Index object
	// Add the labels property to this
	idx.labels = labels;
	this.indexData = idx;
};
