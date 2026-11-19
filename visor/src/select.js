// Selector desplegable propio: envuelve un <select> nativo manteniéndolo como fuente
// de verdad (valor, opciones, eventos change), pero dibuja trigger + lista a nuestro
// estilo para que el desplegable no sea el nativo del sistema operativo.

const instances = [];
let openInstance = null;

export function enhanceSelects(root = document) {
  root.querySelectorAll('select').forEach((sel) => {
    if (!sel.dataset.enhanced) instances.push(new CustomSelect(sel));
  });
}

// Refresca las etiquetas tras cambios de valor hechos por código (render()).
export function syncSelects() {
  instances.forEach((i) => i.sync());
}

document.addEventListener('click', (e) => {
  if (openInstance && !openInstance.root.contains(e.target)) openInstance.close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openInstance) openInstance.close();
});

class CustomSelect {
  constructor(sel) {
    this.sel = sel;
    sel.dataset.enhanced = '1';
    const wrap = document.createElement('div');
    wrap.className = 'cs';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    this.root = wrap;

    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.className = 'cs-trigger';
    this.trigger.setAttribute('aria-haspopup', 'listbox');
    this.trigger.innerHTML =
      '<span class="cs-value"></span>' +
      '<svg class="cs-caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">' +
      '<path d="M2.5 4.75L6 8.25l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    this.list = document.createElement('div');
    this.list.className = 'cs-list';
    this.list.setAttribute('role', 'listbox');
    this.list.hidden = true;

    wrap.append(this.trigger, this.list);
    this.trigger.addEventListener('click', () => this.toggle());
    this.build();
    // reconstruye la lista cuando el código reemplaza las opciones (p.ej. fillSitios)
    new MutationObserver(() => this.build()).observe(sel, { childList: true });
  }

  build() {
    this.list.innerHTML = '';
    [...this.sel.options].forEach((opt) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cs-option';
      b.setAttribute('role', 'option');
      b.textContent = opt.textContent;
      b.dataset.value = opt.value;
      b.addEventListener('click', () => {
        if (this.sel.value !== opt.value) {
          this.sel.value = opt.value;
          this.sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this.close();
      });
      this.list.appendChild(b);
    });
    this.sync();
  }

  sync() {
    const opt = this.sel.selectedOptions[0];
    this.root.querySelector('.cs-value').textContent = opt ? opt.textContent : '';
    this.list.querySelectorAll('.cs-option').forEach((b) =>
      b.setAttribute('aria-selected', b.dataset.value === this.sel.value));
  }

  toggle() { this.list.hidden ? this.open() : this.close(); }

  open() {
    if (openInstance && openInstance !== this) openInstance.close();
    this.list.hidden = false;
    this.root.classList.add('cs-open');
    openInstance = this;
    const sel = this.list.querySelector('[aria-selected="true"]');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  close() {
    this.list.hidden = true;
    this.root.classList.remove('cs-open');
    if (openInstance === this) openInstance = null;
  }
}
