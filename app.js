
var fs = require('fs');

const {
	HTTPServer,
	RouteStaticFile,
	RouteError,
	RouteNotFound,
	RouteLocalReference,
	RoutePipeline,
	First,
	Negotiate,
} = require('dive-httpd');

var Markdown = require( "./lib/Markdown.js" ).Markdown;
var RenderTemplate = require( "./lib/RenderTemplate.js" ).RenderTemplate;
var RenderBindings = require( "./lib/RenderBindings.js" ).RenderBindings;
var RenderTheme = require( "./lib/RenderTheme.js" ).RenderTheme;
var RenderEditLink = require( "./lib/RenderEditLink.js" ).RenderEditLink;
var RouteGitLog = require( "./lib/RouteGitLog.js" ).RouteGitLog;
var RouteLunrIndex = require( "./lib/RouteLunrIndex.js" ).RouteLunrIndex;
var RouteTTL = require( "./lib/RouteTTL.js" ).RouteTTL;
var RouteNT = require( "./lib/RouteNT.js" ).RouteNT;
var RouteNQ = require( "./lib/RouteNQ.js" ).RouteNQ;
var IndexRDFa = require( "./lib/IndexRDFa.js" ).IndexRDFa;

const docroot = __dirname + '/web';

var options = new HTTPServer;
options.fixedScheme = 'http';
options.fixedAuthority = 'fullstack.wiki';
options.RouteNotFound = RouteNotFound;
options.RouteError = RouteError;
var routes = options.routes;

// Alias / to /index.xml
var routeIndex = RouteLocalReference(routes, "http://fullstack.wiki{/path*}/index");
routeIndex.uriTemplate = 'http://fullstack.wiki{/path*}/';
options.addRoute(routeIndex);

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
	RoutePipeline(MarkdownSource, Markdown),
]);
options.addRoute(routeSourceHTML);

// Rendering happens in three stages:
// 1. Template: substitute in template calls and other manipulations that will make it into the RDF index
// 2. Bindings: use the RDF index to fill out data bindings for fulltext index
// 3. Theme: generate themed page for Web browsers

// // Rendered HTML but plain (no) theme
var routeTemplate = RoutePipeline({
	uriTemplate: 'http://fullstack.wiki{/path*}.tpl.xml',
	contentType: 'application/x.wiki.fullstack.template+xml',
	outboundTransform: RenderTemplate,
	innerRoute: routeSourceHTML,
});
options.addRoute(routeTemplate);

// Rendered HTML but plain (no) theme
function gRenderBindings(res){
	return new RenderBindings(indexRDFa.graph, res);
}
var routePlain = RoutePipeline({
	uriTemplate: 'http://fullstack.wiki{/path*}.plain.xml',
	contentType: 'application/x.wiki.fullstack.plain+xml',
	outboundTransform: gRenderBindings,
	innerRoute: routeTemplate,
});
options.addRoute(routePlain);

// Fully rendered theme
// Later, put this on <http://fullstack.wiki{/path*}.xhtml> and
// make <http://fullstack.wiki{/path*}> a Content-Type negotiation version
function gRenderTheme(res){
	return new RenderTheme(indexRDFa.graph, res);
}
var routeThemed = RoutePipeline({
	uriTemplate: 'http://fullstack.wiki{/path*}.xhtml',
	contentType: 'application/xhtml+xml',
	outboundTransform: gRenderTheme,
	innerRoute: routePlain,
});
options.addRoute(routeThemed);

var routeBest = Negotiate('http://fullstack.wiki{/path*}', [
	routeThemed,
	routePlain,
	routeTemplate,
	routeSourceHTML,
]);
options.addRoute(routeBest);

// The Recent Changes page, which is a Git log
var routeRecent = RoutePipeline(RouteGitLog({
	uriTemplate: 'http://fullstack.wiki/recent',
	title: 'Recent Changes',
	fs: fs,
	dir: __dirname,
	ref: 'HEAD',
}), [gRenderTheme]);
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

var documentRoutes = routes.routes.filter(function(v){
	return [
		'http://fullstack.wiki{/path*}',
	].indexOf(v.template)>=0;
});

var indexRDFa = new IndexRDFa(options);
documentRoutes.forEach(function(route){
	indexRDFa.import(route);
});

var routeLunrIndex = RouteLunrIndex({
	uriTemplate: 'http://fullstack.wiki/search-index.js',
	exportName: 'searchIndex',
	routes: documentRoutes,
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

module.exports = options;
