
"use strict";

const inherits = require('util').inherits;

const lunr = require('lunr');
const { DOMParser } = require('xmldom');
const { Route, StringResource, MessageHeaders } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteLunrIndex, Route);
module.exports.RouteLunrIndex = RouteLunrIndex;
function RouteLunrIndex(options){
	if(!(this instanceof RouteLunrIndex)) return new RouteLunrIndex(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteLunrIndex.prototype.name = 'ResourceLunrIndex';
RouteLunrIndex.prototype.contentType = 'application/ecmascript';
RouteLunrIndex.prototype.prepare = function prepare(uri){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	var match = this.matchUri(uri);
	return Promise.resolve(new StringResource(self, {match}));
};
RouteLunrIndex.prototype.index = function index(){
	// This route identifies exactly one resource with no arguments
	return [{}];
};
RouteLunrIndex.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.resolve([ this.prepare(this.uriTemplate) ]);
};
RouteLunrIndex.prototype.renderString = function renderString(req){
	var route = this.options.route;
	if(!route){
		throw new Error('expected route');
	}
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	var out = new MessageHeaders;
	out.setHeader('Content-Type', this.contentType);
	var labels = {};
	return route.listing().then(function(list){
		return Promise.all(list.map(function(resource){
			var req = {
				uri: resource.uri,
				method: 'GET',
				headers: {
					'Accept': 'application/xhtml+xml'
				},
			};
			return resource.renderString(req).then(function(res){
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
			});
		}));
	}).then(function(documents){
		var idx = lunr(function(){
			//this.metadataWhitelist.push('position');
			this.ref('id');
			this.field('title', {boost: 8});
			this.field('body');
			documents.forEach(function (doc) {
				this.add(doc);
				labels[doc.id] = doc.title;
			}, this);
		}).toJSON();
		// call toJSON so we get a plain object and not an Index object
		// Add the labels property to this
		idx.labels = labels;
		out.body = '';
		if(self.options.exportName){
			out.body += 'var '+self.options.exportName+'=\n';
		}
		out.body += JSON.stringify(idx,null,"\t")+"\n";
		return out;
	});
};
