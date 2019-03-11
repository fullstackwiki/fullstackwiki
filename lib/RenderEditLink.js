
// Presentation view step 1/4
// This file does one thing very simply:
// It adds a Link: header pointing to the form/place you can edit the file

const inherits = require('util').inherits;
const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;
const httpLink = require('http-link');

module.exports.RenderEditLink = RenderEditLink;
inherits(RenderEditLink, ServerResponseTransform);
function RenderEditLink(docroot, template){
	if(!(this instanceof RenderEditLink)) return new RenderEditLink();
	if(typeof template!=='object') throw new Error('Expected `template` to be an object');
	this.docroot = docroot;
	this.template = template;
	ServerResponseTransform.call(this);
};
RenderEditLink.prototype.name = 'RenderEditLink';
RenderEditLink.prototype._transformHead = function _transformHead(headers){
	var docroot = 'file://fullstack.wiki'+this.docroot;
	var template = this.template;
	var linkHeaders = headers.getHeader('Link') || [];
	if(typeof linkHeaders=='string') linkHeaders = [linkHeaders];
	linkHeaders.slice().forEach(function(line){
		httpLink.parse(line).forEach(function(link){
			if(link.rel==='tag:fullstack.wiki,2018:ns/source'){
				linkHeaders.push(httpLink.stringify([
					{
						rel: 'edit-form',
						href: link.href.replace(docroot, template['edit-form']),
					},
					{
						rel: 'version-history',
						href: link.href.replace(docroot, template['version-history']),
					}
				]));
			}
		});
	});
	headers.setHeader('Link', linkHeaders);
	return headers;
};
RenderEditLink.prototype._transform = function _transform(data, encoding, callback){
	callback(null, data);
};
RenderEditLink.prototype._flush = function (callback){
	callback(null);
};
