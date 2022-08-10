
// Presentation view step 1/4
// This file does one thing very simply:
// It adds a Link: header pointing to the form/place you can edit the file

const inherits = require('util').inherits;
const TransformRoute = require('dive-httpd').TransformRoute;
const httpLink = require('http-link');
const assert = require('assert');

module.exports.RouteAddLinks = RouteAddLinks;
inherits(RouteAddLinks, TransformRoute);
function RouteAddLinks(opts){
	if(!(this instanceof RouteAddLinks)) return new RouteAddLinks(opts);
	this.opts = opts;
	this.fileroot = opts.fileroot;
	assert(this.fileroot);
	TransformRoute.call(this, opts);
	if(!this.opts) throw new Error('no opts');
}
RouteAddLinks.prototype.name = 'RouteAddLinks';
RouteAddLinks.prototype.render_transform = async function render_transform(resource, req, input, res){
	const docroot = 'file://fullstack.wiki'+this.fileroot;
	if(!this.opts){
		throw new Error('no opts');
	}
	const template = this.opts;
	await input.headersReady;
	// Cast the Link headers to an array
	const linkHeaders = (typeof input.headers['link']==='string') ? [input.headers['link']] : (input.headers['link'] || []);
	input.pipeMessage(res);
	linkHeaders.forEach(function(line){
		httpLink.parse(line).forEach(function(link){
			if(link.rel==='tag:fullstack.wiki,2018:ns/source'){
				res.addHeader('Link', httpLink.stringify([
					{
						rel: 'edit-form',
						href: link.href.replace(docroot, template['edit-form']),
					},
					{
						rel: 'version-history',
						href: link.href.replace(docroot, template['version-history']),
					},
				]));
			}
		});
	});
	res.flushHeaders(); // Lock the headers from further modification
};
