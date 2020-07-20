
"use strict";

const inherits = require('util').inherits;

const lunr = require('lunr');
const { DOMParser } = require('xmldom');
const { Route, ResponsePassThrough, ResponseMessage } = require('dive-httpd');

inherits(RouteLunrIndex, Route);
module.exports.RouteLunrIndex = RouteLunrIndex;
function RouteLunrIndex(options){
	if(!(this instanceof RouteLunrIndex)) return new RouteLunrIndex(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
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
	var route = this.options.route;
	if(!route){
		throw new Error('expected route');
	}
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var self = this;
	var out = new ResponsePassThrough;
	out.setHeader('Content-Type', this.contentType);
	var labels = {};
	route.listing().then(function(list){
		return Promise.all(list.map(function(resource){
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
			return ResponseMessage.fromStream(resource.render(req)).then(function(res){
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
				if(!doc) return;
				this.add(doc);
				labels[doc.id] = doc.title;
			}, this);
		}).toJSON();
		// call toJSON so we get a plain object and not an Index object
		// Add the labels property to this
		idx.labels = labels;
		var body = '';
		if(self.options.exportName){
			body += 'var '+self.options.exportName+'=\n';
		}
		body += JSON.stringify(idx,null,"\t")+"\n";
		out.end(body);
	}).catch(function(err){
		out.destroy(err);
	});
	return out.readableSide;
};
