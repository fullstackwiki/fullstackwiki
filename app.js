"use strict";
var fs = require('fs');
var assert = require('assert');

const {
	Application,
	RouteFilesystem,
	RouteLocalReference,
	First,
	Negotiate,
	Resource,
	ResponsePassThrough,
	TransformRoute,
} = require('dive-httpd');

const UriRoute = require('uri-template-router').Route;

const { RouteApplyMarkdown } = require('./lib/Markdown.js');
const { RouteApplyMacros } = require('./lib/RenderMacros.js');
const { RouteApplyBindings } = require('./lib/RenderBindings.js');
const { RouteApplyTheme } = require('./lib/RenderTheme.js');
const { RouteAddLinks } = require('./lib/RenderEditLink.js');
const { RouteGitLog } = require('./lib/RouteGitLog.js');
const { RouteSearchResults } = require('./lib/RouteSearchResults.js');
const { RouteLunrIndex } = require('./lib/RouteLunrIndex.js');
const { RouteTTL } = require('./lib/RouteTTL.js');
const { RouteNT } = require('./lib/RouteNT.js');
const { RouteNQ } = require('./lib/RouteNQ.js');
const { RouteSitemapXML } = require('./lib/RouteSitemapXML.js');
const { IndexRDFa } = require('./lib/IndexRDFa.js');
const { IndexLunr } = require('./lib/IndexLunr.js');
const { env } = require('process');

const docroot = __dirname + '/htdocs';
const defaultRoute = new UriRoute('http://fullstack.wiki{/path*}');

var options = new Application;
options.fixedScheme = 'http';
options.fixedAuthority = 'fullstack.wiki';

var indexRDFa = new IndexRDFa(options);
var indexLunr = new IndexLunr(options);

// Most resources are Content-Type negotiated
var routeBest = Negotiate(defaultRoute);
options.addRoute(routeBest);

function gRenderEditLink(innerRoute){
	return new RouteAddLinks({
		innerRoute,
		fileroot: __dirname, // specify the root of the Git repository, not the docroot
		'edit-form': 'https://github.com/fullstackwiki/fullstackwiki/blob/master',
		'version-history': 'https://github.com/fullstackwiki/fullstackwiki/commits/master',
	});
}

const HTMLSource = gRenderEditLink(RouteFilesystem({
	uriRoute: new UriRoute('http://fullstack.wiki{/path*}.xml', {parent: defaultRoute}),
	contentType: 'application/xml',
	fileroot: docroot,
	pathTemplate: "{/path*}.xml",
	filepathLink: true,
	filepathAuthority: 'fullstack.wiki',
	filepathRel: 'tag:fullstack.wiki,2018:ns/source',
}));
HTMLSource.name = 'RenderEditLink.html';
options.addRoute(HTMLSource);

const MarkdownSource = gRenderEditLink(RouteFilesystem({
	uriRoute: new UriRoute('http://fullstack.wiki{/path*}.md', {parent: defaultRoute}),
	contentType: 'text/markdown',
	fileroot: docroot,
	pathTemplate: "{/path*}.md",
	filepathLink: true,
	filepathAuthority: 'fullstack.wiki',
	filepathRel: 'tag:fullstack.wiki,2018:ns/source',
}));
MarkdownSource.name = 'RenderEditLink.md';
options.addRoute(MarkdownSource);

// Source code
var routeSourceHTML = First(new UriRoute('http://fullstack.wiki{/path*}.src.xml', {parent: defaultRoute}), [
	HTMLSource,
	new RouteApplyMarkdown('http://fullstack.wiki{/path*}.src.xml', MarkdownSource),
]);
options.addRoute(routeSourceHTML);
// routeBest.addRoute(routeSourceHTML);

// Rendering happens in three stages:
// 1. Macro substitution: substitute in manipulations that will make it into the RDF index
// 2. Bindings: use the RDF index to fill out data bindings for fulltext index
// 3. Theme: generate themed page for Web browsers

// Macros applied, waiting for RDFa Templates to be applied
var routeTemplate = new RouteApplyMacros(new UriRoute('http://fullstack.wiki{/path*}.tpl.xml', {parent:defaultRoute}), routeSourceHTML);
options.addRoute(routeTemplate);
// TODO: Add these back in
// routeBest.addRoute(routeTemplate);

// Rendered HTML but plain (no) theme
var routePlain = new RouteApplyBindings(new UriRoute('http://fullstack.wiki{/path*}.plain.xml', {parent:defaultRoute}), indexRDFa, routeTemplate);
options.addRoute(routePlain);
// TODO: Add these back in
// routeBest.addRoute(routePlain);

// Fully rendered theme
// Later, put this on <http://fullstack.wiki{/path*}.xhtml> and
// make <http://fullstack.wiki{/path*}> a Content-Type negotiation version
var routeThemed = new RouteApplyTheme(new UriRoute('http://fullstack.wiki{/path*}.xhtml', {parent:defaultRoute}), indexRDFa, routePlain);
options.addRoute(routeThemed);
routeBest.addRoute(routeThemed);

// Alias / to /index.xml
var routeIndex = RouteLocalReference(new UriRoute("http://fullstack.wiki{/path*}/", {parent: defaultRoute}), routeBest, "http://fullstack.wiki{/path*}/index");
options.addRoute(routeIndex);

// The Recent Changes page, which is a Git log
var routeRecent = new RouteApplyTheme('http://fullstack.wiki/recent', indexRDFa, RouteGitLog({
	uriTemplate: 'http://fullstack.wiki/recent',
	title: 'Recent Changes',
	fs: fs,
	dir: __dirname,
	ref: 'HEAD',
}));
options.addRoute(routeRecent);

// Codemirror dependencies
// routes.addTemplate('http://fullstack.wiki/+/codemirror{/path*}.css', {}, RouteFilesystem(__dirname+'/codemirror', "{/path*}.css", 'text/css') );
// routes.addTemplate('http://fullstack.wiki/+/codemirror{/path*}.js', {}, RouteFilesystem(__dirname+'/codemirror', "{/path*}.js", 'application/ecmascript') );
options.addRoute(RouteFilesystem({
	uriTemplate: 'http://fullstack.wiki/+/highlight.js/{path}.css',
	fileroot: __dirname+'/node_modules/highlight.js/styles/',
	pathTemplate: "/{path}.css",
	contentType: 'text/css',
}));

// Render files
// routes.addTemplate('http://fullstack.wiki/+/app.js', {}, RouteBrowserify(docroot+'/+/main.js', "App", 'application/ecmascript') );

var routeScript = RouteFilesystem({
	uriTemplate: 'http://fullstack.wiki/+{/path*}.js',
	fileroot: docroot+'/+',
	pathTemplate: "{/path*}.js",
	contentType: 'application/ecmascript',
});
options.addRoute(routeScript);

var routeStyle = RouteFilesystem({
	uriTemplate: 'http://fullstack.wiki/+{/path*}.css',
	fileroot: docroot+'/+',
	pathTemplate: "{/path*}.css",
	contentType: 'text/css',
});
options.addRoute(routeStyle);

var routeSVG = RouteFilesystem({
	uriRoute: new UriRoute('http://fullstack.wiki{/path*}.svg', {parent: defaultRoute}),
	fileroot: docroot,
	pathTemplate: "{/path*}.svg",
	contentType: 'image/svg+xml',
});
options.addRoute(routeSVG);

var routeLunrIndex = RouteLunrIndex({
	uriTemplate: 'http://fullstack.wiki/search-index.js',
	exportName: 'searchIndex',
	index: indexLunr,
});
options.addRoute(routeLunrIndex);

var routeSearch = RouteSearchResults({
	// FIXME Using the ?q parameter does not match any route in defaultRoute so it doesn't work
	uriRoute: new UriRoute('http://fullstack.wiki/search/json{?q}', {parent: defaultRoute}),
	index: indexLunr,
});
options.addRoute(routeSearch);

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

indexRDFa.import(routeBest);
indexLunr.import(routeBest);

if(env.UPDATE_BRANCH_SCRIPT){
	// This allows a running server to receive a GitHub-formatted Webhook and run a script to update in-place
	// Trigger with an event like:
	// curl -XPOST -v http://localhost:8080/about:hook/commit -H'Content-Type: application/json' -d'{"ref":"refs/heads/master","repository":"fullstack.wiki","head_commit":{"id":"6698676b1ed28d09eb0f0f0c38686465e35cdfd8"}}'
	options.addRoute(require('./lib/RouteGitHubHook.js').RouteGitHubHook({
		uriTemplate: 'http://fullstack.wiki/about:hook/commit',
		UPDATE_BRANCH_SCRIPT: env.UPDATE_BRANCH_SCRIPT,
	}));
}

// Define a function that will resolve a Resource that generates the 404 Not Found error page
// This is set in `defaultNotFound` for static file generators, but this will mostly be called from
// the `error` handler of the <http://fullstack.wiki{/path*}> route.
const defaultNotFound = new TransformRoute({
	innerRoute: routeBest,
	error(uri, error){
		// uri and error arguments are not provided by defaultNotFound
		return this.innerRoute.prepare('http://fullstack.wiki/error.notfound').then((inner) => {
			assert(inner);
			return new Resource(this, {inner}, {error});
		});
	},
	render(resource, req){
		const input = resource.inner.render(req);
		const output = new ResponsePassThrough;
		input.on('error', (err)=>output.destroy(err));
		input.headersReady.then(function(inner){
			inner.pipeMessage(output);
			output.statusCode = 404;
			output.flushHeaders(); // Lock the headers from further modification
		});
		return output.clientReadableSide;
	},
});
options.defaultNotFound = ()=>defaultNotFound.error();

module.exports = options;
