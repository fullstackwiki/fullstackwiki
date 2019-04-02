
var createServer = require('http').createServer;
var assert = require('assert');

var writeMessage = require('../../dive-httpd/test/util.js').writeMessage;
var lib = require('../../dive-httpd/index.js');
var app = require('../app.js');

describe('Server', function(){
	var server;
	before(function(){
		server = createServer(lib.handleRequest.bind(null, app));
	});
	after(function(){
		server = undefined;
	})
	it('404 Not Found', function(){
		// Choose any URI that doesn't have a definition
		return writeMessage(server, [
			'GET /some-path-that-does-not-exist HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 404 /));
		});
	});
	it('/ (landing page)', function(){
		return writeMessage(server, [
			'GET /index HTTP/1.1',
			'Accept: application/xhtml+xml',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/xhtml\+xml$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/index', function(){
		return writeMessage(server, [
			'GET /index HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/xhtml\+xml$/m));
			assert(res.toString().match(/^Content-Location: http:\/\/fullstack.wiki\/index\.html$/m));
			assert(res.toString().match(/^Vary: Accept$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/http/index.md', function(){
		// Choose any URI sourced from a Markdown file on the filesystem
		return writeMessage(server, [
			'GET /http/index.md HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: text\/markdown$/m));
			assert(res.toString().match(/^# /m));
		});
	});
	it('/index.xml', function(){
		// Choose any URI sourced from an XML file on the filesystem
		return writeMessage(server, [
			'GET /index.xml HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/xml$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/index.src.xml', function(){
		return writeMessage(server, [
			'GET /index.src.xml HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/xml$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/index.tpl.xml', function(){
		return writeMessage(server, [
			'GET /index.tpl.xml HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/x.wiki.fullstack.template\+xml$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/index.plain.xml', function(){
		return writeMessage(server, [
			'GET /index.plain.xml HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/x.wiki.fullstack.plain\+xml$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/index.html', function(){
		return writeMessage(server, [
			'GET /index.html HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/xhtml\+xml$/m));
			assert(res.toString().match(/<h1>Welcome to Fullstack.wiki<\/h1>/));
		});
	});
	it('/graph.ttl', function(){
		return writeMessage(server, [
			'GET /graph.ttl HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: text\/turtle$/m));
			assert(res.toString().match(/<http:\/\/fullstack.wiki\/index>/));
		});
	});
	it('/graph.nt', function(){
		return writeMessage(server, [
			'GET /graph.nt HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/n-triples$/m));
			assert(res.toString().match(/<http:\/\/fullstack.wiki\/index>/));
		});
	});
	it('/graph.nq', function(){
		return writeMessage(server, [
			'GET /graph.nq HTTP/1.1',
			'Host: fullstack.wiki',
		]).then(function(res){
			assert(res.toString().match(/^HTTP\/1.1 200 /));
			assert(res.toString().match(/^Content-Type: application\/n-quads$/m));
			assert(res.toString().match(/<http:\/\/fullstack.wiki\/index>/));
		});
	});
	it('/search-index.js');
	it('XML: Syntax highlighting');
	it('Table of contents rel=up');
	it('Data tables (/http/headers/index)');
});
