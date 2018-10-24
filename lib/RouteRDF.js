
"use strict";

const inherits = require('util').inherits;

const rdfa = require('rdfa');
const parse = rdfa.RDFaXHTMLParser.parse;
const { DOMParser } = require('xmldom');
const { handleRequest, Route, Resource } = require('dive-httpd');
const { PassThrough } = require('http-transform');

inherits(RouteRDF, Route);
module.exports.RouteRDF = RouteRDF;
function RouteRDF(options){
	if(!(this instanceof RouteRDF)) return new RouteRDF(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	Route.call(this);
}
RouteRDF.prototype.ResourceLunrIndex = ResourceLunrIndex;
RouteRDF.prototype.prepare = function prepare(match, euri, queryMap){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new self.ResourceLunrIndex(self, euri, match, self.options));
};
RouteRDF.prototype.index = function index(routes){
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
	out.setHeader('Content-Type', 'text/turtle');
	var files = [];
	var labels = {};
	self.options.routes.forEach(function(route){
		route.name.index(route.router).forEach(function(data){
			files.push(route.gen(data));
		});
	});
	var documentPromise = files.map(function(uri){
		return new Promise(function(resolve, reject){
			var req = {
				url: uri,
				method: 'GET',
				headers: {},
			};
			var res = new PassThrough;
			handleRequest(serverOptions, req, res);
			var responseBody = '';
			res.on('data', function(block){
				responseBody += block;
			});
			res.on('end', function(){
				var ct = res.getHeader('Content-Type');
				if(res.statusCode===200 && ct.length){
					const document = new DOMParser().parseFromString(responseBody); // xsltString: string of xslt file contents
					//var baseURI = filepath.replace(/^web\//, 'http://fullstack.wiki/');
					var baseURI = uri.replace(/^http:\/\/localhost\//, 'http://fullstack.wiki/');
					var result = parse(baseURI, document);
					out.write('# '+baseURI+'\n');
					out.write(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
				}else{
					return void reject(new Error('Status code '+res.statusCode));
				}
			});
		});
	});
	Promise.all(documentPromise).then(function(documents){
		out.write("\n");
		out.end();
	});
	return out;
};
