var http = require('http');
var fs = require('fs');
var stream = require('stream');

var http = require('http');
var stream = require('stream');
var inherits = require('util').inherits;

const {
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
var RouteRDF = require( "./lib/RouteRDF.js" ).RouteRDF;

var rdf = require('rdf');

// Application-specific types
var RouteBrowserify = require('./lib/RouteBrowserify.js');

var listenPort = process.env.PORT || 8080;

const docroot = __dirname + '/web';

var routes = new TemplateRouter.Router();

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

const dataGraph = rdf.TurtleParser.parse(fs.readFileSync('graph.ttl'), 'http://fullstack.wiki/').graph;
function gRenderBindings(){
	return new RenderBindings(dataGraph);
}

// Source code
routes.addTemplate('http://localhost{/path*}.source', {}, First([
	HTMLSource,
	MarkdownSource,
]) );

// Rendered HTML but plain (no) theme
routes.addTemplate('http://localhost{/path*}.pattern', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]) );

// Rendered HTML but plain (no) theme
routes.addTemplate('http://localhost{/path*}.plain', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]) );

// Fully rendered HTML version
routes.addTemplate('http://localhost{/path*}.html', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate, gRenderBindings, RenderTheme] ),
	RoutePipeline(MarkdownSource, [Markdown, RenderTheme] ),
]) );

// Fully rendered HTML version (conneg)
// But actually just pick the .html version for now
routes.addTemplate('http://localhost{/path*}', {}, First([
	RouteLocalReference(routes, 'http://localhost{/path*}.html'),
	RouteLocalReference(routes, 'http://localhost{/path*}.plain'),
	RouteLocalReference(routes, 'http://localhost{/path*}.pattern'),
	RouteLocalReference(routes, 'http://localhost{/path*}.source'),
]) );

// Editable form version
routes.addTemplate('http://localhost{/path*}.edit', {}, First([
	RoutePipeline(HTMLSource, [RenderForm, RenderTheme]),
//	RoutePipeline(MarkdownSource, RenderForm),
]) );

// The Recent Changes page, which is a Git log
routes.addTemplate('http://localhost/recent', {}, RoutePipeline(RouteGitLog({fs:fs, dir:__dirname, ref:'HEAD'}), [RenderTheme]));

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
routes.addTemplate('http://localhost/search-index.js', {}, RouteLunrIndex({exportName:'searchIndex', routes:indexRoutes}) );

var ttlRoutes = new TemplateRouter.Router();
// Present a version with templates substituted, but no data bindings
// This is, after all, the file that the data bindings will be reading from
ttlRoutes.addTemplate('http://localhost{/path*}', {}, First([
	RoutePipeline(HTMLSource, [RenderTemplate] ),
	RoutePipeline(MarkdownSource, [Markdown] ),
]) );
routes.addTemplate('http://localhost/graph.ttl', {}, RouteRDF({routes:ttlRoutes.routes, acceptProfile:'plain'}) );

var options = {
	fixedScheme: 'http',
	fixedAuthority: 'localhost',
	RouteNotFound: RouteNotFound,
	RouteError: RouteError,
	routes: routes,
}

module.exports = options;
