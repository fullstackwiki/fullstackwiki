
"use strict";

const inherits = require('util').inherits;

const lunr = require('lunr');
const { handleRequest, Route, Resource } = require('dive-httpd');
const { PassThrough } = require('http-transform');

const escapeHTML = require('./html-escape.js').escapeHTML;

inherits(RouteLunrIndex, Route);
module.exports.RouteLunrIndex = RouteLunrIndex;
function RouteLunrIndex(options, pipe){
	if(!(this instanceof RouteLunrIndex)) return new RouteLunrIndex(options, pipe);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	if(typeof pipe!=='function') throw new Error('Expected function `pipe`');
	this.options = options;
	this.pipe = pipe;
	Route.call(this);
}
RouteLunrIndex.prototype.ResourceLunrIndex = ResourceLunrIndex;
RouteLunrIndex.prototype.prepare = function prepare(match, euri, queryMap){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new self.ResourceLunrIndex(self, euri, match, self.options));
};
RouteLunrIndex.prototype.index = function index(routes){
	// This route identifies exactly one resource with no arguments
	return [{}];
};

inherits(ResourceLunrIndex, Route);
module.exports.ResourceLunrIndex = ResourceLunrIndex;
function ResourceLunrIndex(route, euri, match, options){
	if(!(this instanceof ResourceLunrIndex)) return new ResourceLunrIndex(route, euri, match);
	this.route = route;
	this.euri = euri;
	this.match = match;
	this.options = options;
}
ResourceLunrIndex.prototype.render = function render(req, res, route, euri, queryMap, serverOptions){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	var out = new PassThrough;
	out.setHeader('Content-Type', 'application/ecmascript');
	var files = [];
	self.options.routes.forEach(function(route){
		route.name.index(route.router).forEach(function(data){
			files.push(route.gen(data));
		});
	});
	var documentPromise = files.map(function(uri){
		return new Promise(function(resolve, reject){
		console.log(uri);
			var req = {
				url: uri,
				method: 'GET',
				headers: {},
			};
			var res = new PassThrough;
			handleRequest(serverOptions, req, res);
			var body = '';
			res.on('data', function(block){
				body += block;
			});
			res.on('end', function(){
				var ct = res.getHeader('Content-Type');
				if(res.statusCode===200 && ct.length){
					// TODO use a real parser
					var title = body.toString().match(/<title>([^<]+)<\/title>/);
					title = title && title[1];
					console.log(res.statusCode, uri, title);
					return void resolve({
						id: uri.replace('http://localhost/', ''),
						title: title.replace(/ ?\| Fullstack\.wiki$/, ''),
						description: '',
						//description: parsed.metatags.description && parsed.metatags.description[0],
					});
				}else{
					return void reject(new Error('Status code '+res.statusCode));
				}
			});
		});
	});
	Promise.all(documentPromise).then(function(documents){
		var idx = lunr(function(){
			this.ref('id');
			this.field('title');
			this.field('description');
			documents.forEach(function (doc) {
				this.add(doc);
			}, this);
		});

		if(self.options.exportName) out.write('var '+self.options.exportName+'=\n');
		out.write(JSON.stringify(idx));
		out.write("\n");
		out.end();
	})


	return self.route.pipe(out);
};
