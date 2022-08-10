"use strict";

// Presentation view step 3/4
// Substitutes variable bindings with data from other pages

const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
var parse = require('rdfa-template').parserFrom(require('rdfa').RDFaXHTMLParser);
var XMLSerializer = require('xmldom').XMLSerializer;

const TransformRoute = require('dive-httpd').TransformRoute;
const ResponseMessage = require('dive-httpd').ResponseMessage;

module.exports.RouteApplyBindings = RouteApplyBindings;
inherits(RouteApplyBindings, TransformRoute);
function RouteApplyBindings(uriTemplate, index, innerRoute){
	TransformRoute.call(this, {uriTemplate, innerRoute});
	this.index = index;
	this.graph = index.graph;
}

RouteApplyBindings.prototype.contentType = 'application/x.wiki.fullstack.plain+xml';

RouteApplyBindings.prototype.render_transform = async function render_transform(resource, req, input, res){
	const message = await ResponseMessage.fromStream(input);
	message.pipeHeaders(res);
	res.setHeader('Content-Type', resource.route.contentType);
	const document = new DOMParser().parseFromString(message.body);
	const graph = resource.route.graph;
	const eMain = document.documentElement;
	if(eMain.getAttribute('xmlns:q')==='http://fullstack.wiki/rdfq/'){
		var filled = parse(resource.uri, document).fillSingle(graph);
		res.end((new XMLSerializer).serializeToString(filled));
	}else{
		res.end(message.body);
	}
};
