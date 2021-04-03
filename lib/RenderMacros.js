"use strict";

// Presentation view step 2/4
// Expands custom elements into HTML structures

const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
const hjs = require('highlight.js');
const stripIndent = require('strip-indent');
const assert = require('assert');
const { TransformRoute, ResponseMessage } = require('dive-httpd');

var escapeHTML = require('./html-escape.js').escapeHTML;

module.exports.RouteApplyMacros = RouteApplyMacros;
inherits(RouteApplyMacros, TransformRoute);
function RouteApplyMacros(uriTemplate, innerRoute){
	this.uriTemplate = uriTemplate;
	this.innerRoute = innerRoute;
	this.innerRouteTemplate = innerRoute.uriTemplate;
	TransformRoute.call(this);
}

RouteApplyMacros.prototype.contentType = 'application/x.wiki.fullstack.template+xml';

RouteApplyMacros.prototype.render_transform = async function render_transform(resource, req, input, res){
	const message = await ResponseMessage.fromStream(input);
	assert(typeof message.body === 'string');
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
				'application/link-format': '',
				'abnf': 'abnf',
				'ebnf': 'ebnf',
				'': '',
			})[hjsMediaType];
			if(hjsLanguage===undefined) throw new Error('Unknown media type '+JSON.stringify(hjsMediaType)+' at tag '+doc.localName);
			const textContent = doc.getAttribute('w:space')=='indent' ? stripIndent(doc.textContent).trim() : doc.textContent ;
			const hjsHTML = hjsLanguage ? hjs.highlight(textContent, {language: hjsLanguage}).value : escapeHTML(textContent);
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

	const document = new DOMParser().parseFromString(message.body); // xsltString: string of xslt file contents
	if(!document.documentElement){
		throw new Error('!document.documentElement '+resource.uri);
	}
	input.pipeHeaders(res);
	assert(resource.route.contentType);
	res.setHeader('Content-Type', resource.route.contentType);
	const body = applyTemplate(document.documentElement);
	res.end(body);
	// console.log(2, res._headersList.flat());
};
