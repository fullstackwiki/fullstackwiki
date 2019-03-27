
// Presentation view step 4/4
// Renders final page layout with menus, and other last-minute changes

const inherits = require('util').inherits;

const DOMParser = require('xmldom').DOMParser;
var escapeHTML = require('./html-escape.js').escapeHTML;
const httpLink = require('http-link');

const ServerResponseTransform = require('dive-httpd').ServerResponseTransform;

module.exports.RenderTheme = RenderTheme;

function createElement(document, name, attr, children){
	var e = document.createElement(name);
	if(typeof attr=='object') for(var k in attr){
		e.setAttribute(k, attr[k]);
	}
	if(Array.isArray(children)) children.forEach(function(f){
		e.appendChild(f);
	});
	return e;
}

// TODO maybe find a more comprehensive function for this
function toIRIReference(base, target){
	// Test if the schemes match. If not, return the full IRI
	var baseScheme = base.match(/^[A-Za-z][A-Za-z0-9+.-]*:/);
	if(!baseScheme) throw new Error('Invalid IRI scheme for base');
	var targetScheme = target.match(/^[A-Za-z][A-Za-z0-9+.-]*:/);
	if(!targetScheme) throw new Error('Invalid IRI scheme for target');
	baseScheme = baseScheme[0];
	targetScheme = targetScheme[0];
	if(baseScheme.toLowerCase() !== targetScheme.toLowerCase()){
		// scheme is not the same, return `IRI`
		return target;
	}
	var authorityStart = targetScheme.length;
	if(base[authorityStart+0]=='/' && base[authorityStart+1]=='/' && target[authorityStart+0]=='/' && target[authorityStart+1]=='/'){
		var authorityEnd = base.indexOf('/', authorityStart+2);
		if(authorityEnd<0) authorityEnd = base.length;
		// +1 for the length of the `/` character
		if(base.substring(0, authorityEnd+1) !== target.substring(0, authorityEnd+1)){
			// authority is not the same, return double-slash relative part
			return target.substring(authorityStart);
		}
	}else{
		// TODO
		return target;
	}
	return target.substring(authorityEnd);
}



inherits(RenderTheme, ServerResponseTransform);
function RenderTheme(graph, resource){
	if(!(this instanceof RenderTheme)) return new RenderTheme();
	if(!graph) throw new Error('Expected graph');
	if(!resource) throw new Error('Expected resource');
	ServerResponseTransform.call(this);
	this.graph = graph;
	this.resource = resource;
	this.sourceContents = '';
};
RenderTheme.prototype.name = 'RenderTheme';
RenderTheme.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
	return headers;
};
RenderTheme.prototype._transform = function _transform(data, encoding, callback){
	this.sourceContents += data.toString();
	callback(null);
};
RenderTheme.prototype._flush = function (callback){
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
				level: Number.parseInt(doc.localName[1]),
				labelHTML: mapChildren(doc, applyTemplate).join(''),
				id: doc.hasAttribute('id') && doc.getAttribute('id'),
				element: doc,
			});
			return '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</'+doc.localName+'>';
		}
		if(doc.localName=='main'){
			return ''
				+ '<div id="main-col">'
				+ '<nav id="edit"><ul>'
				//+ '<li><a href="index.discussion">Discussion</a></li>'
				+ editLinkHTML
				+ historyLinkHTML
				+ '</ul></nav>'
				+ '<main'+mapAttributes(doc, applyTemplate).join('')+'>'
				+ mapChildren(doc, applyTemplate).join('')
				+ '</main>'
				+ '</div>';
			// return mapChildren(doc, applyTemplate).join('');
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
		// Else, serialize the element
		if(doc.childNodes.length){
			return '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'>' + mapChildren(doc, applyTemplate).join('') + '</'+doc.localName+'>';
		}else{
			return '<'+doc.localName+mapAttributes(doc, applyTemplate).join('')+'/>';
		}
	}
	function getLinkHTML(rel, textHTML){
		var linkHeaders = self.getHeader('Link') || [];
		var linkHTML = '';
		if(typeof linkHeaders=='string') linkHeaders = [linkHeaders];
		linkHeaders.forEach(function(line){
			httpLink.parse(line).forEach(function(link){
				if(link.rel===rel){
					linkHTML = '<li><a rel="'+escapeHTML(link.rel)+'" href="'+escapeHTML(link.href)+'">'+textHTML+'</a></li>';
				}
			});
		});
		return linkHTML;
	}
	const historyLinkHTML = getLinkHTML('version-history', 'History');
	const editLinkHTML = getLinkHTML('edit-form', 'Edit');
	const eTitle = xml.getElementsByTagName('title')[0].textContent;
	const eMain = xml.getElementsByTagName('main')[0] || xml.getElementsByTagName('body')[0];
	const euri = self.resource.uri;
//	try {
//		var baseURI = filepath.replace(/^web\//, 'http://fullstack.wiki/');
//		var result = rdfa.RDFaXHTMLParser.parse(baseURI, document);
//		console.log(result.outputGraph.toArray().map(function(t){ return t.toString()+'\n'; }).join(''));
//	}catch(err){
//		console.error(err.stack);
//	}
	// 	});
	// 	return map;
	// })();
	var upLink = self.graph.match(euri, 'http://www.w3.org/1999/xhtml/vocab#up', null).toArray()[0];
	const tocSections = [];
	const mainHTML = applyTemplate(eMain);
	const upHTML = (function(){
		var tree = {};
		var steps = [];
		var first = upLink && upLink.object;
		while(first){
			var label = self.graph.match(first, 'http://purl.org/dc/terms/title', null).toArray()[0];
			steps.unshift({href: first.toString(), label:label?label.object.toString():first.toString()});
			var up = self.graph.match(first, 'http://www.w3.org/1999/xhtml/vocab#up', null).toArray()[0];
			if(!up) break;
			if(tree[up.object]) break;
			tree[up.object] = up;
			first = up.object;
		}
		if(steps.length){
			return ''+steps.map(function(li){
				return '<ol><li><a href="'+escapeHTML(toIRIReference(euri, li.href))+'">'+escapeHTML(li.label)+'</a></li></ol><hr/>'
			}).join('')+'';
		}else{
			return '';
		}
	})();
	const tocHTML = tocSections.concat([{level:0}]).reduce(function(state, item){
		var html = state.html;
		for(var i=state.level; i<item.level; i++) html += '<ol>';
		for(var i=state.level; i>item.level; i--) html += '</ol>';
		if(item.labelHTML) html += '<li>'+(item.id ? '<a href="#'+escapeHTML(item.id)+'">'+item.labelHTML+'</a>' : item.labelHTML)+'</li>';
		return {html:html, level:item.level};
	}, {html:'', level:0}).html;
	const langText = xml.documentElement.getAttribute('xml:lang') || xml.documentElement.getAttribute('lang');
	const langHTML = langText ? escapeHTML(langText) : '';
	// List the default stylesheet first to indicate it's the most important
	const links = [
		createElement(xml, 'link', {rel:'stylesheet', href:'/style/default.css'}),
	].concat([].slice.call(xml.getElementsByTagName('link'))).join('\n\t\t');
	// Ensure the charset meta is first because HTML will be HTML
	const metas = [
		createElement(xml, 'meta', {'charset':'UTF-8'}),
		createElement(xml, 'meta', {'http-equiv':'Content-Type', 'content':'application/xhtml+xml;charset=utf-8'}),
		createElement(xml, 'meta', {'name':'viewport', 'value':'width=device-width, initial-scale=1, maximum-scale=1'}),
	].concat([].slice.call(xml.getElementsByTagName('meta')))
		.filter(function(e){ return e.getAttribute('charset')!=='UTF-8' }).join('\n\t\t');
	if(langText) self.setHeader('Content-Language', langText);
	self.push(`<!-- -->
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${langHTML}" lang="${langHTML}" version="XHTML+RDFa 1.0" dir="ltr" xmlns:w="tag:fullstack.wiki,2018:ns/" xmlns:xht="http://www.w3.org/1999/xhtml/vocab#">
	<head profile="http://www.w3.org/1999/xhtml/vocab">
		${metas}
		<title>${eTitle.toString()} | Fullstack.wiki</title>
		${links}
		<!-- the search runner will use this id= to get the src attribute -->
		<script id="search-runner-script" type="application/ecmascript" src="/style/search-runner.js"></script>
	</head>
	<body class="pagewidth">
		<div class="site-header">
			<div id="skip-link">
				<a href="#main-content">Skip to main content</a>
			</div>
			<header>
				<ul>
					<li><h1><a href="/">Fullstack.wiki</a></h1></li>
					<li><a href="/recent">Recent changes</a></li>
					<li><a href="/about/index">About</a></li>
				</ul>
				<form id="searchform" action="/index.xhtml">
					<input type="search" name="q" id="search" placeholder="Search..." title="Search [ctrl-option-f]" accesskey="f" />
				</form>
				<div id="search-results">
					<div class="search-results-header">Search Results</div>
					<table><tbody id="search-results-list"></tbody></table>
				</div>
			</header>
		</div>
		<div class="columns">
			<div class="toc">${upHTML}${tocHTML}</div>
			${mainHTML}
		</div>
	</body>
</html>
`);
	callback();
};
