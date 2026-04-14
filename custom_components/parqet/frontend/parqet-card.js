var ParqetCard=function(t){"use strict";function e(t,e,i,o){var r,s=arguments.length,n=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(s<3?r(n):s>3?r(e,i,n):r(e,i))||n);return s>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const i=globalThis,o=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),s=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(o&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new n(i,t,r)},l=o?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,r))(e)})(t):t,{is:d,defineProperty:c,getOwnPropertyDescriptor:p,getOwnPropertyNames:h,getOwnPropertySymbols:v,getPrototypeOf:u}=Object,m=globalThis,_=m.trustedTypes,g=_?_.emptyScript:"",f=m.reactiveElementPolyfillSupport,y=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!d(t,e),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=x){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&c(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:r}=p(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const s=o?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??x}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...h(t),...v(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(l(t))}else void 0!==t&&e.push(l(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(o)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const o of e){const e=document.createElement("style"),r=i.litNonce;void 0!==r&&e.setAttribute("nonce",r),e.textContent=o.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=o;const s=r.fromAttribute(e,t.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(t,e,i,o=!1,r){if(void 0!==t){const s=this.constructor;if(!1===o&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??$)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[y("elementProperties")]=new Map,w[y("finalized")]=new Map,f?.({ReactiveElement:w}),(m.reactiveElementVersions??=[]).push("2.1.2");const A=globalThis,k=t=>t,S=A.trustedTypes,E=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,z="?"+P,I=`<${z}>`,M=document,q=()=>M.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,N="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,H=/>/g,R=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),G=/'/g,L=/"/g,j=/^(?:script|style|textarea|title)$/i,V=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),F=V(1),B=V(2),W=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),J=new WeakMap,K=M.createTreeWalker(M,129);function X(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,o=[];let r,s=2===e?"<svg>":3===e?"<math>":"",n=D;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===D?"!--"===l[1]?n=T:void 0!==l[1]?n=H:void 0!==l[2]?(j.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=R):void 0!==l[3]&&(n=R):n===R?">"===l[0]?(n=r??D,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?R:'"'===l[3]?L:G):n===L||n===G?n=R:n===T||n===H?n=D:(n=R,r=void 0);const p=n===R&&t[e+1].startsWith("/>")?" ":"";s+=n===D?i+I:d>=0?(o.push(a),i.slice(0,d)+C+i.slice(d)+P+p):i+P+(-2===d?e:p)}return[X(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class Q{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,s=0;const n=t.length-1,a=this.parts,[l,d]=Z(t,e);if(this.el=Q.createElement(l,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=K.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(C)){const e=d[s++],i=o.getAttribute(t).split(P),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?rt:"?"===n[1]?st:"@"===n[1]?nt:ot}),o.removeAttribute(t)}else t.startsWith(P)&&(a.push({type:6,index:r}),o.removeAttribute(t));if(j.test(o.tagName)){const t=o.textContent.split(P),e=t.length-1;if(e>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],q()),K.nextNode(),a.push({type:2,index:++r});o.append(t[e],q())}}}else if(8===o.nodeType)if(o.data===z)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(P,t+1));)a.push({type:7,index:r}),t+=P.length-1}r++}}static createElement(t,e){const i=M.createElement("template");return i.innerHTML=t,i}}function tt(t,e,i=t,o){if(e===W)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=O(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=tt(t,r._$AS(t,e.values),r,o)),e}class et{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??M).importNode(e,!0);K.currentNode=o;let r=K.nextNode(),s=0,n=0,a=i[0];for(;void 0!==a;){if(s===a.index){let e;2===a.type?e=new it(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new at(r,this,t)),this._$AV.push(e),a=i[++n]}s!==a?.index&&(r=K.nextNode(),s++)}return K.currentNode=M,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class it{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=tt(this,t,e),O(t)?t===Y||null==t||""===t?(this._$AH!==Y&&this._$AR(),this._$AH=Y):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Y&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(M.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Q.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new et(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=J.get(t.strings);return void 0===e&&J.set(t.strings,e=new Q(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new it(this.O(q()),this.O(q()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class ot{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(t,e=this,i,o){const r=this.strings;let s=!1;if(void 0===r)t=tt(this,t,e,0),s=!O(t)||t!==this._$AH&&t!==W,s&&(this._$AH=t);else{const o=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=tt(this,o[i+n],e,n),a===W&&(a=this._$AH[n]),s||=!O(a)||a!==this._$AH[n],a===Y?t=Y:t!==Y&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}s&&!o&&this.j(t)}j(t){t===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class rt extends ot{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Y?void 0:t}}class st extends ot{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Y)}}class nt extends ot{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=tt(this,t,e,0)??Y)===W)return;const i=this._$AH,o=t===Y&&i!==Y||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==Y&&(i===Y||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){tt(this,t)}}const lt=A.litHtmlPolyfillSupport;lt?.(Q,it),(A.litHtmlVersions??=[]).push("3.3.2");const dt=globalThis;class ct extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=i?.renderBefore??null;o._$litPart$=r=new it(e.insertBefore(q(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ct._$litElement$=!0,ct.finalized=!0,dt.litElementHydrateSupport?.({LitElement:ct});const pt=dt.litElementPolyfillSupport;pt?.({LitElement:ct}),(dt.litElementVersions??=[]).push("4.2.2");const ht={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:$},vt=(t=ht,e,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,r,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];e.call(this,i),this.requestUpdate(o,r,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ut(t){return(e,i)=>"object"==typeof i?vt(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function mt(t){return ut({...t,state:!0,attribute:!1})}const _t=[{value:"1d",label:"1D"},{value:"1w",label:"1W"},{value:"mtd",label:"MTD"},{value:"1m",label:"1M"},{value:"3m",label:"3M"},{value:"6m",label:"6M"},{value:"1y",label:"1Y"},{value:"ytd",label:"YTD"},{value:"3y",label:"3Y"},{value:"5y",label:"5Y"},{value:"10y",label:"10Y"},{value:"max",label:"Max"}],gt=["total_value","xirr","ttwror","unrealized_gain","realized_gain","dividends","fees","taxes","valuation_start","unrealized_gain_net","unrealized_return_gross","unrealized_return_net","realized_gain_net","realized_return_gross","realized_return_net","dividends_net","dividends_taxes","dividends_fees","holdings_count","net_allocation","positive_allocation","negative_allocation"];function ft(t){for(const e of gt)if(t.endsWith("_"+e))return e;return null}function yt(t,e){return t.entities?function(t,e){var i,o,r,s;const n=new Map;for(const i of Object.values(t.entities))"parqet"===i.platform&&i.device_id&&(e&&i.device_id!==e||(n.has(i.device_id)||n.set(i.device_id,[]),n.get(i.device_id).push({entity_id:i.entity_id,unique_id:i.unique_id})));const a=[];for(const[e,l]of n){const n=null!==(r=null===(o=null===(i=t.devices)||void 0===i?void 0:i[e])||void 0===o?void 0:o.name)&&void 0!==r?r:e,d={};let c=null;for(const{entity_id:e,unique_id:i}of l){const o=t.states[e];if(o&&(!c&&(null===(s=o.attributes)||void 0===s?void 0:s.entry_id)&&(c=o.attributes.entry_id),i)){const t=ft(i);t&&(d[t]=o)}}c&&a.push({entryId:c,name:n,entityPrefix:null,sensors:d})}return a}(t,e):function(t){const e=new Map,i=12;for(const[o,r]of Object.entries(t.states)){if(!o.startsWith("sensor.")||!o.includes("_total_value"))continue;const s=r.attributes,n=o.slice(0,o.length-i),a=n+"_",l={};for(const[e,i]of Object.entries(t.states))e.startsWith(a)&&(l[e.slice(a.length)]=i);if(Object.keys(l).length<3)continue;const d=s.entry_id||n,c=(n.replace("sensor.","")||"Portfolio").split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ");e.set(n,{entryId:d,name:c,entityPrefix:n,sensors:l})}return Array.from(e.values())}(t)}class bt extends ct{render(){return F`
      <div class="container" role="status" aria-label="Loading">
        <div class="spinner"></div>
      </div>
    `}}function $t(t,e="€"){return null==t?"—":`${e}${t.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function xt(t){return null==t?"—":`${t>=0?"+":""}${t.toFixed(2)}%`}function wt(t){return null==t?"":t>0?"positive":t<0?"negative":""}bt.styles=a`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--divider-color, #e0e0e0);
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,customElements.get("parqet-loading-spinner")||customElements.define("parqet-loading-spinner",bt);class At extends ct{constructor(){super(...arguments),this.selected="1y"}_select(t){this.selected=t,this.dispatchEvent(new CustomEvent("interval-change",{detail:{interval:t},bubbles:!0,composed:!0}))}render(){return F`
      <div class="intervals" role="group" aria-label="Time interval">
        ${_t.map(({value:t,label:e})=>F`
            <button
              class="btn ${this.selected===t?"active":""}"
              @click=${()=>this._select(t)}
              aria-pressed=${this.selected===t}
            >
              ${e}
            </button>
          `)}
      </div>
    `}}At.styles=a`
    .intervals {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 8px 16px;
    }
    .btn {
      padding: 3px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      background: none;
      color: var(--secondary-text-color);
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn.active {
      background: var(--primary-color, #03a9f4);
      color: white;
      border-color: var(--primary-color, #03a9f4);
    }
    .btn:hover:not(.active) {
      color: var(--primary-text-color);
      border-color: var(--primary-text-color);
    }
    .btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }
  `,e([ut()],At.prototype,"selected",void 0),customElements.get("parqet-interval-selector")||customElements.define("parqet-interval-selector",At);class kt extends ct{constructor(){super(...arguments),this.segments=[],this.currencySymbol="€"}_fmt(t){return`${t<0?"−":""}${this.currencySymbol}${Math.abs(t).toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:0})}`}render(){const t=this.segments.filter(t=>0!==t.value);if(0===t.length)return F`<div class="empty">No data</div>`;const e=t.reduce((t,e)=>t+Math.abs(e.value),0);if(0===e)return F`<div class="empty">No data</div>`;const i=t.map(t=>Object.assign(Object.assign({},t),{pct:Math.abs(t.value)/e*100}));return F`
      <div class="chart-container">
        <div class="bar-track">
          ${i.map((t,e)=>F`
              <div
                class="bar-seg"
                style="width:${t.pct}%;background:${t.color};
                  ${0===e?"border-radius:4px 0 0 4px;":""}
                  ${e===i.length-1?"border-radius:0 4px 4px 0;":""}
                  ${1===i.length?"border-radius:4px;":""}"
                title="${t.label}: ${this._fmt(t.value)} (${t.pct.toFixed(1)}%)"
              ></div>
            `)}
        </div>
        <div class="legend">
          ${i.map(t=>F`
              <div class="legend-item">
                <span class="dot" style="background:${t.color}"></span>
                <span class="legend-label">${t.label}</span>
                <span class="legend-value">${this._fmt(t.value)}</span>
              </div>
            `)}
        </div>
      </div>
    `}}kt.styles=a`
    :host {
      display: block;
      overflow: hidden;
      min-width: 0;
    }
    .chart-container {
      padding: 8px 16px 16px;
    }
    .bar-track {
      display: flex;
      height: ${18}px;
      border-radius: ${4}px;
      overflow: hidden;
    }
    .bar-seg {
      min-width: 2px;
      opacity: 0.85;
      transition: opacity 0.15s;
    }
    .bar-seg:hover {
      opacity: 1;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin-top: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      color: var(--secondary-text-color, #757575);
    }
    .legend-value {
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--primary-text-color, #212121);
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.82rem;
    }
  `,e([ut({type:Array})],kt.prototype,"segments",void 0),e([ut({type:String})],kt.prototype,"currencySymbol",void 0),customElements.get("parqet-stacked-bar")||customElements.define("parqet-stacked-bar",kt);class St extends ct{constructor(){super(...arguments),this._interval="1y",this._wsData=null,this._loading=!1,this._error=""}connectedCallback(){var t,e;super.connectedCallback(),this._interval=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_interval)&&void 0!==e?e:"1y"}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_getData(){var t,e,i,o,r,s,n,a,l,d,c,p,h,v,u;if(this._wsData)return this._wsData;const m=this.portfolio.sensors,_=t=>{var e;return function(t){if(!t||"unavailable"===t||"unknown"===t)return null;const e=parseFloat(t);return isNaN(e)?null:e}(null===(e=m[t])||void 0===e?void 0:e.state)},g=_("total_value");return null==g?null:{kpis:{inInterval:{xirr:_("xirr"),ttwror:_("ttwror")}},fees:{inInterval:{fees:null!==(t=_("fees"))&&void 0!==t?t:0}},taxes:{inInterval:{taxes:null!==(e=_("taxes"))&&void 0!==e?e:0}},unrealizedGains:{inInterval:{gainGross:null!==(i=_("unrealized_gain"))&&void 0!==i?i:0,gainNet:null!==(o=_("unrealized_gain_net"))&&void 0!==o?o:0,returnGross:null!==(r=_("unrealized_return_gross"))&&void 0!==r?r:0,returnNet:null!==(s=_("unrealized_return_net"))&&void 0!==s?s:0}},realizedGains:{inInterval:{gainGross:null!==(n=_("realized_gain"))&&void 0!==n?n:0,gainNet:null!==(a=_("realized_gain_net"))&&void 0!==a?a:0,returnGross:null!==(l=_("realized_return_gross"))&&void 0!==l?l:0,returnNet:null!==(d=_("realized_return_net"))&&void 0!==d?d:0}},dividends:{inInterval:{gainGross:null!==(c=_("dividends"))&&void 0!==c?c:0,gainNet:null!==(p=_("dividends_net"))&&void 0!==p?p:0,taxes:null!==(h=_("dividends_taxes"))&&void 0!==h?h:0,fees:null!==(v=_("dividends_fees"))&&void 0!==v?v:0}},valuation:{atIntervalStart:null!==(u=_("valuation_start"))&&void 0!==u?u:0,atIntervalEnd:g}}}async _onIntervalChange(t){this._interval=t.detail.interval,this._loading=!0,this._error="";try{const t=await this.hass.connection.sendMessagePromise({type:"parqet/get_performance",entry_id:this.portfolio.entryId,interval:this._interval});this._wsData=t.performance}catch(t){this._error="Failed to load performance data",this._wsData=null}finally{this._loading=!1}}render(){var t,e,i,o,r,s,n,a,l,d,c,p,h,v,u,m,_,g,f,y,b,$,x,w,A,k,S,E;const C=this._getData();return F`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?F`
        <parqet-interval-selector
          .selected=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-interval-selector>
      `:""}

      ${this._error?F`<div class="error" role="alert">${this._error}</div>`:""}
      ${this._loading?F`<parqet-loading-spinner></parqet-loading-spinner>`:""}

      ${C?F`
        <div class="kpi-grid ${(null===(e=this.config)||void 0===e?void 0:e.compact)?"compact":""}">
          ${this._kpi("Total Value",$t(null===(i=C.valuation)||void 0===i?void 0:i.atIntervalEnd,this._sym()))}
          ${this._kpi("XIRR",xt(null===(r=null===(o=C.kpis)||void 0===o?void 0:o.inInterval)||void 0===r?void 0:r.xirr),null===(n=null===(s=C.kpis)||void 0===s?void 0:s.inInterval)||void 0===n?void 0:n.xirr)}
          ${this._kpi("TTWROR",xt(null===(l=null===(a=C.kpis)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.ttwror),null===(c=null===(d=C.kpis)||void 0===d?void 0:d.inInterval)||void 0===c?void 0:c.ttwror)}
          ${this._kpi("Unrealized Gain",$t(null===(h=null===(p=C.unrealizedGains)||void 0===p?void 0:p.inInterval)||void 0===h?void 0:h.gainGross,this._sym()),null===(u=null===(v=C.unrealizedGains)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.gainGross)}
          ${(()=>{var t,e,i,o;const r=null!==(e=null===(t=C.valuation)||void 0===t?void 0:t.atIntervalStart)&&void 0!==e?e:0,s=null!==(o=null===(i=C.valuation)||void 0===i?void 0:i.atIntervalEnd)&&void 0!==o?o:0,n=r>0?(s-r)/r*100:null;return this._kpi("Period Return",xt(n),n)})()}
          ${this._kpi("Realized Gain",$t(null===(_=null===(m=C.realizedGains)||void 0===m?void 0:m.inInterval)||void 0===_?void 0:_.gainGross,this._sym()),null===(f=null===(g=C.realizedGains)||void 0===g?void 0:g.inInterval)||void 0===f?void 0:f.gainGross)}
          ${this._kpi("Dividends",$t(null===(b=null===(y=C.dividends)||void 0===y?void 0:y.inInterval)||void 0===b?void 0:b.gainGross,this._sym()))}
          ${this._kpi("Fees",$t(null===(x=null===($=C.fees)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.fees,this._sym()))}
          ${this._kpi("Taxes",$t(null===(A=null===(w=C.taxes)||void 0===w?void 0:w.inInterval)||void 0===A?void 0:A.taxes,this._sym()))}
        </div>
        ${!1!==(null!==(S=null===(k=this.config)||void 0===k?void 0:k.show_performance_chart)&&void 0!==S?S:null===(E=this.config)||void 0===E?void 0:E.show_chart)?this._renderChart(C):""}
      `:this._loading?"":F`<div class="empty">No data available.</div>`}
    `}_kpi(t,e,i){return F`
      <div class="kpi-tile">
        <div class="kpi-label">${t}</div>
        <div class="kpi-value ${wt(i)}">${e}</div>
      </div>
    `}_renderChart(t){var e,i,o,r,s,n,a,l,d,c,p,h,v,u,m;const _=[{label:"Unrealized",value:null!==(o=null===(i=null===(e=t.unrealizedGains)||void 0===e?void 0:e.inInterval)||void 0===i?void 0:i.gainGross)&&void 0!==o?o:0,color:"var(--success-color, #4caf50)"},{label:"Realized",value:null!==(n=null===(s=null===(r=t.realizedGains)||void 0===r?void 0:r.inInterval)||void 0===s?void 0:s.gainGross)&&void 0!==n?n:0,color:"#4285f4"},{label:"Dividends",value:null!==(d=null===(l=null===(a=t.dividends)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.gainGross)&&void 0!==d?d:0,color:"#46bdc6"},{label:"Fees",value:-(null!==(h=null===(p=null===(c=t.fees)||void 0===c?void 0:c.inInterval)||void 0===p?void 0:p.fees)&&void 0!==h?h:0),color:"#ff6d01"},{label:"Taxes",value:-(null!==(m=null===(u=null===(v=t.taxes)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.taxes)&&void 0!==m?m:0),color:"var(--error-color, #f44336)"}].filter(t=>0!==t.value);return 0===_.length?"":F`<parqet-stacked-bar .segments=${_} .currencySymbol=${this._sym()}></parqet-stacked-bar>`}}St.styles=a`
    :host { display: block; overflow: hidden; min-width: 0; }
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px; padding: 8px 16px 16px;
    }
    .kpi-grid.compact { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 4px; padding: 6px 10px 10px; }
    .kpi-tile { background: var(--secondary-background-color, #f5f5f5); border-radius: 8px; padding: 10px 12px; }
    .kpi-grid.compact .kpi-tile { padding: 6px 8px; border-radius: 6px; }
    .kpi-label { font-size: 0.68rem; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .kpi-grid.compact .kpi-label { font-size: 0.6rem; margin-bottom: 2px; }
    .kpi-value { font-size: 0.95rem; font-weight: 600; color: var(--primary-text-color); }
    .kpi-grid.compact .kpi-value { font-size: 0.8rem; }
    .kpi-value.positive { color: var(--success-color, #4caf50); }
    .kpi-value.negative { color: var(--error-color, #f44336); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `,e([ut({attribute:!1})],St.prototype,"hass",void 0),e([ut({attribute:!1})],St.prototype,"portfolio",void 0),e([ut({attribute:!1})],St.prototype,"config",void 0),e([mt()],St.prototype,"_interval",void 0),e([mt()],St.prototype,"_wsData",void 0),e([mt()],St.prototype,"_loading",void 0),e([mt()],St.prototype,"_error",void 0),customElements.get("parqet-performance-view")||customElements.define("parqet-performance-view",St);const Et=160,Ct=2*Math.PI*66;class Pt extends ct{constructor(){super(...arguments),this.segments=[],this.centerLabel="",this.centerSub=""}render(){const t=this.segments.reduce((t,e)=>t+Math.abs(e.value),0);if(0===t||0===this.segments.length)return F`<div class="empty">No data</div>`;const e=80;let i=0;return F`
      <div class="chart-container">
        <svg viewBox="0 0 ${Et} ${Et}" class="donut" role="img" aria-label="Portfolio allocation chart">
          ${this.segments.map(o=>{const r=Math.abs(o.value)/t,s=r*Ct,n=Ct-s,a=i/t*360-90;return i+=Math.abs(o.value),B`
              <circle
                cx="${e}" cy="${e}" r="${66}"
                fill="none"
                stroke="${o.color}"
                stroke-width="${28}"
                stroke-dasharray="${s} ${n}"
                transform="rotate(${a} ${e} ${e})"
                opacity="0.85"
              >
                <title>${o.label}: ${(100*r).toFixed(1)}%</title>
              </circle>
            `})}
          ${this.centerLabel?B`
                <text x="${e}" y="${e}" text-anchor="middle" dominant-baseline="central" class="center-text">
                  <tspan x="${e}" dy="-0.3em" class="center-val">${this.centerLabel}</tspan>
                  ${this.centerSub?B`<tspan x="${e}" dy="1.3em" class="center-sub">${this.centerSub}</tspan>`:""}
                </text>
              `:""}
        </svg>
        <div class="legend">
          ${this.segments.map(e=>{const i=Math.abs(e.value)/t*100;return F`
              <div class="legend-item">
                <span class="legend-dot" style="background:${e.color}"></span>
                <span class="legend-label">${e.label}</span>
                <span class="legend-pct">${i.toFixed(1)}%</span>
              </div>
            `})}
        </div>
      </div>
    `}}Pt.styles=a`
    :host { display: block; overflow: hidden; min-width: 0; }
    .chart-container {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      max-width: 100%;
      box-sizing: border-box;
    }
    .donut {
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }
    .center-text { pointer-events: none; }
    .center-val {
      font-size: 14px;
      font-weight: 600;
      fill: var(--primary-text-color, #333);
    }
    .center-sub {
      font-size: 9px;
      fill: var(--secondary-text-color, #757575);
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      color: var(--primary-text-color);
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .legend-pct {
      flex-shrink: 0;
      color: var(--secondary-text-color);
      font-variant-numeric: tabular-nums;
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.82rem;
    }
  `,e([ut({type:Array})],Pt.prototype,"segments",void 0),e([ut({type:String})],Pt.prototype,"centerLabel",void 0),e([ut({type:String})],Pt.prototype,"centerSub",void 0),customElements.get("parqet-donut-chart")||customElements.define("parqet-donut-chart",Pt);const zt=["#4285f4","#ea4335","#fbbc04","#34a853","#ff6d01","#46bdc6","#9c27b0","#795548","#607d8b","#e91e63","#00bcd4","#8bc34a","#ff5722","#3f51b5","#cddc39","#009688","#ffc107","#673ab7","#03a9f4","#ff9800"];class It extends ct{constructor(){super(...arguments),this._holdings=[],this._loading=!1,this._error="",this._interval="max",this._sortBy="value",this._sortAsc=!1,this._expandedId=null,this._fetchGen=0}connectedCallback(){var t,e;super.connectedCallback(),this._interval=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_interval)&&void 0!==e?e:"max",this._load()}updated(t){t.has("portfolio")&&this._load()}async _load(){if(!this.hass||!this.portfolio)return;const t=++this._fetchGen;this._loading=!0,this._error="";try{const e=await this.hass.connection.sendMessagePromise({type:"parqet/get_performance",entry_id:this.portfolio.entryId,interval:this._interval});if(t!==this._fetchGen)return;this._holdings=(e.holdings||[]).filter(t=>{var e;return!(null===(e=t.position)||void 0===e?void 0:e.isSold)})}catch(e){if(t!==this._fetchGen)return;this._error="Failed to load holdings"}finally{t===this._fetchGen&&(this._loading=!1)}}async _onIntervalChange(t){return this._interval=t.detail.interval,this._load()}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_totalValue(){return this._holdings.reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0)}_sorted(t){const e=[...this._holdings].sort((e,i)=>{var o,r,s,n,a,l,d,c,p,h,v,u,m,_,g,f,y,b,$,x,w,A,k,S,E,C,P,z;switch(this._sortBy){case"name":return(null!==(r=null===(o=e.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"").localeCompare(null!==(n=null===(s=i.asset)||void 0===s?void 0:s.name)&&void 0!==n?n:"");case"value":return(null!==(l=null===(a=i.position)||void 0===a?void 0:a.currentValue)&&void 0!==l?l:0)-(null!==(c=null===(d=e.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0);case"pl":return(null!==(u=null===(v=null===(h=null===(p=i.performance)||void 0===p?void 0:p.unrealizedGains)||void 0===h?void 0:h.inInterval)||void 0===v?void 0:v.gainGross)&&void 0!==u?u:0)-(null!==(f=null===(g=null===(_=null===(m=e.performance)||void 0===m?void 0:m.unrealizedGains)||void 0===_?void 0:_.inInterval)||void 0===g?void 0:g.gainGross)&&void 0!==f?f:0);case"plPct":return(null!==(x=null===($=null===(b=null===(y=i.performance)||void 0===y?void 0:y.unrealizedGains)||void 0===b?void 0:b.inInterval)||void 0===$?void 0:$.returnGross)&&void 0!==x?x:0)-(null!==(S=null===(k=null===(A=null===(w=e.performance)||void 0===w?void 0:w.unrealizedGains)||void 0===A?void 0:A.inInterval)||void 0===k?void 0:k.returnGross)&&void 0!==S?S:0);case"weight":{const o=t>0?(null!==(C=null===(E=e.position)||void 0===E?void 0:E.currentValue)&&void 0!==C?C:0)/t:0;return(t>0?(null!==(z=null===(P=i.position)||void 0===P?void 0:P.currentValue)&&void 0!==z?z:0)/t:0)-o}default:return 0}});return this._sortAsc?e.reverse():e}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t;return F`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?F`
        <parqet-interval-selector
          .selected=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-interval-selector>
      `:""}

      ${this._loading?F`<parqet-loading-spinner></parqet-loading-spinner>`:""}
      ${this._error?F`<div class="error" role="alert">${this._error}</div>`:""}
      ${this._loading||this._error||this._holdings.length?"":F`<div class="empty">No holdings found.</div>`}

      ${this._loading||this._error||!this._holdings.length?"":(()=>{var t,e,i,o,r;const s=this._totalValue(),n=null!==(e=null===(t=this.config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,a=this._sorted(s).slice(0,n);return F`
      ${!1!==(null!==(o=null===(i=this.config)||void 0===i?void 0:i.show_allocation_chart)&&void 0!==o?o:null===(r=this.config)||void 0===r?void 0:r.show_chart)?F`
        <parqet-donut-chart
          .segments=${(()=>{const t=a.slice(0,20).map((t,e)=>{var i,o,r,s,n;return{label:null!==(r=null!==(i=t.nickname)&&void 0!==i?i:null===(o=t.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"Unknown",value:null!==(n=null===(s=t.position)||void 0===s?void 0:s.currentValue)&&void 0!==n?n:0,color:zt[e%zt.length]}});if(a.length>20){const e=a.slice(20).reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0);e>0&&t.push({label:"Other",value:e,color:"#9e9e9e"})}return t})()}
        ></parqet-donut-chart>
      `:""}

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click=${()=>this._toggleSort("name")}>Name</th>
              <th class="sortable num" @click=${()=>this._toggleSort("value")}>Value</th>
              <th class="sortable num" @click=${()=>this._toggleSort("pl")}>P&amp;L</th>
              <th class="sortable num" @click=${()=>this._toggleSort("plPct")}>P&amp;L%</th>
              <th class="sortable num" @click=${()=>this._toggleSort("weight")}>Weight</th>
            </tr>
          </thead>
          <tbody>
            ${a.map(t=>{var e,i,o,r,n,a,l,d,c,p,h,v,u,m,_,g,f,y,b,$,x,w,A,k,S,E,C;const P=null!==(r=null===(o=null===(i=null===(e=t.performance)||void 0===e?void 0:e.unrealizedGains)||void 0===i?void 0:i.inInterval)||void 0===o?void 0:o.gainGross)&&void 0!==r?r:0,z=null===(l=null===(a=null===(n=t.performance)||void 0===n?void 0:n.unrealizedGains)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.returnGross,I=s>0?(null!==(c=null===(d=t.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0)/s*100:0,M=this._expandedId===t.id;return F`
                <tr class="holding-row ${M?"expanded":""}" @click=${()=>this._expandedId=M?null:t.id}>
                  <td>
                    <div class="holding-name">
                      ${!1!==(null===(p=this.config)||void 0===p?void 0:p.show_logo)&&t.logo?F`<img class="logo" src=${t.logo} alt="" />`:""}
                      <span>${null!==(u=null!==(h=t.nickname)&&void 0!==h?h:null===(v=t.asset)||void 0===v?void 0:v.name)&&void 0!==u?u:"Unknown"}</span>
                    </div>
                  </td>
                  <td class="num">${$t(null===(m=t.position)||void 0===m?void 0:m.currentValue,this._sym())}</td>
                  <td class="num ${wt(P)}">${$t(P,this._sym())}</td>
                  <td class="num ${wt(z)}">${xt(z)}</td>
                  <td class="num">${I.toFixed(1)}%</td>
                </tr>
                ${M?F`
                  <tr class="detail-row">
                    <td colspan="5">
                      <div class="detail-grid">
                        <span>Shares: ${null===(g=null===(_=t.position)||void 0===_?void 0:_.shares)||void 0===g?void 0:g.toFixed(4)}</span>
                        <span>Avg Price: ${$t(null===(f=t.position)||void 0===f?void 0:f.purchasePrice,this._sym())}</span>
                        <span>Current: ${$t(null===(y=t.position)||void 0===y?void 0:y.currentPrice,this._sym())}</span>
                        <span>XIRR: ${xt(null===(x=null===($=null===(b=t.performance)||void 0===b?void 0:b.kpis)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.xirr)}</span>
                        <span>Dividends: ${$t(null===(k=null===(A=null===(w=t.performance)||void 0===w?void 0:w.dividends)||void 0===A?void 0:A.inInterval)||void 0===k?void 0:k.gainGross,this._sym())}</span>
                        <span>Fees: ${$t(null===(C=null===(E=null===(S=t.performance)||void 0===S?void 0:S.fees)||void 0===E?void 0:E.inInterval)||void 0===C?void 0:C.fees,this._sym())}</span>
                      </div>
                    </td>
                  </tr>
                `:""}
              `})}
          </tbody>
        </table>
      </div>
        `})()}
    `}}It.styles=a`
    :host { display: block; overflow: hidden; }
    .table-wrap { overflow-x: auto; padding: 0 8px 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { text-align: left; padding: 6px 8px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--secondary-text-color); border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    th.num { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .sortable { cursor: pointer; }
    .sortable:hover { color: var(--primary-color); }
    .holding-row { cursor: pointer; }
    .holding-row:hover { background: var(--secondary-background-color, #f5f5f5); }
    .holding-name { display: flex; align-items: center; gap: 8px; }
    .logo { width: 20px; height: 20px; border-radius: 4px; object-fit: contain; }
    .detail-row td { padding: 8px 12px; background: var(--secondary-background-color, #f5f5f5); }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px; font-size: 0.75rem; color: var(--secondary-text-color); }
    .positive { color: var(--success-color, #4caf50); }
    .negative { color: var(--error-color, #f44336); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `,e([ut({attribute:!1})],It.prototype,"hass",void 0),e([ut({attribute:!1})],It.prototype,"portfolio",void 0),e([ut({attribute:!1})],It.prototype,"config",void 0),e([mt()],It.prototype,"_holdings",void 0),e([mt()],It.prototype,"_loading",void 0),e([mt()],It.prototype,"_error",void 0),e([mt()],It.prototype,"_interval",void 0),e([mt()],It.prototype,"_sortBy",void 0),e([mt()],It.prototype,"_sortAsc",void 0),e([mt()],It.prototype,"_expandedId",void 0),customElements.get("parqet-holdings-view")||customElements.define("parqet-holdings-view",It);const Mt=[{value:"all",label:"All"},{value:"buy",label:"Buy"},{value:"sell",label:"Sell"},{value:"dividend",label:"Dividend"},{value:"interest",label:"Interest"},{value:"transfer_in",label:"Transfer In"},{value:"transfer_out",label:"Transfer Out"},{value:"fees_taxes",label:"Fees/Taxes"},{value:"deposit",label:"Deposit"},{value:"withdrawal",label:"Withdrawal"}],qt={buy:"#4caf50",sell:"#f44336",dividend:"#46bdc6",interest:"#9c27b0",transfer_in:"#4285f4",transfer_out:"#ff6d01",fees_taxes:"#ff9800",deposit:"#4caf50",withdrawal:"#f44336"};class Ot extends ct{constructor(){super(...arguments),this._activities=[],this._holdingsMap=new Map,this._loading=!1,this._error="",this._filter="all",this._cursor=null,this._hasMore=!1}connectedCallback(){var t,e;super.connectedCallback(),this._filter=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_activity_type)&&void 0!==e?e:"all",this._load()}updated(t){t.has("portfolio")&&this._load()}async _loadHoldingsMap(){var t,e,i;if(!(this._holdingsMap.size>0))try{const o=await this.hass.connection.sendMessagePromise({type:"parqet/get_holdings",entry_id:this.portfolio.entryId}),r=new Map;for(const s of o.holdings||[])s.id&&r.set(s.id,null!==(i=null!==(t=s.nickname)&&void 0!==t?t:null===(e=s.asset)||void 0===e?void 0:e.name)&&void 0!==i?i:"Unknown");this._holdingsMap=r}catch(t){}}async _load(t=!1){var e,i;if(this.hass&&this.portfolio){this._loading=!0,this._error="",await this._loadHoldingsMap();try{const o={type:"parqet/get_activities",entry_id:this.portfolio.entryId,limit:null!==(i=null===(e=this.config)||void 0===e?void 0:e.activities_limit)&&void 0!==i?i:25};"all"!==this._filter&&(o.activity_type=[this._filter]),t&&this._cursor&&(o.cursor=this._cursor);const r=await this.hass.connection.sendMessagePromise(o);this._activities=t?[...this._activities,...r.activities]:r.activities,this._cursor=r.cursor,this._hasMore=!!r.cursor}catch(t){this._error="Failed to load activities"}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_onFilterChange(t){this._filter=t,this._cursor=null,this._load()}render(){return F`
      <div class="filters">
        ${Mt.map(t=>F`
          <button
            class="chip ${this._filter===t.value?"active":""}"
            @click=${()=>this._onFilterChange(t.value)}
          >${t.label}</button>
        `)}
      </div>

      ${this._error?F`<div class="error">${this._error}</div>`:""}

      ${0!==this._activities.length||this._loading?F`
          <div class="activity-list">
            ${this._activities.map(t=>this._renderActivity(t))}
          </div>
        `:F`<div class="empty">No activities found.</div>`}

      ${this._loading?F`<parqet-loading-spinner></parqet-loading-spinner>`:""}

      ${this._hasMore&&!this._loading?F`
        <button class="load-more" @click=${()=>this._load(!0)}>Load more</button>
      `:""}
    `}_resolveAssetName(t){var e,i,o;if(t.holdingId&&this._holdingsMap.has(t.holdingId))return this._holdingsMap.get(t.holdingId);const r=t.asset;return r&&null!==(o=null!==(i=null!==(e=r.name)&&void 0!==e?e:r.symbol)&&void 0!==i?i:r.isin)&&void 0!==o?o:"Unknown"}_renderActivity(t){var e;const i=null!==(e=qt[t.type])&&void 0!==e?e:"var(--secondary-text-color)",o=t.type.replace("_"," "),r=this._resolveAssetName(t);return F`
      <div class="activity">
        <div class="activity-left">
          <span class="badge" style="background: ${i}">${o}</span>
          <div class="activity-info">
            <span class="asset-name">${r}</span>
            <span class="activity-meta">
              ${function(t){try{return new Date(t).toLocaleDateString(void 0,{year:"numeric",month:"short",day:"numeric"})}catch(e){return t}}(t.datetime)}${t.broker?` · ${t.broker}`:""}
            </span>
          </div>
        </div>
        <div class="activity-right">
          <span class="amount">${$t(t.amount,this._sym())}</span>
          ${t.shares?F`<span class="shares">${t.shares} @ ${$t(t.price,this._sym())}</span>`:""}
          ${t.tax?F`<span class="tax-fee">Tax: ${$t(t.tax,this._sym())}</span>`:""}
          ${t.fee?F`<span class="tax-fee">Fee: ${$t(t.fee,this._sym())}</span>`:""}
        </div>
      </div>
    `}}Ot.styles=a`
    :host { display: block; overflow: hidden; }
    .filters { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 16px; }
    .chip {
      padding: 4px 10px; border-radius: 16px; border: 1px solid var(--divider-color, #e0e0e0);
      background: none; cursor: pointer; font-size: 0.72rem; color: var(--secondary-text-color);
      transition: all 0.15s;
    }
    .chip.active { background: var(--primary-color, #03a9f4); color: white; border-color: transparent; }
    .chip:hover:not(.active) { border-color: var(--primary-color); color: var(--primary-color); }
    .activity-list { padding: 0 16px 16px; }
    .activity {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .activity:last-child { border-bottom: none; }
    .activity-left { display: flex; align-items: flex-start; gap: 10px; }
    .badge {
      padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 600;
      color: white; text-transform: uppercase; white-space: nowrap; margin-top: 2px;
    }
    .activity-info { display: flex; flex-direction: column; gap: 2px; }
    .asset-name { font-size: 0.82rem; font-weight: 500; color: var(--primary-text-color); }
    .activity-meta { font-size: 0.7rem; color: var(--secondary-text-color); }
    .activity-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .amount { font-size: 0.82rem; font-weight: 600; font-variant-numeric: tabular-nums; }
    .shares { font-size: 0.7rem; color: var(--secondary-text-color); }
    .tax-fee { font-size: 0.65rem; color: var(--secondary-text-color); }
    .load-more {
      display: block; width: calc(100% - 32px); margin: 0 16px 16px; padding: 8px;
      border: 1px solid var(--divider-color); border-radius: 6px; background: none;
      cursor: pointer; color: var(--primary-color); font-size: 0.82rem;
    }
    .load-more:hover { background: var(--secondary-background-color); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `,e([ut({attribute:!1})],Ot.prototype,"hass",void 0),e([ut({attribute:!1})],Ot.prototype,"portfolio",void 0),e([ut({attribute:!1})],Ot.prototype,"config",void 0),e([mt()],Ot.prototype,"_activities",void 0),e([mt()],Ot.prototype,"_holdingsMap",void 0),e([mt()],Ot.prototype,"_loading",void 0),e([mt()],Ot.prototype,"_error",void 0),e([mt()],Ot.prototype,"_filter",void 0),e([mt()],Ot.prototype,"_cursor",void 0),e([mt()],Ot.prototype,"_hasMore",void 0),customElements.get("parqet-activities-view")||customElements.define("parqet-activities-view",Ot);const Ut=window;Ut.customCards=Ut.customCards||[],Ut.customCards.some(t=>"parqet-snapshot-card"===t.type)||Ut.customCards.push({type:"parqet-snapshot-card",name:"Parqet Daily Snapshot",description:"Per-holding daily P&L based on custom snapshot time.",preview:!1});class Nt extends ct{constructor(){super(...arguments),this._config={type:"custom:parqet-snapshot-card"},this._portfolio=null,this._data=null,this._loading=!1,this._error="",this._notEnabled=!1,this._sortBy="pl",this._sortAsc=!1}setConfig(t){this._config=t}getCardSize(){return 4}static getConfigForm(){return{schema:[{name:"device_id",selector:{device:{integration:"parqet"}}},{name:"currency_symbol",selector:{text:{}}},{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"show_logo",selector:{boolean:{}}},{name:"compact",selector:{boolean:{}}}],computeLabel:t=>({device_id:"Portfolio (leave empty for auto-detect)",currency_symbol:"Currency Symbol",holdings_limit:"Holdings Limit",show_logo:"Show Holding Logos",compact:"Compact Mode"}[t.name]||t.name)}}connectedCallback(){super.connectedCallback(),this._discoverPortfolio()}updated(t){t.has("hass")&&!this._portfolio&&this._discoverPortfolio()}_discoverPortfolio(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;const i=null===(e=this._config)||void 0===e?void 0:e.device_id,o=yt(this.hass,i);0!==o.length&&(this._portfolio=o[0],this._load())}async _load(){if(this.hass&&this._portfolio){this._loading=!0,this._error="",this._notEnabled=!1;try{const t=await this.hass.connection.sendMessagePromise({type:"parqet/get_snapshot",entry_id:this._portfolio.entryId});this._data=t}catch(t){t&&"object"==typeof t&&"code"in t&&"not_enabled"===t.code?this._notEnabled=!0:this._error="Failed to load snapshot data"}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this._config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_fmtSnapshot(t){try{return new Date(t).toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return t}}_sorted(){if(!this._data)return[];const t=[...this._data.holdings].sort((t,e)=>{var i,o,r,s,n,a,l,d,c,p;switch(this._sortBy){case"name":return(null!==(i=t.name)&&void 0!==i?i:"").localeCompare(null!==(o=e.name)&&void 0!==o?o:"");case"value":return(null!==(r=e.current_value)&&void 0!==r?r:0)-(null!==(s=t.current_value)&&void 0!==s?s:0);case"pl":return(null!==(n=e.daily_pl)&&void 0!==n?n:0)-(null!==(a=t.daily_pl)&&void 0!==a?a:0);case"plPct":return(null!==(l=e.daily_pl_pct)&&void 0!==l?l:0)-(null!==(d=t.daily_pl_pct)&&void 0!==d?d:0);case"weight":return(null!==(c=e.weight)&&void 0!==c?c:0)-(null!==(p=t.weight)&&void 0!==p?p:0);default:return 0}});return this._sortAsc?t.reverse():t}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t;return F`
      <ha-card>
        ${this._portfolio?F`
          <div class="header">
            <span class="title">${this._portfolio.name}</span>
            ${(null===(t=this._data)||void 0===t?void 0:t.snapshot_taken_at)?F`
              <span class="subtitle">vs. ${this._fmtSnapshot(this._data.snapshot_taken_at)}</span>
            `:""}
          </div>
        `:""}

        ${this._notEnabled?F`
          <div class="info">Enable daily snapshots in integration settings.</div>
        `:""}

        ${this._loading?F`<parqet-loading-spinner></parqet-loading-spinner>`:""}
        ${this._error?F`<div class="error" role="alert">${this._error}</div>`:""}

        ${!this._data||this._loading||this._error?"":(()=>{var t,e;const i=this._data,o=null!==i.snapshot_date,r=null!==(e=null===(t=this._config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,s=this._sorted().slice(0,r);return F`
            ${o?F`
              <div class="summary">
                <div class="summary-item">
                  <span class="summary-label">Total</span>
                  <span class="summary-value">${$t(i.total_value,this._sym())}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Daily P&amp;L</span>
                  <span class="summary-value ${wt(i.total_daily_pl)}">${$t(i.total_daily_pl,this._sym())} (${xt(i.total_daily_pl_pct)})</span>
                </div>
              </div>
            `:""}

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th class="sortable" @click=${()=>this._toggleSort("name")}>Name</th>
                    <th class="sortable num" @click=${()=>this._toggleSort("value")}>Value</th>
                    ${o?F`
                      <th class="sortable num" @click=${()=>this._toggleSort("pl")}>P&amp;L</th>
                      <th class="sortable num" @click=${()=>this._toggleSort("plPct")}>P&amp;L%</th>
                    `:""}
                    <th class="sortable num" @click=${()=>this._toggleSort("weight")}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.map(t=>{var e;return F`
                    <tr class="holding-row">
                      <td>
                        <div class="holding-name">
                          ${!1!==(null===(e=this._config)||void 0===e?void 0:e.show_logo)&&t.logo?F`<img class="logo" src=${t.logo} alt="" />`:""}
                          <span>${t.name}</span>
                        </div>
                      </td>
                      <td class="num">${$t(t.current_value,this._sym())}</td>
                      ${o?F`
                        <td class="num ${wt(t.daily_pl)}">${null!=t.daily_pl?$t(t.daily_pl,this._sym()):"—"}</td>
                        <td class="num ${wt(t.daily_pl_pct)}">${null!=t.daily_pl_pct?xt(t.daily_pl_pct):"—"}</td>
                      `:""}
                      <td class="num">${t.weight.toFixed(1)}%</td>
                    </tr>
                  `})}
                </tbody>
              </table>
            </div>

            ${o?"":F`
              <div class="info">Waiting for first daily snapshot.</div>
            `}
          `})()}
      </ha-card>
    `}}Nt.styles=a`
    :host { display: block; }
    ha-card { overflow: hidden; }
    .header { padding: 16px 16px 8px; }
    .title { font-size: 1rem; font-weight: 600; }
    .subtitle { font-size: 0.75rem; color: var(--secondary-text-color); margin-left: 8px; }
    .summary { display: flex; gap: 16px; padding: 8px 16px 12px; }
    .summary-item { display: flex; flex-direction: column; }
    .summary-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text-color); }
    .summary-value { font-size: 0.95rem; font-weight: 600; }
    .table-wrap { overflow-x: auto; padding: 0 8px 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { text-align: left; padding: 6px 8px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--secondary-text-color); border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    th.num { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .sortable { cursor: pointer; }
    .sortable:hover { color: var(--primary-color); }
    .holding-row:hover { background: var(--secondary-background-color, #f5f5f5); }
    .holding-name { display: flex; align-items: center; gap: 8px; }
    .logo { width: 20px; height: 20px; border-radius: 4px; object-fit: contain; }
    .positive { color: var(--success-color, #4caf50); }
    .negative { color: var(--error-color, #f44336); }
    .error { margin: 8px 16px; padding: 8px 12px; background: rgba(244, 67, 54, 0.1); color: var(--error-color, #f44336); border-radius: 6px; font-size: 0.82rem; }
    .info { padding: 24px 16px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; }
  `,e([ut({attribute:!1})],Nt.prototype,"hass",void 0),e([mt()],Nt.prototype,"_config",void 0),e([mt()],Nt.prototype,"_portfolio",void 0),e([mt()],Nt.prototype,"_data",void 0),e([mt()],Nt.prototype,"_loading",void 0),e([mt()],Nt.prototype,"_error",void 0),e([mt()],Nt.prototype,"_notEnabled",void 0),e([mt()],Nt.prototype,"_sortBy",void 0),e([mt()],Nt.prototype,"_sortAsc",void 0),customElements.get("parqet-snapshot-card")||customElements.define("parqet-snapshot-card",Nt);const Dt=window;Dt.customCards=Dt.customCards||[],Dt.customCards.some(t=>"parqet-companion-card"===t.type)||Dt.customCards.push({type:"parqet-companion-card",name:"Parqet Companion",description:"Display your Parqet portfolio data — performance, holdings and activities.",preview:!0,documentationURL:"https://github.com/cubinet-code/ha-parqet-companion"});class Tt extends ct{constructor(){super(...arguments),this._portfolios=[],this._selectedIndex=0,this._activeView="performance"}setConfig(t){this._config=Object.assign({default_view:"performance",default_interval:"1y",show_interval_selector:!0,show_performance_chart:!0,show_allocation_chart:!0,show_logo:!0,compact:!1,currency_symbol:"€",activities_limit:25},t),this._activeView=this._config.default_view}getCardSize(){return 6}static getConfigForm(){return{schema:[{name:"device_id",selector:{device:{integration:"parqet"}}},{name:"default_view",selector:{select:{options:[{value:"performance",label:"Performance"},{value:"holdings",label:"Holdings"},{value:"activities",label:"Activities"}]}}},{name:"currency_symbol",selector:{text:{}}},{name:"",type:"expandable",title:"Performance",icon:"mdi:chart-line",schema:[{name:"default_interval",selector:{select:{options:[{value:"1d",label:"1 Day"},{value:"1w",label:"1 Week"},{value:"mtd",label:"Month to Date"},{value:"1m",label:"1 Month"},{value:"3m",label:"3 Months"},{value:"6m",label:"6 Months"},{value:"1y",label:"1 Year"},{value:"ytd",label:"Year to Date"},{value:"3y",label:"3 Years"},{value:"5y",label:"5 Years"},{value:"10y",label:"10 Years"},{value:"max",label:"Maximum"}]}}},{name:"show_interval_selector",selector:{boolean:{}}},{name:"show_performance_chart",selector:{boolean:{}}}]},{name:"",type:"expandable",title:"Holdings",icon:"mdi:chart-donut",schema:[{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"show_allocation_chart",selector:{boolean:{}}},{name:"show_logo",selector:{boolean:{}}}]},{name:"",type:"expandable",title:"Activities",icon:"mdi:format-list-bulleted",schema:[{name:"activities_limit",selector:{number:{min:1,max:500,mode:"box"}}}]},{name:"",type:"expandable",title:"Layout",icon:"mdi:page-layout-body",schema:[{name:"compact",selector:{boolean:{}}},{name:"hide_header",selector:{boolean:{}}}]}],computeLabel:t=>{var e;return null!==(e={device_id:"Portfolio (leave empty for auto-detect)",default_view:"Default View",default_interval:"Default Interval",currency_symbol:"Currency Symbol",holdings_limit:"Holdings Limit",activities_limit:"Activities Limit",show_interval_selector:"Show Interval Selector",show_performance_chart:"Show Performance Chart",show_allocation_chart:"Show Allocation Chart",show_logo:"Show Holding Logos",compact:"Compact Mode",hide_header:"Hide Header"}[t.name])&&void 0!==e?e:t.name}}}static getStubConfig(){return{default_view:"performance",default_interval:"1y",show_performance_chart:!0,show_allocation_chart:!0,show_interval_selector:!0,show_logo:!0,compact:!1,hide_header:!1,currency_symbol:"€",activities_limit:25}}updated(t){t.has("hass")&&this._discoverPortfolios()}_discoverPortfolios(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;if(this.hass.entities===this._lastEntities)return;this._lastEntities=this.hass.entities;const i=null===(e=this._config)||void 0===e?void 0:e.device_id,o=yt(this.hass,i),r=t=>[...t.map(t=>t.entryId)].sort().join(",");r(o)!==r(this._portfolios)&&(this._portfolios=o)}render(){var t;if(!this._portfolios.length)return F`
        <ha-card>
          <div class="empty">
            <span>No Parqet portfolios found</span>
            <span class="hint">Add the Parqet Companion integration first</span>
          </div>
        </ha-card>
      `;const e=this._portfolios[this._selectedIndex]||this._portfolios[0];return F`
      <ha-card>
        ${(null===(t=this._config)||void 0===t?void 0:t.hide_header)?"":F`
          <div class="card-header">
            ${this._portfolios.length>1?F`
              <select class="portfolio-select" @change=${this._onPortfolioChange}>
                ${this._portfolios.map((t,e)=>F`
                  <option value=${e} ?selected=${e===this._selectedIndex}>${t.name}</option>
                `)}
              </select>
            `:F`<span class="portfolio-name">${e.name}</span>`}
          </div>
        `}

        ${F`
          <div class="tabs" role="tablist">
            ${["performance","holdings","activities"].map(t=>F`
              <button
                class="tab ${this._activeView===t?"active":""}"
                role="tab"
                aria-selected=${this._activeView===t}
                @click=${()=>this._activeView=t}
              >
                ${t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            `)}
          </div>
        `}

        <div class="view-content" role="tabpanel">
          ${this._renderView(e)}
        </div>
      </ha-card>
    `}_renderView(t){return"performance"===this._activeView?F`
        <parqet-performance-view
          .hass=${this.hass}
          .portfolio=${t}
          .config=${this._config}
        ></parqet-performance-view>
      `:"holdings"===this._activeView?F`
        <parqet-holdings-view
          .hass=${this.hass}
          .portfolio=${t}
          .config=${this._config}
        ></parqet-holdings-view>
      `:F`
      <parqet-activities-view
        .hass=${this.hass}
        .portfolio=${t}
        .config=${this._config}
      ></parqet-activities-view>
    `}_onPortfolioChange(t){this._selectedIndex=parseInt(t.target.value,10)}}return Tt.styles=a`
    :host { display: block; overflow: hidden; min-width: 0; height: 100%; }
    ha-card { display: flex; flex-direction: column; overflow: hidden; height: 100%; }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--divider-color, #e0e0e0); min-height: 48px;
    }
    .portfolio-name { font-weight: 600; font-size: 1rem; color: var(--primary-text-color); }
    .portfolio-select {
      width: 100%; padding: 6px 10px; border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px; background: var(--card-background-color, #fff);
      color: var(--primary-text-color); font-size: 0.875rem; cursor: pointer;
    }
    .tabs { display: flex; border-bottom: 1px solid var(--divider-color, #e0e0e0); }
    .tab {
      flex: 1; padding: 10px 4px; background: none; border: none;
      border-bottom: 2px solid transparent; cursor: pointer;
      color: var(--secondary-text-color); font-size: 0.875rem; font-weight: 500;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab.active { color: var(--primary-color, #03a9f4); border-bottom-color: var(--primary-color, #03a9f4); }
    .tab:hover:not(.active) { color: var(--primary-text-color); }
    .view-content { flex: 1; min-height: 0; overflow-y: auto; }
    .empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 32px; font-size: 0.875rem; color: var(--secondary-text-color);
    }
    .hint { font-size: 0.75rem; opacity: 0.7; }
  `,e([ut({attribute:!1})],Tt.prototype,"hass",void 0),e([mt()],Tt.prototype,"_config",void 0),e([mt()],Tt.prototype,"_portfolios",void 0),e([mt()],Tt.prototype,"_selectedIndex",void 0),e([mt()],Tt.prototype,"_activeView",void 0),customElements.get("parqet-companion-card")||customElements.define("parqet-companion-card",Tt),t.ParqetCompanionCard=Tt,t}({});
