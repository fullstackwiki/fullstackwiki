"use strict";

// Test that a Nearley grammar file and an ABNF grammar file will compile to the same thing

const assert = require('assert').strict;
const fs = require('fs');
const nearley = require('nearley');
const compiledGrammar = require('nearley/lib/nearley-language-bootstrapped.js')
const { parseABNF, ABNFParseTree } = require('../index.js');

function parseNearley(string){
	var parserGrammar = nearley.Grammar.fromCompiled(compiledGrammar);
	var parser = new nearley.Parser(parserGrammar);
	parser.feed(string);
	// parser.feed('\n');
	return new ABNFParseTree(parser.results[0]);
}

describe('Nearley & ABNF comparison', function(){
	it('test', function(){
		var abnf_text = fs.readFileSync(__dirname + '/fixtures/test.abnf', 'UTF-8');
		var abnf_parsed = parseABNF(abnf_text);

		var nearley_text = fs.readFileSync(__dirname + '/fixtures/test.ne', 'UTF-8');
		var nearley_parsed = parseNearley(nearley_text);

		assert.deepEqual(abnf_parsed, nearley_parsed);
	});
});
