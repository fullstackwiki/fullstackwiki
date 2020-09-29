"use strict";

const inherits = require('util').inherits;

const { Route, ResponsePassThrough } = require('dive-httpd');
const esc = require('./html-escape').escapeHTML;

inherits(RouteSitemapXML, Route);
module.exports.RouteSitemapXML = RouteSitemapXML;
function RouteSitemapXML(uriTemplate, innerRoute, options){
	if(!(this instanceof RouteSitemapXML)) return new RouteSitemapXML(options);
	if(options && typeof options!=='object') throw new Error('Expected object `options`');
	this.uriTemplate = uriTemplate;
	this.innerRoute = innerRoute;
	this.options = options;

	Route.call(this);
}
RouteSitemapXML.prototype.name = 'RouteSitemapXML';
RouteSitemapXML.prototype.contentType = 'application/xml';
RouteSitemapXML.prototype.prepare_match = async function prepare_match(uri){
	return true;
};
RouteSitemapXML.prototype.listing = function listing(){
	// This route identifies exactly one resource with no arguments
	return Promise.all([ this.prepare(this.uriTemplate) ]);
};
RouteSitemapXML.prototype.render = function render(){
	// this.target might have a URI Template expression. Substutite route.variables into this.
	var route = this;
	var out = new ResponsePassThrough;
	out.setHeader('Content-Type', this.contentType);
	route.innerRoute.listing().then(function(dataset){
		dataset.sort();
		out.write('<?xml version="1.0" encoding="UTF-8"?>\n');
		out.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
		dataset.forEach(function(item){
			var uri = item.uri.replace(/^http:/, 'https:');
			// if(typeof item!=='string') return void console.log(item);
			if(!uri) return;
			out.write('\t<url>');
			out.write('<loc>'+esc(uri)+'</loc>');
			// out.write('<lastmod>2005-01-01</lastmod>');
			// out.write('<changefreq>monthly</changefreq>');
			// out.write('<priority>0.5</priority>');
			out.write('</url>\n');
		});
		out.write('</urlset>\n');
		out.end();
	});
	return out;
};

