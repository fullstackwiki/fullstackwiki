"use strict";

const inherits = require('util').inherits;
var markdown = require( "markdown" ).markdown;

const { TransformRoute } = require('dive-httpd');
const { escapeHTML } = require('./html-escape.js');

module.exports.RouteApplyMarkdown = RouteApplyMarkdown;
inherits(RouteApplyMarkdown, TransformRoute);
function RouteApplyMarkdown(uriTemplate, innerRoute){
	this.uriTemplate = uriTemplate;
	this.innerRoute = innerRoute;
	this.innerRouteTemplate = innerRoute.uriTemplate;
}

RouteApplyMarkdown.prototype.render_transform = async function render_transform(resource, req, input, output){
	await input.headersReady;
	input.pipeHeaders(output);
	output.setHeader('Content-Type', this.contentType);
	var source = '';
	for await(var chunk of input) source += chunk.toString();
	const title_m = source.match(/^#\s*(.*)$/m);
	const title = title_m ? title_m[1] : "";
	const main_html = markdown.toHTML(source);

	output.write('<!DOCTYPE html>');
	output.write('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
	output.write('\t<head>');
	output.write('\t\t<meta charset="UTF-8" />');
	output.write('\t\t<title>'+escapeHTML(title)+'</title>');
	output.write('\t\t<meta property="http://purl.org/dc/terms/title" content="'+escapeHTML(title)+'"/>\n');
	output.write('\t\t<meta name="generator" content="https://github.com/evilstreak/markdown-js" />\n');
	output.write('\t</head>');
	output.write('\t<body>');
	output.write('\t\t<main id="main-content">');
	output.write(main_html);
	output.write('\t\t</main>');
	output.write('\t</body>');
	output.write('</html>');
	output.end();
}

RouteApplyMarkdown.prototype.contentType = 'application/xml';
