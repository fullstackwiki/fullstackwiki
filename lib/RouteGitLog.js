
"use strict";

var fs = require('fs');
var inherits = require('util').inherits;
var git = require('isomorphic-git');
var escapeHTML = require('./html-escape.js').escapeHTML;

var { Route, Resource, ResponsePassThrough } = require('dive-httpd');

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
RouteGitLog.prototype.prepare_match = async function prepare_match(uri){
	return true;
};
RouteGitLog.prototype.render = function render(resource){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var options = this.options;
	var out = new ResponsePassThrough;
	git.log(options).then(function(commits){
		out.setHeader('Content-Type', resource.contentType);
		const body = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:w="tag:fullstack.wiki,2018:ns/" lang="en" dir="ltr">
	<head>
		<meta charset="UTF-8" />
		<title>${options.title ? `<h1>${escapeHTML(options.title)}</h1>` : ''}</title>
	</head>
	<body>
		<main>
			${options.title ? `<h1>${escapeHTML(options.title)}</h1>` : ''}
			<ol class="commits-listing">${commits.map(function(obj){
				const c = obj.commit;
				c.message || console.error(c);
			return `<li class="commit" id="${escapeHTML(obj.oid)}">
<p>${escapeHTML(c.message)}</p>
<div>${escapeHTML(c.author.name)} on <date>${new Date(c.author.timestamp*1000).toISOString()}</date></div>
</li>`;
		}).join('\n')}</ol>
		</main>
	</body>
</html>
`;
		out.end(body);
	}).catch(function(err){
		out.destroy(err);
	});
	return out.readableSide;
}
RouteGitLog.prototype.listing = function listing(){
	return Promise.all([ this.prepare(this.uriTemplate) ]);
};
