
const inherits = require('util').inherits;
var markdown = require( "markdown" ).markdown;

const MessageHeaders = require('dive-httpd').MessageHeaders;
const StringResource = require('dive-httpd').StringResource;
const Route = require('dive-httpd').Route;

var escapeHTML = require('./html-escape.js').escapeHTML;

function generateString(resource, upstreamResponse){
	const sourceContents = upstreamResponse.body; // xsltString: string of xslt file contents
	var res = new MessageHeaders;
	res.setHeader('Content-Type', resource.route.contentType);

	var title = sourceContents.toString().match(/^#\s*(.*)$/m);

	if(title) title = title[1];
	else title = "";

	res.body = "";
	res.body += ('<!DOCTYPE html>\n');
	res.body += ('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">\n');
	res.body += ('\t<head>\n');
	res.body += ('\t\t<meta charset="UTF-8" />\n');
	res.body += ('\t\t<title>'+escapeHTML(title)+'</title>\n');
	res.body += ('\t\t<meta property="http://purl.org/dc/terms/title" content="'+escapeHTML(title)+'"/>\n');
	//res.body += ('\t\t<meta name="description" content="" />\n');
	res.body += ('\t\t<meta name="generator" content="https://github.com/evilstreak/markdown-js" />\n');
	res.body += ('\t</head>\n');
	res.body += ('\t<body>\n');
	res.body += ('\t\t<main id="main-content">\n');
	res.body += (markdown.toHTML(sourceContents));
	res.body += ('\t\t</main>\n');
	res.body += ('\t</body>\n');
	res.body += ('</html>\n');
	return res;
};


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
	return this.innerRoute.prepare(innerMatch).then(function(resource){
		if(resource===undefined) return Promise.resolve();
		return new StringResource(route, {}, {uri:match.uri, match:match, innerResource:resource});
	});
}
RouteApplyMarkdown.prototype.renderString = function renderString(resource, req){
	return resource.innerResource.renderString(req).then(function(upstreamResponse){
		return generateString(resource, upstreamResponse);
	});
}
RouteApplyMarkdown.prototype.watch = function watch(cb){
	return this.innerRoute.watch(cb);
}

// List all the URIs accessible through this route
RouteApplyMarkdown.prototype.listing = function listing(){
	return this.innerRoute.listing();
}

RouteApplyMarkdown.prototype.listDependents = function listDependents(){
	return [this.innerRoute];
}

RouteApplyMarkdown.prototype.contentType = 'application/xhtml+xml';
