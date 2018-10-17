
const inherits = require('util').inherits;
const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;
var markdown = require( "markdown" ).markdown;

module.exports.Markdown = Markdown;

inherits(Markdown, ServerResponseTransform);
function Markdown(){
	if(!(this instanceof Markdown)) return new Markdown();
	ServerResponseTransform.call(this);
	this.sourceContents = '';
	this.push('<!DOCTYPE html>\n');
	this.push('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">\n');
	this.push('\t<head>\n');
	this.push('\t\t<meta charset="UTF-8" />\n');
	this.push('\t\t<title></title>\n');
	//this.push('\t\t<meta name="description" content="" />\n');
	this.push('\t\t<meta name="generator" content="https://github.com/evilstreak/markdown-js" />\n');
	this.push('\t</head>\n');
	this.push('\t<body>\n');
	this.push('\t\t<main id="main-content">\n');
};
Markdown.prototype.name = 'Markdown';
Markdown.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
};
Markdown.prototype._transform = function _transform(data, encoding, callback){
	this.sourceContents += data;
	callback(null);
};
Markdown.prototype._flush = function (callback){
	this.push(markdown.toHTML(this.sourceContents));
	this.push('\t\t</main>\n');
	this.push('\t</body>\n');
	this.push('</html>\n');
	callback();
};