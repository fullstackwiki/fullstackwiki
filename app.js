var http = require('http');
var fs = require('fs');
var stream = require('stream');

var http = require('http');
var stream = require('stream');
var inherits = require('util').inherits;

const {
	HTTPServer,
	TemplateRouter,
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
var RenderForm = require( "./lib/RenderForm.js" ).RenderForm;
var RouteGitLog = require( "./lib/RouteGitLog.js" ).RouteGitLog;
var RouteLunrIndex = require( "./lib/RouteLunrIndex.js" ).RouteLunrIndex;
var RouteTTL = require( "./lib/RouteTTL.js" ).RouteTTL;
var RouteNT = require( "./lib/RouteNT.js" ).RouteNT;
var RouteNQ = require( "./lib/RouteNQ.js" ).RouteNQ;
var IndexRDFa = require( "./lib/IndexRDFa.js" ).IndexRDFa;

var rdf = require('rdf');

// Application-specific types
var RouteBrowserify = require('./lib/RouteBrowserify.js');

var listenPort = process.env.PORT || 8080;

const docroot = __dirname + '/web';

var options = new HTTPServer;
options.fixedScheme = 'http';
options.fixedAuthority = 'localhost';
options.RouteNotFound = RouteNotFound;
options.RouteError = RouteError;
var routes = options.routes;

// Alias / to /index.html
routes.addTemplate('http://localhost{/path*}/', {}, RouteLocalReference(routes, "http://localhost{/path*}/index"));

const HTMLSource = RouteStaticFile(docroot, "{/path*}.html", 'application/xhtml+xml');
const MarkdownSource = RouteStaticFile(docroot, "{/path*}.md", 'text/markdown');

// Content-negotiated version
// routes.addTemplate('http://localhost{/path*}', {}, Conneg({
// 	'application/xhtml+xml;profile="http://fullstack.wiki/ns/profile/render"':
// 		RoutePipeline(RouteLocalReference(routes, "http:http://localhost{/path*}.src.html"), [RenderTemplate, RenderBindings, RenderTheme] ),
// 	'application/xhtml+xml;profile="http://fullstack.wiki/ns/profile/render"':
// 		RoutePipeline(RouteLocalReference(routes, "http://localhost{/path*}.src.html"), [Markdown, RenderTheme] ),
// 	// 'text/markdown':
// 	// 	RoutePipeline(RouteLocalReference(routes, "http://localhost{/path*}.src.html"), [Markdown, RenderTheme] ),
// }) );

function gRenderBindings(res){
	return new RenderBindings(index.graph, res);
}

function gRenderTheme(res){
	return new RenderTheme(index.graph, res);
}

// Source code
routes.addTemplate('http://localhost{/path*}.src', {}, First([
	HTMLSource,
	MarkdownSource,
]) );

// Rendering happens in three stages:
// 1. Template: substitute in template calls and other manipulations that will make it into the RDF index
// 2. Bindings: use the RDF index to fill out data bindings for fulltext index
// 3. Theme: generate themed page for Web browsers

// // Rendered HTML but plain (no) theme
// routes.addTemplate('http://localhost{/path*}.pattern', {}, First([
// 	RoutePipeline(HTMLSource, [RenderTemplate] ),
// 	RoutePipeline(MarkdownSource, [Markdown] ),
// ]) );

// // Rendered HTML but plain (no) theme
// routes.addTemplate('http://localhost{/path*}.plain', {}, First([
// 	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings] ),
// 	RoutePipeline(MarkdownSource, [Markdown] ),
// ]) );

// // Fully rendered HTML version
// routes.addTemplate('http://localhost{/path*}.html', {}, First([
// 	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings, RenderTheme] ),
// 	RoutePipeline(MarkdownSource, [Markdown, RenderTheme] ),
// ]) );

// Fully rendered HTML version (conneg)
// routes.addTemplate('http://localhost{/path*}', {}, First([
// 	RouteLocalReference(routes, 'http://localhost{/path*}.html'),
// 	RouteLocalReference(routes, 'http://localhost{/path*}.plain'),
// 	RouteLocalReference(routes, 'http://localhost{/path*}.pattern'),
// 	RouteLocalReference(routes, 'http://localhost{/path*}.source'),
// ]) );
// But actually just pick the rendered version for now
routes.addTemplate('http://localhost{/path*}', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings, gRenderTheme] ),
	RoutePipeline(MarkdownSource, [Markdown, gRenderTheme] ),
]) );


// Editable form version
// routes.addTemplate('http://localhost{/path*}.edit', {}, First([
// 	RoutePipeline(HTMLSource, [RenderForm, RenderTheme]),
// //	RoutePipeline(MarkdownSource, RenderForm),
// ]) );

// The Recent Changes page, which is a Git log
routes.addTemplate('http://localhost/recent', {}, RoutePipeline(RouteGitLog({fs:fs, dir:__dirname, ref:'HEAD'}), [gRenderTheme]));

// Render the source Markdown
routes.addTemplate('http://localhost{/path*}.md', {}, MarkdownSource );

// Codemirror dependencies
routes.addTemplate('http://localhost/style/codemirror{/path*}.css', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.css", 'text/css') );
routes.addTemplate('http://localhost/style/codemirror{/path*}.js', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.js", 'application/ecmascript') );
routes.addTemplate('http://localhost/style/highlight.js/{path}.css', {}, RouteStaticFile(__dirname+'/node_modules/highlight.js/styles/', "/{path}.css", 'text/css') );

// Render files
routes.addTemplate('http://localhost/style/app.js', {}, RouteBrowserify(docroot+'/style/main.js', "App", 'application/ecmascript') );
routes.addTemplate('http://localhost/style{/path*}.js', {}, RouteStaticFile(docroot+'/style', "{/path*}.js", 'application/ecmascript') );
routes.addTemplate('http://localhost/style{/path*}.css', {}, RouteStaticFile(docroot+'/style', "{/path*}.css", 'text/css') );

var indexRoutes = routes.routes.filter(function(v){
	return [
		'http://localhost{/path*}',
	].indexOf(v.template)>=0;
});

var index = new IndexRDFa(options);
indexRoutes.forEach(function(route){
	index.import(route);
});

routes.addTemplate('http://localhost/search-index.js', {}, RouteLunrIndex({exportName:'searchIndex', routes:indexRoutes}) );

var ttlRoutes = new TemplateRouter.Router();
// Present a version with templates substituted, but no data bindings
// This is, after all, the file that the data bindings will be reading from
ttlRoutes.addTemplate('http://localhost{/path*}', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]) );
routes.addTemplate('http://localhost/graph.ttl', {}, RouteTTL({index:index, acceptProfile:'plain'}) );
routes.addTemplate('http://localhost/graph.nt', {}, RouteNT({index:index, acceptProfile:'plain'}) );
routes.addTemplate('http://localhost/graph.nq', {}, RouteNQ({index:index, acceptProfile:'plain'}) );

module.exports = options;
