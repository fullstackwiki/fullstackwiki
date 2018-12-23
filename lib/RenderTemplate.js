
const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
var escapeHTML = require('./html-escape.js').escapeHTML;
const hjs = require('highlight.js');
const stripIndent = require('strip-indent');

const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;

module.exports.RenderTemplate = RenderTemplate;

inherits(RenderTemplate, ServerResponseTransform);
function RenderTemplate(){
	if(!(this instanceof RenderTemplate)) return new RenderTemplate();
	ServerResponseTransform.call(this);
	this.sourceContents = '';
};
RenderTemplate.prototype.name = 'RenderTemplate';
RenderTemplate.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
	return headers;
};
RenderTemplate.prototype._transform = function _transform(data, encoding, callback){
	this.sourceContents += data.toString();
	callback(null);
};
RenderTemplate.prototype._flush = function (callback){
	const xml = new DOMParser().parseFromString(this.sourceContents); // xsltString: string of xslt file contents
	const self = this;
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
			return mapChildren(doc, applyTemplate).join('');
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
	const documentHTML = applyTemplate(xml.documentElement);
	callback(null, documentHTML);
};
