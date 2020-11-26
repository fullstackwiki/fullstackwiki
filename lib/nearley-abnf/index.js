"use strict";

const nearley = require('nearley/lib/nearley.js');

const compiledGrammar = require('./lib/nearley-abnf-language.ne.js');
const generate = require('nearley/lib/generate.js');
const compileNe = require('nearley/lib/compile.js');

exports.parseABNF = parseABNF;
function parseABNF(abnfDocument, options){
	if(typeof abnfDocument !== 'string') throw new Error('Expected string `abnfDocument`');

	if(!options) options = {};
	// Read the # short form for HTTP headers
	if(options.ext_http === undefined) options.ext_http = true;
	// Read the case-insensitive extension
	if(options.ext_case === undefined) options.ext_case = true;
	// Include the core ABNF rules
	if(options.core_rules === undefined) options.core_rules = true;

	var parserGrammar = nearley.Grammar.fromCompiled(compiledGrammar);
	var parser = new nearley.Parser(parserGrammar);
	parser.feed(abnfDocument);
	// parser.feed('\n');
	if(parser.results[0]) return new ABNFParseTree(parser.results[0]);
	console.error('Expected result');
	console.dir(abnfDocument);
}

exports.ABNFParseTree = ABNFParseTree;
function ABNFParseTree(rules){
	if(!rules) throw new Error('Expected array `rules`');
	if(!Array.isArray(rules)) throw new Error('Expected array `rules`');
	this.rules = rules;
}
ABNFParseTree.prototype.compile = function compile(){
	// Parse the grammar source into an AST
	const grammarParser = new nearley.Parser(nearleyGrammar);
	grammarParser.feed(sourceCode);
	const grammarAst = grammarParser.results[0]; // TODO check for errors

	// Compile the AST into a set of rules
	const grammarInfoObject = compileNe(grammarAst, {});
	// Generate JavaScript code from the rules
	const grammarJs = generate(grammarInfoObject, "grammar");

	// Pretend this is a CommonJS environment to catch exports from the grammar.
	const module = { exports: {} };
	var fn = new Function('module', 'exports', grammarJs);
	fn(module, module.exports);
	return module.exports;
};

ABNFParseTree.prototype.toGrammar = function toGrammar(){
	return nearley.Grammar.fromCompiled(this.compile());
};
