"use strict";

// Presentation view step 2/4
// Expands custom elements into HTML structures

const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
const hjs = require('highlight.js');
const stripIndent = require('strip-indent');
const StringResource = require('dive-httpd').StringResource;
const Route = require('dive-httpd').Route;
const MessageHeaders = require('dive-httpd').MessageHeaders;

var escapeHTML = require('./html-escape.js').escapeHTML;

function generateString(resource, upstreamResponse){
	const xml = new DOMParser().parseFromString(upstreamResponse.body); // xsltString: string of xslt file contents

	function mapChildren(node, fn){
		return Array.prototype.slice.call(node.childNodes).map(function(nn){
				return fn(nn);
		});
	}
	function mapAttributes(node, fn){
		return Array.prototype.slice.call(node.attributes).map(function(nn){
				return fn(nn);
		});
	}
	function applyTemplate(doc){
		// If node is not an element, return XML representation
		if(!doc.childNodes){
			return doc.toString();
		}
		if(doc.localName=='main'){
			return '<main'+mapAttributes(doc, applyTemplate).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</main>';
			// return mapChildren(doc, applyTemplate).join('');
		}
		if(doc.localName=='title'){
			return ''
				+ '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</'+doc.localName+'>'
				+ '\n<meta property="http://purl.org/dc/terms/title" content="'+escapeHTML(doc.textContent)+'"/>';
		}
		if(doc.localName=='a'){
			return '<a'+mapAttributes(doc, function(attr){
				if(attr.name=='href' && attr.value.match(/^[a-zA-Z+-]+:/)==null){
					attr = attr.cloneNode();
					//attr.value = attr.value.replace(/\/index\.(xml|xhtml|html|md)$/, '/').replace(/\.(xml|xhtml|html|md)$/, '');
					attr.value = attr.value.replace(/\.(xml|xhtml|html|md)$/, '');
				}
				return applyTemplate(attr);
			}).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</'+doc.localName+'>';
		}
		if(doc.localName=='link'){
			return '<link'+mapAttributes(doc, function(attr){
				if(attr.name=='href' && attr.value.match(/^[a-zA-Z+-]+:/)==null){
					attr = attr.cloneNode();
					//attr.value = attr.value.replace(/\/index\.(xml|xhtml|html|md)$/, '/').replace(/\.(xml|xhtml|html|md)$/, '');
					attr.value = attr.value.replace(/\.(xml|xhtml|html|md)$/, '');
				}
				return applyTemplate(attr);
			}).join('')+'/>';
		}
		if(doc.localName=='pre' && (doc.hasAttribute('type') || doc.hasAttribute('w:space'))){
			const hjsMediaType = doc.getAttribute('type') || '';
			const hjsLanguage = ({
				'application/json': 'json',
				'application/schema+json': 'json',
				'application/ecmascript': 'javascript',
				'application/xhtml+xml': 'html',
				'text/css': 'css',
				'message/http': 'http',
				'abnf': '',
				'': '',
			})[hjsMediaType];
			if(hjsLanguage===undefined) throw new Error('Unknown media type '+JSON.stringify(hjsMediaType)+' at tag '+doc.localName);
			const textContent = doc.getAttribute('w:space')=='indent' ? stripIndent(doc.textContent).trim() : doc.textContent ;
			const hjsHTML = hjsLanguage ? hjs.highlight(hjsLanguage, textContent).value : escapeHTML(textContent);
			return '<pre'+mapAttributes(doc, function(attr){
				if(attr.name=='w:space') return '';
				return applyTemplate(attr);
			}).join('')+'>' + hjsHTML + '</'+doc.localName+'>';
		}
		// Else, serialize the element
		if(doc.childNodes.length){
			return '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</'+doc.localName+'>';
		}else{
			return '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'/>';
		}
	}

	var res = new MessageHeaders;
	res.setHeader('Content-Type', resource.route.contentType);
	res.body = applyTemplate(xml.documentElement);
	return res;
};

module.exports.RouteApplyMacros = RouteApplyMacros;
inherits(RouteApplyMacros, Route);
function RouteApplyMacros(uriTemplate, innerRoute){
	this.uriTemplate = uriTemplate;
	this.innerRoute = innerRoute;
	this.innerRouteTemplate = innerRoute.uriTemplate;
}

RouteApplyMacros.prototype.contentType = 'application/x.wiki.fullstack.template+xml';

RouteApplyMacros.prototype.prepare = function prepare(uri){
	var route = this;
	var match = this.matchUri(uri);
	if(!match) return Promise.resolve();
	var innerMatch = match.rewrite(this.innerRouteTemplate);
	return this.innerRoute.prepare(innerMatch).then(function(resource){
		if(resource===undefined) return Promise.resolve();
		return new StringResource(route, {}, {uri:match.uri, match:match, innerResource:resource});
	});
}

RouteApplyMacros.prototype.renderString = function renderString(resource, req){
	return resource.innerResource.renderString(req).then(function(upstreamResponse){
		return generateString(resource, upstreamResponse);
	});
}

RouteApplyMacros.prototype.watch = function watch(cb){
	return this.innerRoute.watch(cb);
}

// List all the URIs accessible through this route
RouteApplyMacros.prototype.listing = function listing(){
	return this.innerRoute.listing();
}

RouteApplyMacros.prototype.listDependents = function listDependents(){
	return [this.innerRoute];
}
