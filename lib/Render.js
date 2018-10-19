
const fs = require('fs');
const inherits = require('util').inherits;

const hjs = require('highlight.js');
const DOMParser = require('xmldom').DOMParser;
var rdfa = require('rdfa');

const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;

module.exports.Render = Render;

inherits(Render, ServerResponseTransform);
function Render(){
	if(!(this instanceof Render)) return new Render();
	ServerResponseTransform.call(this);
	this.sourceContents = '';
};
Render.prototype.name = 'Render';
Render.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
	return headers;
};
Render.prototype._transform = function _transform(data, encoding, callback){
	this.sourceContents += data.toString();
	callback(null);
};
Render.prototype._flush = function (callback){
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
		if(doc.localName=='h' || doc.localName=='h1' || doc.localName=='h2' || doc.localName=='h3' || doc.localName=='h4' || doc.localName=='h5' || doc.localName=='h6'){
			// Keep an index of the headings, for a Table of Contents later on
			tocSections.push({
				level: parseInt(doc.localName[1]),
				labelHTML: mapChildren(doc, applyTemplate).join(''),
			});
			return '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</'+doc.localName+'>';
		}
		if(doc.localName=='main'){
			return mapChildren(doc, applyTemplate).join('');
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
		if(doc.localName=='pre' && doc.hasAttribute('type')){
			const hjsMediaType = doc.getAttribute('type');
			const hjsLanguage = ({
				'application/json': 'json',
				'application/schema+json': 'json',
				'application/ecmascript': 'javascript',
				'application/xhtml+xml': 'html',
				'text/css': 'css',
			})[hjsMediaType];
			if(!hjsLanguage) throw new Error('Unknown media type '+JSON.stringify(hjsMediaType)+' at tag '+doc.localName);
			const hjsHTML = hjs.highlight(hjsLanguage, doc.textContent).value;
			return '<pre'+mapAttributes(doc, function(attr){
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
	const editLink = '.edit';
	const eTitle = xml.getElementsByTagName('title')[0].textContent;
	const eMain = xml.getElementsByTagName('main')[0];
//	try {
//		var baseURI = filepath.replace(/^web\//, 'http://fullstack.wiki/');
//		var result = rdfa.RDFaXHTMLParser.parse(baseURI, document);
//		console.log(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
//	}catch(err){
//		console.error(err.stack);
//	}

	const tocSections = [];
	const mainHTML = applyTemplate(eMain);
	const tocHTML = tocSections.concat([{level:0}]).reduce(function(state, item){
		var html = state.html;
		for(var i=state.level; i<item.level; i++) html += '<ol>';
		for(var i=state.level; i>item.level; i--) html += '</ol>';
		if(item.labelHTML) html += '<li>'+item.labelHTML+'</li>';
		return {html:html, level:item.level};
	}, {html:'', level:0}).html;
	const links = [
		(function(){
			var e = xml.createElement('link');
			e.setAttribute('rel', 'stylesheet');
			e.setAttribute('href', '/style/default.css');
			return e;
		})()
	].concat([].slice.call(xml.getElementsByTagName('link'))).join('\n\t\t');
	self.push(`
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" version="XHTML+RDFa 1.0" dir="ltr">
	<head profile="http://www.w3.org/1999/xhtml/vocab">
		<meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
		<!--<xsl:apply-templates select="//html:meta[@name]" />-->
		<!--<base><xsl:attribute name="href"><xsl:value-of select="$root" /></xsl:attribute></base>-->
		${links}
		<title>${eTitle.toString()} | Fullstack.wiki</title>
		<!-- the search runner will use this id= to get the src attribute -->
		<script id="search-runner-script" type="application/ecmascript" src="/style/search-runner.js"></script>
	</head>
	<body class="pagewidth">
		<div id="skip-link">
			<a href="#main-content">Skip to main content</a>
		</div>
		<header>
			<ul>
				<li><h1><a href="/">Fullstack.wiki</a></h1></li>
				<li><a href="/recent">Recent changes</a></li>
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
			<div class="toc">${tocHTML}</div>
			<div id="edit"><a href="${editLink}">Edit</a></div>
			<!--<xsl:apply-templates select="//html:main/*"/>-->
			${mainHTML}
		</main>
	</body>
</html>
`);
	callback();
};
Render.withTemplate = function(templateFile){
	var templateContents = '';
	if(templateFile){
		fs.readFile(templateFile, function(err, s){ templateContents = s.toString(); });
	}
	return function(){
		return new Render(templateContents);
	}
}
