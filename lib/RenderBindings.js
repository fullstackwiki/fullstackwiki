
const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
var rdfa = require('rdfa');
var parse = require('rdfa-template').parse;
var escapeHTML = require('./html-escape.js').escapeHTML;
var XMLSerializer = require('xmldom').XMLSerializer;

const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;

module.exports.RenderBindings = RenderBindings;

inherits(RenderBindings, ServerResponseTransform);
function RenderBindings(graph){
	if(!(this instanceof RenderBindings)) return new RenderBindings(graph);
	ServerResponseTransform.call(this);
	this.graph = graph;
	this.sourceContents = '';
};
RenderBindings.prototype.name = 'RenderBindings';
RenderBindings.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
	return headers;
};
RenderBindings.prototype._transform = function _transform(data, encoding, callback){
	this.sourceContents += data.toString();
	callback(null);
};
RenderBindings.prototype._flush = function (callback){
	const document = new DOMParser().parseFromString(this.sourceContents);
	const self = this;
	const eMain = document.documentElement;
	if(eMain.getAttribute('xmlns:q')==='http://fullstack.wiki/rdfq/'){
		var result = parse('http://fullstack.wiki/', document);
		callback(null, (new XMLSerializer).serializeToString(result.parser.generateDocument(document, self.graph)));
	}else{
		callback(null, this.sourceContents);
	}
};
