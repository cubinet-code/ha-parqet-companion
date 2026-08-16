function t(t,e,i,o){var r,s=arguments.length,a=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,o);else for(var n=t.length-1;n>=0;n--)(r=t[n])&&(a=(s<3?r(a):s>3?r(e,i,a):r(e,i))||a);return s>3&&a&&Object.defineProperty(e,i,a),a}var e;"function"==typeof SuppressedError&&SuppressedError;const i={version:"0.5.0-beta.4",loadedAt:(new Date).toISOString(),moduleContext:!1,customElementsAvailable:"undefined"!=typeof customElements,elements:{},errors:[]};try{i.moduleContext="string"==typeof(null===(e=import.meta)||void 0===e?void 0:e.url)}catch(t){i.moduleContext=!1}function o(t,e){try{if(customElements.get(t))return void(i.elements[t]={registered:!0,error:"already-defined",timestamp:(new Date).toISOString()});customElements.define(t,e),i.elements[t]={registered:!0,timestamp:(new Date).toISOString()}}catch(e){const o=e instanceof Error?e.message:String(e);i.elements[t]={registered:!1,error:o,timestamp:(new Date).toISOString()},console.error(`[parqet-card] Failed to register <${t}>:`,o)}}window.__parqetDiag=i,console.info("[parqet-card] Script executing",{loadedAt:i.loadedAt,moduleContext:i.moduleContext,customElements:i.customElementsAvailable});const r=globalThis,s=r.ShadowRoot&&(void 0===r.ShadyCSS||r.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),n=new WeakMap;let l=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const d=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new l(i,t,a)},c=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new l("string"==typeof t?t:t+"",void 0,a))(e)})(t):t,{is:h,defineProperty:p,getOwnPropertyDescriptor:v,getOwnPropertyNames:u,getOwnPropertySymbols:m,getPrototypeOf:f}=Object,g=globalThis,_=g.trustedTypes,y=_?_.emptyScript:"",b=g.reactiveElementPolyfillSupport,$=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?y:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},w=(t,e)=>!h(t,e),A={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:w};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let P=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=A){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&p(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:r}=v(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const s=o?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??A}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=f(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...u(t),...m(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(c(t))}else void 0!==t&&e.push(c(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(s)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of e){const e=document.createElement("style"),o=r.litNonce;void 0!==o&&e.setAttribute("nonce",o),e.textContent=i.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=o;const s=r.fromAttribute(e,t.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(t,e,i,o=!1,r){if(void 0!==t){const s=this.constructor;if(!1===o&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??w)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};P.elementStyles=[],P.shadowRootOptions={mode:"open"},P[$("elementProperties")]=new Map,P[$("finalized")]=new Map,b?.({ReactiveElement:P}),(g.reactiveElementVersions??=[]).push("2.1.2");const k=globalThis,S=t=>t,E=k.trustedTypes,I=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",z=`lit$${Math.random().toFixed(9).slice(2)}$`,D="?"+z,M=`<${D}>`,L=document,q=()=>L.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,U="[ \t\n\f\r]",G=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,H=/>/g,N=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),V=/'/g,j=/"/g,W=/^(?:script|style|textarea|title)$/i,B=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),F=B(1),Y=B(2),K=Symbol.for("lit-noChange"),J=Symbol.for("lit-nothing"),Z=new WeakMap,X=L.createTreeWalker(L,129);function Q(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==I?I.createHTML(e):e}const tt=(t,e)=>{const i=t.length-1,o=[];let r,s=2===e?"<svg>":3===e?"<math>":"",a=G;for(let e=0;e<i;e++){const i=t[e];let n,l,d=-1,c=0;for(;c<i.length&&(a.lastIndex=c,l=a.exec(i),null!==l);)c=a.lastIndex,a===G?"!--"===l[1]?a=R:void 0!==l[1]?a=H:void 0!==l[2]?(W.test(l[2])&&(r=RegExp("</"+l[2],"g")),a=N):void 0!==l[3]&&(a=N):a===N?">"===l[0]?(a=r??G,d=-1):void 0===l[1]?d=-2:(d=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?N:'"'===l[3]?j:V):a===j||a===V?a=N:a===R||a===H?a=G:(a=N,r=void 0);const h=a===N&&t[e+1].startsWith("/>")?" ":"";s+=a===G?i+M:d>=0?(o.push(n),i.slice(0,d)+C+i.slice(d)+z+h):i+z+(-2===d?e:h)}return[Q(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class et{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,s=0;const a=t.length-1,n=this.parts,[l,d]=tt(t,e);if(this.el=et.createElement(l,i),X.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=X.nextNode())&&n.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(C)){const e=d[s++],i=o.getAttribute(t).split(z),a=/([.?@])?(.*)/.exec(e);n.push({type:1,index:r,name:a[2],strings:i,ctor:"."===a[1]?at:"?"===a[1]?nt:"@"===a[1]?lt:st}),o.removeAttribute(t)}else t.startsWith(z)&&(n.push({type:6,index:r}),o.removeAttribute(t));if(W.test(o.tagName)){const t=o.textContent.split(z),e=t.length-1;if(e>0){o.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],q()),X.nextNode(),n.push({type:2,index:++r});o.append(t[e],q())}}}else if(8===o.nodeType)if(o.data===D)n.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(z,t+1));)n.push({type:7,index:r}),t+=z.length-1}r++}}static createElement(t,e){const i=L.createElement("template");return i.innerHTML=t,i}}function it(t,e,i=t,o){if(e===K)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=O(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=it(t,r._$AS(t,e.values),r,o)),e}class ot{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??L).importNode(e,!0);X.currentNode=o;let r=X.nextNode(),s=0,a=0,n=i[0];for(;void 0!==n;){if(s===n.index){let e;2===n.type?e=new rt(r,r.nextSibling,this,t):1===n.type?e=new n.ctor(r,n.name,n.strings,this,t):6===n.type&&(e=new dt(r,this,t)),this._$AV.push(e),n=i[++a]}s!==n?.index&&(r=X.nextNode(),s++)}return X.currentNode=L,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class rt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=J,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=it(this,t,e),O(t)?t===J||null==t||""===t?(this._$AH!==J&&this._$AR(),this._$AH=J):t!==this._$AH&&t!==K&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==J&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(L.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=et.createElement(Q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new ot(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Z.get(t.strings);return void 0===e&&Z.set(t.strings,e=new et(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new rt(this.O(q()),this.O(q()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=S(t).nextSibling;S(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=J,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=J}_$AI(t,e=this,i,o){const r=this.strings;let s=!1;if(void 0===r)t=it(this,t,e,0),s=!O(t)||t!==this._$AH&&t!==K,s&&(this._$AH=t);else{const o=t;let a,n;for(t=r[0],a=0;a<r.length-1;a++)n=it(this,o[i+a],e,a),n===K&&(n=this._$AH[a]),s||=!O(n)||n!==this._$AH[a],n===J?t=J:t!==J&&(t+=(n??"")+r[a+1]),this._$AH[a]=n}s&&!o&&this.j(t)}j(t){t===J?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class at extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===J?void 0:t}}class nt extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==J)}}class lt extends st{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=it(this,t,e,0)??J)===K)return;const i=this._$AH,o=t===J&&i!==J||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==J&&(i===J||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class dt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){it(this,t)}}const ct=k.litHtmlPolyfillSupport;ct?.(et,rt),(k.litHtmlVersions??=[]).push("3.3.2");const ht=globalThis;class pt extends P{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=i?.renderBefore??null;o._$litPart$=r=new rt(e.insertBefore(q(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return K}}pt._$litElement$=!0,pt.finalized=!0,ht.litElementHydrateSupport?.({LitElement:pt});const vt=ht.litElementPolyfillSupport;vt?.({LitElement:pt}),(ht.litElementVersions??=[]).push("4.2.2");const ut={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:w},mt=(t=ut,e,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,r,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];e.call(this,i),this.requestUpdate(o,r,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ft(t){return(e,i)=>"object"==typeof i?mt(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function gt(t){return ft({...t,state:!0,attribute:!1})}const _t=[{value:"1d",label:"1D"},{value:"1w",label:"1W"},{value:"mtd",label:"MTD"},{value:"1m",label:"1M"},{value:"3m",label:"3M"},{value:"6m",label:"6M"},{value:"1y",label:"1Y"},{value:"ytd",label:"YTD"},{value:"3y",label:"3Y"},{value:"5y",label:"5Y"},{value:"10y",label:"10Y"},{value:"max",label:"Max"}],yt=["total_value","xirr","ttwror","unrealized_gain","realized_gain","dividends","fees","taxes","valuation_start","unrealized_gain_net","unrealized_return_gross","unrealized_return_net","realized_gain_net","realized_return_gross","realized_return_net","dividends_net","dividends_taxes","dividends_fees","holdings_count","net_allocation","positive_allocation","negative_allocation"];function bt(t){for(const e of yt)if(t.endsWith("_"+e))return e;return null}function $t(t,e){const i=xt(t,e);return{portfolios:i,matchedConfiguredDevice:Boolean(e&&i.length>0)}}function xt(t,e){return t.entities?function(t,e){var i,o,r,s,a,n;const l=e?null===(i=t.devices)||void 0===i?void 0:i[e]:void 0,d=wt(l),c=new Map;for(const i of Object.values(t.entities))"parqet"===i.platform&&i.device_id&&(e&&i.device_id!==e||(c.has(i.device_id)||c.set(i.device_id,[]),c.get(i.device_id).push({entity_id:i.entity_id,unique_id:i.unique_id})));const h=[];for(const[e,i]of c){const l=null===(o=t.devices)||void 0===o?void 0:o[e];if(!d&&wt(l))continue;const c=null!==(r=null==l?void 0:l.name)&&void 0!==r?r:e;let p=null;for(const[t,e]of null!==(s=null==l?void 0:l.identifiers)&&void 0!==s?s:[])if("parqet"===t&&e){p=e;break}const v={};let u=null;for(const{entity_id:e,unique_id:o}of i){const i=t.states[e];if(i&&(!u&&(null===(a=i.attributes)||void 0===a?void 0:a.entry_id)&&(u=i.attributes.entry_id),!p&&(null===(n=i.attributes)||void 0===n?void 0:n.portfolio_id)&&(p=i.attributes.portfolio_id),o)){const t=bt(o);t&&(v[t]=i)}}u&&p&&h.push({entryId:u,portfolioId:p,name:c,entityPrefix:null,sensors:v})}return h}(t,e):function(t){const e=new Map,i=12;for(const[o,r]of Object.entries(t.states)){if(!o.startsWith("sensor.")||!o.includes("_total_value"))continue;const s=r.attributes,a=o.slice(0,o.length-i),n=a+"_",l={};for(const[e,i]of Object.entries(t.states))e.startsWith(n)&&(l[e.slice(n.length)]=i);if(Object.keys(l).length<3)continue;const d=s.entry_id||a,c=s.portfolio_id||a,h=(a.replace("sensor.","")||"Portfolio").split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ");e.set(a,{entryId:d,portfolioId:c,name:h,entityPrefix:a,sensors:l})}return Array.from(e.values())}(t)}function wt(t){var e;return!!(null===(e=null==t?void 0:t.identifiers)||void 0===e?void 0:e.some(([t,e])=>"parqet"===t&&"combined_accounts"===e))}function At(t){var e,i;const o=Object.values(null!==(e=t.devices)&&void 0!==e?e:{}).find(wt);return o&&null!==(i=xt(t,o.id)[0])&&void 0!==i?i:null}function Pt(t,e="€"){return null==t?"—":`${e}${t.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function kt(t){return null==t?"—":`${t>=0?"+":""}${t.toFixed(2)}%`}function St(t){return null==t?"":t>0?"positive":t<0?"negative":""}function Et(t,e){const i={type:"parqet/get_performance",interval:e};if(t._portfolios&&t._portfolios.length>0){const e=t._portfolios[0].entryId;i.entry_id=e,i.portfolio_ids=t._portfolios.filter(t=>t.entryId===e).map(t=>t.portfolioId)}else i.entry_id=t.entryId,i.portfolio_id=t.portfolioId;return i}function It(t){var e;return null!==(e=t._portfolios)&&void 0!==e?e:[{entryId:t.entryId,portfolioId:t.portfolioId}]}function Ct(t){return!!t&&"object"==typeof t&&"code"in t&&"rate_limited"===t.code}const zt={en:{"card.description":"Display your Parqet portfolio data — performance, holdings and activities.","snapshot.name":"Parqet Daily Snapshot","snapshot.description":"Per-holding daily P&L based on a custom snapshot time.","views.performance":"Performance","views.holdings":"Holdings","views.activities":"Activities","views.layout":"Layout","editor.device":"Portfolio (leave empty for auto-detect)","editor.defaultView":"Default View","editor.defaultInterval":"Default Interval","editor.currencySymbol":"Currency Symbol","editor.holdingsLimit":"Holdings Limit","editor.activitiesLimit":"Activities Limit","editor.showIntervalSelector":"Show Interval Selector","editor.showPerformanceChart":"Show Performance Chart","editor.showAllocationChart":"Show Allocation Chart","editor.showLogo":"Show Holding Logos","editor.compact":"Compact Mode","editor.hideHeader":"Hide Header","interval.1d":"1 Day","interval.1w":"1 Week","interval.mtd":"Month to Date","interval.1m":"1 Month","interval.3m":"3 Months","interval.6m":"6 Months","interval.1y":"1 Year","interval.ytd":"Year to Date","interval.3y":"3 Years","interval.5y":"5 Years","interval.10y":"10 Years","interval.max":"Maximum","interval.short.1d":"1D","interval.short.1w":"1W","interval.short.mtd":"MTD","interval.short.1m":"1M","interval.short.3m":"3M","interval.short.6m":"6M","interval.short.1y":"1Y","interval.short.ytd":"YTD","interval.short.3y":"3Y","interval.short.5y":"5Y","interval.short.10y":"10Y","interval.short.max":"Max","common.loading":"Loading","common.noData":"No data","common.name":"Name","common.value":"Value","common.profitLoss":"P&L","common.profitLossPct":"P&L%","common.weight":"Weight","common.unknown":"Unknown","common.total":"Total","common.dividends":"Dividends","common.fees":"Fees","common.taxes":"Taxes","common.timeInterval":"Time interval","common.selectPortfolio":"Select portfolio","common.portfolioAllocationChart":"Portfolio allocation chart","card.allPortfolios":"All Portfolios","card.noPortfolios":"No Parqet portfolios found","card.addIntegration":"Add the Parqet Companion integration first","card.rateLimitWarning":"API rate limit reached — wait a few minutes before retrying; reloading now makes it worse","card.rateLimitError":"Rate limit exceeded","card.loadError":"Failed to load data","performance.totalValue":"Total Value","performance.xirr":"XIRR","performance.ttwror":"TTWROR","performance.unrealizedGain":"Unrealized Gain","performance.realizedGain":"Realized Gain","performance.unrealized":"Unrealized","performance.realized":"Realized","performance.noData":"No data available.","holdings.none":"No holdings found.","holdings.other":"Other","holdings.shares":"Shares","holdings.averagePrice":"Avg Price","holdings.current":"Current","activities.all":"All","activities.buy":"Buy","activities.sell":"Sell","activities.dividend":"Dividend","activities.interest":"Interest","activities.transferIn":"Transfer In","activities.transferOut":"Transfer Out","activities.feesTaxes":"Fees/Taxes","activities.deposit":"Deposit","activities.withdrawal":"Withdrawal","activities.rateLimit":"API rate limit reached — data will refresh automatically","activities.loadError":"Failed to load activities","activities.none":"No activities found.","activities.loadMore":"Load more","activities.tax":"Tax","activities.fee":"Fee","snapshot.compare":"vs.","snapshot.enable":"Enable daily snapshots in integration settings.","snapshot.loadError":"Failed to load snapshot data","snapshot.dailyProfitLoss":"Daily P&L","snapshot.waiting":"Waiting for first daily snapshot."},de:{"card.description":"Zeigt deine Parqet-Portfoliodaten mit Wertentwicklung, Positionen und Aktivitäten.","snapshot.name":"Parqet Tages-Snapshot","snapshot.description":"Täglicher Gewinn oder Verlust je Position auf Basis einer eigenen Snapshot-Zeit.","views.performance":"Wertentwicklung","views.holdings":"Positionen","views.activities":"Aktivitäten","views.layout":"Darstellung","editor.device":"Portfolio (leer lassen für automatische Erkennung)","editor.defaultView":"Standardansicht","editor.defaultInterval":"Standardzeitraum","editor.currencySymbol":"Währungssymbol","editor.holdingsLimit":"Maximale Positionen","editor.activitiesLimit":"Maximale Aktivitäten","editor.showIntervalSelector":"Zeitraumauswahl anzeigen","editor.showPerformanceChart":"Wertentwicklungsdiagramm anzeigen","editor.showAllocationChart":"Allokationsdiagramm anzeigen","editor.showLogo":"Logos der Positionen anzeigen","editor.compact":"Kompakte Darstellung","editor.hideHeader":"Kopfzeile ausblenden","interval.1d":"1 Tag","interval.1w":"1 Woche","interval.mtd":"Laufender Monat","interval.1m":"1 Monat","interval.3m":"3 Monate","interval.6m":"6 Monate","interval.1y":"1 Jahr","interval.ytd":"Laufendes Jahr","interval.3y":"3 Jahre","interval.5y":"5 Jahre","interval.10y":"10 Jahre","interval.max":"Gesamt","interval.short.1d":"1T","interval.short.1w":"1W","interval.short.mtd":"MTD","interval.short.1m":"1M","interval.short.3m":"3M","interval.short.6m":"6M","interval.short.1y":"1J","interval.short.ytd":"YTD","interval.short.3y":"3J","interval.short.5y":"5J","interval.short.10y":"10J","interval.short.max":"Max","common.loading":"Wird geladen","common.noData":"Keine Daten","common.name":"Name","common.value":"Wert","common.profitLoss":"G/V","common.profitLossPct":"G/V %","common.weight":"Anteil","common.unknown":"Unbekannt","common.total":"Gesamt","common.dividends":"Dividenden","common.fees":"Gebühren","common.taxes":"Steuern","common.timeInterval":"Zeitraum","common.selectPortfolio":"Portfolio auswählen","common.portfolioAllocationChart":"Diagramm zur Portfolioaufteilung","card.allPortfolios":"Alle Portfolios","card.noPortfolios":"Keine Parqet-Portfolios gefunden","card.addIntegration":"Füge zuerst die Parqet-Companion-Integration hinzu","card.rateLimitWarning":"API-Limit erreicht — warte einige Minuten; ein erneutes Laden verschärft das Problem","card.rateLimitError":"API-Limit überschritten","card.loadError":"Daten konnten nicht geladen werden","performance.totalValue":"Gesamtwert","performance.xirr":"XIRR","performance.ttwror":"TTWROR","performance.unrealizedGain":"Unrealisierter Gewinn","performance.realizedGain":"Realisierter Gewinn","performance.unrealized":"Unrealisiert","performance.realized":"Realisiert","performance.noData":"Keine Daten verfügbar.","holdings.none":"Keine Positionen gefunden.","holdings.other":"Sonstige","holdings.shares":"Anteile","holdings.averagePrice":"Ø Kaufpreis","holdings.current":"Aktuell","activities.all":"Alle","activities.buy":"Kauf","activities.sell":"Verkauf","activities.dividend":"Dividende","activities.interest":"Zinsen","activities.transferIn":"Übertrag Eingang","activities.transferOut":"Übertrag Ausgang","activities.feesTaxes":"Gebühren/Steuern","activities.deposit":"Einzahlung","activities.withdrawal":"Auszahlung","activities.rateLimit":"API-Limit erreicht — die Daten werden automatisch aktualisiert","activities.loadError":"Aktivitäten konnten nicht geladen werden","activities.none":"Keine Aktivitäten gefunden.","activities.loadMore":"Mehr laden","activities.tax":"Steuer","activities.fee":"Gebühr","snapshot.compare":"ggü.","snapshot.enable":"Aktiviere tägliche Snapshots in den Integrationseinstellungen.","snapshot.loadError":"Snapshot-Daten konnten nicht geladen werden","snapshot.dailyProfitLoss":"Tages-G/V","snapshot.waiting":"Warte auf den ersten täglichen Snapshot."}};function Dt(t){return"de"===function(t){var e,i;if("string"==typeof t)return t;const o=null!==(i=null===(e=null==t?void 0:t.locale)||void 0===e?void 0:e.language)&&void 0!==i?i:null==t?void 0:t.language;return o||("undefined"!=typeof document&&document.documentElement.lang?document.documentElement.lang:"undefined"!=typeof navigator&&navigator.language?navigator.language:"en")}(t).toLowerCase().split(/[-_]/,1)[0]?"de":"en"}function Mt(t){return"de"===Dt(t)?"de-DE":"en-US"}function Lt(t,e){return zt[Dt(e)][t]}class qt extends pt{render(){return F`
      <div class="container" role="status" aria-label=${Lt("common.loading",this.hass)}>
        <div class="spinner"></div>
      </div>
    `}}qt.styles=d`
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
  `,t([ft({attribute:!1})],qt.prototype,"hass",void 0),o("parqet-loading-spinner",qt);class Ot extends pt{constructor(){super(...arguments),this.selected="1y"}_select(t){this.selected=t,this.dispatchEvent(new CustomEvent("interval-change",{detail:{interval:t},bubbles:!0,composed:!0}))}render(){return F`
      <div class="intervals" role="group" aria-label=${Lt("common.timeInterval",this.hass)}>
        ${_t.map(({value:t})=>F`
            <button
              class="btn ${this.selected===t?"active":""}"
              @click=${()=>this._select(t)}
              aria-pressed=${this.selected===t}
            >
              ${Lt(`interval.short.${t}`,this.hass)}
            </button>
          `)}
      </div>
    `}}Ot.styles=d`
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
  `,t([ft({attribute:!1})],Ot.prototype,"hass",void 0),t([ft()],Ot.prototype,"selected",void 0),o("parqet-interval-selector",Ot);class Tt extends pt{constructor(){super(...arguments),this.segments=[],this.currencySymbol="€"}_fmt(t){return`${t<0?"−":""}${this.currencySymbol}${Math.abs(t).toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:0})}`}render(){const t=this.segments.filter(t=>0!==t.value);if(0===t.length)return F`<div class="empty">${Lt("common.noData",this.hass)}</div>`;const e=t.reduce((t,e)=>t+Math.abs(e.value),0);if(0===e)return F`<div class="empty">${Lt("common.noData",this.hass)}</div>`;const i=t.map(t=>Object.assign(Object.assign({},t),{pct:Math.abs(t.value)/e*100}));return F`
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
    `}}Tt.styles=d`
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
  `,t([ft({attribute:!1})],Tt.prototype,"hass",void 0),t([ft({type:Array})],Tt.prototype,"segments",void 0),t([ft({type:String})],Tt.prototype,"currencySymbol",void 0),o("parqet-stacked-bar",Tt);class Ut extends pt{constructor(){super(...arguments),this.perfData=null,this.loading=!1,this.error="",this.interval="1y"}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}render(){var t,e,i,o,r,s,a,n,l,d,c,h,p,v,u,m,f,g,_,y,b,$,x,w,A,P,k,S;const E=this.perfData;return F`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?F`
        <parqet-interval-selector
          .hass=${this.hass}
          .selected=${this.interval}
          @interval-change=${t=>this.dispatchEvent(new CustomEvent("interval-change",{detail:t.detail,bubbles:!0,composed:!0}))}
        ></parqet-interval-selector>
      `:""}

      ${this.error?F`<div class="error" role="alert">${this.error}</div>`:""}
      ${this.loading?F`<parqet-loading-spinner .hass=${this.hass}></parqet-loading-spinner>`:""}

      ${E?F`
        <div class="kpi-grid ${(null===(e=this.config)||void 0===e?void 0:e.compact)?"compact":""}">
          ${this._kpi(Lt("performance.totalValue",this.hass),Pt(null===(i=E.valuation)||void 0===i?void 0:i.atIntervalEnd,this._sym()))}
          ${this._kpi(Lt("performance.xirr",this.hass),kt(null===(r=null===(o=E.kpis)||void 0===o?void 0:o.inInterval)||void 0===r?void 0:r.xirr),null===(a=null===(s=E.kpis)||void 0===s?void 0:s.inInterval)||void 0===a?void 0:a.xirr)}
          ${this._kpi(Lt("performance.ttwror",this.hass),kt(null===(l=null===(n=E.kpis)||void 0===n?void 0:n.inInterval)||void 0===l?void 0:l.ttwror),null===(c=null===(d=E.kpis)||void 0===d?void 0:d.inInterval)||void 0===c?void 0:c.ttwror)}
          ${this._kpi(Lt("performance.unrealizedGain",this.hass),Pt(null===(p=null===(h=E.unrealizedGains)||void 0===h?void 0:h.inInterval)||void 0===p?void 0:p.gainGross,this._sym()),null===(u=null===(v=E.unrealizedGains)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.gainGross)}
          ${this._kpi(Lt("performance.realizedGain",this.hass),Pt(null===(f=null===(m=E.realizedGains)||void 0===m?void 0:m.inInterval)||void 0===f?void 0:f.gainGross,this._sym()),null===(_=null===(g=E.realizedGains)||void 0===g?void 0:g.inInterval)||void 0===_?void 0:_.gainGross)}
          ${this._kpi(Lt("common.dividends",this.hass),Pt(null===(b=null===(y=E.dividends)||void 0===y?void 0:y.inInterval)||void 0===b?void 0:b.gainGross,this._sym()))}
          ${this._kpi(Lt("common.fees",this.hass),Pt(null===(x=null===($=E.fees)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.fees,this._sym()))}
          ${this._kpi(Lt("common.taxes",this.hass),Pt(null===(A=null===(w=E.taxes)||void 0===w?void 0:w.inInterval)||void 0===A?void 0:A.taxes,this._sym()))}
        </div>
        ${!1!==(null!==(k=null===(P=this.config)||void 0===P?void 0:P.show_performance_chart)&&void 0!==k?k:null===(S=this.config)||void 0===S?void 0:S.show_chart)?this._renderChart(E):""}
      `:this.loading?"":F`<div class="empty">${Lt("performance.noData",this.hass)}</div>`}
    `}_kpi(t,e,i){return F`
      <div class="kpi-tile">
        <div class="kpi-label">${t}</div>
        <div class="kpi-value ${St(i)}">${e}</div>
      </div>
    `}_renderChart(t){var e,i,o,r,s,a,n,l,d,c,h,p,v,u,m;const f=[{label:Lt("performance.unrealized",this.hass),value:null!==(o=null===(i=null===(e=t.unrealizedGains)||void 0===e?void 0:e.inInterval)||void 0===i?void 0:i.gainGross)&&void 0!==o?o:0,color:"var(--success-color, #4caf50)"},{label:Lt("performance.realized",this.hass),value:null!==(a=null===(s=null===(r=t.realizedGains)||void 0===r?void 0:r.inInterval)||void 0===s?void 0:s.gainGross)&&void 0!==a?a:0,color:"#4285f4"},{label:Lt("common.dividends",this.hass),value:null!==(d=null===(l=null===(n=t.dividends)||void 0===n?void 0:n.inInterval)||void 0===l?void 0:l.gainGross)&&void 0!==d?d:0,color:"#46bdc6"},{label:Lt("common.fees",this.hass),value:-(null!==(p=null===(h=null===(c=t.fees)||void 0===c?void 0:c.inInterval)||void 0===h?void 0:h.fees)&&void 0!==p?p:0),color:"#ff6d01"},{label:Lt("common.taxes",this.hass),value:-(null!==(m=null===(u=null===(v=t.taxes)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.taxes)&&void 0!==m?m:0),color:"var(--error-color, #f44336)"}].filter(t=>0!==t.value);return 0===f.length?"":F`<parqet-stacked-bar .hass=${this.hass} .segments=${f} .currencySymbol=${this._sym()}></parqet-stacked-bar>`}}Ut.styles=d`
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
  `,t([ft({attribute:!1})],Ut.prototype,"hass",void 0),t([ft({attribute:!1})],Ut.prototype,"portfolio",void 0),t([ft({attribute:!1})],Ut.prototype,"config",void 0),t([ft({attribute:!1})],Ut.prototype,"perfData",void 0),t([ft({attribute:!1})],Ut.prototype,"loading",void 0),t([ft({attribute:!1})],Ut.prototype,"error",void 0),t([ft()],Ut.prototype,"interval",void 0),o("parqet-performance-view",Ut);const Gt=160,Rt=2*Math.PI*66;class Ht extends pt{constructor(){super(...arguments),this.segments=[],this.centerLabel="",this.centerSub=""}render(){const t=this.segments.reduce((t,e)=>t+Math.abs(e.value),0);if(0===t||0===this.segments.length)return F`<div class="empty">${Lt("common.noData",this.hass)}</div>`;const e=80;let i=0;return F`
      <div class="chart-container">
        <svg viewBox="0 0 ${Gt} ${Gt}" class="donut" role="img" aria-label=${Lt("common.portfolioAllocationChart",this.hass)}>
          ${this.segments.map(o=>{const r=Math.abs(o.value)/t,s=r*Rt,a=Rt-s,n=i/t*360-90;return i+=Math.abs(o.value),Y`
              <circle
                cx="${e}" cy="${e}" r="${66}"
                fill="none"
                stroke="${o.color}"
                stroke-width="${28}"
                stroke-dasharray="${s} ${a}"
                transform="rotate(${n} ${e} ${e})"
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
          ${this.segments.map(e=>{const i=Math.abs(e.value)/t*100;return F`
              <div class="legend-item">
                <span class="legend-dot" style="background:${e.color}"></span>
                <span class="legend-label">${e.label}</span>
                <span class="legend-pct">${i.toFixed(1)}%</span>
              </div>
            `})}
        </div>
      </div>
    `}}Ht.styles=d`
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
  `,t([ft({attribute:!1})],Ht.prototype,"hass",void 0),t([ft({type:Array})],Ht.prototype,"segments",void 0),t([ft({type:String})],Ht.prototype,"centerLabel",void 0),t([ft({type:String})],Ht.prototype,"centerSub",void 0),o("parqet-donut-chart",Ht);const Nt=["#4285f4","#ea4335","#fbbc04","#34a853","#ff6d01","#46bdc6","#9c27b0","#795548","#607d8b","#e91e63","#00bcd4","#8bc34a","#ff5722","#3f51b5","#cddc39","#009688","#ffc107","#673ab7","#03a9f4","#ff9800"];class Vt extends pt{constructor(){super(...arguments),this.holdingsData=[],this.loading=!1,this.error="",this.interval="max",this._sortBy="value",this._sortAsc=!1,this._expandedId=null}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_totalValue(){return this.holdingsData.reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0)}_sorted(t){const e=[...this.holdingsData].sort((e,i)=>{var o,r,s,a,n,l,d,c,h,p,v,u,m,f,g,_,y,b,$,x,w,A,P,k,S,E,I,C;switch(this._sortBy){case"name":return(null!==(r=null===(o=e.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"").localeCompare(null!==(a=null===(s=i.asset)||void 0===s?void 0:s.name)&&void 0!==a?a:"");case"value":return(null!==(l=null===(n=i.position)||void 0===n?void 0:n.currentValue)&&void 0!==l?l:0)-(null!==(c=null===(d=e.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0);case"pl":return(null!==(u=null===(v=null===(p=null===(h=i.performance)||void 0===h?void 0:h.unrealizedGains)||void 0===p?void 0:p.inInterval)||void 0===v?void 0:v.gainGross)&&void 0!==u?u:0)-(null!==(_=null===(g=null===(f=null===(m=e.performance)||void 0===m?void 0:m.unrealizedGains)||void 0===f?void 0:f.inInterval)||void 0===g?void 0:g.gainGross)&&void 0!==_?_:0);case"plPct":return(null!==(x=null===($=null===(b=null===(y=i.performance)||void 0===y?void 0:y.unrealizedGains)||void 0===b?void 0:b.inInterval)||void 0===$?void 0:$.returnGross)&&void 0!==x?x:0)-(null!==(k=null===(P=null===(A=null===(w=e.performance)||void 0===w?void 0:w.unrealizedGains)||void 0===A?void 0:A.inInterval)||void 0===P?void 0:P.returnGross)&&void 0!==k?k:0);case"weight":{const o=t>0?(null!==(E=null===(S=e.position)||void 0===S?void 0:S.currentValue)&&void 0!==E?E:0)/t:0;return(t>0?(null!==(C=null===(I=i.position)||void 0===I?void 0:I.currentValue)&&void 0!==C?C:0)/t:0)-o}default:return 0}});return this._sortAsc?e.reverse():e}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t;return F`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?F`
        <parqet-interval-selector
          .hass=${this.hass}
          .selected=${this.interval}
          @interval-change=${t=>this.dispatchEvent(new CustomEvent("interval-change",{detail:t.detail,bubbles:!0,composed:!0}))}
        ></parqet-interval-selector>
      `:""}

      ${this.loading?F`<parqet-loading-spinner .hass=${this.hass}></parqet-loading-spinner>`:""}
      ${this.error?F`<div class="error" role="alert">${this.error}</div>`:""}
      ${this.loading||this.error||this.holdingsData.length?"":F`<div class="empty">${Lt("holdings.none",this.hass)}</div>`}

      ${this.loading||this.error||!this.holdingsData.length?"":(()=>{var t,e,i,o,r;const s=this._totalValue(),a=null!==(e=null===(t=this.config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,n=this._sorted(s).slice(0,a);return F`
      ${!1!==(null!==(o=null===(i=this.config)||void 0===i?void 0:i.show_allocation_chart)&&void 0!==o?o:null===(r=this.config)||void 0===r?void 0:r.show_chart)?F`
        <parqet-donut-chart
          .hass=${this.hass}
          .segments=${(()=>{const t=n.slice(0,20).map((t,e)=>{var i,o,r,s,a;return{label:null!==(r=null!==(i=t.nickname)&&void 0!==i?i:null===(o=t.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:Lt("common.unknown",this.hass),value:null!==(a=null===(s=t.position)||void 0===s?void 0:s.currentValue)&&void 0!==a?a:0,color:Nt[e%Nt.length]}});if(n.length>20){const e=n.slice(20).reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0);e>0&&t.push({label:Lt("holdings.other",this.hass),value:e,color:"#9e9e9e"})}return t})()}
        ></parqet-donut-chart>
      `:""}

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click=${()=>this._toggleSort("name")}>${Lt("common.name",this.hass)}</th>
              <th class="sortable num" @click=${()=>this._toggleSort("value")}>${Lt("common.value",this.hass)}</th>
              <th class="sortable num" @click=${()=>this._toggleSort("pl")}>${Lt("common.profitLoss",this.hass)}</th>
              <th class="sortable num" @click=${()=>this._toggleSort("plPct")}>${Lt("common.profitLossPct",this.hass)}</th>
              <th class="sortable num" @click=${()=>this._toggleSort("weight")}>${Lt("common.weight",this.hass)}</th>
            </tr>
          </thead>
          <tbody>
            ${n.map(t=>{var e,i,o,r,a,n,l,d,c,h,p,v,u,m,f,g,_,y,b,$,x,w,A,P,k,S,E;const I=null!==(r=null===(o=null===(i=null===(e=t.performance)||void 0===e?void 0:e.unrealizedGains)||void 0===i?void 0:i.inInterval)||void 0===o?void 0:o.gainGross)&&void 0!==r?r:0,C=null===(l=null===(n=null===(a=t.performance)||void 0===a?void 0:a.unrealizedGains)||void 0===n?void 0:n.inInterval)||void 0===l?void 0:l.returnGross,z=s>0?(null!==(c=null===(d=t.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0)/s*100:0,D=this._expandedId===t.id;return F`
                <tr class="holding-row ${D?"expanded":""}" @click=${()=>this._expandedId=D?null:t.id}>
                  <td>
                    <div class="holding-name">
                      ${!1!==(null===(h=this.config)||void 0===h?void 0:h.show_logo)&&t.logo?F`<img class="logo" src=${t.logo} alt="" />`:""}
                      <span>${null!==(u=null!==(p=t.nickname)&&void 0!==p?p:null===(v=t.asset)||void 0===v?void 0:v.name)&&void 0!==u?u:Lt("common.unknown",this.hass)}</span>
                    </div>
                  </td>
                  <td class="num">${Pt(null===(m=t.position)||void 0===m?void 0:m.currentValue,this._sym())}</td>
                  <td class="num ${St(I)}">${Pt(I,this._sym())}</td>
                  <td class="num ${St(C)}">${kt(C)}</td>
                  <td class="num">${z.toFixed(1)}%</td>
                </tr>
                ${D?F`
                  <tr class="detail-row">
                    <td colspan="5">
                      <div class="detail-grid">
                        <span>${Lt("holdings.shares",this.hass)}: ${null===(g=null===(f=t.position)||void 0===f?void 0:f.shares)||void 0===g?void 0:g.toFixed(4)}</span>
                        <span>${Lt("holdings.averagePrice",this.hass)}: ${Pt(null===(_=t.position)||void 0===_?void 0:_.purchasePrice,this._sym())}</span>
                        <span>${Lt("holdings.current",this.hass)}: ${Pt(null===(y=t.position)||void 0===y?void 0:y.currentPrice,this._sym())}</span>
                        <span>XIRR: ${kt(null===(x=null===($=null===(b=t.performance)||void 0===b?void 0:b.kpis)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.xirr)}</span>
                        <span>${Lt("common.dividends",this.hass)}: ${Pt(null===(P=null===(A=null===(w=t.performance)||void 0===w?void 0:w.dividends)||void 0===A?void 0:A.inInterval)||void 0===P?void 0:P.gainGross,this._sym())}</span>
                        <span>${Lt("common.fees",this.hass)}: ${Pt(null===(E=null===(S=null===(k=t.performance)||void 0===k?void 0:k.fees)||void 0===S?void 0:S.inInterval)||void 0===E?void 0:E.fees,this._sym())}</span>
                      </div>
                    </td>
                  </tr>
                `:""}
              `})}
          </tbody>
        </table>
      </div>
        `})()}
    `}}Vt.styles=d`
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
  `,t([ft({attribute:!1})],Vt.prototype,"hass",void 0),t([ft({attribute:!1})],Vt.prototype,"portfolio",void 0),t([ft({attribute:!1})],Vt.prototype,"config",void 0),t([ft({attribute:!1})],Vt.prototype,"holdingsData",void 0),t([ft({attribute:!1})],Vt.prototype,"loading",void 0),t([ft({attribute:!1})],Vt.prototype,"error",void 0),t([ft()],Vt.prototype,"interval",void 0),t([gt()],Vt.prototype,"_sortBy",void 0),t([gt()],Vt.prototype,"_sortAsc",void 0),t([gt()],Vt.prototype,"_expandedId",void 0),o("parqet-holdings-view",Vt);const jt=[{value:"all",key:"activities.all"},{value:"buy",key:"activities.buy"},{value:"sell",key:"activities.sell"},{value:"dividend",key:"activities.dividend"},{value:"interest",key:"activities.interest"},{value:"transfer_in",key:"activities.transferIn"},{value:"transfer_out",key:"activities.transferOut"},{value:"fees_taxes",key:"activities.feesTaxes"},{value:"deposit",key:"activities.deposit"},{value:"withdrawal",key:"activities.withdrawal"}],Wt={buy:"activities.buy",sell:"activities.sell",dividend:"activities.dividend",interest:"activities.interest",transfer_in:"activities.transferIn",transfer_out:"activities.transferOut",fees_taxes:"activities.feesTaxes",deposit:"activities.deposit",withdrawal:"activities.withdrawal"},Bt={buy:"#4caf50",sell:"#f44336",dividend:"#46bdc6",interest:"#9c27b0",transfer_in:"#4285f4",transfer_out:"#ff6d01",fees_taxes:"#ff9800",deposit:"#4caf50",withdrawal:"#f44336"};class Ft extends pt{constructor(){super(...arguments),this._activities=[],this._holdingsMap=new Map,this._loading=!1,this._error="",this._filter="all",this._cursor=null,this._hasMore=!1}connectedCallback(){var t,e;super.connectedCallback(),this._filter=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_activity_type)&&void 0!==e?e:"all",this._load()}updated(t){t.has("portfolio")&&this._load()}_isAggregated(){return It(this.portfolio).length>1}async _loadHoldingsMap(){var t,e,i;if(!(this._holdingsMap.size>0))try{const o=new Map,r=await Promise.all(It(this.portfolio).map(t=>this.hass.connection.sendMessagePromise({type:"parqet/get_holdings",entry_id:t.entryId,portfolio_id:t.portfolioId})));for(const s of r)for(const r of s.holdings||[])r.id&&o.set(r.id,null!==(i=null!==(t=r.nickname)&&void 0!==t?t:null===(e=r.asset)||void 0===e?void 0:e.name)&&void 0!==i?i:Lt("common.unknown",this.hass));this._holdingsMap=o}catch(t){}}async _load(t=!1){var e,i;if(this.hass&&this.portfolio){this._loading=!0,this._error="",await this._loadHoldingsMap();try{const o=null!==(i=null===(e=this.config)||void 0===e?void 0:e.activities_limit)&&void 0!==i?i:25,r=It(this.portfolio),s=await Promise.all(r.map(e=>{const i={type:"parqet/get_activities",entry_id:e.entryId,portfolio_id:e.portfolioId,limit:o};return"all"!==this._filter&&(i.activity_type=[this._filter]),!this._isAggregated()&&t&&this._cursor&&(i.cursor=this._cursor),this.hass.connection.sendMessagePromise(i)})),a=[];let n=null;for(const t of s)a.push(...t.activities),t.cursor&&(n=t.cursor);a.sort((t,e)=>new Date(e.datetime).getTime()-new Date(t.datetime).getTime()),this._activities=t?[...this._activities,...a]:a,this._cursor=this._isAggregated()?null:n,this._hasMore=!this._isAggregated()&&!!n}catch(t){Ct(t)?this._error=Lt("activities.rateLimit",this.hass):this._error=Lt("activities.loadError",this.hass)}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_onFilterChange(t){this._filter=t,this._cursor=null,this._load()}render(){return F`
      <div class="filters">
        ${jt.map(t=>F`
          <button
            class="chip ${this._filter===t.value?"active":""}"
            @click=${()=>this._onFilterChange(t.value)}
          >${Lt(t.key,this.hass)}</button>
        `)}
      </div>

      ${this._error?F`<div class="error">${this._error}</div>`:""}

      ${0!==this._activities.length||this._loading?F`
          <div class="activity-list">
            ${this._activities.map(t=>this._renderActivity(t))}
          </div>
        `:F`<div class="empty">${Lt("activities.none",this.hass)}</div>`}

      ${this._loading?F`<parqet-loading-spinner .hass=${this.hass}></parqet-loading-spinner>`:""}

      ${this._hasMore&&!this._loading?F`
        <button class="load-more" @click=${()=>this._load(!0)}>${Lt("activities.loadMore",this.hass)}</button>
      `:""}
    `}_resolveAssetName(t){var e,i,o;if(t.holdingId&&this._holdingsMap.has(t.holdingId))return this._holdingsMap.get(t.holdingId);const r=t.asset;return r&&null!==(o=null!==(i=null!==(e=r.name)&&void 0!==e?e:r.symbol)&&void 0!==i?i:r.isin)&&void 0!==o?o:Lt("common.unknown",this.hass)}_renderActivity(t){var e;const i=null!==(e=Bt[t.type])&&void 0!==e?e:"var(--secondary-text-color)",o=Wt[t.type],r=o?Lt(o,this.hass):String(t.type).replace(/_/g," "),s=this._resolveAssetName(t);return F`
      <div class="activity">
        <div class="activity-left">
          <span class="badge" style="background: ${i}">${r}</span>
          <div class="activity-info">
            <span class="asset-name">${s}</span>
            <span class="activity-meta">
              ${function(t,e){try{const i=new Date(t);return Number.isNaN(i.getTime())?t:i.toLocaleDateString(e,{year:"numeric",month:"short",day:"numeric"})}catch(e){return t}}(t.datetime,Mt(this.hass))}${t.broker?` · ${t.broker}`:""}
            </span>
          </div>
        </div>
        <div class="activity-right">
          <span class="amount">${Pt(t.amount,this._sym())}</span>
          ${t.shares?F`<span class="shares">${t.shares} @ ${Pt(t.price,this._sym())}</span>`:""}
          ${t.tax?F`<span class="tax-fee">${Lt("activities.tax",this.hass)}: ${Pt(t.tax,this._sym())}</span>`:""}
          ${t.fee?F`<span class="tax-fee">${Lt("activities.fee",this.hass)}: ${Pt(t.fee,this._sym())}</span>`:""}
        </div>
      </div>
    `}}Ft.styles=d`
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
  `,t([ft({attribute:!1})],Ft.prototype,"hass",void 0),t([ft({attribute:!1})],Ft.prototype,"portfolio",void 0),t([ft({attribute:!1})],Ft.prototype,"config",void 0),t([gt()],Ft.prototype,"_activities",void 0),t([gt()],Ft.prototype,"_holdingsMap",void 0),t([gt()],Ft.prototype,"_loading",void 0),t([gt()],Ft.prototype,"_error",void 0),t([gt()],Ft.prototype,"_filter",void 0),t([gt()],Ft.prototype,"_cursor",void 0),t([gt()],Ft.prototype,"_hasMore",void 0),o("parqet-activities-view",Ft);const Yt=window;Yt.customCards=Yt.customCards||[],Yt.customCards.some(t=>"parqet-snapshot-card"===t.type)||Yt.customCards.push({type:"parqet-snapshot-card",name:Lt("snapshot.name"),description:Lt("snapshot.description"),preview:!1});class Kt extends pt{constructor(){super(...arguments),this._config={type:"custom:parqet-snapshot-card"},this._portfolio=null,this._data=null,this._loading=!1,this._error="",this._notEnabled=!1,this._sortBy="pl",this._sortAsc=!1}setConfig(t){this._config=t}getCardSize(){return 4}static getConfigForm(){const t=Dt();return{schema:[{name:"device_id",selector:{device:{integration:"parqet"}}},{name:"currency_symbol",selector:{text:{}}},{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"show_logo",selector:{boolean:{}}},{name:"compact",selector:{boolean:{}}}],computeLabel:e=>({device_id:Lt("editor.device",t),currency_symbol:Lt("editor.currencySymbol",t),holdings_limit:Lt("editor.holdingsLimit",t),show_logo:Lt("editor.showLogo",t),compact:Lt("editor.compact",t)}[e.name]||e.name)}}connectedCallback(){super.connectedCallback(),this._discoverPortfolio()}updated(t){t.has("hass")&&!this._portfolio&&this._discoverPortfolio()}_discoverPortfolio(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;const i=null===(e=this._config)||void 0===e?void 0:e.device_id,o=$t(this.hass,i);0!==o.portfolios.length&&(this._portfolio=o.portfolios[0],this._load())}async _load(){if(this.hass&&this._portfolio){this._loading=!0,this._error="",this._notEnabled=!1;try{const t=await this.hass.connection.sendMessagePromise({type:"parqet/get_snapshot",entry_id:this._portfolio.entryId,portfolio_id:this._portfolio.portfolioId});this._data=t}catch(t){t&&"object"==typeof t&&"code"in t&&"not_enabled"===t.code?this._notEnabled=!0:this._error=Lt("snapshot.loadError",this.hass)}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this._config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_fmtSnapshot(t){try{const e=new Date(t);return Number.isNaN(e.getTime())?t:e.toLocaleString(Mt(this.hass),{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return t}}_sorted(){if(!this._data)return[];const t=[...this._data.holdings].sort((t,e)=>{var i,o,r,s,a,n,l,d,c,h;switch(this._sortBy){case"name":return(null!==(i=t.name)&&void 0!==i?i:"").localeCompare(null!==(o=e.name)&&void 0!==o?o:"");case"value":return(null!==(r=e.current_value)&&void 0!==r?r:0)-(null!==(s=t.current_value)&&void 0!==s?s:0);case"pl":return(null!==(a=e.daily_pl)&&void 0!==a?a:0)-(null!==(n=t.daily_pl)&&void 0!==n?n:0);case"plPct":return(null!==(l=e.daily_pl_pct)&&void 0!==l?l:0)-(null!==(d=t.daily_pl_pct)&&void 0!==d?d:0);case"weight":return(null!==(c=e.weight)&&void 0!==c?c:0)-(null!==(h=t.weight)&&void 0!==h?h:0);default:return 0}});return this._sortAsc?t.reverse():t}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t;return F`
      <ha-card>
        ${this._portfolio?F`
          <div class="header">
            <span class="title">${this._portfolio.name}</span>
            ${(null===(t=this._data)||void 0===t?void 0:t.snapshot_taken_at)?F`
              <span class="subtitle">${Lt("snapshot.compare",this.hass)} ${this._fmtSnapshot(this._data.snapshot_taken_at)}</span>
            `:""}
          </div>
        `:""}

        ${this._notEnabled?F`
          <div class="info">${Lt("snapshot.enable",this.hass)}</div>
        `:""}

        ${this._loading?F`<parqet-loading-spinner .hass=${this.hass}></parqet-loading-spinner>`:""}
        ${this._error?F`<div class="error" role="alert">${this._error}</div>`:""}

        ${!this._data||this._loading||this._error?"":(()=>{var t,e;const i=this._data,o=null!==i.snapshot_date,r=null!==(e=null===(t=this._config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,s=this._sorted().slice(0,r);return F`
            ${o?F`
              <div class="summary">
                <div class="summary-item">
                  <span class="summary-label">${Lt("common.total",this.hass)}</span>
                  <span class="summary-value">${Pt(i.total_value,this._sym())}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">${Lt("snapshot.dailyProfitLoss",this.hass)}</span>
                  <span class="summary-value ${St(i.total_daily_pl)}">${Pt(i.total_daily_pl,this._sym())} (${kt(i.total_daily_pl_pct)})</span>
                </div>
              </div>
            `:""}

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th class="sortable" @click=${()=>this._toggleSort("name")}>${Lt("common.name",this.hass)}</th>
                    <th class="sortable num" @click=${()=>this._toggleSort("value")}>${Lt("common.value",this.hass)}</th>
                    ${o?F`
                      <th class="sortable num" @click=${()=>this._toggleSort("pl")}>${Lt("common.profitLoss",this.hass)}</th>
                      <th class="sortable num" @click=${()=>this._toggleSort("plPct")}>${Lt("common.profitLossPct",this.hass)}</th>
                    `:""}
                    <th class="sortable num" @click=${()=>this._toggleSort("weight")}>${Lt("common.weight",this.hass)}</th>
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
                      <td class="num">${Pt(t.current_value,this._sym())}</td>
                      ${o?F`
                        <td class="num ${St(t.daily_pl)}">${null!=t.daily_pl?Pt(t.daily_pl,this._sym()):"—"}</td>
                        <td class="num ${St(t.daily_pl_pct)}">${null!=t.daily_pl_pct?kt(t.daily_pl_pct):"—"}</td>
                      `:""}
                      <td class="num">${t.weight.toFixed(1)}%</td>
                    </tr>
                  `})}
                </tbody>
              </table>
            </div>

            ${o?"":F`
              <div class="info">${Lt("snapshot.waiting",this.hass)}</div>
            `}
          `})()}
      </ha-card>
    `}}Kt.styles=d`
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
  `,t([ft({attribute:!1})],Kt.prototype,"hass",void 0),t([gt()],Kt.prototype,"_config",void 0),t([gt()],Kt.prototype,"_portfolio",void 0),t([gt()],Kt.prototype,"_data",void 0),t([gt()],Kt.prototype,"_loading",void 0),t([gt()],Kt.prototype,"_error",void 0),t([gt()],Kt.prototype,"_notEnabled",void 0),t([gt()],Kt.prototype,"_sortBy",void 0),t([gt()],Kt.prototype,"_sortAsc",void 0),o("parqet-snapshot-card",Kt);const Jt={performance:"views.performance",holdings:"views.holdings",activities:"views.activities"},Zt=window;Zt.customCards=Zt.customCards||[],Zt.customCards.some(t=>"parqet-companion-card"===t.type)||Zt.customCards.push({type:"parqet-companion-card",name:"Parqet Companion",description:Lt("card.description"),preview:!0,documentationURL:"https://github.com/cubinet-code/ha-parqet-companion"});class Xt extends pt{constructor(){super(...arguments),this._portfolios=[],this._selectedIndex=-1,this._activeView="performance",this._interval="1y",this._perfData=null,this._holdingsData=[],this._dataLoading=!1,this._dataError="",this._rateLimited=!1,this._discoveryRan=!1,this._fetchGen=0,this._cachedProxy=null,this._cachedProxySource=null,this._cachedProxyKey=null}setConfig(t){var e;this._config=Object.assign({default_view:"performance",default_interval:"1y",show_interval_selector:!0,show_performance_chart:!0,show_allocation_chart:!0,show_logo:!0,compact:!1,currency_symbol:"€",activities_limit:25},t),this._activeView=this._config.default_view,this._interval=null!==(e=this._config.default_interval)&&void 0!==e?e:"1y"}getCardSize(){return 6}static getConfigForm(){const t=Dt();return{schema:[{name:"device_id",selector:{device:{integration:"parqet"}}},{name:"default_view",selector:{select:{options:[{value:"performance",label:Lt("views.performance",t)},{value:"holdings",label:Lt("views.holdings",t)},{value:"activities",label:Lt("views.activities",t)}]}}},{name:"currency_symbol",selector:{text:{}}},{name:"",type:"expandable",title:Lt("views.performance",t),icon:"mdi:chart-line",schema:[{name:"default_interval",selector:{select:{options:[{value:"1d",label:Lt("interval.1d",t)},{value:"1w",label:Lt("interval.1w",t)},{value:"mtd",label:Lt("interval.mtd",t)},{value:"1m",label:Lt("interval.1m",t)},{value:"3m",label:Lt("interval.3m",t)},{value:"6m",label:Lt("interval.6m",t)},{value:"1y",label:Lt("interval.1y",t)},{value:"ytd",label:Lt("interval.ytd",t)},{value:"3y",label:Lt("interval.3y",t)},{value:"5y",label:Lt("interval.5y",t)},{value:"10y",label:Lt("interval.10y",t)},{value:"max",label:Lt("interval.max",t)}]}}},{name:"show_interval_selector",selector:{boolean:{}}},{name:"show_performance_chart",selector:{boolean:{}}}]},{name:"",type:"expandable",title:Lt("views.holdings",t),icon:"mdi:chart-donut",schema:[{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"show_allocation_chart",selector:{boolean:{}}},{name:"show_logo",selector:{boolean:{}}}]},{name:"",type:"expandable",title:Lt("views.activities",t),icon:"mdi:format-list-bulleted",schema:[{name:"activities_limit",selector:{number:{min:1,max:500,mode:"box"}}}]},{name:"",type:"expandable",title:Lt("views.layout",t),icon:"mdi:page-layout-body",schema:[{name:"compact",selector:{boolean:{}}},{name:"hide_header",selector:{boolean:{}}}]}],computeLabel:e=>{var i;return null!==(i={device_id:Lt("editor.device",t),default_view:Lt("editor.defaultView",t),default_interval:Lt("editor.defaultInterval",t),currency_symbol:Lt("editor.currencySymbol",t),holdings_limit:Lt("editor.holdingsLimit",t),activities_limit:Lt("editor.activitiesLimit",t),show_interval_selector:Lt("editor.showIntervalSelector",t),show_performance_chart:Lt("editor.showPerformanceChart",t),show_allocation_chart:Lt("editor.showAllocationChart",t),show_logo:Lt("editor.showLogo",t),compact:Lt("editor.compact",t),hide_header:Lt("editor.hideHeader",t)}[e.name])&&void 0!==i?i:e.name}}}static getStubConfig(){return{default_view:"performance",default_interval:"1y",show_performance_chart:!0,show_allocation_chart:!0,show_interval_selector:!0,show_logo:!0,compact:!1,hide_header:!1,currency_symbol:"€",activities_limit:25}}updated(t){t.has("hass")&&this._discoverPortfolios()}_discoverPortfolios(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;if(this._discoveryRan&&this.hass.entities===this._lastEntities)return;this._discoveryRan=!0,this._lastEntities=this.hass.entities;const i=null===(e=this._config)||void 0===e?void 0:e.device_id,o=$t(this.hass,i),r=o.portfolios,s=t=>[...t.map(t=>`${t.entryId}:${t.portfolioId}`)].sort().join(",");s(r)!==s(this._portfolios)&&(this._portfolios=r,r.length<=1||o.matchedConfiguredDevice||!this._canAggregateAll(r)?this._selectedIndex=0:this._selectedIndex=-1,this._loadData())}_canAggregateAll(t=this._portfolios){return!(t.length<2)&&(1===new Set(t.map(t=>t.entryId)).size||null!==At(this.hass))}_aggregateOptionLabel(t=this._portfolios){var e,i;return new Set(t.map(t=>t.entryId)).size>1?null!==(i=null===(e=At(this.hass))||void 0===e?void 0:e.name)&&void 0!==i?i:"Parqet Combined":Lt("card.allPortfolios",this.hass)}render(){var t;if(!this._portfolios.length)return F`
        <ha-card>
          <div class="empty">
            <span>${Lt("card.noPortfolios",this.hass)}</span>
            <span class="hint">${Lt("card.addIntegration",this.hass)}</span>
          </div>
        </ha-card>
      `;const e=this._getActivePortfolio(),i="combined_accounts"===e.portfolioId?["performance","holdings"]:["performance","holdings","activities"];return F`
      <ha-card>
        ${(null===(t=this._config)||void 0===t?void 0:t.hide_header)?"":F`
          <div class="card-header">
            ${this._portfolios.length>1?F`
              <select
                class="portfolio-select"
                aria-label=${Lt("common.selectPortfolio",this.hass)}
                @change=${this._onPortfolioChange}
              >
                ${this._canAggregateAll()?F`
                  <option value="-1" ?selected=${-1===this._selectedIndex}>${this._aggregateOptionLabel()}</option>
                `:""}
                ${this._portfolios.map((t,e)=>F`
                  <option value=${e} ?selected=${e===this._selectedIndex}>${t.name}</option>
                `)}
              </select>
            `:F`<span class="portfolio-name">${e.name}</span>`}
          </div>
        `}

        ${this._rateLimited?F`
          <div class="rate-limit" role="alert">${Lt("card.rateLimitWarning",this.hass)}</div>
        `:""}

        <div class="tabs" role="tablist">
          ${i.map(t=>F`
            <button
              class="tab ${this._activeView===t?"active":""}"
              role="tab"
              aria-selected=${this._activeView===t}
              @click=${()=>this._activeView=t}
            >
              ${Lt(Jt[t],this.hass)}
            </button>
          `)}
        </div>

        <div class="view-content" role="tabpanel">
          ${this._renderView(e)}
        </div>
      </ha-card>
    `}_renderView(t){return"performance"===this._activeView||"combined_accounts"===t.portfolioId&&"activities"===this._activeView?F`
        <parqet-performance-view
          .hass=${this.hass}
          .portfolio=${t}
          .config=${this._config}
          .perfData=${this._perfData}
          .loading=${this._dataLoading}
          .error=${this._dataError}
          .interval=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-performance-view>
      `:"holdings"===this._activeView?F`
        <parqet-holdings-view
          .hass=${this.hass}
          .portfolio=${t}
          .config=${this._config}
          .holdingsData=${this._holdingsData}
          .loading=${this._dataLoading}
          .error=${this._dataError}
          .interval=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-holdings-view>
      `:F`
      <parqet-activities-view
        .hass=${this.hass}
        .portfolio=${t}
        .config=${this._config}
      ></parqet-activities-view>
    `}_getActivePortfolio(){if(!this._portfolios.length)return null;return this._portfolios.length>1&&-1===this._selectedIndex?this._allPortfoliosProxy():this._portfolios[this._selectedIndex]||this._portfolios[0]}async _loadData(){const t=this._getActivePortfolio();if(!this.hass||!t)return;const e=++this._fetchGen;this._dataLoading=!0,this._dataError="",this._rateLimited=!1;try{const i=await this._fetchPerformanceAndHoldings(t);if(e!==this._fetchGen)return;this._perfData=i.performance,this._holdingsData=(i.holdings||[]).filter(t=>{var e;return!(null===(e=t.position)||void 0===e?void 0:e.isSold)})}catch(t){if(e!==this._fetchGen)return;Ct(t)?(this._rateLimited=!0,this._dataError=Lt("card.rateLimitError",this.hass)):this._dataError=Lt("card.loadError",this.hass),this._perfData=null,this._holdingsData=[]}finally{e===this._fetchGen&&(this._dataLoading=!1)}}async _fetchPerformanceAndHoldings(t){var e;if(!(null===(e=t._portfolios)||void 0===e?void 0:e.length))return await this.hass.connection.sendMessagePromise(Et(t,this._interval));const i=t._portfolios;let o=t;if(new Set(i.map(t=>t.entryId)).size>1){const t=At(this.hass);if(!t)throw new Error("Parqet Combined entry is required for multi-account totals");o=t}return await this.hass.connection.sendMessagePromise(Et(o,this._interval))}_onIntervalChange(t){this._interval=t.detail.interval,this._loadData()}_allPortfoliosProxy(){var t,e,i;const o=new Set(this._portfolios.map(t=>t.entryId)).size>1?At(this.hass):null,r=null!==(t=null==o?void 0:o.entryId)&&void 0!==t?t:null;return this._cachedProxySource===this._portfolios&&this._cachedProxy&&this._cachedProxyKey===r?this._cachedProxy:(this._cachedProxyKey=r,o?(this._cachedProxy=o,this._cachedProxySource=this._portfolios,this._cachedProxy):(this._cachedProxy={entryId:null!==(i=null===(e=this._portfolios[0])||void 0===e?void 0:e.entryId)&&void 0!==i?i:"__all__",portfolioId:"__all__",name:Lt("card.allPortfolios",this.hass),entityPrefix:null,sensors:{},_portfolios:this._portfolios.map(t=>({entryId:t.entryId,portfolioId:t.portfolioId}))},this._cachedProxySource=this._portfolios,this._cachedProxy))}_onPortfolioChange(t){this._selectedIndex=parseInt(t.target.value,10),this._loadData()}}Xt.styles=d`
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
    .rate-limit {
      margin: 8px 16px; padding: 8px 12px;
      background: rgba(255, 152, 0, 0.12); color: var(--warning-color, #ff9800);
      border-radius: 6px; font-size: 0.82rem;
    }
  `,t([ft({attribute:!1})],Xt.prototype,"hass",void 0),t([gt()],Xt.prototype,"_config",void 0),t([gt()],Xt.prototype,"_portfolios",void 0),t([gt()],Xt.prototype,"_selectedIndex",void 0),t([gt()],Xt.prototype,"_activeView",void 0),t([gt()],Xt.prototype,"_interval",void 0),t([gt()],Xt.prototype,"_perfData",void 0),t([gt()],Xt.prototype,"_holdingsData",void 0),t([gt()],Xt.prototype,"_dataLoading",void 0),t([gt()],Xt.prototype,"_dataError",void 0),t([gt()],Xt.prototype,"_rateLimited",void 0),o("parqet-companion-card",Xt);export{Xt as ParqetCompanionCard};
