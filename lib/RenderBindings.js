
// Presentation view step 3/4
// Substitutes variable bindings with data from other pages

const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
var parse = require('rdfa-template').parserFrom(require('rdfa').RDFaXHTMLParser);
var XMLSerializer = require('xmldom').XMLSerializer;

const StringResource = require('dive-httpd').StringResource;
const Route = require('dive-httpd').Route;
const MessageHeaders = require('dive-httpd').MessageHeaders;

module.exports.RouteApplyBindings = RouteApplyBindings;
inherits(RouteApplyBindings, Route);
function RouteApplyBindings(uriTemplate, graph, innerRoute){
	this.uriTemplate = uriTemplate;
	this.graph = graph;
	this.innerRoute = innerRoute;
	this.innerRouteTemplate = innerRoute.uriTemplate;
}

RouteApplyBindings.prototype.contentType = 'application/x.wiki.fullstack.plain+xml';

RouteApplyBindings.prototype.prepare = function prepare(uri){
	var route = this;
	var match = this.matchUri(uri);
	if(!match) return Promise.resolve();
	var innerMatch = match.rewrite(this.innerRouteTemplate);
	return this.innerRoute.prepare(innerMatch).then(function(resource){
		if(resource===undefined) return Promise.resolve();
		return new StringResource(route, {}, {uri:match.uri, match:match, innerResource:resource});
	});
}

RouteApplyBindings.prototype.renderString = function renderString(resource, req){
	return resource.innerResource.renderString(req).then(function(upstreamResponse){
		var res = new MessageHeaders;
		upstreamResponse.pipeHeaders(res);
		res.setHeader('Content-Type', resource.route.contentType);
		const document = new DOMParser().parseFromString(upstreamResponse.body);
		const graph = resource.route.graph;
		const eMain = document.documentElement;
		if(eMain.getAttribute('xmlns:q')==='http://fullstack.wiki/rdfq/'){
			var filled = parse(resource.uri, document).fillSingle(graph);
			res.body = (new XMLSerializer).serializeToString(filled);
		}else{
			res.body = upstreamResponse.body;
		}
		return res;
	});
}

RouteApplyBindings.prototype.watch = function watch(cb){
	return this.innerRoute.watch(cb);
}

// List all the URIs accessible through this route
RouteApplyBindings.prototype.listing = function listing(){
	return this.innerRoute.listing();
}

RouteApplyBindings.prototype.listDependents = function listDependents(){
	return [this.innerRoute];
}
