
"use strict";

var fs = require('fs');
var inherits = require('util').inherits;
var TemplateRouter = require('uri-template-router');
var git = require('isomorphic-git');
var escapeHTML = require('./html-escape.js').escapeHTML;


var Route = require('dive-httpd').Route;
var Resource = require('dive-httpd').Resource;
var PassThrough = require('http-transform').PassThrough;

inherits(RouteGitLog, Route);
module.exports.RouteGitLog = RouteGitLog;
function RouteGitLog(options){
	if(!(this instanceof RouteGitLog)) return new RouteGitLog(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.routerURITemplate = options.uriTemplate;
	Route.call(this);
}
RouteGitLog.prototype.name = 'RouteGitLog';
RouteGitLog.prototype.ResourceGitLog = ResourceGitLog;
RouteGitLog.prototype.prepare = function prepare(uri, euri, queryMap){
	var match = this.matchUri(uri);
	if(!match) return Promise.resolve();
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new self.ResourceGitLog(self, match, self.options));
};
RouteGitLog.prototype.index = function index(routes){
	return [{}];
};
RouteGitLog.prototype.listing = function index(routes){
	return Promise.resolve([{}]);
};

inherits(ResourceGitLog, Route);
module.exports.ResourceGitLog = ResourceGitLog;
function ResourceGitLog(route, match, options){
	if(!(this instanceof ResourceGitLog)) return new ResourceGitLog(route, match, match);
	this.route = route;
	this.uri = match.uri;
	this.contentType = 'application/xhtml+xml';
	this.options = options;
}
ResourceGitLog.prototype.render = function render(req, res, route, euri, queryMap){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	var out = new PassThrough;
	out.setHeader('Content-Type', this.contentType);
	git.log(self.options).then(function(commits){
		out.end(`<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:w="tag:fullstack.wiki,2018:ns/" lang="en" dir="ltr">
	<head>
		<meta charset="UTF-8" />
		<title>${self.options.title ? `<h1>${escapeHTML(self.options.title)}</h1>` : ''}</title>
	</head>
	<body>
		<main>
			${self.options.title ? `<h1>${escapeHTML(self.options.title)}</h1>` : ''}
			<ol class="commits-listing">${commits.map(function(c){
			return `<li class="commit">
<p>${escapeHTML(c.message)}</p>
<div>${escapeHTML(c.author.name)} on <date>${new Date(c.author.timestamp*1000).toISOString()}</date></div>
</li>`;
		}).join('\n')}</ol>
		</main>
	</body>
</html>
`);

	});
	return out;
};
