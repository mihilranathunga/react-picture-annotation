(window.webpackJsonp=window.webpackJsonp||[]).push([[22],{1717:function(module,exports){module.exports=function(hljs){var KEYWORDS="div mod in and or not xor asserterror begin case do downto else end exit for if of repeat then to until while with var",COMMENT_MODES=[hljs.C_LINE_COMMENT_MODE,hljs.COMMENT(/\{/,/\}/,{relevance:0}),hljs.COMMENT(/\(\*/,/\*\)/,{relevance:10})],STRING={className:"string",begin:/'/,end:/'/,contains:[{begin:/''/}]},CHAR_STRING={className:"string",begin:/(#\d+)+/},PROCEDURE={className:"function",beginKeywords:"procedure",end:/[:;]/,keywords:"procedure|10",contains:[hljs.TITLE_MODE,{className:"params",begin:/\(/,end:/\)/,keywords:KEYWORDS,contains:[STRING,CHAR_STRING]}].concat(COMMENT_MODES)},OBJECT={className:"class",begin:"OBJECT (Table|Form|Report|Dataport|Codeunit|XMLport|MenuSuite|Page|Query) (\\d+) ([^\\r\\n]+)",returnBegin:!0,contains:[hljs.TITLE_MODE,PROCEDURE]};return{case_insensitive:!0,keywords:{keyword:KEYWORDS,literal:"false true"},illegal:/\/\*/,contains:[STRING,CHAR_STRING,{className:"number",begin:"\\b\\d+(\\.\\d+)?(DT|D|T)",relevance:0},{className:"string",begin:'"',end:'"'},hljs.NUMBER_MODE,OBJECT,PROCEDURE]}}}}]);
//# sourceMappingURL=react-syntax-highlighter_languages_highlight_cal.8ed3a1d8d98bf31ed18e.bundle.js.map