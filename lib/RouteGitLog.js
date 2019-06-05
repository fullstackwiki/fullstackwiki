
"use strict";

var fs = require('fs');
var inherits = require('util').inherits;
var TemplateRouter = require('uri-template-router');
var git = require('isomorphic-git');
var escapeHTML = require('./html-escape.js').escapeHTML;


var Route = require('dive-httpd').Route;
var StringResource = require('dive-httpd').StringResource;
var MessageHeaders = require('http-transform').Headers;

inherits(RouteGitLog, Route);
module.exports.RouteGitLog = RouteGitLog;
function RouteGitLog(options){
	if(!(this instanceof RouteGitLog)) return new RouteGitLog(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.options = options;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteGitLog.prototype.name = 'RouteGitLog';
RouteGitLog.prototype.contentType = 'application/xhtml+xml';
RouteGitLog.prototype.prepare = function prepare(uri, euri, queryMap){
	var match = this.matchUri(uri);
	if(!match) return Promise.resolve();
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var self = this;
	return Promise.resolve(new StringResource(self, {}, {match, uri}));
};
RouteGitLog.prototype.renderString = function renderString(resource){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var options = this.options;
	var out = new MessageHeaders;
	return git.log(options).then(function(commits){
		out.setHeader('Content-Type', resource.contentType);
		out.body = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:w="tag:fullstack.wiki,2018:ns/" lang="en" dir="ltr">
	<head>
		<meta charset="UTF-8" />
		<title>${options.title ? `<h1>${escapeHTML(options.title)}</h1>` : ''}</title>
	</head>
	<body>
		<main>
			${options.title ? `<h1>${escapeHTML(options.title)}</h1>` : ''}
			<ol class="commits-listing">${commits.map(function(c){
			return `<li class="commit">
<p>${escapeHTML(c.message)}</p>
<div>${escapeHTML(c.author.name)} on <date>${new Date(c.author.timestamp*1000).toISOString()}</date></div>
</li>`;
		}).join('\n')}</ol>
		</main>
	</body>
</html>
`;
		return out;
	});
}
RouteGitLog.prototype.listing = function listing(){
	var match = this.matchUri(this.uriTemplate);
	return Promise.resolve([ new StringResource(this, {match}) ]);
};
