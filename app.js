"use strict";
var fs = require('fs');

const {
	Application,
	RouteStaticFile,
	RouteLocalReference,
	RoutePipeline,
	First,
	Negotiate,
	RoutePermanentRedirect,
} = require('dive-httpd');

var RouteApplyMarkdown = require( "./lib/Markdown.js" ).RouteApplyMarkdown;
var RouteApplyMacros = require( "./lib/RenderMacros.js" ).RouteApplyMacros;
var RouteApplyBindings = require( "./lib/RenderBindings.js" ).RouteApplyBindings;
var RouteApplyTheme = require( "./lib/RenderTheme.js" ).RouteApplyTheme;
var RenderEditLink = require( "./lib/RenderEditLink.js" ).RenderEditLink;
var RouteGitLog = require( "./lib/RouteGitLog.js" ).RouteGitLog;
var RouteLunrIndex = require( "./lib/RouteLunrIndex.js" ).RouteLunrIndex;
var RouteTTL = require( "./lib/RouteTTL.js" ).RouteTTL;
var RouteNT = require( "./lib/RouteNT.js" ).RouteNT;
var RouteNQ = require( "./lib/RouteNQ.js" ).RouteNQ;
var RouteSitemapXML = require( "./lib/RouteSitemapXML.js" ).RouteSitemapXML;
var IndexRDFa = require( "./lib/IndexRDFa.js" ).IndexRDFa;

const docroot = __dirname + '/htdocs';

var options = new Application;
options.fixedScheme = 'http';
options.fixedAuthority = 'fullstack.wiki';

var indexRDFa = new IndexRDFa(options);

// Define a function that will resolve a Resource that generates the 404 Not Found error page
// This is set in `defaultNotFound` for static file generators, but this will mostly be called from
// the `error` handler of the <http://fullstack.wiki{/path*}> route.
function prepareNotFound(){
	return routeBest.prepare('http://fullstack.wiki/error.notfound');
}
options.defaultNotFound = prepareNotFound;

function gRenderEditLink(res){
	return new RenderEditLink(__dirname, {
		'edit-form': 'https://github.com/fullstackwiki/fullstackwiki/blob/master',
		'version-history': 'https://github.com/fullstackwiki/fullstackwiki/commits/master',
	});
}

const HTMLSource = RoutePipeline(RouteStaticFile({
	uriTemplate: 'http://fullstack.wiki{/path*}.xml',
	contentType: 'application/xml',
	fileroot: docroot,
	pathTemplate: "{/path*}.xml",
	filepathLink: true,
	filepathAuthority: 'fullstack.wiki',
	filepathRel: 'tag:fullstack.wiki,2018:ns/source',
}), gRenderEditLink);
HTMLSource.name = 'RenderEditLink';
options.addRoute(HTMLSource);

const MarkdownSource = RoutePipeline(RouteStaticFile({
	uriTemplate: 'http://fullstack.wiki{/path*}.md',
	contentType: 'text/markdown',
	fileroot: docroot,
	pathTemplate: "{/path*}.md",
	filepathLink: true,
	filepathAuthority: 'fullstack.wiki',
	filepathRel: 'tag:fullstack.wiki,2018:ns/source',
}), gRenderEditLink);
MarkdownSource.name = 'RenderEditLink';
options.addRoute(MarkdownSource);

// Source code
var routeSourceHTML = First('http://fullstack.wiki{/path*}.src.xml', [
	HTMLSource,
	new RouteApplyMarkdown('http://fullstack.wiki{/path*}.src.xml', MarkdownSource),
]);
options.addRoute(routeSourceHTML);

// Rendering happens in three stages:
// 1. Macro substitution: substitute in manipulations that will make it into the RDF index
// 2. Bindings: use the RDF index to fill out data bindings for fulltext index
// 3. Theme: generate themed page for Web browsers

// Macros applied, waiting for RDFa Templates to be applied
var routeTemplate = new RouteApplyMacros('http://fullstack.wiki{/path*}.tpl.xml', routeSourceHTML);
options.addRoute(routeTemplate);

// Rendered HTML but plain (no) theme
var routePlain = new RouteApplyBindings('http://fullstack.wiki{/path*}.plain.xml', indexRDFa.graph, routeTemplate);
options.addRoute(routePlain);

// Fully rendered theme
// Later, put this on <http://fullstack.wiki{/path*}.xhtml> and
// make <http://fullstack.wiki{/path*}> a Content-Type negotiation version
var routeThemed = new RouteApplyTheme('http://fullstack.wiki{/path*}.xhtml', indexRDFa.graph, routePlain);
options.addRoute(routeThemed);

var routeBest = Negotiate('http://fullstack.wiki{/path*}', [
	routeThemed,
	routePlain,
	routeTemplate,
	routeSourceHTML,
]);
routeBest.error = prepareNotFound;
options.addRoute(routeBest);

// Alias / to /index.xml
var routeIndex = RouteLocalReference("http://fullstack.wiki{/path*}/", routeBest, "http://fullstack.wiki{/path*}/index");
options.addRoute(routeIndex);

// The Recent Changes page, which is a Git log
var routeRecent = new RouteApplyTheme('http://fullstack.wiki/recent', indexRDFa.graph, RouteGitLog({
	uriTemplate: 'http://fullstack.wiki/recent',
	title: 'Recent Changes',
	fs: fs,
	dir: __dirname,
	ref: 'HEAD',
}));
options.addRoute(routeRecent);

// Codemirror dependencies
// routes.addTemplate('http://fullstack.wiki/style/codemirror{/path*}.css', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.css", 'text/css') );
// routes.addTemplate('http://fullstack.wiki/style/codemirror{/path*}.js', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.js", 'application/ecmascript') );
// routes.addTemplate('http://fullstack.wiki/style/highlight.js/{path}.css', {}, RouteStaticFile(__dirname+'/node_modules/highlight.js/styles/', "/{path}.css", 'text/css') );

// Render files
// routes.addTemplate('http://fullstack.wiki/style/app.js', {}, RouteBrowserify(docroot+'/style/main.js', "App", 'application/ecmascript') );

var routeScript = RouteStaticFile({
	uriTemplate: 'http://fullstack.wiki/style{/path*}.js',
	fileroot: docroot+'/style',
	pathTemplate: "{/path*}.js",
	contentType: 'application/ecmascript',
});
options.addRoute(routeScript);

var routeStyle = RouteStaticFile({
	uriTemplate: 'http://fullstack.wiki/style{/path*}.css',
	fileroot: docroot+'/style',
	pathTemplate: "{/path*}.css",
	contentType: 'text/css',
});
options.addRoute(routeStyle);

var routeLunrIndex = RouteLunrIndex({
	uriTemplate: 'http://fullstack.wiki/search-index.js',
	exportName: 'searchIndex',
	route: routeBest,
	// app: options,
});
options.addRoute(routeLunrIndex);

var RouteGraphTTL = RouteTTL({
	uriTemplate: 'http://fullstack.wiki/graph.ttl',
	index: indexRDFa,
});
options.addRoute(RouteGraphTTL);

var routeGraphNT = RouteNT({
	uriTemplate: 'http://fullstack.wiki/graph.nt',
	index: indexRDFa,
});
options.addRoute(routeGraphNT);

var routeGraphNT = RouteNQ({
	uriTemplate: 'http://fullstack.wiki/graph.nq',
	index: indexRDFa,
});
options.addRoute(routeGraphNT);

options.addRoute(new RouteSitemapXML('http://fullstack.wiki/sitemap.xml', routeBest));

options.before(function(){
	return indexRDFa.import(routeBest);
});

module.exports = options;
