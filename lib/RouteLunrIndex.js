
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
RouteLunrIndex.prototype.prepare = function prepare(match, euri, queryMap){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new StringResource(self, {match}));
};
RouteLunrIndex.prototype.index = function index(routes){
	// This route identifies exactly one resource with no arguments
	return [{}];
};
RouteLunrIndex.prototype.listing = function listing(routes){
	// This route identifies exactly one resource with no arguments
	return Promise.resolve([{}]);
};
RouteLunrIndex.prototype.renderString = function renderString(req){
	var app = this.options.app;
	if(!app){
		throw new Error('expected app');
	}
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	var out = new MessageHeaders;
	out.setHeader('Content-Type', this.contentType);
	var labels = {};
	return Promise.all(self.options.routes.map(function(route){
		return route.listing().then(function(data){
			return Promise.resolve(data.map(function(data){
				if(typeof data==='string') return data;
				return route.generateUri(data);
			}));
		});
	})).then(function(routesPaths){
		var list = [];
		routesPaths.forEach(function(paths){
			paths.forEach(function(uri){
				list.push(app.prepare(uri).then(function(resource){
					if(!resource) throw new Error('Expected resource '+uri);
					return app.prepare(uri);
				}).then(function(resource){
					var req = {
						url: uri,
						method: 'GET',
						headers: {
							'Accept': 'application/xhtml+xml'
						},
					};
					var res = new PassThrough;
					resource.render(req).pipe(res);
					var responseBody = '';
					res.on('data', function(block){
						responseBody += block;
					});
					return new Promise(function(resolve, reject){
						res.on('end', function(){
							var ct = res.getHeader('Content-Type');
							const xml = new DOMParser().parseFromString(responseBody);
							const title = xml.getElementsByTagName('title')[0].textContent;
							const body = xml.getElementsByTagName('body')[0].textContent;
							//console.log(res.statusCode, uri, title);
							return void resolve({
								// FIXME: use a better to-relative method
								id: uri.replace('http://fullstack.wiki/', ''),
								title: title.replace(/ ?\| Fullstack\.wiki$/, ''),
								body: body,
								//description: parsed.metatags.description && parsed.metatags.description[0],
							});
						});
					});
				}));
			});
		});
		return Promise.all(list);
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
