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

const docroot = __dirname + '/htdocs';

var options = new Application;
options.fixedScheme = 'http';
options.fixedAuthority = 'fullstack.wiki';

var indexRDFa = new IndexRDFa(options);
var indexLunr = new IndexLunr(options);

function gRenderEditLink(innerRoute){
	return new RouteAddLinks({
		// uriTemplate: innerRoute.uriTemplate,
		fileroot: __dirname, // specify the root of the Git repository, not the docroot
		'edit-form': 'https://github.com/fullstackwiki/fullstackwiki/blob/master',
		'version-history': 'https://github.com/fullstackwiki/fullstackwiki/commits/master',
		innerRoute,
	});
}

const HTMLSource = gRenderEditLink(RouteFilesystem({
	uriTemplate: 'http://fullstack.wiki{/path*}.xml',
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
	uriTemplate: 'http://fullstack.wiki{/path*}.md',
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
var routePlain = new RouteApplyBindings('http://fullstack.wiki{/path*}.plain.xml', indexRDFa, routeTemplate);
options.addRoute(routePlain);

// Fully rendered theme
// Later, put this on <http://fullstack.wiki{/path*}.xhtml> and
// make <http://fullstack.wiki{/path*}> a Content-Type negotiation version
var routeThemed = new RouteApplyTheme('http://fullstack.wiki{/path*}.xhtml', indexRDFa, routePlain);
options.addRoute(routeThemed);

var routeBest = Negotiate('http://fullstack.wiki{/path*}', [
	routeThemed,
	routePlain,
	routeTemplate,
	routeSourceHTML,
]);
// routeBest.error = prepareNotFound;
options.addRoute(routeBest);

// Alias / to /index.xml
var routeIndex = RouteLocalReference("http://fullstack.wiki{/path*}/", routeBest, "http://fullstack.wiki{/path*}/index");
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
// routes.addTemplate('http://fullstack.wiki/+/highlight.js/{path}.css', {}, RouteFilesystem(__dirname+'/node_modules/highlight.js/styles/', "/{path}.css", 'text/css') );

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
	uriTemplate: 'http://fullstack.wiki{/path*}.svg',
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
	uriTemplate: 'http://fullstack.wiki/search{?q}',
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
