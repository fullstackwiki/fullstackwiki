
var fs = require('fs');

const {
	HTTPServer,
	RouteStaticFile,
	RouteError,
	RouteNotFound,
	RouteLocalReference,
	RoutePipeline,
	First,
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
options.fixedAuthority = 'localhost';
options.RouteNotFound = RouteNotFound;
options.RouteError = RouteError;
var routes = options.routes;

// Alias / to /index.xml
var routeIndex = RouteLocalReference(routes, "http://localhost{/path*}/index");
routeIndex.routerURITemplate = 'http://localhost{/path*}/';
options.addRoute(routeIndex);

function gRenderEditLink(res){
	return new RenderEditLink(__dirname, {
		'edit-form': 'https://github.com/awwright/fullstackwiki/blob/master',
		'version-history': 'https://github.com/awwright/fullstackwiki/commits/master',
	});
}
const RouteStaticFileOpts = {
	filepathLink: true,
	filepathAuthority: 'fullstack.wiki',
	filepathRel: 'tag:fullstack.wiki,2018:ns/source',
};
const HTMLSource = RoutePipeline(RouteStaticFile(docroot, "{/path*}.xml", 'application/xml', RouteStaticFileOpts), gRenderEditLink);
HTMLSource.routerURITemplate = 'http://localhost{/path*}.xml';
const MarkdownSource = RoutePipeline(RouteStaticFile(docroot, "{/path*}.md", 'text/markdown', RouteStaticFileOpts), gRenderEditLink);
MarkdownSource.routerURITemplate = 'http://localhost{/path*}.md';

// Content-negotiated version
// routes.addTemplate('http://localhost{/path*}', {}, Conneg({
// 	'application/xhtml+xml;profile="tag:fullstack.wiki,2018:ns/profile/render"':
// 		RoutePipeline(RouteLocalReference(routes, "http:http://localhost{/path*}.src.xml"), [RenderTemplate, RenderBindings, RenderTheme] ),
// 	'application/xhtml+xml;profile="tag:fullstack.wiki,2018:ns/profile/render"':
// 		RoutePipeline(RouteLocalReference(routes, "http://localhost{/path*}.src.xml"), [Markdown, RenderTheme] ),
// 	// 'text/markdown':
// 	// 	RoutePipeline(RouteLocalReference(routes, "http://localhost{/path*}.src.xml"), [Markdown, RenderTheme] ),
// }) );

function gRenderBindings(res){
	return new RenderBindings(indexRDFa.graph, res);
}

function gRenderTheme(res){
	return new RenderTheme(indexRDFa.graph, res);
}

// Source code
var routeSourceHTML = First([
	HTMLSource,
	MarkdownSource,
]);
routeSourceHTML.routerURITemplate = 'http://localhost{/path*}.src.xml';
options.addRoute(routeSourceHTML);

// Rendering happens in three stages:
// 1. Template: substitute in template calls and other manipulations that will make it into the RDF index
// 2. Bindings: use the RDF index to fill out data bindings for fulltext index
// 3. Theme: generate themed page for Web browsers

// // Rendered HTML but plain (no) theme
var routeTemplate = First([
	RoutePipeline(HTMLSource, [RenderTemplate] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]);
routeTemplate.routerURITemplate = 'http://localhost{/path*}.tpl.xml';
options.addRoute(routeTemplate);

// Rendered HTML but plain (no) theme
var routePlain = First([
	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]);
routePlain.routerURITemplate = 'http://localhost{/path*}.plain.xml';
options.addRoute(routePlain);

// Fully rendered theme
// Later, put this on <http://localhost{/path*}.xhtml> and
// make <http://localhost{/path*}> a Content-Type negotiation version
routes.addTemplate('http://localhost{/path*}', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings, gRenderTheme] ),
	RoutePipeline(MarkdownSource, [Markdown, gRenderTheme] ),
]) );

// The Recent Changes page, which is a Git log
var routeRecent = RoutePipeline(RouteGitLog({title:'Recent Changes', fs:fs, dir:__dirname, ref:'HEAD'}), [gRenderTheme]);
routeRecent.routerURITemplate = 'http://localhost/recent';
options.addRoute(routeRecent);

// Render the source Markdown
routes.addTemplate('http://localhost{/path*}.md', {}, MarkdownSource );

// Codemirror dependencies
// routes.addTemplate('http://localhost/style/codemirror{/path*}.css', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.css", 'text/css') );
// routes.addTemplate('http://localhost/style/codemirror{/path*}.js', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.js", 'application/ecmascript') );
// routes.addTemplate('http://localhost/style/highlight.js/{path}.css', {}, RouteStaticFile(__dirname+'/node_modules/highlight.js/styles/', "/{path}.css", 'text/css') );

// Render files
// routes.addTemplate('http://localhost/style/app.js', {}, RouteBrowserify(docroot+'/style/main.js', "App", 'application/ecmascript') );
var routeScript = RouteStaticFile(docroot+'/style', "{/path*}.js", 'application/ecmascript');
routeScript.routerURITemplate = 'http://localhost/style{/path*}.js';
options.addRoute(routeScript);

var routeStyle = RouteStaticFile(docroot+'/style', "{/path*}.css", 'text/css');
routeStyle.routerURITemplate = 'http://localhost/style{/path*}.css';
options.addRoute(routeStyle);

var indexRDFaRoutes = routes.routes.filter(function(v){
	return [
		'http://localhost{/path*}',
	].indexOf(v.template)>=0;
});

var indexRDFa = new IndexRDFa(options);
indexRDFaRoutes.forEach(function(route){
	indexRDFa.import(route);
});

var routeLunrIndex = RouteLunrIndex({exportName:'searchIndex', routes:indexRDFaRoutes});
routeLunrIndex.routerURITemplate = 'http://localhost/search-index.js';
options.addRoute(routeLunrIndex);

var RouteGraphTTL = RouteTTL({index:indexRDFa, acceptProfile:'plain'});
RouteGraphTTL.routerURITemplate = 'http://localhost/graph.ttl';
options.addRoute(RouteGraphTTL);

var routeGraphNT = RouteNT({index:indexRDFa, acceptProfile:'plain'});
routeGraphNT.routerURITemplate = 'http://localhost/graph.nt';
options.addRoute(routeGraphNT);

var routeGraphNT = RouteNQ({index:indexRDFa, acceptProfile:'plain'});
routeGraphNT.routerURITemplate = 'http://localhost/graph.nq';
options.addRoute(routeGraphNT);

module.exports = options;
