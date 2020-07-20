"use strict";

const inherits = require('util').inherits;
var markdown = require( "markdown" ).markdown;

const { Resource, Route } = require('dive-httpd');
const { ResponseTransform } = require('http-transform');
const { escapeHTML } = require('./html-escape.js');

class MarkdownTransform extends ResponseTransform {
	constructor(resource, route) {
		super();
		const [ input, output ] = this.makeStreams();
		output.setHeader('Content-Type', route.contentType);
		output.write('<!DOCTYPE html>');
		output.write('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
		output.write('\t<head>');
		output.write('\t\t<meta charset="UTF-8" />');
		input.once('readable', async function(){
			var source = '';
			for await(var chunk of input) source += chunk.toString();

			const title_m = source.match(/^#\s*(.*)$/m);
			const title = title_m ? title_m[1] : "";

			output.write('\t\t<title>'+escapeHTML(title)+'</title>');
			output.write('\t\t<meta property="http://purl.org/dc/terms/title" content="'+escapeHTML(title)+'"/>\n');
			output.write('\t\t<meta name="generator" content="https://github.com/evilstreak/markdown-js" />\n');
			output.write('\t</head>');
			output.write('\t<body>');
			output.write('\t\t<main id="main-content">');
			output.write(markdown.toHTML(source));
			output.write('\t\t</main>');
			output.write('\t</body>');
			output.write('</html>');
			output.end();
		});
		this.once('error', (err)=>output.destroy(err));
	}
}

module.exports.RouteApplyMarkdown = RouteApplyMarkdown;
inherits(RouteApplyMarkdown, Route);
function RouteApplyMarkdown(uriTemplate, innerRoute){
	this.uriTemplate = uriTemplate;
	this.innerRoute = innerRoute;
	this.innerRouteTemplate = innerRoute.uriTemplate;
}
RouteApplyMarkdown.prototype.prepare = function prepare(uri){
	var route = this;
	var match = this.matchUri(uri);
	if(!match) return Promise.resolve();
	var innerMatch = match.rewrite(this.innerRouteTemplate);
	return this.innerRoute.prepare(innerMatch).then(function(inner){
		if(inner===undefined) return Promise.resolve();
		return new Resource(route, {match, inner});
	});
}
RouteApplyMarkdown.prototype.render = function render(resource, req){
	const inner = resource.inner.render(req);
	const output = new MarkdownTransform(resource, this);
	inner.once('error', (err)=>output.destroy(err));
	return inner.pipeMessage(output);
}
RouteApplyMarkdown.prototype.watch = function watch(cb){
	var route = this;
	return this.innerRoute.watch(function(inner, ancestor){
		var match = inner.match.rewrite(route.uriTemplate);
		return void cb(new Resource(route, {match, inner}), ancestor);
	});
}

// List all the URIs accessible through this route
RouteApplyMarkdown.prototype.listing = function listing(){
	var route = this;
	return this.innerRoute.listing().then(function(list){
		return list.map(function(inner){
			var match = inner.match.rewrite(route.uriTemplate);
			return new Resource(route, {match, inner});
		});
	});
}

RouteApplyMarkdown.prototype.listDependents = function listDependents(){
	return [this.innerRoute];
}

RouteApplyMarkdown.prototype.contentType = 'application/xml';
