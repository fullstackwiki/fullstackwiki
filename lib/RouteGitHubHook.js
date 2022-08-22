
"use strict";

const child_process = require('child_process');
const { inherits } = require('util');

const { Route, Resource, ResponsePassThrough } = require('dive-httpd');

inherits(RouteGitHubHook, Route);
module.exports.RouteGitHubHook = RouteGitHubHook;
function RouteGitHubHook(options){
	if(!(this instanceof RouteGitHubHook)) return new RouteGitHubHook(options);
	if(typeof options!=='object') throw new Error('Expected object `options`');
	this.UPDATE_BRANCH_SCRIPT = options.UPDATE_BRANCH_SCRIPT;
	this.uriTemplate = options.uriTemplate;
	Route.call(this);
}
RouteGitHubHook.prototype.name = 'RouteGitLog';
RouteGitHubHook.prototype.methods = ['GET', 'HEAD', 'POST'];
RouteGitHubHook.prototype.contentType = 'text/plain';
RouteGitHubHook.prototype.prepare_match = async function prepare_match(uri){
	return true;
};
RouteGitHubHook.prototype.render = function render(resource){
	// this.target might have a URI Template expression. Substitute route.variables into this.
	var options = this.options;
	var out = new ResponsePassThrough;
	out.setHeader('Content-Type', resource.contentType);
	out.end('GET\r\n');
	return out.readableSide;
};
RouteGitHubHook.prototype.listing = function listing(){
	return Promise.all([ this.prepare(this.uriTemplate) ]);
};

RouteGitHubHook.prototype.post = function post(resource, req){
	const out = new ResponsePassThrough;
	const { UPDATE_BRANCH_SCRIPT } = this;

	(async function(){
		var data = '';
		for await (const chunk of req.stream) {
			data += chunk;
		}
		try{
			var event = JSON.parse(data);
		}catch(err){
			out.destroy(err);
			return;
		}
		// console.log(data);
		// console.log(event);

		if(event.ref !== 'refs/heads/master'){
			// throw new Error('Event not for master branch');
			out.setHeader('Content-Type', 'text/plain');
			out.end("Ignoring event not for master branch\r\n");
			return;
		}
		if(!event.repository){
			throw new Error('Event has no repository property');
		}
		if(!event.head_commit){
			throw new Error('Event has no head_commit property');
		}
		const commitId = event.head_commit.id;

		out.setHeader('Content-Type', 'text/plain');
		const task = child_process.spawn(UPDATE_BRANCH_SCRIPT, [commitId]);
		task.stdout.pipe(process.stdout);
		task.stdout.pipe(out);
	})();

	return out.readableSide;
};
