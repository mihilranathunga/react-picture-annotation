(window.webpackJsonp=window.webpackJsonp||[]).push([[91],{1783:function(module,exports){module.exports=function(hljs){var LISP_IDENT_RE="[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#!]*",LISP_SIMPLE_NUMBER_RE="(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s|D|E|F|L|S)(\\+|\\-)?\\d+)?",LITERAL={className:"literal",begin:"\\b(t{1}|nil)\\b"},NUMBER={className:"number",variants:[{begin:LISP_SIMPLE_NUMBER_RE,relevance:0},{begin:"#(b|B)[0-1]+(/[0-1]+)?"},{begin:"#(o|O)[0-7]+(/[0-7]+)?"},{begin:"#(x|X)[0-9a-fA-F]+(/[0-9a-fA-F]+)?"},{begin:"#(c|C)\\("+LISP_SIMPLE_NUMBER_RE+" +"+LISP_SIMPLE_NUMBER_RE,end:"\\)"}]},STRING=hljs.inherit(hljs.QUOTE_STRING_MODE,{illegal:null}),COMMENT=hljs.COMMENT(";","$",{relevance:0}),VARIABLE={begin:"\\*",end:"\\*"},KEYWORD={className:"symbol",begin:"[:&]"+LISP_IDENT_RE},IDENT={begin:LISP_IDENT_RE,relevance:0},MEC={begin:"\\|[^]*?\\|"},QUOTED={contains:[NUMBER,STRING,VARIABLE,KEYWORD,{begin:"\\(",end:"\\)",contains:["self",LITERAL,STRING,NUMBER,IDENT]},IDENT],variants:[{begin:"['`]\\(",end:"\\)"},{begin:"\\(quote ",end:"\\)",keywords:{name:"quote"}},{begin:"'\\|[^]*?\\|"}]},QUOTED_ATOM={variants:[{begin:"'"+LISP_IDENT_RE},{begin:"#'"+LISP_IDENT_RE+"(::"+LISP_IDENT_RE+")*"}]},LIST={begin:"\\(\\s*",end:"\\)"},BODY={endsWithParent:!0,relevance:0};return LIST.contains=[{className:"name",variants:[{begin:LISP_IDENT_RE},{begin:"\\|[^]*?\\|"}]},BODY],BODY.contains=[QUOTED,QUOTED_ATOM,LIST,LITERAL,NUMBER,STRING,COMMENT,VARIABLE,KEYWORD,MEC,IDENT],{illegal:/\S/,contains:[NUMBER,{className:"meta",begin:"^#!",end:"$"},LITERAL,STRING,COMMENT,QUOTED,QUOTED_ATOM,LIST,IDENT]}}}}]);
//# sourceMappingURL=react-syntax-highlighter_languages_highlight_lisp.522d7603bef77a409260.bundle.js.map