var http = require('http');
var stream = require('stream');

var http = require('http');
var stream = require('stream');
var inherits = require('util').inherits;

const {
	TemplateRouter,
	Processor,
	RouteStaticFile,
	RouteError,
	RouteNotFound,
	RouteLocalReference,
	ServerResponseTransform,
	First,
	handleRequest,
} = require('dive-httpd');

var Markdown = require( "./lib/Markdown.js" ).Markdown;
var Render = require( "./lib/Render.js" ).Render;
var RenderForm = require( "./lib/RenderForm.js" ).RenderForm;

// Application-specific types
var RouteBrowserify = require('./lib/RouteBrowserify.js');

var listenPort = process.env.PORT || 8080;

const docroot = __dirname + '/web';

var routes = new TemplateRouter.Router();

// Alias / to /index.html
routes.addTemplate('http://localhost{/path*}/', {}, RouteLocalReference("http://localhost{/path*}/index"));

// Determine which version to return based on Content-Type negotiation
//routes.addTemplate('http://localhost{/path*}', {}, new lib.Conneg([
//	dereference("http://localhost{/path*}.html"),
//	dereference("http://localhost{/path*}.xhtml"),
//	dereference("http://localhost{/path*}.md"),
//	dereference("http://localhost{/path*}.src.html"),
//]));

// Render a document from the source version
routes.addTemplate('http://localhost{/path*}', {}, First([
	RouteStaticFile(docroot, "{/path*}.html", 'application/xhtml+xml', res=>res.pipe(new Render) ),
	RouteStaticFile(docroot, "{/path*}.md", 'text/markdown', res=>res.pipe(new Markdown).pipe(new Render) ),
]) );

// Source code
routes.addTemplate('http://localhost{/path*}.src', {}, First([
	RouteStaticFile(docroot, "{/path*}.html", 'application/xhtml+xml', x=>x),
	RouteStaticFile(docroot, "{/path*}.md", 'text/markdown', x=>x),
]) );

// Editable form version
routes.addTemplate('http://localhost{/path*}.edit', {}, First([
	RouteStaticFile(docroot, "{/path*}.html", 'application/xhtml+xml', x=>x.pipe(new RenderForm)),
//	RouteStaticFile(docroot, "{/path*}.md", 'text/markdown', x=>x.pipe(new RenderForm)),
]) );

// Render a document from the source Markdown
routes.addTemplate('http://localhost{/path*}.md', {}, RouteStaticFile(docroot, "{/path*}.md", 'text/markdown', x=>x) );
// Codemirror dependencies
routes.addTemplate('http://localhost/style/codemirror{/path*}.css', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.css", 'text/css', x=>x) );
routes.addTemplate('http://localhost/style/codemirror{/path*}.js', {}, RouteStaticFile(__dirname+'/codemirror', "{/path*}.js", 'application/ecmascript', x=>x) );

// Render files
routes.addTemplate('http://localhost/style/app.js', {}, RouteBrowserify(docroot+'/style/main.js', "App", 'application/ecmascript') );
routes.addTemplate('http://localhost/style{/path*}.js', {}, RouteStaticFile(docroot+'/style', "{/path*}.js", 'application/ecmascript', x=>x) );
routes.addTemplate('http://localhost/style{/path*}.css', {}, RouteStaticFile(docroot+'/style', "{/path*}.css", 'text/css', x=>x) );

routes.addTemplate('http://localhost/search-index.js', {}, RouteBrowserify(docroot+'/style/main.js', "App", 'application/ecmascript') );


var options = {
	fixedScheme: 'http',
	fixedAuthority: 'localhost',
	RouteNotFound: RouteNotFound,
	RouteError: RouteError,
	routes: routes,
}

module.exports = options;
