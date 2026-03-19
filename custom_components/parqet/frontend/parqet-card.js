var ParqetCard=function(t){"use strict";function e(t,e,i,o){var r,s=arguments.length,n=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,o);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(s<3?r(n):s>3?r(e,i,n):r(e,i))||n);return s>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const i=globalThis,o=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),s=new WeakMap;let n=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(o&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new n(i,t,r)},l=o?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,r))(e)})(t):t,{is:d,defineProperty:c,getOwnPropertyDescriptor:p,getOwnPropertyNames:h,getOwnPropertySymbols:v,getPrototypeOf:u}=Object,f=globalThis,g=f.trustedTypes,m=g?g.emptyScript:"",_=f.reactiveElementPolyfillSupport,y=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!d(t,e),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),f.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=x){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&c(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:r}=p(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const s=o?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??x}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const t=this.properties,e=[...h(t),...v(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(l(t))}else void 0!==t&&e.push(l(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,e)=>{if(o)t.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const o of e){const e=document.createElement("style"),r=i.litNonce;void 0!==r&&e.setAttribute("nonce",r),e.textContent=o.cssText,t.appendChild(e)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=o;const s=r.fromAttribute(e,t.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(t,e,i,o=!1,r){if(void 0!==t){const s=this.constructor;if(!1===o&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??$)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[y("elementProperties")]=new Map,w[y("finalized")]=new Map,_?.({ReactiveElement:w}),(f.reactiveElementVersions??=[]).push("2.1.2");const A=globalThis,k=t=>t,S=A.trustedTypes,C=S?S.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,z="?"+P,I=`<${z}>`,M=document,q=()=>M.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,N="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,R=/>/g,H=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),G=/'/g,j=/"/g,V=/^(?:script|style|textarea|title)$/i,L=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),F=L(1),B=L(2),W=Symbol.for("lit-noChange"),Y=Symbol.for("lit-nothing"),J=new WeakMap,K=M.createTreeWalker(M,129);function X(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,o=[];let r,s=2===e?"<svg>":3===e?"<math>":"",n=T;for(let e=0;e<i;e++){const i=t[e];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===T?"!--"===l[1]?n=D:void 0!==l[1]?n=R:void 0!==l[2]?(V.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=H):void 0!==l[3]&&(n=H):n===H?">"===l[0]?(n=r??T,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?H:'"'===l[3]?j:G):n===j||n===G?n=H:n===D||n===R?n=T:(n=H,r=void 0);const p=n===H&&t[e+1].startsWith("/>")?" ":"";s+=n===T?i+I:d>=0?(o.push(a),i.slice(0,d)+E+i.slice(d)+P+p):i+P+(-2===d?e:p)}return[X(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class Q{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,s=0;const n=t.length-1,a=this.parts,[l,d]=Z(t,e);if(this.el=Q.createElement(l,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=K.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(E)){const e=d[s++],i=o.getAttribute(t).split(P),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?rt:"?"===n[1]?st:"@"===n[1]?nt:ot}),o.removeAttribute(t)}else t.startsWith(P)&&(a.push({type:6,index:r}),o.removeAttribute(t));if(V.test(o.tagName)){const t=o.textContent.split(P),e=t.length-1;if(e>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],q()),K.nextNode(),a.push({type:2,index:++r});o.append(t[e],q())}}}else if(8===o.nodeType)if(o.data===z)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(P,t+1));)a.push({type:7,index:r}),t+=P.length-1}r++}}static createElement(t,e){const i=M.createElement("template");return i.innerHTML=t,i}}function tt(t,e,i=t,o){if(e===W)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=O(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=tt(t,r._$AS(t,e.values),r,o)),e}class et{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??M).importNode(e,!0);K.currentNode=o;let r=K.nextNode(),s=0,n=0,a=i[0];for(;void 0!==a;){if(s===a.index){let e;2===a.type?e=new it(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new at(r,this,t)),this._$AV.push(e),a=i[++n]}s!==a?.index&&(r=K.nextNode(),s++)}return K.currentNode=M,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class it{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=tt(this,t,e),O(t)?t===Y||null==t||""===t?(this._$AH!==Y&&this._$AR(),this._$AH=Y):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Y&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(M.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Q.createElement(X(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new et(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=J.get(t.strings);return void 0===e&&J.set(t.strings,e=new Q(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new it(this.O(q()),this.O(q()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class ot{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Y}_$AI(t,e=this,i,o){const r=this.strings;let s=!1;if(void 0===r)t=tt(this,t,e,0),s=!O(t)||t!==this._$AH&&t!==W,s&&(this._$AH=t);else{const o=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=tt(this,o[i+n],e,n),a===W&&(a=this._$AH[n]),s||=!O(a)||a!==this._$AH[n],a===Y?t=Y:t!==Y&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}s&&!o&&this.j(t)}j(t){t===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class rt extends ot{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Y?void 0:t}}class st extends ot{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Y)}}class nt extends ot{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=tt(this,t,e,0)??Y)===W)return;const i=this._$AH,o=t===Y&&i!==Y||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==Y&&(i===Y||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){tt(this,t)}}const lt=A.litHtmlPolyfillSupport;lt?.(Q,it),(A.litHtmlVersions??=[]).push("3.3.2");const dt=globalThis;class ct extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=i?.renderBefore??null;o._$litPart$=r=new it(e.insertBefore(q(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ct._$litElement$=!0,ct.finalized=!0,dt.litElementHydrateSupport?.({LitElement:ct});const pt=dt.litElementPolyfillSupport;pt?.({LitElement:ct}),(dt.litElementVersions??=[]).push("4.2.2");const ht=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},vt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:$},ut=(t=vt,e,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,r,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];e.call(this,i),this.requestUpdate(o,r,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ft(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function gt(t){return ft({...t,state:!0,attribute:!1})}let mt=class extends ct{render(){return F`
      <div class="container" role="status" aria-label="Loading">
        <div class="spinner"></div>
      </div>
    `}};function _t(t,e="€"){return null==t?"—":`${e}${t.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function yt(t){return null==t?"—":`${t>=0?"+":""}${t.toFixed(2)}%`}function bt(t){return null==t?"":t>0?"positive":t<0?"negative":""}mt.styles=a`
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
  `,mt=e([ht("parqet-loading-spinner")],mt);const $t=[{value:"1d",label:"1D"},{value:"1w",label:"1W"},{value:"mtd",label:"MTD"},{value:"1m",label:"1M"},{value:"3m",label:"3M"},{value:"6m",label:"6M"},{value:"1y",label:"1Y"},{value:"ytd",label:"YTD"},{value:"3y",label:"3Y"},{value:"5y",label:"5Y"},{value:"10y",label:"10Y"},{value:"max",label:"Max"}];let xt=class extends ct{constructor(){super(...arguments),this.selected="1y"}_select(t){this.selected=t,this.dispatchEvent(new CustomEvent("interval-change",{detail:{interval:t},bubbles:!0,composed:!0}))}render(){return F`
      <div class="intervals" role="group" aria-label="Time interval">
        ${$t.map(({value:t,label:e})=>F`
            <button
              class="btn ${this.selected===t?"active":""}"
              @click=${()=>this._select(t)}
              aria-pressed=${this.selected===t}
            >
              ${e}
            </button>
          `)}
      </div>
    `}};xt.styles=a`
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
  `,e([ft()],xt.prototype,"selected",void 0),xt=e([ht("parqet-interval-selector")],xt);let wt=class extends ct{constructor(){super(...arguments),this.segments=[],this.currencySymbol="€"}_fmt(t){return`${t<0?"−":""}${this.currencySymbol}${Math.abs(t).toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:0})}`}render(){const t=this.segments.filter(t=>0!==t.value);if(0===t.length)return F`<div class="empty">No data</div>`;const e=t.reduce((t,e)=>t+Math.abs(e.value),0);if(0===e)return F`<div class="empty">No data</div>`;const i=t.map(t=>Object.assign(Object.assign({},t),{pct:Math.abs(t.value)/e*100}));return F`
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
    `}};wt.styles=a`
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
  `,e([ft({type:Array})],wt.prototype,"segments",void 0),e([ft({type:String})],wt.prototype,"currencySymbol",void 0),wt=e([ht("parqet-stacked-bar")],wt);let At=class extends ct{constructor(){super(...arguments),this._interval="1y",this._wsData=null,this._loading=!1,this._error=""}connectedCallback(){var t,e;super.connectedCallback(),this._interval=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_interval)&&void 0!==e?e:"1y"}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_getData(){var t,e,i,o,r,s,n,a,l,d,c,p,h,v,u;if(this._wsData)return this._wsData;const f=this.portfolio.sensors,g=t=>{var e;return function(t){if(!t||"unavailable"===t||"unknown"===t)return null;const e=parseFloat(t);return isNaN(e)?null:e}(null===(e=f[t])||void 0===e?void 0:e.state)},m=g("total_value");return null==m?null:{kpis:{inInterval:{xirr:g("xirr"),ttwror:g("ttwror")}},fees:{inInterval:{fees:null!==(t=g("fees"))&&void 0!==t?t:0}},taxes:{inInterval:{taxes:null!==(e=g("taxes"))&&void 0!==e?e:0}},unrealizedGains:{inInterval:{gainGross:null!==(i=g("unrealized_gain"))&&void 0!==i?i:0,gainNet:null!==(o=g("unrealized_gain_net"))&&void 0!==o?o:0,returnGross:null!==(r=g("unrealized_return_gross"))&&void 0!==r?r:0,returnNet:null!==(s=g("unrealized_return_net"))&&void 0!==s?s:0}},realizedGains:{inInterval:{gainGross:null!==(n=g("realized_gain"))&&void 0!==n?n:0,gainNet:null!==(a=g("realized_gain_net"))&&void 0!==a?a:0,returnGross:null!==(l=g("realized_return_gross"))&&void 0!==l?l:0,returnNet:null!==(d=g("realized_return_net"))&&void 0!==d?d:0}},dividends:{inInterval:{gainGross:null!==(c=g("dividends"))&&void 0!==c?c:0,gainNet:null!==(p=g("dividends_net"))&&void 0!==p?p:0,taxes:null!==(h=g("dividends_taxes"))&&void 0!==h?h:0,fees:null!==(v=g("dividends_fees"))&&void 0!==v?v:0}},valuation:{atIntervalStart:null!==(u=g("valuation_start"))&&void 0!==u?u:0,atIntervalEnd:m}}}async _onIntervalChange(t){this._interval=t.detail.interval,this._loading=!0,this._error="";try{const t=await this.hass.connection.sendMessagePromise({type:"parqet/get_performance",entry_id:this.portfolio.entryId,interval:this._interval});this._wsData=t.performance}catch(t){this._error="Failed to load performance data",this._wsData=null}finally{this._loading=!1}}render(){var t,e,i,o,r,s,n,a,l,d,c,p,h,v,u,f,g,m,_,y,b,$,x,w,A,k;const S=this._getData();return F`
      ${!1!==(null===(t=this.config)||void 0===t?void 0:t.show_interval_selector)?F`
        <parqet-interval-selector
          .selected=${this._interval}
          @interval-change=${this._onIntervalChange}
        ></parqet-interval-selector>
      `:""}

      ${this._error?F`<div class="error" role="alert">${this._error}</div>`:""}
      ${this._loading?F`<parqet-loading-spinner></parqet-loading-spinner>`:""}

      ${S?F`
        <div class="kpi-grid ${(null===(e=this.config)||void 0===e?void 0:e.compact)?"compact":""}">
          ${this._kpi("Total Value",_t(null===(i=S.valuation)||void 0===i?void 0:i.atIntervalEnd,this._sym()))}
          ${this._kpi("XIRR",yt(null===(r=null===(o=S.kpis)||void 0===o?void 0:o.inInterval)||void 0===r?void 0:r.xirr),null===(n=null===(s=S.kpis)||void 0===s?void 0:s.inInterval)||void 0===n?void 0:n.xirr)}
          ${this._kpi("TTWROR",yt(null===(l=null===(a=S.kpis)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.ttwror),null===(c=null===(d=S.kpis)||void 0===d?void 0:d.inInterval)||void 0===c?void 0:c.ttwror)}
          ${this._kpi("Unrealized Gain",_t(null===(h=null===(p=S.unrealizedGains)||void 0===p?void 0:p.inInterval)||void 0===h?void 0:h.gainGross,this._sym()),null===(u=null===(v=S.unrealizedGains)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.gainGross)}
          ${(()=>{var t,e,i,o;const r=null!==(e=null===(t=S.valuation)||void 0===t?void 0:t.atIntervalStart)&&void 0!==e?e:0,s=null!==(o=null===(i=S.valuation)||void 0===i?void 0:i.atIntervalEnd)&&void 0!==o?o:0,n=r>0?(s-r)/r*100:null;return this._kpi("Period Return",yt(n),n)})()}
          ${this._kpi("Realized Gain",_t(null===(g=null===(f=S.realizedGains)||void 0===f?void 0:f.inInterval)||void 0===g?void 0:g.gainGross,this._sym()),null===(_=null===(m=S.realizedGains)||void 0===m?void 0:m.inInterval)||void 0===_?void 0:_.gainGross)}
          ${this._kpi("Dividends",_t(null===(b=null===(y=S.dividends)||void 0===y?void 0:y.inInterval)||void 0===b?void 0:b.gainGross,this._sym()))}
          ${this._kpi("Fees",_t(null===(x=null===($=S.fees)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.fees,this._sym()))}
          ${this._kpi("Taxes",_t(null===(A=null===(w=S.taxes)||void 0===w?void 0:w.inInterval)||void 0===A?void 0:A.taxes,this._sym()))}
        </div>
        ${!1!==(null===(k=this.config)||void 0===k?void 0:k.show_chart)?this._renderChart(S):""}
      `:this._loading?"":F`<div class="empty">No data available.</div>`}
    `}_kpi(t,e,i){return F`
      <div class="kpi-tile">
        <div class="kpi-label">${t}</div>
        <div class="kpi-value ${bt(i)}">${e}</div>
      </div>
    `}_renderChart(t){var e,i,o,r,s,n,a,l,d,c,p,h,v,u,f;const g=[{label:"Unrealized",value:null!==(o=null===(i=null===(e=t.unrealizedGains)||void 0===e?void 0:e.inInterval)||void 0===i?void 0:i.gainGross)&&void 0!==o?o:0,color:"var(--success-color, #4caf50)"},{label:"Realized",value:null!==(n=null===(s=null===(r=t.realizedGains)||void 0===r?void 0:r.inInterval)||void 0===s?void 0:s.gainGross)&&void 0!==n?n:0,color:"#4285f4"},{label:"Dividends",value:null!==(d=null===(l=null===(a=t.dividends)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.gainGross)&&void 0!==d?d:0,color:"#46bdc6"},{label:"Fees",value:-(null!==(h=null===(p=null===(c=t.fees)||void 0===c?void 0:c.inInterval)||void 0===p?void 0:p.fees)&&void 0!==h?h:0),color:"#ff6d01"},{label:"Taxes",value:-(null!==(f=null===(u=null===(v=t.taxes)||void 0===v?void 0:v.inInterval)||void 0===u?void 0:u.taxes)&&void 0!==f?f:0),color:"var(--error-color, #f44336)"}].filter(t=>0!==t.value);return 0===g.length?"":F`<parqet-stacked-bar .segments=${g} .currencySymbol=${this._sym()}></parqet-stacked-bar>`}};At.styles=a`
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
  `,e([ft({attribute:!1})],At.prototype,"hass",void 0),e([ft({attribute:!1})],At.prototype,"portfolio",void 0),e([ft({attribute:!1})],At.prototype,"config",void 0),e([gt()],At.prototype,"_interval",void 0),e([gt()],At.prototype,"_wsData",void 0),e([gt()],At.prototype,"_loading",void 0),e([gt()],At.prototype,"_error",void 0),At=e([ht("parqet-performance-view")],At);const kt=160,St=2*Math.PI*66;let Ct=class extends ct{constructor(){super(...arguments),this.segments=[],this.centerLabel="",this.centerSub=""}render(){const t=this.segments.reduce((t,e)=>t+Math.abs(e.value),0);if(0===t||0===this.segments.length)return F`<div class="empty">No data</div>`;const e=80;let i=0;return F`
      <div class="chart-container">
        <svg viewBox="0 0 ${kt} ${kt}" class="donut" role="img" aria-label="Portfolio allocation chart">
          ${this.segments.map(o=>{const r=Math.abs(o.value)/t,s=r*St,n=St-s,a=i/t*360-90;return i+=Math.abs(o.value),B`
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
    `}};Ct.styles=a`
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
  `,e([ft({type:Array})],Ct.prototype,"segments",void 0),e([ft({type:String})],Ct.prototype,"centerLabel",void 0),e([ft({type:String})],Ct.prototype,"centerSub",void 0),Ct=e([ht("parqet-donut-chart")],Ct);const Et=["#4285f4","#ea4335","#fbbc04","#34a853","#ff6d01","#46bdc6","#9c27b0","#795548","#607d8b","#e91e63","#00bcd4","#8bc34a","#ff5722","#3f51b5","#cddc39","#009688","#ffc107","#673ab7","#03a9f4","#ff9800"];let Pt=class extends ct{constructor(){super(...arguments),this._holdings=[],this._loading=!1,this._error="",this._sortBy="value",this._sortAsc=!1,this._expandedId=null}connectedCallback(){super.connectedCallback(),this._load()}updated(t){t.has("portfolio")&&this._load()}async _load(){if(this.hass&&this.portfolio){this._loading=!0,this._error="";try{const t=await this.hass.connection.sendMessagePromise({type:"parqet/get_holdings",entry_id:this.portfolio.entryId});this._holdings=(t.holdings||[]).filter(t=>{var e;return!(null===(e=t.position)||void 0===e?void 0:e.isSold)})}catch(t){this._error="Failed to load holdings"}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_totalValue(){return this._holdings.reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0)}_sorted(){const t=this._totalValue(),e=[...this._holdings].sort((e,i)=>{var o,r,s,n,a,l,d,c,p,h,v,u,f,g,m,_,y,b,$,x,w,A,k,S,C,E,P,z;switch(this._sortBy){case"name":return(null!==(r=null===(o=e.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"").localeCompare(null!==(n=null===(s=i.asset)||void 0===s?void 0:s.name)&&void 0!==n?n:"");case"value":return(null!==(l=null===(a=i.position)||void 0===a?void 0:a.currentValue)&&void 0!==l?l:0)-(null!==(c=null===(d=e.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0);case"pl":return(null!==(u=null===(v=null===(h=null===(p=i.performance)||void 0===p?void 0:p.unrealizedGains)||void 0===h?void 0:h.inInterval)||void 0===v?void 0:v.gainGross)&&void 0!==u?u:0)-(null!==(_=null===(m=null===(g=null===(f=e.performance)||void 0===f?void 0:f.unrealizedGains)||void 0===g?void 0:g.inInterval)||void 0===m?void 0:m.gainGross)&&void 0!==_?_:0);case"plPct":return(null!==(x=null===($=null===(b=null===(y=i.performance)||void 0===y?void 0:y.unrealizedGains)||void 0===b?void 0:b.inInterval)||void 0===$?void 0:$.returnGross)&&void 0!==x?x:0)-(null!==(S=null===(k=null===(A=null===(w=e.performance)||void 0===w?void 0:w.unrealizedGains)||void 0===A?void 0:A.inInterval)||void 0===k?void 0:k.returnGross)&&void 0!==S?S:0);case"weight":{const o=t>0?(null!==(E=null===(C=e.position)||void 0===C?void 0:C.currentValue)&&void 0!==E?E:0)/t:0;return(t>0?(null!==(z=null===(P=i.position)||void 0===P?void 0:P.currentValue)&&void 0!==z?z:0)/t:0)-o}default:return 0}});return this._sortAsc?e.reverse():e}_toggleSort(t){this._sortBy===t?this._sortAsc=!this._sortAsc:(this._sortBy=t,this._sortAsc=!1)}render(){var t,e,i;if(this._loading)return F`<parqet-loading-spinner></parqet-loading-spinner>`;if(this._error)return F`<div class="error">${this._error}</div>`;if(!this._holdings.length)return F`<div class="empty">No holdings found.</div>`;const o=this._totalValue(),r=null!==(e=null===(t=this.config)||void 0===t?void 0:t.holdings_limit)&&void 0!==e?e:50,s=this._sorted().slice(0,r);return F`
      ${!1!==(null===(i=this.config)||void 0===i?void 0:i.show_chart)?F`
        <parqet-donut-chart
          .segments=${(()=>{const t=s.slice(0,20).map((t,e)=>{var i,o,r,s,n;return{label:null!==(r=null!==(i=t.nickname)&&void 0!==i?i:null===(o=t.asset)||void 0===o?void 0:o.name)&&void 0!==r?r:"Unknown",value:null!==(n=null===(s=t.position)||void 0===s?void 0:s.currentValue)&&void 0!==n?n:0,color:Et[e%Et.length]}});if(s.length>20){const e=s.slice(20).reduce((t,e)=>{var i,o;return t+(null!==(o=null===(i=e.position)||void 0===i?void 0:i.currentValue)&&void 0!==o?o:0)},0);e>0&&t.push({label:"Other",value:e,color:"#9e9e9e"})}return t})()}
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
            ${s.map(t=>{var e,i,r,s,n,a,l,d,c,p,h,v,u,f,g,m,_,y,b,$,x,w,A,k,S,C,E;const P=null!==(s=null===(r=null===(i=null===(e=t.performance)||void 0===e?void 0:e.unrealizedGains)||void 0===i?void 0:i.inInterval)||void 0===r?void 0:r.gainGross)&&void 0!==s?s:0,z=null===(l=null===(a=null===(n=t.performance)||void 0===n?void 0:n.unrealizedGains)||void 0===a?void 0:a.inInterval)||void 0===l?void 0:l.returnGross,I=o>0?(null!==(c=null===(d=t.position)||void 0===d?void 0:d.currentValue)&&void 0!==c?c:0)/o*100:0,M=this._expandedId===t.id;return F`
                <tr class="holding-row ${M?"expanded":""}" @click=${()=>this._expandedId=M?null:t.id}>
                  <td>
                    <div class="holding-name">
                      ${!1!==(null===(p=this.config)||void 0===p?void 0:p.show_logo)&&t.logo?F`<img class="logo" src=${t.logo} alt="" />`:""}
                      <span>${null!==(u=null!==(h=t.nickname)&&void 0!==h?h:null===(v=t.asset)||void 0===v?void 0:v.name)&&void 0!==u?u:"Unknown"}</span>
                    </div>
                  </td>
                  <td class="num">${_t(null===(f=t.position)||void 0===f?void 0:f.currentValue,this._sym())}</td>
                  <td class="num ${bt(P)}">${_t(P,this._sym())}</td>
                  <td class="num ${bt(z)}">${yt(z)}</td>
                  <td class="num">${I.toFixed(1)}%</td>
                </tr>
                ${M?F`
                  <tr class="detail-row">
                    <td colspan="5">
                      <div class="detail-grid">
                        <span>Shares: ${null===(m=null===(g=t.position)||void 0===g?void 0:g.shares)||void 0===m?void 0:m.toFixed(4)}</span>
                        <span>Avg Price: ${_t(null===(_=t.position)||void 0===_?void 0:_.purchasePrice,this._sym())}</span>
                        <span>Current: ${_t(null===(y=t.position)||void 0===y?void 0:y.currentPrice,this._sym())}</span>
                        <span>XIRR: ${yt(null===(x=null===($=null===(b=t.performance)||void 0===b?void 0:b.kpis)||void 0===$?void 0:$.inInterval)||void 0===x?void 0:x.xirr)}</span>
                        <span>Dividends: ${_t(null===(k=null===(A=null===(w=t.performance)||void 0===w?void 0:w.dividends)||void 0===A?void 0:A.inInterval)||void 0===k?void 0:k.gainGross,this._sym())}</span>
                        <span>Fees: ${_t(null===(E=null===(C=null===(S=t.performance)||void 0===S?void 0:S.fees)||void 0===C?void 0:C.inInterval)||void 0===E?void 0:E.fees,this._sym())}</span>
                      </div>
                    </td>
                  </tr>
                `:""}
              `})}
          </tbody>
        </table>
      </div>
    `}};Pt.styles=a`
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
  `,e([ft({attribute:!1})],Pt.prototype,"hass",void 0),e([ft({attribute:!1})],Pt.prototype,"portfolio",void 0),e([ft({attribute:!1})],Pt.prototype,"config",void 0),e([gt()],Pt.prototype,"_holdings",void 0),e([gt()],Pt.prototype,"_loading",void 0),e([gt()],Pt.prototype,"_error",void 0),e([gt()],Pt.prototype,"_sortBy",void 0),e([gt()],Pt.prototype,"_sortAsc",void 0),e([gt()],Pt.prototype,"_expandedId",void 0),Pt=e([ht("parqet-holdings-view")],Pt);const zt=[{value:"all",label:"All"},{value:"buy",label:"Buy"},{value:"sell",label:"Sell"},{value:"dividend",label:"Dividend"},{value:"interest",label:"Interest"},{value:"transfer_in",label:"Transfer In"},{value:"transfer_out",label:"Transfer Out"},{value:"fees_taxes",label:"Fees/Taxes"},{value:"deposit",label:"Deposit"},{value:"withdrawal",label:"Withdrawal"}],It={buy:"#4caf50",sell:"#f44336",dividend:"#46bdc6",interest:"#9c27b0",transfer_in:"#4285f4",transfer_out:"#ff6d01",fees_taxes:"#ff9800",deposit:"#4caf50",withdrawal:"#f44336"};let Mt=class extends ct{constructor(){super(...arguments),this._activities=[],this._holdingsMap=new Map,this._loading=!1,this._error="",this._filter="all",this._cursor=null,this._hasMore=!1}connectedCallback(){var t,e;super.connectedCallback(),this._filter=null!==(e=null===(t=this.config)||void 0===t?void 0:t.default_activity_type)&&void 0!==e?e:"all",this._load()}updated(t){t.has("portfolio")&&this._load()}async _loadHoldingsMap(){var t,e,i;if(!(this._holdingsMap.size>0))try{const o=await this.hass.connection.sendMessagePromise({type:"parqet/get_holdings",entry_id:this.portfolio.entryId}),r=new Map;for(const s of o.holdings||[])s.id&&r.set(s.id,null!==(i=null!==(t=s.nickname)&&void 0!==t?t:null===(e=s.asset)||void 0===e?void 0:e.name)&&void 0!==i?i:"Unknown");this._holdingsMap=r}catch(t){}}async _load(t=!1){var e,i;if(this.hass&&this.portfolio){this._loading=!0,this._error="",await this._loadHoldingsMap();try{const o={type:"parqet/get_activities",entry_id:this.portfolio.entryId,limit:null!==(i=null===(e=this.config)||void 0===e?void 0:e.activities_limit)&&void 0!==i?i:25};"all"!==this._filter&&(o.activity_type=[this._filter]),t&&this._cursor&&(o.cursor=this._cursor);const r=await this.hass.connection.sendMessagePromise(o);this._activities=t?[...this._activities,...r.activities]:r.activities,this._cursor=r.cursor,this._hasMore=!!r.cursor}catch(t){this._error="Failed to load activities"}finally{this._loading=!1}}}_sym(){var t,e;return null!==(e=null===(t=this.config)||void 0===t?void 0:t.currency_symbol)&&void 0!==e?e:"€"}_onFilterChange(t){this._filter=t,this._cursor=null,this._load()}render(){return F`
      <div class="filters">
        ${zt.map(t=>F`
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
    `}_resolveAssetName(t){var e,i,o;if(t.holdingId&&this._holdingsMap.has(t.holdingId))return this._holdingsMap.get(t.holdingId);const r=t.asset;return r&&null!==(o=null!==(i=null!==(e=r.name)&&void 0!==e?e:r.symbol)&&void 0!==i?i:r.isin)&&void 0!==o?o:"Unknown"}_renderActivity(t){var e;const i=null!==(e=It[t.type])&&void 0!==e?e:"var(--secondary-text-color)",o=t.type.replace("_"," "),r=this._resolveAssetName(t);return F`
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
          <span class="amount">${_t(t.amount,this._sym())}</span>
          ${t.shares?F`<span class="shares">${t.shares} @ ${_t(t.price,this._sym())}</span>`:""}
          ${t.tax?F`<span class="tax-fee">Tax: ${_t(t.tax,this._sym())}</span>`:""}
          ${t.fee?F`<span class="tax-fee">Fee: ${_t(t.fee,this._sym())}</span>`:""}
        </div>
      </div>
    `}};Mt.styles=a`
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
  `,e([ft({attribute:!1})],Mt.prototype,"hass",void 0),e([ft({attribute:!1})],Mt.prototype,"portfolio",void 0),e([ft({attribute:!1})],Mt.prototype,"config",void 0),e([gt()],Mt.prototype,"_activities",void 0),e([gt()],Mt.prototype,"_holdingsMap",void 0),e([gt()],Mt.prototype,"_loading",void 0),e([gt()],Mt.prototype,"_error",void 0),e([gt()],Mt.prototype,"_filter",void 0),e([gt()],Mt.prototype,"_cursor",void 0),e([gt()],Mt.prototype,"_hasMore",void 0),Mt=e([ht("parqet-activities-view")],Mt);const qt=window;return qt.customCards=qt.customCards||[],qt.customCards.push({type:"parqet-companion-card",name:"Parqet Companion",description:"Display your Parqet portfolio data — performance, holdings and activities.",preview:!0,documentationURL:"https://github.com/cubinet-code/ha-parqet-companion"}),t.ParqetCompanionCard=class extends ct{constructor(){super(...arguments),this._portfolios=[],this._selectedIndex=0,this._activeView="performance"}setConfig(t){this._config=Object.assign({default_view:"performance",default_interval:"1y",show_interval_selector:!0,show_chart:!0,show_logo:!0,compact:!1,currency_symbol:"€",activities_limit:25},t),this._activeView=this._config.default_view}getCardSize(){return 6}static getConfigForm(){return{schema:[{name:"entity",selector:{entity:{domain:"sensor",integration:"parqet"}}},{name:"default_view",selector:{select:{options:[{value:"performance",label:"Performance"},{value:"holdings",label:"Holdings"},{value:"activities",label:"Activities"}]}}},{name:"default_interval",selector:{select:{options:[{value:"1d",label:"1 Day"},{value:"1w",label:"1 Week"},{value:"mtd",label:"Month to Date"},{value:"1m",label:"1 Month"},{value:"3m",label:"3 Months"},{value:"6m",label:"6 Months"},{value:"1y",label:"1 Year"},{value:"ytd",label:"Year to Date"},{value:"3y",label:"3 Years"},{value:"5y",label:"5 Years"},{value:"10y",label:"10 Years"},{value:"max",label:"Maximum"}]}}},{name:"currency_symbol",selector:{text:{}}},{name:"holdings_limit",selector:{number:{min:1,max:200,mode:"box"}}},{name:"activities_limit",selector:{number:{min:5,max:500,mode:"box"}}},{name:"show_interval_selector",selector:{boolean:{}}},{name:"show_chart",selector:{boolean:{}}},{name:"show_logo",selector:{boolean:{}}},{name:"compact",selector:{boolean:{}}},{name:"hide_header",selector:{boolean:{}}}],computeLabel:t=>{var e;return null!==(e={entity:"Portfolio (leave empty for auto-detect)",default_view:"Default View",default_interval:"Default Interval",currency_symbol:"Currency Symbol",holdings_limit:"Holdings Limit",activities_limit:"Activities Limit",show_interval_selector:"Show Interval Selector",show_chart:"Show Chart",show_logo:"Show Holding Logos",compact:"Compact Mode",hide_header:"Hide Header"}[t.name])&&void 0!==e?e:t.name}}}static getStubConfig(){return{default_view:"performance",default_interval:"1y",show_chart:!0,show_interval_selector:!0,show_logo:!0,compact:!1,hide_header:!1,currency_symbol:"€",activities_limit:25}}updated(t){t.has("hass")&&this._discoverPortfolios()}_discoverPortfolios(){var t,e;if(!(null===(t=this.hass)||void 0===t?void 0:t.states))return;const i=null===(e=this._config)||void 0===e?void 0:e.entity;let o=null;if(i){const t=i.replace("sensor.","").split("_");for(let e=t.length;e>0;e--){const i="sensor."+t.slice(0,e).join("_");if(this.hass.states[i+"_total_value"]){o=i;break}}}const r=new Map;for(const[t,e]of Object.entries(this.hass.states)){if(!t.startsWith("sensor.")||!t.includes("_total_value"))continue;const i=e.attributes,s=t.replace("_total_value","");if(o&&s!==o)continue;const n=(s.replace("sensor.","")||"Portfolio").split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" "),a={};for(const[t,e]of Object.entries(this.hass.states))if(t.startsWith(s+"_")){a[t.replace(s+"_","")]=e}if(Object.keys(a).length>=3){const t=i.entry_id||s;r.set(s,{entryId:t,name:n,entityPrefix:s,sensors:a})}}const s=Array.from(r.values());JSON.stringify(s.map(t=>t.entityPrefix))!==JSON.stringify(this._portfolios.map(t=>t.entityPrefix))&&(this._portfolios=s)}render(){var t;if(!this._portfolios.length)return F`
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
    `}_onPortfolioChange(t){this._selectedIndex=parseInt(t.target.value,10)}},t.ParqetCompanionCard.styles=a`
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
  `,e([ft({attribute:!1})],t.ParqetCompanionCard.prototype,"hass",void 0),e([gt()],t.ParqetCompanionCard.prototype,"_config",void 0),e([gt()],t.ParqetCompanionCard.prototype,"_portfolios",void 0),e([gt()],t.ParqetCompanionCard.prototype,"_selectedIndex",void 0),e([gt()],t.ParqetCompanionCard.prototype,"_activeView",void 0),t.ParqetCompanionCard=e([ht("parqet-companion-card")],t.ParqetCompanionCard),t}({});
