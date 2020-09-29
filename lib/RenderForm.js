"use strict";

const fs = require('fs');
const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;

const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;
const escapeHTML = require('./html-escape.js').escapeHTML;

module.exports.RenderForm = RenderForm;

inherits(RenderForm, ServerResponseTransform);
function RenderForm(){
	if(!(this instanceof RenderForm)) return new RenderForm();
	ServerResponseTransform.call(this);
	this.sourceContents = '';
}
RenderForm.prototype.name = 'RenderForm';
RenderForm.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
	return headers;
};
RenderForm.prototype._transform = function _transform(data, encoding, callback){
	this.sourceContents += data.toString();
	callback(null);
};
RenderForm.prototype._flush = function (callback){
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
	const editLink = '#edit';
	const eTitle = xml.getElementsByTagName('title')[0].textContent;
	const eMain = xml.getElementsByTagName('main')[0];
	self.push(`
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" version="XHTML+RDFa 1.0" dir="ltr">
	<head profile="http://www.w3.org/1999/xhtml/vocab">
		<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
		<!--<xsl:apply-templates select="//html:meta[@name]" />-->
		<!--<base><xsl:attribute name="href"><xsl:value-of select="$root" /></xsl:attribute></base>-->
		<link rel="stylesheet" href="/+/default.css" />
		<link rel="stylesheet" href="/+/codemirror/lib/codemirror.css" />
		<title>Editing: ${eTitle.toString()} | Fullstack.wiki</title>
		<!-- the search runner will use this id= to get the src attribute -->
		<script id="search-runner-script" type="application/ecmascript" src="/+/search-runner.js"></script>
		<script type="application/ecmascript" src="/+/editor.js"></script>
		<script type="application/ecmascript" src="/+/codemirror/lib/codemirror.js"></script>
		<script type="application/ecmascript" src="/+/codemirror/mode/xml/xml.js"></script>
		<script type="application/ecmascript" src="/+/codemirror/addon/hint/xml-hint.js"></script>
	</head>
	<body class="">
		<div id="skip-link">
			<a href="#main-content">Skip to main content</a>
		</div>
		<header>
			<ul>
				<li><h1><a href="/">Fullstack.wiki</a></h1></li>
				<li><a href="/protocols/index">Protocols</a></li>
				<li><a href="/media_types/index">Media Types</a></li>
				<li><a href="/vocabularies/index">Vocabularies</a></li>
				<li><a href="/tools/index">Tools</a></li>
				<li><a href="/about/index">About</a></li>
			</ul>
			<form id="searchform" action="/index.xhtml">
				<input type="search" name="q" id="search" placeholder="Search..." />
			</form>
			<div id="search-results">
				<div class="search-results-header">Search Results</div>
				<table><tbody id="search-results-list"></tbody></table>
			</div>
		</header>
		<main id="main-content">
			<h1>Edit <i>${eTitle.toString()}</i></h1>
			<textarea id="editor-textarea">${escapeHTML(this.sourceContents)}</textarea>
		</main>
	</body>
</html>
`);
	callback();
};
RenderForm.withTemplate = function(templateFile){
	var templateContents = '';
	if(templateFile){
		fs.readFile(templateFile, function(err, s){ templateContents = s.toString(); });
	}
	return function(){
		return new RenderForm(templateContents);
	};
};
