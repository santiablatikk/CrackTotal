/**
 * Node loader for Mi Carrera engine + UI (minimal DOM mock).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadMiCarrera, ROOT, SCRIPTS } = require('./_load_mi_carrera_engine');

const UI_SCRIPTS = [
  'assets/js/games/mi-carrera/persistence/storage.js',
  'assets/js/games/mi-carrera/ui/narrative.js',
  'assets/js/games/mi-carrera/ui/components.js',
  'assets/js/games/mi-carrera/ui/career-card.js',
  'assets/js/games/mi-carrera/ui/screens.js',
  'assets/js/games/mi-carrera/ui/app.js'
];

function createDomMock() {
  function Node() {
    this.children = [];
    this.className = '';
    this.style = {};
    this.attributes = {};
    this.textContent = '';
    this.innerHTML = '';
    this.parentNode = null;
    this.value = '';
    this.type = '';
    this.maxLength = 0;
    this.placeholder = '';
    this.loading = '';
    this.src = '';
    this.alt = '';
  }
  Node.prototype.setAttribute = function (k, v) {
    this.attributes[k] = String(v);
    if (k === 'class') this.className = String(v);
  };
  Node.prototype.getAttribute = function (k) {
    return this.attributes[k] != null ? this.attributes[k] : null;
  };
  Node.prototype.appendChild = function (child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  };
  Node.prototype.querySelector = function (sel) {
    return walkFind(this, sel);
  };
  Node.prototype.querySelectorAll = function (sel) {
    const out = [];
    walkCollect(this, sel, out);
    return out;
  };
  Node.prototype.closest = function (sel) {
    let n = this;
    while (n) {
      if (matches(n, sel)) return n;
      n = n.parentNode;
    }
    return null;
  };
  Node.prototype.addEventListener = function () {};
  Node.prototype.classList = {
    _owner: null,
    add: function (c) {
      const n = this._owner;
      const parts = String(n.className || '')
        .split(/\s+/)
        .filter(Boolean);
      if (parts.indexOf(c) === -1) parts.push(c);
      n.className = parts.join(' ');
    }
  };

  function matches(node, sel) {
    if (!sel) return false;
    if (sel[0] === '[') {
      const body = sel.slice(1, -1);
      if (body.indexOf('=') === -1) return node.attributes[body] != null;
      const eq = body.indexOf('=');
      const key = body.slice(0, eq);
      const val = body.slice(eq + 1).replace(/^["']|["']$/g, '');
      return node.attributes[key] === val;
    }
    if (sel[0] === '.') return String(node.className || '').split(/\s+/).indexOf(sel.slice(1)) !== -1;
    return String(node.tagName || '').toLowerCase() === sel.toLowerCase();
  }

  function walkFind(node, sel) {
    if (matches(node, sel)) return node;
    for (let i = 0; i < node.children.length; i++) {
      const f = walkFind(node.children[i], sel);
      if (f) return f;
    }
    return null;
  }

  function walkCollect(node, sel, out) {
    if (matches(node, sel)) out.push(node);
    for (let i = 0; i < node.children.length; i++) walkCollect(node.children[i], sel, out);
  }

  function createElement(tag) {
    const n = new Node();
    n.tagName = String(tag || 'div').toUpperCase();
    n.classList._owner = n;
    Object.defineProperty(n, 'innerHTML', {
      get: function () {
        return this._html || '';
      },
      set: function (v) {
        this._html = String(v);
        if (v === '') this.children = [];
      }
    });
    return n;
  }

  const store = {};
  const document = {
    createElement: createElement,
    querySelector: function () {
      return null;
    },
    addEventListener: function () {}
  };

  return {
    document: document,
    localStorage: {
      getItem: function (k) {
        return store[k] || null;
      },
      setItem: function (k, v) {
        store[k] = String(v);
      },
      removeItem: function (k) {
        delete store[k];
      }
    },
    _store: store
  };
}

function loadMiCarreraUI() {
  const dom = createDomMock();
  const context = {
    console,
    process,
    require,
    module,
    __dirname,
    __filename,
    document: dom.document,
    localStorage: dom.localStorage,
    globalThis: {}
  };
  context.window = context.globalThis;
  context.globalThis.document = dom.document;
  context.globalThis.localStorage = dom.localStorage;
  vm.createContext(context);

  for (const rel of SCRIPTS.concat(UI_SCRIPTS)) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }
  process.chdir(ROOT);
  const MC = context.globalThis.MiCarrera;
  MC.loadPhase1DataSync();
  return { MC: MC, document: dom.document, localStorage: dom.localStorage, createElement: dom.document.createElement };
}

module.exports = { loadMiCarreraUI, loadMiCarrera, ROOT, UI_SCRIPTS };
