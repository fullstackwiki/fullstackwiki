
var fs = require('fs');

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
var RenderEditLink = require( "./lib/RenderEditLink.js" ).RenderEditLink;
var RouteGitLog = require( "./lib/RouteGitLog.js" ).RouteGitLog;
var RouteLunrIndex = require( "./lib/RouteLunrIndex.js" ).RouteLunrIndex;
var RouteTTL = require( "./lib/RouteTTL.js" ).RouteTTL;
var RouteNT = require( "./lib/RouteNT.js" ).RouteNT;
var RouteNQ = require( "./lib/RouteNQ.js" ).RouteNQ;
var IndexRDFa = require( "./lib/IndexRDFa.js" ).IndexRDFa;

// Application-specific types
var RouteBrowserify = require('./lib/RouteBrowserify.js');

const docroot = __dirname + '/web';

var options = new HTTPServer;
options.fixedScheme = 'http';
options.fixedAuthority = 'localhost';
options.RouteNotFound = RouteNotFound;
options.RouteError = RouteError;
var routes = options.routes;

// Alias / to /index.xml
routes.addTemplate('http://localhost{/path*}/', {}, RouteLocalReference(routes, "http://localhost{/path*}/index"));

function gRenderEditLink(res){
	return new RenderEditLink(__dirname, {
		'edit-form': 'https://github.com/awwright/fullstackwiki/blob/master',
		'version-history': 'https://github.com/awwright/fullstackwiki/commits/master',
	});
}
const RouteStaticFileOpts = {
	filepathLink: true,
	filepathAuthority: 'fullstack.wiki',
	filepathRel: 'http://fullstack.wiki/ns/source',
};
const HTMLSource = RoutePipeline(RouteStaticFile(docroot, "{/path*}.xml", 'application/xhtml+xml', RouteStaticFileOpts), gRenderEditLink);
const MarkdownSource = RoutePipeline(RouteStaticFile(docroot, "{/path*}.md", 'text/markdown', RouteStaticFileOpts), gRenderEditLink);

// Content-negotiated version
// routes.addTemplate('http://localhost{/path*}', {}, Conneg({
// 	'application/xhtml+xml;profile="http://fullstack.wiki/ns/profile/render"':
// 		RoutePipeline(RouteLocalReference(routes, "http:http://localhost{/path*}.src.xml"), [RenderTemplate, RenderBindings, RenderTheme] ),
// 	'application/xhtml+xml;profile="http://fullstack.wiki/ns/profile/render"':
// 		RoutePipeline(RouteLocalReference(routes, "http://localhost{/path*}.src.xml"), [Markdown, RenderTheme] ),
// 	// 'text/markdown':
// 	// 	RoutePipeline(RouteLocalReference(routes, "http://localhost{/path*}.src.xml"), [Markdown, RenderTheme] ),
// }) );

function gRenderBindings(res){
	return new RenderBindings(index.graph, res);
}

function gRenderTheme(res){
	return new RenderTheme(index.graph, res);
}

// Source code
routes.addTemplate('http://localhost{/path*}.src.xml', {}, First([
	HTMLSource,
	MarkdownSource,
]) );

// Rendering happens in three stages:
// 1. Template: substitute in template calls and other manipulations that will make it into the RDF index
// 2. Bindings: use the RDF index to fill out data bindings for fulltext index
// 3. Theme: generate themed page for Web browsers

// // Rendered HTML but plain (no) theme
routes.addTemplate('http://localhost{/path*}.tpl.xml', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]) );

// Rendered HTML but plain (no) theme
routes.addTemplate('http://localhost{/path*}.plain.xml', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]) );

// // Fully rendered HTML version
// routes.addTemplate('http://localhost{/path*}.html', {}, First([
// 	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings, RenderTheme] ),
// 	RoutePipeline(MarkdownSource, [Markdown, RenderTheme] ),
// ]) );

// Fully rendered HTML version (conneg)
// routes.addTemplate('http://localhost{/path*}', {}, First([
// 	RouteLocalReference(routes, 'http://localhost{/path*}.xml'),
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
routes.addTemplate('http://localhost/recent', {}, RoutePipeline(RouteGitLog({title:'Recent Changes', fs:fs, dir:__dirname, ref:'HEAD'}), [gRenderTheme]));

// Render the source Markdown
routes.addTemplate('http://localhost{/path*}.md', {}, MarkdownSource );

// Codemirror dependencies
// routes.addTemplate('http://localhost/style/codemirror{/path*}.css', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.css", 'text/css') );
// routes.addTemplate('http://localhost/style/codemirror{/path*}.js', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.js", 'application/ecmascript') );
// routes.addTemplate('http://localhost/style/highlight.js/{path}.css', {}, RouteStaticFile(__dirname+'/node_modules/highlight.js/styles/', "/{path}.css", 'text/css') );

// Render files
routes.addTemplate('http://localhost/style/app.js', {}, RouteBrowserify(docroot+'/style/main.js', "App", 'application/ecmascript') );
routes.addTemplate('http://localhost/style{/path*}.js', {}, RouteStaticFile(docroot+'/style', "{/path*}.js", 'application/ecmascript') );
routes.addTemplate('http://localhost/style{/path*}.css', {}, RouteStaticFile(docroot+'/style', "{/path*}.css", 'text/css') );

var indexRoutes = routes.routes.filter(function(v){
	return [
		'http://localhost{/path*}.tpl.xml',
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
