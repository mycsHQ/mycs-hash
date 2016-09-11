require=function e(n,r,t){function i(o,u){if(!r[o]){if(!n[o]){var s="function"==typeof require&&require;if(!u&&s)return s(o,!0);if(a)return a(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var c=r[o]={exports:{}};n[o][0].call(c.exports,function(e){var r=n[o][1][e];return i(r?r:e)},c,c.exports,e,n,r,t)}return r[o].exports}for(var a="function"==typeof require&&require,o=0;o<t.length;o++)i(t[o]);return i}({1:[function(e,n,r){"use strict";!function(e){function t(e,n,r){var t,i,a,o,u,b,l,p,g=0,y=[],v=0,E=!1,d=!1,A=[],H=[],S=!1;if(r=r||{},t=r.encoding||"UTF8",p=r.numRounds||1,a=h(n,t),p!==parseInt(p,10)||1>p)throw Error("numRounds must a integer >= 1");if("SHA-1"===e)u=512,b=X,l=j,o=160;else if(b=function(n,r){return L(n,r,e)},l=function(n,r,t,i){var a,o;if("SHA-224"===e||"SHA-256"===e)a=(r+65>>>9<<4)+15,o=16;else{if("SHA-384"!==e&&"SHA-512"!==e)throw Error("Unexpected error in SHA-2 implementation");a=(r+129>>>10<<5)+31,o=32}for(;n.length<=a;)n.push(0);for(n[r>>>5]|=128<<24-r%32,n[a]=r+t,t=n.length,r=0;t>r;r+=o)i=L(n.slice(r,r+o),i,e);if("SHA-224"===e)n=[i[0],i[1],i[2],i[3],i[4],i[5],i[6]];else if("SHA-256"===e)n=i;else if("SHA-384"===e)n=[i[0].a,i[0].b,i[1].a,i[1].b,i[2].a,i[2].b,i[3].a,i[3].b,i[4].a,i[4].b,i[5].a,i[5].b];else{if("SHA-512"!==e)throw Error("Unexpected error in SHA-2 implementation");n=[i[0].a,i[0].b,i[1].a,i[1].b,i[2].a,i[2].b,i[3].a,i[3].b,i[4].a,i[4].b,i[5].a,i[5].b,i[6].a,i[6].b,i[7].a,i[7].b]}return n},"SHA-224"===e)u=512,o=224;else if("SHA-256"===e)u=512,o=256;else if("SHA-384"===e)u=1024,o=384;else{if("SHA-512"!==e)throw Error("Chosen SHA variant is not supported");u=1024,o=512}i=N(e),this.setHMACKey=function(n,r,a){var o;if(!0===d)throw Error("HMAC key already set");if(!0===E)throw Error("Cannot set HMAC key after finalizing hash");if(!0===S)throw Error("Cannot set HMAC key after calling update");if(t=(a||{}).encoding||"UTF8",r=h(r,t)(n),n=r.binLen,r=r.value,o=u>>>3,a=o/4-1,n/8>o){for(r=l(r,n,0,N(e));r.length<=a;)r.push(0);r[a]&=4294967040}else if(o>n/8){for(;r.length<=a;)r.push(0);r[a]&=4294967040}for(n=0;a>=n;n+=1)A[n]=909522486^r[n],H[n]=1549556828^r[n];i=b(A,i),g=u,d=!0},this.update=function(e){var n,r,t,o=0,s=u>>>5;for(n=a(e,y,v),e=n.binLen,r=n.value,n=e>>>5,t=0;n>t;t+=s)e>=o+u&&(i=b(r.slice(t,t+s),i),o+=u);g+=o,y=r.slice(o>>>5),v=e%u,S=!0},this.getHash=function(n,r){var t,a,u;if(!0===d)throw Error("Cannot call getHash after setting HMAC key");switch(u=w(r),n){case"HEX":t=function(e){return s(e,u)};break;case"B64":t=function(e){return f(e,u)};break;case"BYTES":t=c;break;default:throw Error("format must be HEX, B64, or BYTES")}if(!1===E)for(i=l(y,v,g,i),a=1;p>a;a+=1)i=l(i,o,0,N(e));return E=!0,t(i)},this.getHMAC=function(n,r){var t,a,h;if(!1===d)throw Error("Cannot call getHMAC without first setting HMAC key");switch(h=w(r),n){case"HEX":t=function(e){return s(e,h)};break;case"B64":t=function(e){return f(e,h)};break;case"BYTES":t=c;break;default:throw Error("outputFormat must be HEX, B64, or BYTES")}return!1===E&&(a=l(y,v,g,i),i=b(H,N(e)),i=l(a,o,u,i)),E=!0,t(i)}}function i(e,n){this.a=e,this.b=n}function a(e,n,r){var t,i,a,o,u,s=e.length;if(n=n||[0],r=r||0,u=r>>>3,0!==s%2)throw Error("String of HEX type must be in byte increments");for(t=0;s>t;t+=2){if(i=parseInt(e.substr(t,2),16),isNaN(i))throw Error("String of HEX type contains invalid characters");for(o=(t>>>1)+u,a=o>>>2;n.length<=a;)n.push(0);n[a]|=i<<8*(3-o%4)}return{value:n,binLen:4*s+r}}function o(e,n,r){var t,i,a,o,u=[],u=n||[0];for(r=r||0,i=r>>>3,t=0;t<e.length;t+=1)n=e.charCodeAt(t),o=t+i,a=o>>>2,u.length<=a&&u.push(0),u[a]|=n<<8*(3-o%4);return{value:u,binLen:8*e.length+r}}function u(e,n,r){var t,i,a,o,u,s,f=[],c=0,f=n||[0];if(r=r||0,n=r>>>3,-1===e.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");if(i=e.indexOf("="),e=e.replace(/\=/g,""),-1!==i&&i<e.length)throw Error("Invalid '=' found in base-64 string");for(i=0;i<e.length;i+=4){for(u=e.substr(i,4),a=o=0;a<u.length;a+=1)t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(u[a]),o|=t<<18-6*a;for(a=0;a<u.length-1;a+=1){for(s=c+n,t=s>>>2;f.length<=t;)f.push(0);f[t]|=(o>>>16-8*a&255)<<8*(3-s%4),c+=1}}return{value:f,binLen:8*c+r}}function s(e,n){var r,t,i="",a=4*e.length;for(r=0;a>r;r+=1)t=e[r>>>2]>>>8*(3-r%4),i+="0123456789abcdef".charAt(t>>>4&15)+"0123456789abcdef".charAt(15&t);return n.outputUpper?i.toUpperCase():i}function f(e,n){var r,t,i,a="",o=4*e.length;for(r=0;o>r;r+=3)for(i=r+1>>>2,t=e.length<=i?0:e[i],i=r+2>>>2,i=e.length<=i?0:e[i],i=(e[r>>>2]>>>8*(3-r%4)&255)<<16|(t>>>8*(3-(r+1)%4)&255)<<8|i>>>8*(3-(r+2)%4)&255,t=0;4>t;t+=1)a+=8*r+6*t<=32*e.length?"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(i>>>6*(3-t)&63):n.b64Pad;return a}function c(e){var n,r,t="",i=4*e.length;for(n=0;i>n;n+=1)r=e[n>>>2]>>>8*(3-n%4)&255,t+=String.fromCharCode(r);return t}function w(e){var n={outputUpper:!1,b64Pad:"="};if(e=e||{},n.outputUpper=e.outputUpper||!1,n.b64Pad=e.b64Pad||"=","boolean"!=typeof n.outputUpper)throw Error("Invalid outputUpper formatting option");if("string"!=typeof n.b64Pad)throw Error("Invalid b64Pad formatting option");return n}function h(e,n){var r;switch(n){case"UTF8":case"UTF16BE":case"UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE")}switch(e){case"HEX":r=a;break;case"TEXT":r=function(e,r,t){var i,a,o,u,s,f=[],c=[],w=0,f=r||[0];if(r=t||0,o=r>>>3,"UTF8"===n)for(i=0;i<e.length;i+=1)for(t=e.charCodeAt(i),c=[],128>t?c.push(t):2048>t?(c.push(192|t>>>6),c.push(128|63&t)):55296>t||t>=57344?c.push(224|t>>>12,128|t>>>6&63,128|63&t):(i+=1,t=65536+((1023&t)<<10|1023&e.charCodeAt(i)),c.push(240|t>>>18,128|t>>>12&63,128|t>>>6&63,128|63&t)),a=0;a<c.length;a+=1){for(s=w+o,u=s>>>2;f.length<=u;)f.push(0);f[u]|=c[a]<<8*(3-s%4),w+=1}else if("UTF16BE"===n||"UTF16LE"===n)for(i=0;i<e.length;i+=1){for(t=e.charCodeAt(i),"UTF16LE"===n&&(a=255&t,t=a<<8|t>>>8),s=w+o,u=s>>>2;f.length<=u;)f.push(0);f[u]|=t<<8*(2-s%4),w+=2}return{value:f,binLen:8*w+r}};break;case"B64":r=u;break;case"BYTES":r=o;break;default:throw Error("format must be HEX, TEXT, B64, or BYTES")}return r}function b(e,n){return e<<n|e>>>32-n}function l(e,n){return e>>>n|e<<32-n}function p(e,n){var r=null,r=new i(e.a,e.b);return r=32>=n?new i(r.a>>>n|r.b<<32-n&4294967295,r.b>>>n|r.a<<32-n&4294967295):new i(r.b>>>n-32|r.a<<64-n&4294967295,r.a>>>n-32|r.b<<64-n&4294967295)}function g(e,n){var r=null;return r=32>=n?new i(e.a>>>n,e.b>>>n|e.a<<32-n&4294967295):new i(0,e.a>>>n-32)}function y(e,n,r){return e&n^~e&r}function v(e,n,r){return new i(e.a&n.a^~e.a&r.a,e.b&n.b^~e.b&r.b)}function E(e,n,r){return e&n^e&r^n&r}function d(e,n,r){return new i(e.a&n.a^e.a&r.a^n.a&r.a,e.b&n.b^e.b&r.b^n.b&r.b)}function A(e){return l(e,2)^l(e,13)^l(e,22)}function H(e){var n=p(e,28),r=p(e,34);return e=p(e,39),new i(n.a^r.a^e.a,n.b^r.b^e.b)}function S(e){return l(e,6)^l(e,11)^l(e,25)}function m(e){var n=p(e,14),r=p(e,18);return e=p(e,41),new i(n.a^r.a^e.a,n.b^r.b^e.b)}function T(e){return l(e,7)^l(e,18)^e>>>3}function O(e){var n=p(e,1),r=p(e,8);return e=g(e,7),new i(n.a^r.a^e.a,n.b^r.b^e.b)}function k(e){return l(e,17)^l(e,19)^e>>>10}function U(e){var n=p(e,19),r=p(e,61);return e=g(e,6),new i(n.a^r.a^e.a,n.b^r.b^e.b)}function C(e,n){var r=(65535&e)+(65535&n);return((e>>>16)+(n>>>16)+(r>>>16)&65535)<<16|65535&r}function _(e,n,r,t){var i=(65535&e)+(65535&n)+(65535&r)+(65535&t);return((e>>>16)+(n>>>16)+(r>>>16)+(t>>>16)+(i>>>16)&65535)<<16|65535&i}function x(e,n,r,t,i){var a=(65535&e)+(65535&n)+(65535&r)+(65535&t)+(65535&i);return((e>>>16)+(n>>>16)+(r>>>16)+(t>>>16)+(i>>>16)+(a>>>16)&65535)<<16|65535&a}function B(e,n){var r,t,a;return r=(65535&e.b)+(65535&n.b),t=(e.b>>>16)+(n.b>>>16)+(r>>>16),a=(65535&t)<<16|65535&r,r=(65535&e.a)+(65535&n.a)+(t>>>16),t=(e.a>>>16)+(n.a>>>16)+(r>>>16),new i((65535&t)<<16|65535&r,a)}function F(e,n,r,t){var a,o,u;return a=(65535&e.b)+(65535&n.b)+(65535&r.b)+(65535&t.b),o=(e.b>>>16)+(n.b>>>16)+(r.b>>>16)+(t.b>>>16)+(a>>>16),u=(65535&o)<<16|65535&a,a=(65535&e.a)+(65535&n.a)+(65535&r.a)+(65535&t.a)+(o>>>16),o=(e.a>>>16)+(n.a>>>16)+(r.a>>>16)+(t.a>>>16)+(a>>>16),new i((65535&o)<<16|65535&a,u)}function P(e,n,r,t,a){var o,u,s;return o=(65535&e.b)+(65535&n.b)+(65535&r.b)+(65535&t.b)+(65535&a.b),u=(e.b>>>16)+(n.b>>>16)+(r.b>>>16)+(t.b>>>16)+(a.b>>>16)+(o>>>16),s=(65535&u)<<16|65535&o,o=(65535&e.a)+(65535&n.a)+(65535&r.a)+(65535&t.a)+(65535&a.a)+(u>>>16),u=(e.a>>>16)+(n.a>>>16)+(r.a>>>16)+(t.a>>>16)+(a.a>>>16)+(o>>>16),new i((65535&u)<<16|65535&o,s)}function N(e){var n,r;if("SHA-1"===e)e=[1732584193,4023233417,2562383102,271733878,3285377520];else switch(n=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],r=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],e){case"SHA-224":e=n;break;case"SHA-256":e=r;break;case"SHA-384":e=[new i(3418070365,n[0]),new i(1654270250,n[1]),new i(2438529370,n[2]),new i(355462360,n[3]),new i(1731405415,n[4]),new i(41048885895,n[5]),new i(3675008525,n[6]),new i(1203062813,n[7])];break;case"SHA-512":e=[new i(r[0],4089235720),new i(r[1],2227873595),new i(r[2],4271175723),new i(r[3],1595750129),new i(r[4],2917565137),new i(r[5],725511199),new i(r[6],4215389547),new i(r[7],327033209)];break;default:throw Error("Unknown SHA variant")}return e}function X(e,n){var r,t,i,a,o,u,s,f=[];for(r=n[0],t=n[1],i=n[2],a=n[3],o=n[4],s=0;80>s;s+=1)f[s]=16>s?e[s]:b(f[s-3]^f[s-8]^f[s-14]^f[s-16],1),u=20>s?x(b(r,5),t&i^~t&a,o,1518500249,f[s]):40>s?x(b(r,5),t^i^a,o,1859775393,f[s]):60>s?x(b(r,5),E(t,i,a),o,2400959708,f[s]):x(b(r,5),t^i^a,o,3395469782,f[s]),o=a,a=i,i=b(t,30),t=r,r=u;return n[0]=C(r,n[0]),n[1]=C(t,n[1]),n[2]=C(i,n[2]),n[3]=C(a,n[3]),n[4]=C(o,n[4]),n}function j(e,n,r,t){var i;for(i=(n+65>>>9<<4)+15;e.length<=i;)e.push(0);for(e[n>>>5]|=128<<24-n%32,e[i]=n+r,r=e.length,n=0;r>n;n+=16)t=X(e.slice(n,n+16),t);return t}function L(e,n,r){var t,a,o,u,s,f,c,w,h,b,l,p,g,N,X,j,L,I,Y,q,z,D,K,R=[];if("SHA-224"===r||"SHA-256"===r)b=64,p=1,D=Number,g=C,N=_,X=x,j=T,L=k,I=A,Y=S,z=E,q=y,K=M;else{if("SHA-384"!==r&&"SHA-512"!==r)throw Error("Unexpected error in SHA-2 implementation");b=80,p=2,D=i,g=B,N=F,X=P,j=O,L=U,I=H,Y=m,z=d,q=v,K=J}for(r=n[0],t=n[1],a=n[2],o=n[3],u=n[4],s=n[5],f=n[6],c=n[7],l=0;b>l;l+=1)16>l?(h=l*p,w=e.length<=h?0:e[h],h=e.length<=h+1?0:e[h+1],R[l]=new D(w,h)):R[l]=N(L(R[l-2]),R[l-7],j(R[l-15]),R[l-16]),w=X(c,Y(u),q(u,s,f),K[l],R[l]),h=g(I(r),z(r,t,a)),c=f,f=s,s=u,u=g(o,w),o=a,a=t,t=r,r=g(w,h);return n[0]=g(r,n[0]),n[1]=g(t,n[1]),n[2]=g(a,n[2]),n[3]=g(o,n[3]),n[4]=g(u,n[4]),n[5]=g(s,n[5]),n[6]=g(f,n[6]),n[7]=g(c,n[7]),n}var M,J;M=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],J=[new i(M[0],3609767458),new i(M[1],602891725),new i(M[2],3964484399),new i(M[3],2173295548),new i(M[4],4081628472),new i(M[5],3053834265),new i(M[6],2937671579),new i(M[7],3664609560),new i(M[8],2734883394),new i(M[9],1164996542),new i(M[10],1323610764),new i(M[11],3590304994),new i(M[12],4068182383),new i(M[13],991336113),new i(M[14],633803317),new i(M[15],3479774868),new i(M[16],2666613458),new i(M[17],944711139),new i(M[18],2341262773),new i(M[19],2007800933),new i(M[20],1495990901),new i(M[21],1856431235),new i(M[22],3175218132),new i(M[23],2198950837),new i(M[24],3999719339),new i(M[25],766784016),new i(M[26],2566594879),new i(M[27],3203337956),new i(M[28],1034457026),new i(M[29],2466948901),new i(M[30],3758326383),new i(M[31],168717936),new i(M[32],1188179964),new i(M[33],1546045734),new i(M[34],1522805485),new i(M[35],2643833823),new i(M[36],2343527390),new i(M[37],1014477480),new i(M[38],1206759142),new i(M[39],344077627),new i(M[40],1290863460),new i(M[41],3158454273),new i(M[42],3505952657),new i(M[43],106217008),new i(M[44],3606008344),new i(M[45],1432725776),new i(M[46],1467031594),new i(M[47],851169720),new i(M[48],3100823752),new i(M[49],1363258195),new i(M[50],3750685593),new i(M[51],3785050280),new i(M[52],3318307427),new i(M[53],3812723403),new i(M[54],2003034995),new i(M[55],3602036899),new i(M[56],1575990012),new i(M[57],1125592928),new i(M[58],2716904306),new i(M[59],442776044),new i(M[60],593698344),new i(M[61],3733110249),new i(M[62],2999351573),new i(M[63],3815920427),new i(3391569614,3928383900),new i(3515267271,566280711),new i(3940187606,3454069534),new i(4118630271,4000239992),new i(116418474,1914138554),new i(174292421,2731055270),new i(289380356,3203993006),new i(460393269,320620315),new i(685471733,587496836),new i(852142971,1086792851),new i(1017036298,365543100),new i(1126000580,2618297676),new i(1288033470,3409855158),new i(1501505948,4234509866),new i(1607167915,987167468),new i(1816402316,1246189591)],"function"==typeof define&&define.amd?define(function(){return t}):"undefined"!=typeof r?"undefined"!=typeof n&&n.exports?n.exports=r=t:r=t:e.jsSHA=t}(this)},{}],2:[function(e,n,r){var t,i=function(e,n){return function(){return e.apply(n,arguments)}};t=function(){function e(){this._stringify=i(this._stringify,this),this.stringify=i(this.stringify,this),this._init()}return e.prototype.stringify=function(e){return this._init(),this._stringify({"":e},"",e,0)},e.prototype._init=function(){return this.opts={},this.space=this.opts.space||"","number"==typeof this.space&&(this.space=Array(this.space+1).join(" ")),this.cycles="boolean"==typeof this.opts.cycles?this.opts.cycles:!1,this.replacer=this.opts.replacer||function(e,n){return n},this.seen=[]},e.prototype._isArray=function(e){var n;return n=Array.isArray(e),n?n:"[object Array]"==={}.toString.call(e)},e.prototype._stringify=function(e,n,r,t){var i,a,o,u,s,f,c,w,h,b,l,p;if(o=this.space,i=this.space?": ":":",r&&r.toJSON&&"function"==typeof r.toJSON&&(r=r.toJSON()),r=this.replacer.call(e,n,r),null!=r){if("object"!=typeof r||null===r)return JSON.stringify(r);if(this._isArray(r)){for(h=[],a=s=0,b=r.length;b>=0?b>s:s>b;a=b>=0?++s:--s)u=this._stringify(r,a,r[a],t+1)||JSON.stringify(null),h.push(o+this.space+u);return h.sort(),"["+h.join(",")+o+"]"}if(-1!==this.seen.indexOf(r)){if(this.cycles)return JSON.stringify("__cycle__");throw new TypeError("Converting circular structure to JSON")}for(this.seen.push(r),w=Object.keys(r).sort(),h=[],a=f=0,l=w.length;l>=0?l>f:f>l;a=l>=0?++f:--f)n=w[a],p=this._stringify(r,n,r[n],t+1),p&&(c=JSON.stringify(n)+i+p,h.push(o+this.space+c));return"{"+h.join(",")+o+"}"}},e}(),n.exports=new t},{}],mycshash:[function(e,n,r){var t,i,a,o,u,s,f;s=e("jssha"),f=e("./stringify"),a="0.2",t="SHA-1",i="1903201500",o=function(e){if(!e.hasOwnProperty("furniture_type"))throw new Error("missing furniture_type attribute");if(!e.hasOwnProperty("camera"))throw new Error("missing camera attribute");if(!e.hasOwnProperty("structure"))throw new Error("missing structure attribute");if(!e.is_label&&e.hasOwnProperty("is_label"))throw new Error("is_label must be present with true value or not present");if(5!==Object.keys(e).length&&(3!==Object.keys(e).length||e.hasOwnProperty("is_label")||e.hasOwnProperty("stage"))&&(4!==Object.keys(e).length||e.hasOwnProperty("is_label")&&e.hasOwnProperty("stage")))throw new Error("there should exactly be the attributes camera, furniture_type, structure and optionally is_label")},u=function(e){var n,r;return o(e),r=f.stringify(e),n=new s(t,"TEXT"),n.setHMACKey(i,"TEXT"),n.update(r),n.getHMAC("HEX")},n.exports=u},{"./stringify":2,jssha:1}]},{},[2]);