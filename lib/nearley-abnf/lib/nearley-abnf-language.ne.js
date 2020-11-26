// Generated automatically by nearley, version 2.19.8
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

function getValue(d) {
	return d[0].value;
}

function literals(list) {
	var rules = {};
	for (var lit of list) {
		rules[lit] = {match: lit};
	}
	return rules;
}

var moo = require('moo');
var lexer = moo.compile(Object.assign({
	CRLF: {match: /\r?\n/, lineBreaks: true},
	comment: /;.*\r?\n/,
	WSP: {match: /[ \t]+/},
	number: {
		match: /[0-9]+/,
		value: x => JSON.parse(x),
	},
	bin_val: {
		match: /%b[01]+(?:(?:\.[01]+)*|(?:-[01]+))?/,
		value: x => x,
	},
	dec_val: {
		match: /%d[0-9]+(?:(?:\.[0-9]+)*|(?:-[0-9]+))?/,
		value: x => x,
	},
	hex_val: {
		match: /%x[0-9A-Fa-f]+(?:(?:\.[0-9A-Fa-f]+)*|(?:-[0-9A-Fa-f]+))?/,
		value: x => x,
	},
	string: {
		match: /"[\x20-\x21\x23-\x7E]*"/, // All SP and VCHAR except DQUOTE
		value: s => s.substring(1, s.length-1),
	},
	prose: {
		match: /<[ -=?-~]*>/,
		value: s => s.substring(1, s.length-1),
	},
	word: {
		match: /[A-Za-z][0-9A-Za-z-]*/,
		value: x => x,
	},
}, literals([
	"=", "/", "*", "#",
	"(", ")",
	"[", "]",
])));

function insensitive(sl) {
	var s = sl.literal;
	var result = [];
	for (var i=0; i<s.length; i++) {
		var c = s.charAt(i);
		if (c.toUpperCase() !== c || c.toLowerCase() !== c) {
			result.push(new RegExp("[" + c.toLowerCase() + c.toUpperCase() + "]"));
		} else {
			result.push({literal: c});
		}
	}
	return {subexpression: [{tokens: result, postprocess: function(d) {return d.join(""); }}]};
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "rulelist$ebnf$1", "symbols": []},
    {"name": "rulelist$ebnf$1", "symbols": ["rulelist$ebnf$1", (lexer.has("c_wsp") ? {type: "c_wsp"} : c_wsp)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "rulelist$ebnf$2", "symbols": ["line"]},
    {"name": "rulelist$ebnf$2", "symbols": ["rulelist$ebnf$2", "line"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "rulelist", "symbols": ["rulelist$ebnf$1", "rulelist$ebnf$2"], "postprocess": function(d) { return d[1].filter(d=>d); }},
    {"name": "line", "symbols": ["rule"], "postprocess": d => d[0]},
    {"name": "line", "symbols": ["c_nl"], "postprocess": d => null},
    {"name": "rule", "symbols": ["word", "_", {"literal":"="}, "_", "elements", "c_nl"], "postprocess":  function(d) {
        	return {name: d[0], rules: d[4]};
        } },
    {"name": "elements", "symbols": ["alternation", "_"], "postprocess": d => d[0]},
    {"name": "alternation$ebnf$1", "symbols": []},
    {"name": "alternation$ebnf$1", "symbols": ["alternation$ebnf$1", "alternation1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "alternation", "symbols": ["concatenation", "alternation$ebnf$1"], "postprocess":  function(d) {
        	return [d[0]].concat(d[1]).filter(v => v);
        } },
    {"name": "alternation1", "symbols": ["_", {"literal":"/"}, "_", "concatenation"], "postprocess": d => d[3]},
    {"name": "concatenation$ebnf$1", "symbols": []},
    {"name": "concatenation$ebnf$1", "symbols": ["concatenation$ebnf$1", "concatenation1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "concatenation", "symbols": ["repetition", "concatenation$ebnf$1"], "postprocess":  function(d) {
        	return { tokens: [d[0]].concat(d[1]).filter(v => v) };
        } },
    {"name": "concatenation1", "symbols": ["__", "repetition"], "postprocess": d => d[1]},
    {"name": "repetition$ebnf$1", "symbols": ["repeat"], "postprocess": id},
    {"name": "repetition$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "repetition", "symbols": ["repetition$ebnf$1", "element"], "postprocess":  function(d) {
        	const repeat = d[0];
        	if(repeat){
        		if(repeat.max===0){
        			return null;
        		}
        		if(repeat.min===0){
        			if(repeat.max===1) return {ebnf:d[1], modifier:':?'};
        			if(repeat.max===null) return {ebnf:d[1], modifier:':*'};
        			return {ebnf:d[1], modifier:':*', max:repeat.max};
        		}else if(repeat.min===1){
        			if(repeat.max===null) return {ebnf:d[1], modifier:':+'};
        			return {ebnf:d[1], modifier:':+', max:repeat.max};
        		}
        		return {ebnf:d[1], modifier:':+', min:repeat.min, max:repeat.max};
        	}
        	return d[1];
        } },
    {"name": "repeat", "symbols": ["number"], "postprocess": function(d){ return { min: d[0], max:d[0] }; }},
    {"name": "repeat$ebnf$1", "symbols": ["number"], "postprocess": id},
    {"name": "repeat$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "repeat$ebnf$2", "symbols": ["number"], "postprocess": id},
    {"name": "repeat$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "repeat", "symbols": ["repeat$ebnf$1", {"literal":"*"}, "repeat$ebnf$2"], "postprocess": function(d){ return { min: d[0]||0, type:d[1], max:d[2] }; }},
    {"name": "repeat$ebnf$3", "symbols": ["number"], "postprocess": id},
    {"name": "repeat$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "repeat$ebnf$4", "symbols": ["number"], "postprocess": id},
    {"name": "repeat$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "repeat", "symbols": ["repeat$ebnf$3", {"literal":"#"}, "repeat$ebnf$4"], "postprocess": function(d){ return { min: d[0]||0, type:d[1], max:d[2] }; }},
    {"name": "element", "symbols": ["rulename"], "postprocess": d => d[0]},
    {"name": "element", "symbols": ["group"], "postprocess": d => d[0]},
    {"name": "element", "symbols": ["option"], "postprocess": d => d[0]},
    {"name": "element", "symbols": ["char_val"], "postprocess": d => d[0]},
    {"name": "element", "symbols": ["num_val"], "postprocess":  function(d){
        	const num_val = d[0];
        	var range = num_val.match(/%.([0-9A-Fa-f]+)-([0-9A-Fa-f]+)?/);
        	var string = num_val.match(/%.[0-9A-Fa-f]+(?:\.[0-9A-Fa-f]+)*?/);
        	var base = ({ b:2, d:10, x:16 })[num_val[1]];
        	function escapeRange(chr){
        		return chr.replace(/[[\]]/g, function(a){ return '\\x'+a.charCodeAt(0).toString(16) });
        	}
        	if(range){
        		var start = escapeRange(String.fromCharCode(parseInt(range[1], base)));
        		var end = escapeRange(String.fromCharCode(parseInt(range[2], base)));
        		return new RegExp('[' + start + '-' + end + ']', 'u');
        	}else if(string){
        		const literal = num_val
        			.substring(2)
        			.split('.')
        			.map(function(v){
        				return String.fromCharCode(parseInt(v, base));
        			})
        			.join('')
        			.replace(/[.*+?^${}()|[\]\\]/g, function(a){ return '\\x'+a.charCodeAt(0).toString(16) });
        		return { literal };
        	}else{
        		throw new Error('Unknown num_val '+JSON.stringify(num_val));
        	}
        } },
    {"name": "element", "symbols": ["prose_val"], "postprocess": d => d},
    {"name": "group", "symbols": [{"literal":"("}, "_", "alternation", "_", {"literal":")"}], "postprocess":  function(d) {
        	return {subexpression: d[2]};
        } },
    {"name": "option", "symbols": [{"literal":"["}, "_", "alternation", "_", {"literal":"]"}], "postprocess":  function(d) {
        	return { ebnf: {subexpression:d[2]}, modifier: ':?' };
        } },
    {"name": "rulename", "symbols": ["word"], "postprocess": d => d[0]},
    {"name": "word", "symbols": [(lexer.has("word") ? {type: "word"} : word)], "postprocess": getValue},
    {"name": "char_val", "symbols": ["string"], "postprocess": d => ({literal: d[0]})},
    {"name": "num_val", "symbols": [(lexer.has("bin_val") ? {type: "bin_val"} : bin_val)], "postprocess": getValue},
    {"name": "num_val", "symbols": [(lexer.has("dec_val") ? {type: "dec_val"} : dec_val)], "postprocess": getValue},
    {"name": "num_val", "symbols": [(lexer.has("hex_val") ? {type: "hex_val"} : hex_val)], "postprocess": getValue},
    {"name": "number", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": getValue},
    {"name": "string", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": getValue},
    {"name": "prose_val", "symbols": [(lexer.has("prose") ? {type: "prose"} : prose)], "postprocess": getValue},
    {"name": "charclass", "symbols": [(lexer.has("charclass") ? {type: "charclass"} : charclass)], "postprocess": getValue},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "c_wsp"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "__$ebnf$1", "symbols": ["c_wsp"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "c_wsp"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"]},
    {"name": "c_wsp", "symbols": [(lexer.has("WSP") ? {type: "WSP"} : WSP)]},
    {"name": "c_wsp", "symbols": ["c_nl", (lexer.has("WSP") ? {type: "WSP"} : WSP)]},
    {"name": "c_nl", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "c_nl", "symbols": [(lexer.has("CRLF") ? {type: "CRLF"} : CRLF)]}
]
  , ParserStart: "rulelist"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
