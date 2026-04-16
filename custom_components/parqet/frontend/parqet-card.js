function t(t,e,i,o){var r,s=arguments.length,n=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(s<3?r(n):s>3?r(e,i,n):r(e,i))||n);return s>3&&n&&Object.defineProperty(e,i,n),n}var e;"function"==typeof SuppressedError&&SuppressedError;const i={version:"0.3.6",loadedAt:(new Date).toISOString(),moduleContext:!1,customElementsAvailable:"undefined"!=typeof customElements,elements:{},errors:[]};try{i.moduleContext="string"==typeof(null===(e=import.meta)||void 0===e?void 0:e.url)}catch(t){i.moduleContext=!1}function o(t,e){try{if(customElements.get(t))return void(i.elements[t]={registered:!0,error:"already-defined",timestamp:(new Date).toISOString()});customElements.define(t,e),i.elements[t]={registered:!0,timestamp:(new Date).toISOString()}}catch(e){const o=e instanceof Error?e.message:String(e);i.elements[t]={registered:!1,error:o,timestamp:(new Date).toISOString()},console.error(`[parqet-card] Failed to register <${t}>:`,o)}}window.__parqetDiag=i,console.info("[parqet-card] Script executing",{loadedAt:i.loadedAt,moduleContext:i.moduleContext,customElements:i.customElementsAvailable});const r=globalThis,s=r.ShadowRoot&&(void 0===r.ShadyCSS||r.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),a=new WeakMap;let l=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=a.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(e,t))}return t}toString(){return this.cssText}};const d=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new l(i,t,n)},c=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new l("string"==typeof t?t:t+"",void 0,n))(e)})(t):t,{is:p,defineProperty:h,getOwnPropertyDescriptor:v,getOwnPropertyNames:u,getOwnPropertySymbols:m,getPrototypeOf:_}=Object,f=globalThis,g=f.trustedTypes,y=g?g.emptyScript:"",b=f.reactiveElementPolyfillSupport,$=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?y:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},w=(t,e)=>!p(t,e),A={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let k=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=A){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&h(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:r}=v(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const s=o?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??A}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...u(t),...m(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(c(t))}else void 0!==t&&e.push(c(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(s)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of e){const e=document.createElement("style"),o=r.litNonce;void 0!==o&&e.setAttribute("nonce",o),e.textContent=i.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=o;const s=r.fromAttribute(e,t.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(t,e,i,o=!1,r){if(void 0!==t){const s=this.constructor;if(!1===o&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??w)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[$("elementProperties")]=new Map,k[$("finalized")]=new Map,b?.({ReactiveElement:k}),(f.reactiveElementVersions??=[]).push("2.1.2");const S=globalThis,C=t=>t,E=S.trustedTypes,P=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,z="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,I="?"+M,q=`<${I}>`,O=document,U=()=>O.createComment(""),D=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,H="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,L=/>/g,G=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,V=/"/g,F=/^(?:script|style|textarea|title)$/i,B=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),W=B(1),Y=B(2),J=Symbol.for("lit-noChange"),K=Symbol.for("lit-nothing"),X=new WeakMap,Z=O.createTreeWalker(O,129);function Q(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==P?P.createHTML(e):e}const tt=(t,e)=>{const i=t.length-1,o=[];let r,s=2===e?"<svg>":3===e?"<math>":"",n=N;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===N?"!--"===l[1]?n=R:void 0!==l[1]?n=L:void 0!==l[2]?(F.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=G):void 0!==l[3]&&(n=G):n===G?">"===l[0]?(n=r??N,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?G:'"'===l[3]?V:j):n===V||n===j?n=G:n===R||n===L?n=N:(n=G,r=void 0);const p=n===G&&t[e+1].startsWith("/>")?" ":"";s+=n===N?i+q:d>=0?(o.push(a),i.slice(0,d)+z+i.slice(d)+M+p):i+M+(-2===d?e:p)}return[Q(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class et{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,s=0;const n=t.length-1,a=this.parts,[l,d]=tt(t,e);if(this.el=et.createElement(l,i),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Z.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(z)){const e=d[s++],i=o.getAttribute(t).split(M),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?nt:"?"===n[1]?at:"@"===n[1]?lt:st}),o.removeAttribute(t)}else t.startsWith(M)&&(a.push({type:6,index:r}),o.removeAttribute(t));if(F.test(o.tagName)){const t=o.textContent.split(M),e=t.length-1;if(e>0){o.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],U()),Z.nextNode(),a.push({type:2,index:++r});o.append(t[e],U())}}}else if(8===o.nodeType)if(o.data===I)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(M,t+1));)a.push({type:7,index:r}),t+=M.length-1}r++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function it(t,e,i=t,o){if(e===J)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=D(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=it(t,r._$AS(t,e.values),r,o)),e}class ot{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??O).importNode(e,!0);Z.currentNode=o;let r=Z.nextNode(),s=0,n=0,a=i[0];for(;void 0!==a;){if(s===a.index){let e;2===a.type?e=new rt(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new dt(r,this,t)),this._$AV.push(e),a=i[++n]}s!==a?.index&&(r=Z.nextNode(),s++)}return Z.currentNode=O,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class rt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=K,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=it(this,t,e),D(t)?t===K||null==t||""===t?(this._$AH!==K&&this._$AR(),this._$AH=K):t!==this._$AH&&t!==J&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==K&&D(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=et.createElement(Q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new ot(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=X.get(t.strings);return void 0===e&&X.set(t.strings,e=new et(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new rt(this.O(U()),this.O(U()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=C(t).nextSibling;C(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=K,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=K}_$AI(t,e=this,i,o){const r=this.strings;let s=!1;if(void 0===r)t=it(this,t,e,0),s=!D(t)||t!==this._$AH&&t!==J,s&&(this._$AH=t);else{const o=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=it(this,o[i+n],e,n),a===J&&(a=this._$AH[n]),s||=!D(a)||a!==this._$AH[n],a===K?t=K:t!==K&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}s&&!o&&this.j(t)}j(t){t===K?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class nt extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===K?void 0:t}}class at extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==K)}}class lt extends st{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=it(this,t,e,0)??K)===J)return;const i=this._$AH,o=t===K&&i!==K||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==K&&(i===K||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class dt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){it(this,t)}}const ct=S.litHtmlPolyfillSupport;ct?.(et,rt),(S.litHtmlVersions??=[]).push("3.3.2");const pt=globalThis;class ht extends k{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=i?.renderBefore??null;o._$litPart$=r=new rt(e.insertBefore(U(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return J}}ht._$litElement$=!0,ht.finalized=!0,pt.litElementHydrateSupport?.({LitElement:ht});const vt=pt.litElementPolyfillSupport;vt?.({LitElement:ht}),(pt.litElementVersions??=[]).push("4.2.2");const ut={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:w},mt=(t=ut,e,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,r,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];e.call(this,i),this.requestUpdate(o,r,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function _t(t){return(e,i)=>"object"==typeof i?mt(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ft(t){return _t({...t,state:!0,attribute:!1})}const gt=[{value:"1d",label:"1D"},{value:"1w",label:"1W"},{value:"mtd",label:"MTD"},{value:"1m",label:"1M"},{value:"3m",label:"3M"},{value:"6m",label:"6M"},{value:"1y",label:"1Y"},{value:"ytd",label:"YTD"},{value:"3y",label:"3Y"},{value:"5y",label:"5Y"},{value:"10y",label:"10Y"},{value:"max",label:"Max"}],yt=["total_value","xirr","ttwror","unrealized_gain","realized_gain","dividends","fees","taxes","valuation_start","unrealized_gain_net","unrealized_return_gross","unrealized_return_net","realized_gain_net","realized_return_gross","realized_return_net","dividends_net","dividends_taxes","dividends_fees","holdings_count","net_allocation","positive_allocation","negative_allocation"];function bt(t){for(const e of yt)if(t.endsWith("_"+e))return e;return null}function $t(t,e){return t.entities?function(t,e){var i,o,r,s;const n=new Map;for(const i of Object.values(t.entities))"parqet"===i.platform&&i.device_id&&(e&&i.device_id!==e||(n.has(i.device_id)||n.set(i.device_id,[]),n.get(i.device_id).push({entity_id:i.entity_id,unique_id:i.unique_id})));const a=[];for(const[e,l]of n){const n=null!==(r=null===(o=null===(i=t.devices)||void 0===i?void 0:i[e])||void 0===o?void 0:o.name)&&void 0!==r?r:e,d={};let c=null;for(const{entity_id:e,unique_id:i}of l){const o=t.states[e];if(o&&(!c&&(null===(s=o.attributes)||void 0===s?void 0:s.entry_id)&&(c=o.attributes.entry_id),i)){const t=bt(i);t&&(d[t]=o)}}c&&a.push({entryId:c,name:n,entityPrefix:null,sensors:d})}return a}(t,e):function(t){const e=new Map,i=12;for(const[o,r]of Object.entries(t.states)){if(!o.startsWith("sensor.")||!o.includes("_total_value"))continue;const s=r.attributes,n=o.slice(0,o.length-i),a=n+"_",l={};for(const[e,i]of Object.entries(t.states))e.startsWith(a)&&(l[e.slice(a.length)]=i);if(Object.keys(l).length<3)continue;const d=s.entry_id||n,c=(n.replace("sensor.","")||"Portfolio").split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ");e.set(n,{entryId:d,name:c,entityPrefix:n,sensors:l})}return Array.from(e.values())}(t)}class xt extends ht{render(){return W`
      <div class="container" role="status" aria-label="Loading">
        <div class="spinner"></div>
      </div>
    `}}function wt(t,e="€"){return null==t?"—":`${e}${t.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function At(t){return null==t?"—":`${t>=0?"+":""}${t.toFixed(2)}%`}function kt(t){return null==t?"":t>0?"positive":t<0?"negative":""}xt.styles=d`
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
  `,o("parqet-loading-spinner",xt);class St extends ht{constructor(){super(...arguments),this.selected="1y"}_select(t){this.selected=t,this.dispatchEvent(new CustomEvent("interval-change",{detail:{interval:t},bubbles:!0,composed:!0}))}render(){return W`
      <div class="intervals" role="group" aria-label="Time interval">
        ${gt.map(({value:t,label:e})=>W`
            <button
              class="btn ${this.selected===t?"active":""}"
              @click=${()=>this._select(t)}
              aria-pressed=${this.selected===t}
            >
              ${e}
            </button>
          `)}
      </div>
    `}}St.styles=d`
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
  `,t([_t()],St.prototype,"selected",void 0),o("parqet-interval-selector",St);class Ct extends ht{constructor(){super(...arguments),this.segments=[],this.currencySymbol="€"}_fmt(t){return`${t<0?"−":""}${this.currencySymbol}${Math.abs(t).toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:0})}`}render(){const t=this.segments.filter(t=>0!==t.value);if(0===t.length)return W`<div class="empty">No data</div>`;const e=t.reduce((t,e)=>t+Math.abs(e.value),0);if(0===e)return W`<div class="empty">No data</div>`;const i=t.map(t=>Object.assign(Object.assign({},t),{pct:Math.abs(t.value)/e*100}));return W`
      <div class="chart-container">
        <div class="bar-track">
          ${i.map((t,e)=>W`
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
          ${i.map(t=>W`
              <div class="legend-item">
                <span class="dot" style="background:${t.color}"></span>
                <span class="legend-label">${t.label}</span>
                <span class="legend-value">${this._fmt(t.value)}</span>
              </div>
            `)}
        </div>
      </div>
    `}}Ct.styles=d`
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
  `,t([_t({type:Array})],Ct.prototype,"segments",void 0),t([_t({type:String})],Ct.prototype,"currencySymbol",void 0),o("parqet-stacked-bar",Ct);class Et extends ht{constructor(){super(...arguments),this._interval="1y",this._wsData=null,this._loading=!1,this._error="",this._fetchGen=0}connectedCallback(){var t,e;super.connectedCallback(),this._interval=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_interval)&&void 0!==e?e:"1y",this._load()}updated(t){t.has("portfolio")&&this._load()}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}async _load(){if(!this.hass||!this.portfolio)return;const t=++this._fetchGen;this._loading=!0,this._error="";try{const e=await this.hass.connection.sendMessagePromise({type:"parqet/get_performance",entry_id:this.portfolio.entryId,interval:this._interval});if(t!==this._fetchGen)return;this._wsData=e.performance}catch(e){if(t!==this._fetchGen)return;this._error="Failed to load performance data",this._wsData=null}finally{t===this._fetchGen&&(this._loading=!1)}}async _onIntervalChange(t){return this._interval=t.detail.interval,this._load()}render(){var t,e,i,o,r,s,n,a,l,d,c,p,h,v,u,m,_,f,g,y,b,$,x,w,A,k,S,C;const E=this._wsData;return W`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?W`
        <parqet-interval-selector
          .selected=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-interval-selector>
      `:""}

      ${this._error?W`<div class="error" role="alert">${this._error}</div>`:""}
      ${this._loading?W`<parqet-loading-spinner></parqet-loading-spinner>`:""}

      ${E?W`
        <div class="kpi-grid ${(null===(e=this.config)||void 0===e?void 0:e.compact)?"compact":""}">
          ${this._kpi("Total Value",wt(null===(i=E.valuation)||void 0===i?void 0:i.atIntervalEnd,this._sym()))}
          ${this._kpi("XIRR",At(null===(r=null===(o=E.kpis)||void 0===o?void 0:o.inInterval)||void 0===r?void 0:r.xirr),null===(n=null===(s=E.kpis)||void 0===s?void 0:s.inInterval)||void 0===n?void 0:n.xirr)}
          ${this._kpi("TTWROR",At(null===(l=null===(a=E.kpis)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.ttwror),null===(c=null===(d=E.kpis)||void 0===d?void 0:d.inInterval)||void 0===c?void 0:c.ttwror)}
          ${this._kpi("Unrealized Gain",wt(null===(h=null===(p=E.unrealizedGains)||void 0===p?void 0:p.inInterval)||void 0===h?void 0:h.gainGross,this._sym()),null===(u=null===(v=E.unrealizedGains)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.gainGross)}
          ${this._kpi("Realized Gain",wt(null===(_=null===(m=E.realizedGains)||void 0===m?void 0:m.inInterval)||void 0===_?void 0:_.gainGross,this._sym()),null===(g=null===(f=E.realizedGains)||void 0===f?void 0:f.inInterval)||void 0===g?void 0:g.gainGross)}
          ${this._kpi("Dividends",wt(null===(b=null===(y=E.dividends)||void 0===y?void 0:y.inInterval)||void 0===b?void 0:b.gainGross,this._sym()))}
          ${this._kpi("Fees",wt(null===(x=null===($=E.fees)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.fees,this._sym()))}
          ${this._kpi("Taxes",wt(null===(A=null===(w=E.taxes)||void 0===w?void 0:w.inInterval)||void 0===A?void 0:A.taxes,this._sym()))}
        </div>
        ${!1!==(null!==(S=null===(k=this.config)||void 0===k?void 0:k.show_performance_chart)&&void 0!==S?S:null===(C=this.config)||void 0===C?void 0:C.show_chart)?this._renderChart(E):""}
      `:this._loading?"":W`<div class="empty">No data available.</div>`}
    `}_kpi(t,e,i){return W`
      <div class="kpi-tile">
        <div class="kpi-label">${t}</div>
        <div class="kpi-value ${kt(i)}">${e}</div>
      </div>
    `}_renderChart(t){var e,i,o,r,s,n,a,l,d,c,p,h,v,u,m;const _=[{label:"Unrealized",value:null!==(o=null===(i=null===(e=t.unrealizedGains)||void 0===e?void 0:e.inInterval)||void 0===i?void 0:i.gainGross)&&void 0!==o?o:0,color:"var(--success-color, #4caf50)"},{label:"Realized",value:null!==(n=null===(s=null===(r=t.realizedGains)||void 0===r?void 0:r.inInterval)||void 0===s?void 0:s.gainGross)&&void 0!==n?n:0,color:"#4285f4"},{label:"Dividends",value:null!==(d=null===(l=null===(a=t.dividends)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.gainGross)&&void 0!==d?d:0,color:"#46bdc6"},{label:"Fees",value:-(null!==(h=null===(p=null===(c=t.fees)||void 0===c?void 0:c.inInterval)||void 0===p?void 0:p.fees)&&void 0!==h?h:0),color:"#ff6d01"},{label:"Taxes",value:-(null!==(m=null===(u=null===(v=t.taxes)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.taxes)&&void 0!==m?m:0),color:"var(--error-color, #f44336)"}].filter(t=>0!==t.value);return 0===_.length?"":W`<parqet-stacked-bar .segments=${_} .currencySymbol=${this._sym()}></parqet-stacked-bar>`}}Et.styles=d`
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
  `,t([_t({attribute:!1})],Et.prototype,"hass",void 0),t([_t({attribute:!1})],Et.prototype,"portfolio",void 0),t([_t({attribute:!1})],Et.prototype,"config",void 0),t([ft()],Et.prototype,"_interval",void 0),t([ft()],Et.prototype,"_wsData",void 0),t([ft()],Et.prototype,"_loading",void 0),t([ft()],Et.prototype,"_error",void 0),o("parqet-performance-view",Et);const Pt=160,zt=2*Math.PI*66;class Mt extends ht{constructor(){super(...arguments),this.segments=[],this.centerLabel="",this.centerSub=""}render(){const t=this.segments.reduce((t,e)=>t+Math.abs(e.value),0);if(0===t||0===this.segments.length)return W`<div class="empty">No data</div>`;const e=80;let i=0;return W`
      <div class="chart-container">
        <svg viewBox="0 0 ${Pt} ${Pt}" class="donut" role="img" aria-label="Portfolio allocation chart">
          ${this.segments.map(o=>{const r=Math.abs(o.value)/t,s=r*zt,n=zt-s,a=i/t*360-90;return i+=Math.abs(o.value),Y`
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
          ${this.centerLabel?Y`
                <text x="${e}" y="${e}" text-anchor="middle" dominant-baseline="central" class="center-text">
                  <tspan x="${e}" dy="-0.3em" class="center-val">${this.centerLabel}</tspan>
                  ${this.centerSub?Y`<tspan x="${e}" dy="1.3em" class="center-sub">${this.centerSub}</tspan>`:""}
                </text>
              `:""}
        </svg>
        <div class="legend">
          ${this.segments.map(e=>{const i=Math.abs(e.value)/t*100;return W`
              <div class="legend-item">
                <span class="legend-dot" style="background:${e.color}"></span>
                <span class="legend-label">${e.label}</span>
                <span class="legend-pct">${i.toFixed(1)}%</span>
              </div>
            `})}
        </div>
      </div>
    `}}Mt.styles=d`
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
  `,t([_t({type:Array})],Mt.prototype,"segments",void 0),t([_t({type:String})],Mt.prototype,"centerLabel",void 0),t([_t({type:String})],Mt.prototype,"centerSub",void 0),o("parqet-donut-chart",Mt);const It=["#4285f4","#ea4335","#fbbc04","#34a853","#ff6d01","#46bdc6","#9c27b0","#795548","#607d8b","#e91e63","#00bcd4","#8bc34a","#ff5722","#3f51b5","#cddc39","#009688","#ffc107","#673ab7","#03a9f4","#ff9800"];class qt extends ht{constructor(){super(...arguments),this._holdings=[],this._loading=!1,this._error="",this._interval="max",this._sortBy="value",this._sortAsc=!1,this._expandedId=null,this._fetchGen=0}connectedCallback(){var t,e;super.connectedCallback(),this._interval=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_interval)&&void 0!==e?e:"max",this._load()}updated(t){t.has("portfolio")&&this._load()}async _load(){if(!this.hass||!this.portfolio)return;const t=++this._fetchGen;this._loading=!0,this._error="";try{const e=await this.hass.connection.sendMessagePromise({type:"parqet/get_performance",entry_id:this.portfolio.entryId,interval:this._interval});if(t!==this._fetchGen)return;this._holdings=(e.holdings||[]).filter(t=>{var e;return!(null===(e=t.position)||void 0===e?void 0:e.isSold)})}catch(e){if(t!==this._fetchGen)return;this._error="Failed to load holdings"}finally{t===this._fetchGen&&(this._loading=!1)}}async _onIntervalChange(t){return this._interval=t.detail.interval,this._load()}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_totalValue(){return this._holdings.reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0)}_sorted(t){const e=[...this._holdings].sort((e,i)=>{var o,r,s,n,a,l,d,c,p,h,v,u,m,_,f,g,y,b,$,x,w,A,k,S,C,E,P,z;switch(this._sortBy){case"name":return(null!==(r=null===(o=e.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"").localeCompare(null!==(n=null===(s=i.asset)||void 0===s?void 0:s.name)&&void 0!==n?n:"");case"value":return(null!==(l=null===(a=i.position)||void 0===a?void 0:a.currentValue)&&void 0!==l?l:0)-(null!==(c=null===(d=e.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0);case"pl":return(null!==(u=null===(v=null===(h=null===(p=i.performance)||void 0===p?void 0:p.unrealizedGains)||void 0===h?void 0:h.inInterval)||void 0===v?void 0:v.gainGross)&&void 0!==u?u:0)-(null!==(g=null===(f=null===(_=null===(m=e.performance)||void 0===m?void 0:m.unrealizedGains)||void 0===_?void 0:_.inInterval)||void 0===f?void 0:f.gainGross)&&void 0!==g?g:0);case"plPct":return(null!==(x=null===($=null===(b=null===(y=i.performance)||void 0===y?void 0:y.unrealizedGains)||void 0===b?void 0:b.inInterval)||void 0===$?void 0:$.returnGross)&&void 0!==x?x:0)-(null!==(S=null===(k=null===(A=null===(w=e.performance)||void 0===w?void 0:w.unrealizedGains)||void 0===A?void 0:A.inInterval)||void 0===k?void 0:k.returnGross)&&void 0!==S?S:0);case"weight":{const o=t>0?(null!==(E=null===(C=e.position)||void 0===C?void 0:C.currentValue)&&void 0!==E?E:0)/t:0;return(t>0?(null!==(z=null===(P=i.position)||void 0===P?void 0:P.currentValue)&&void 0!==z?z:0)/t:0)-o}default:return 0}});return this._sortAsc?e.reverse():e}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t;return W`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?W`
        <parqet-interval-selector
          .selected=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-interval-selector>
      `:""}

      ${this._loading?W`<parqet-loading-spinner></parqet-loading-spinner>`:""}
      ${this._error?W`<div class="error" role="alert">${this._error}</div>`:""}
      ${this._loading||this._error||this._holdings.length?"":W`<div class="empty">No holdings found.</div>`}

      ${this._loading||this._error||!this._holdings.length?"":(()=>{var t,e,i,o,r;const s=this._totalValue(),n=null!==(e=null===(t=this.config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,a=this._sorted(s).slice(0,n);return W`
      ${!1!==(null!==(o=null===(i=this.config)||void 0===i?void 0:i.show_allocation_chart)&&void 0!==o?o:null===(r=this.config)||void 0===r?void 0:r.show_chart)?W`
        <parqet-donut-chart
          .segments=${(()=>{const t=a.slice(0,20).map((t,e)=>{var i,o,r,s,n;return{label:null!==(r=null!==(i=t.nickname)&&void 0!==i?i:null===(o=t.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"Unknown",value:null!==(n=null===(s=t.position)||void 0===s?void 0:s.currentValue)&&void 0!==n?n:0,color:It[e%It.length]}});if(a.length>20){const e=a.slice(20).reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0);e>0&&t.push({label:"Other",value:e,color:"#9e9e9e"})}return t})()}
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
            ${a.map(t=>{var e,i,o,r,n,a,l,d,c,p,h,v,u,m,_,f,g,y,b,$,x,w,A,k,S,C,E;const P=null!==(r=null===(o=null===(i=null===(e=t.performance)||void 0===e?void 0:e.unrealizedGains)||void 0===i?void 0:i.inInterval)||void 0===o?void 0:o.gainGross)&&void 0!==r?r:0,z=null===(l=null===(a=null===(n=t.performance)||void 0===n?void 0:n.unrealizedGains)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.returnGross,M=s>0?(null!==(c=null===(d=t.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0)/s*100:0,I=this._expandedId===t.id;return W`
                <tr class="holding-row ${I?"expanded":""}" @click=${()=>this._expandedId=I?null:t.id}>
                  <td>
                    <div class="holding-name">
                      ${!1!==(null===(p=this.config)||void 0===p?void 0:p.show_logo)&&t.logo?W`<img class="logo" src=${t.logo} alt="" />`:""}
                      <span>${null!==(u=null!==(h=t.nickname)&&void 0!==h?h:null===(v=t.asset)||void 0===v?void 0:v.name)&&void 0!==u?u:"Unknown"}</span>
                    </div>
                  </td>
                  <td class="num">${wt(null===(m=t.position)||void 0===m?void 0:m.currentValue,this._sym())}</td>
                  <td class="num ${kt(P)}">${wt(P,this._sym())}</td>
                  <td class="num ${kt(z)}">${At(z)}</td>
                  <td class="num">${M.toFixed(1)}%</td>
                </tr>
                ${I?W`
                  <tr class="detail-row">
                    <td colspan="5">
                      <div class="detail-grid">
                        <span>Shares: ${null===(f=null===(_=t.position)||void 0===_?void 0:_.shares)||void 0===f?void 0:f.toFixed(4)}</span>
                        <span>Avg Price: ${wt(null===(g=t.position)||void 0===g?void 0:g.purchasePrice,this._sym())}</span>
                        <span>Current: ${wt(null===(y=t.position)||void 0===y?void 0:y.currentPrice,this._sym())}</span>
                        <span>XIRR: ${At(null===(x=null===($=null===(b=t.performance)||void 0===b?void 0:b.kpis)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.xirr)}</span>
                        <span>Dividends: ${wt(null===(k=null===(A=null===(w=t.performance)||void 0===w?void 0:w.dividends)||void 0===A?void 0:A.inInterval)||void 0===k?void 0:k.gainGross,this._sym())}</span>
                        <span>Fees: ${wt(null===(E=null===(C=null===(S=t.performance)||void 0===S?void 0:S.fees)||void 0===C?void 0:C.inInterval)||void 0===E?void 0:E.fees,this._sym())}</span>
                      </div>
                    </td>
                  </tr>
                `:""}
              `})}
          </tbody>
        </table>
      </div>
        `})()}
    `}}qt.styles=d`
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
  `,t([_t({attribute:!1})],qt.prototype,"hass",void 0),t([_t({attribute:!1})],qt.prototype,"portfolio",void 0),t([_t({attribute:!1})],qt.prototype,"config",void 0),t([ft()],qt.prototype,"_holdings",void 0),t([ft()],qt.prototype,"_loading",void 0),t([ft()],qt.prototype,"_error",void 0),t([ft()],qt.prototype,"_interval",void 0),t([ft()],qt.prototype,"_sortBy",void 0),t([ft()],qt.prototype,"_sortAsc",void 0),t([ft()],qt.prototype,"_expandedId",void 0),o("parqet-holdings-view",qt);const Ot=[{value:"all",label:"All"},{value:"buy",label:"Buy"},{value:"sell",label:"Sell"},{value:"dividend",label:"Dividend"},{value:"interest",label:"Interest"},{value:"transfer_in",label:"Transfer In"},{value:"transfer_out",label:"Transfer Out"},{value:"fees_taxes",label:"Fees/Taxes"},{value:"deposit",label:"Deposit"},{value:"withdrawal",label:"Withdrawal"}],Ut={buy:"#4caf50",sell:"#f44336",dividend:"#46bdc6",interest:"#9c27b0",transfer_in:"#4285f4",transfer_out:"#ff6d01",fees_taxes:"#ff9800",deposit:"#4caf50",withdrawal:"#f44336"};class Dt extends ht{constructor(){super(...arguments),this._activities=[],this._holdingsMap=new Map,this._loading=!1,this._error="",this._filter="all",this._cursor=null,this._hasMore=!1}connectedCallback(){var t,e;super.connectedCallback(),this._filter=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_activity_type)&&void 0!==e?e:"all",this._load()}updated(t){t.has("portfolio")&&this._load()}async _loadHoldingsMap(){var t,e,i;if(!(this._holdingsMap.size>0))try{const o=await this.hass.connection.sendMessagePromise({type:"parqet/get_holdings",entry_id:this.portfolio.entryId}),r=new Map;for(const s of o.holdings||[])s.id&&r.set(s.id,null!==(i=null!==(t=s.nickname)&&void 0!==t?t:null===(e=s.asset)||void 0===e?void 0:e.name)&&void 0!==i?i:"Unknown");this._holdingsMap=r}catch(t){}}async _load(t=!1){var e,i;if(this.hass&&this.portfolio){this._loading=!0,this._error="",await this._loadHoldingsMap();try{const o={type:"parqet/get_activities",entry_id:this.portfolio.entryId,limit:null!==(i=null===(e=this.config)||void 0===e?void 0:e.activities_limit)&&void 0!==i?i:25};"all"!==this._filter&&(o.activity_type=[this._filter]),t&&this._cursor&&(o.cursor=this._cursor);const r=await this.hass.connection.sendMessagePromise(o);this._activities=t?[...this._activities,...r.activities]:r.activities,this._cursor=r.cursor,this._hasMore=!!r.cursor}catch(t){this._error="Failed to load activities"}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_onFilterChange(t){this._filter=t,this._cursor=null,this._load()}render(){return W`
      <div class="filters">
        ${Ot.map(t=>W`
          <button
            class="chip ${this._filter===t.value?"active":""}"
            @click=${()=>this._onFilterChange(t.value)}
          >${t.label}</button>
        `)}
      </div>

      ${this._error?W`<div class="error">${this._error}</div>`:""}

      ${0!==this._activities.length||this._loading?W`
          <div class="activity-list">
            ${this._activities.map(t=>this._renderActivity(t))}
          </div>
        `:W`<div class="empty">No activities found.</div>`}

      ${this._loading?W`<parqet-loading-spinner></parqet-loading-spinner>`:""}

      ${this._hasMore&&!this._loading?W`
        <button class="load-more" @click=${()=>this._load(!0)}>Load more</button>
      `:""}
    `}_resolveAssetName(t){var e,i,o;if(t.holdingId&&this._holdingsMap.has(t.holdingId))return this._holdingsMap.get(t.holdingId);const r=t.asset;return r&&null!==(o=null!==(i=null!==(e=r.name)&&void 0!==e?e:r.symbol)&&void 0!==i?i:r.isin)&&void 0!==o?o:"Unknown"}_renderActivity(t){var e;const i=null!==(e=Ut[t.type])&&void 0!==e?e:"var(--secondary-text-color)",o=t.type.replace("_"," "),r=this._resolveAssetName(t);return W`
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
          <span class="amount">${wt(t.amount,this._sym())}</span>
          ${t.shares?W`<span class="shares">${t.shares} @ ${wt(t.price,this._sym())}</span>`:""}
          ${t.tax?W`<span class="tax-fee">Tax: ${wt(t.tax,this._sym())}</span>`:""}
          ${t.fee?W`<span class="tax-fee">Fee: ${wt(t.fee,this._sym())}</span>`:""}
        </div>
      </div>
    `}}Dt.styles=d`
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
  `,t([_t({attribute:!1})],Dt.prototype,"hass",void 0),t([_t({attribute:!1})],Dt.prototype,"portfolio",void 0),t([_t({attribute:!1})],Dt.prototype,"config",void 0),t([ft()],Dt.prototype,"_activities",void 0),t([ft()],Dt.prototype,"_holdingsMap",void 0),t([ft()],Dt.prototype,"_loading",void 0),t([ft()],Dt.prototype,"_error",void 0),t([ft()],Dt.prototype,"_filter",void 0),t([ft()],Dt.prototype,"_cursor",void 0),t([ft()],Dt.prototype,"_hasMore",void 0),o("parqet-activities-view",Dt);const Tt=window;Tt.customCards=Tt.customCards||[],Tt.customCards.some(t=>"parqet-snapshot-card"===t.type)||Tt.customCards.push({type:"parqet-snapshot-card",name:"Parqet Daily Snapshot",description:"Per-holding daily P&L based on custom snapshot time.",preview:!1});class Ht extends ht{constructor(){super(...arguments),this._config={type:"custom:parqet-snapshot-card"},this._portfolio=null,this._data=null,this._loading=!1,this._error="",this._notEnabled=!1,this._sortBy="pl",this._sortAsc=!1}setConfig(t){this._config=t}getCardSize(){return 4}static getConfigForm(){return{schema:[{name:"device_id",selector:{device:{integration:"parqet"}}},{name:"currency_symbol",selector:{text:{}}},{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"show_logo",selector:{boolean:{}}},{name:"compact",selector:{boolean:{}}}],computeLabel:t=>({device_id:"Portfolio (leave empty for auto-detect)",currency_symbol:"Currency Symbol",holdings_limit:"Holdings Limit",show_logo:"Show Holding Logos",compact:"Compact Mode"}[t.name]||t.name)}}connectedCallback(){super.connectedCallback(),this._discoverPortfolio()}updated(t){t.has("hass")&&!this._portfolio&&this._discoverPortfolio()}_discoverPortfolio(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;const i=null===(e=this._config)||void 0===e?void 0:e.device_id,o=$t(this.hass,i);0!==o.length&&(this._portfolio=o[0],this._load())}async _load(){if(this.hass&&this._portfolio){this._loading=!0,this._error="",this._notEnabled=!1;try{const t=await this.hass.connection.sendMessagePromise({type:"parqet/get_snapshot",entry_id:this._portfolio.entryId});this._data=t}catch(t){t&&"object"==typeof t&&"code"in t&&"not_enabled"===t.code?this._notEnabled=!0:this._error="Failed to load snapshot data"}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this._config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_fmtSnapshot(t){try{return new Date(t).toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return t}}_sorted(){if(!this._data)return[];const t=[...this._data.holdings].sort((t,e)=>{var i,o,r,s,n,a,l,d,c,p;switch(this._sortBy){case"name":return(null!==(i=t.name)&&void 0!==i?i:"").localeCompare(null!==(o=e.name)&&void 0!==o?o:"");case"value":return(null!==(r=e.current_value)&&void 0!==r?r:0)-(null!==(s=t.current_value)&&void 0!==s?s:0);case"pl":return(null!==(n=e.daily_pl)&&void 0!==n?n:0)-(null!==(a=t.daily_pl)&&void 0!==a?a:0);case"plPct":return(null!==(l=e.daily_pl_pct)&&void 0!==l?l:0)-(null!==(d=t.daily_pl_pct)&&void 0!==d?d:0);case"weight":return(null!==(c=e.weight)&&void 0!==c?c:0)-(null!==(p=t.weight)&&void 0!==p?p:0);default:return 0}});return this._sortAsc?t.reverse():t}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t;return W`
      <ha-card>
        ${this._portfolio?W`
          <div class="header">
            <span class="title">${this._portfolio.name}</span>
            ${(null===(t=this._data)||void 0===t?void 0:t.snapshot_taken_at)?W`
              <span class="subtitle">vs. ${this._fmtSnapshot(this._data.snapshot_taken_at)}</span>
            `:""}
          </div>
        `:""}

        ${this._notEnabled?W`
          <div class="info">Enable daily snapshots in integration settings.</div>
        `:""}

        ${this._loading?W`<parqet-loading-spinner></parqet-loading-spinner>`:""}
        ${this._error?W`<div class="error" role="alert">${this._error}</div>`:""}

        ${!this._data||this._loading||this._error?"":(()=>{var t,e;const i=this._data,o=null!==i.snapshot_date,r=null!==(e=null===(t=this._config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,s=this._sorted().slice(0,r);return W`
            ${o?W`
              <div class="summary">
                <div class="summary-item">
                  <span class="summary-label">Total</span>
                  <span class="summary-value">${wt(i.total_value,this._sym())}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Daily P&amp;L</span>
                  <span class="summary-value ${kt(i.total_daily_pl)}">${wt(i.total_daily_pl,this._sym())} (${At(i.total_daily_pl_pct)})</span>
                </div>
              </div>
            `:""}

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th class="sortable" @click=${()=>this._toggleSort("name")}>Name</th>
                    <th class="sortable num" @click=${()=>this._toggleSort("value")}>Value</th>
                    ${o?W`
                      <th class="sortable num" @click=${()=>this._toggleSort("pl")}>P&amp;L</th>
                      <th class="sortable num" @click=${()=>this._toggleSort("plPct")}>P&amp;L%</th>
                    `:""}
                    <th class="sortable num" @click=${()=>this._toggleSort("weight")}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.map(t=>{var e;return W`
                    <tr class="holding-row">
                      <td>
                        <div class="holding-name">
                          ${!1!==(null===(e=this._config)||void 0===e?void 0:e.show_logo)&&t.logo?W`<img class="logo" src=${t.logo} alt="" />`:""}
                          <span>${t.name}</span>
                        </div>
                      </td>
                      <td class="num">${wt(t.current_value,this._sym())}</td>
                      ${o?W`
                        <td class="num ${kt(t.daily_pl)}">${null!=t.daily_pl?wt(t.daily_pl,this._sym()):"—"}</td>
                        <td class="num ${kt(t.daily_pl_pct)}">${null!=t.daily_pl_pct?At(t.daily_pl_pct):"—"}</td>
                      `:""}
                      <td class="num">${t.weight.toFixed(1)}%</td>
                    </tr>
                  `})}
                </tbody>
              </table>
            </div>

            ${o?"":W`
              <div class="info">Waiting for first daily snapshot.</div>
            `}
          `})()}
      </ha-card>
    `}}Ht.styles=d`
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
  `,t([_t({attribute:!1})],Ht.prototype,"hass",void 0),t([ft()],Ht.prototype,"_config",void 0),t([ft()],Ht.prototype,"_portfolio",void 0),t([ft()],Ht.prototype,"_data",void 0),t([ft()],Ht.prototype,"_loading",void 0),t([ft()],Ht.prototype,"_error",void 0),t([ft()],Ht.prototype,"_notEnabled",void 0),t([ft()],Ht.prototype,"_sortBy",void 0),t([ft()],Ht.prototype,"_sortAsc",void 0),o("parqet-snapshot-card",Ht);const Nt=window;Nt.customCards=Nt.customCards||[],Nt.customCards.some(t=>"parqet-companion-card"===t.type)||Nt.customCards.push({type:"parqet-companion-card",name:"Parqet Companion",description:"Display your Parqet portfolio data — performance, holdings and activities.",preview:!0,documentationURL:"https://github.com/cubinet-code/ha-parqet-companion"});class Rt extends ht{constructor(){super(...arguments),this._portfolios=[],this._selectedIndex=0,this._activeView="performance"}setConfig(t){this._config=Object.assign({default_view:"performance",default_interval:"1y",show_interval_selector:!0,show_performance_chart:!0,show_allocation_chart:!0,show_logo:!0,compact:!1,currency_symbol:"€",activities_limit:25},t),this._activeView=this._config.default_view}getCardSize(){return 6}static getConfigForm(){return{schema:[{name:"device_id",selector:{device:{integration:"parqet"}}},{name:"default_view",selector:{select:{options:[{value:"performance",label:"Performance"},{value:"holdings",label:"Holdings"},{value:"activities",label:"Activities"}]}}},{name:"currency_symbol",selector:{text:{}}},{name:"",type:"expandable",title:"Performance",icon:"mdi:chart-line",schema:[{name:"default_interval",selector:{select:{options:[{value:"1d",label:"1 Day"},{value:"1w",label:"1 Week"},{value:"mtd",label:"Month to Date"},{value:"1m",label:"1 Month"},{value:"3m",label:"3 Months"},{value:"6m",label:"6 Months"},{value:"1y",label:"1 Year"},{value:"ytd",label:"Year to Date"},{value:"3y",label:"3 Years"},{value:"5y",label:"5 Years"},{value:"10y",label:"10 Years"},{value:"max",label:"Maximum"}]}}},{name:"show_interval_selector",selector:{boolean:{}}},{name:"show_performance_chart",selector:{boolean:{}}}]},{name:"",type:"expandable",title:"Holdings",icon:"mdi:chart-donut",schema:[{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"show_allocation_chart",selector:{boolean:{}}},{name:"show_logo",selector:{boolean:{}}}]},{name:"",type:"expandable",title:"Activities",icon:"mdi:format-list-bulleted",schema:[{name:"activities_limit",selector:{number:{min:1,max:500,mode:"box"}}}]},{name:"",type:"expandable",title:"Layout",icon:"mdi:page-layout-body",schema:[{name:"compact",selector:{boolean:{}}},{name:"hide_header",selector:{boolean:{}}}]}],computeLabel:t=>{var e;return null!==(e={device_id:"Portfolio (leave empty for auto-detect)",default_view:"Default View",default_interval:"Default Interval",currency_symbol:"Currency Symbol",holdings_limit:"Holdings Limit",activities_limit:"Activities Limit",show_interval_selector:"Show Interval Selector",show_performance_chart:"Show Performance Chart",show_allocation_chart:"Show Allocation Chart",show_logo:"Show Holding Logos",compact:"Compact Mode",hide_header:"Hide Header"}[t.name])&&void 0!==e?e:t.name}}}static getStubConfig(){return{default_view:"performance",default_interval:"1y",show_performance_chart:!0,show_allocation_chart:!0,show_interval_selector:!0,show_logo:!0,compact:!1,hide_header:!1,currency_symbol:"€",activities_limit:25}}updated(t){t.has("hass")&&this._discoverPortfolios()}_discoverPortfolios(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;if(this.hass.entities===this._lastEntities)return;this._lastEntities=this.hass.entities;const i=null===(e=this._config)||void 0===e?void 0:e.device_id,o=$t(this.hass,i),r=t=>[...t.map(t=>t.entryId)].sort().join(",");r(o)!==r(this._portfolios)&&(this._portfolios=o)}render(){var t;if(!this._portfolios.length)return W`
        <ha-card>
          <div class="empty">
            <span>No Parqet portfolios found</span>
            <span class="hint">Add the Parqet Companion integration first</span>
          </div>
        </ha-card>
      `;const e=this._portfolios[this._selectedIndex]||this._portfolios[0];return W`
      <ha-card>
        ${(null===(t=this._config)||void 0===t?void 0:t.hide_header)?"":W`
          <div class="card-header">
            ${this._portfolios.length>1?W`
              <select class="portfolio-select" @change=${this._onPortfolioChange}>
                ${this._portfolios.map((t,e)=>W`
                  <option value=${e} ?selected=${e===this._selectedIndex}>${t.name}</option>
                `)}
              </select>
            `:W`<span class="portfolio-name">${e.name}</span>`}
          </div>
        `}

        ${W`
          <div class="tabs" role="tablist">
            ${["performance","holdings","activities"].map(t=>W`
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
    `}_renderView(t){return"performance"===this._activeView?W`
        <parqet-performance-view
          .hass=${this.hass}
          .portfolio=${t}
          .config=${this._config}
        ></parqet-performance-view>
      `:"holdings"===this._activeView?W`
        <parqet-holdings-view
          .hass=${this.hass}
          .portfolio=${t}
          .config=${this._config}
        ></parqet-holdings-view>
      `:W`
      <parqet-activities-view
        .hass=${this.hass}
        .portfolio=${t}
        .config=${this._config}
      ></parqet-activities-view>
    `}_onPortfolioChange(t){this._selectedIndex=parseInt(t.target.value,10)}}Rt.styles=d`
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
  `,t([_t({attribute:!1})],Rt.prototype,"hass",void 0),t([ft()],Rt.prototype,"_config",void 0),t([ft()],Rt.prototype,"_portfolios",void 0),t([ft()],Rt.prototype,"_selectedIndex",void 0),t([ft()],Rt.prototype,"_activeView",void 0),o("parqet-companion-card",Rt);export{Rt as ParqetCompanionCard};
