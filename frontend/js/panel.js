// =================================================
// F4TE STAFF PANEL — JS Frontend
// Criado por f4te
// =================================================
(function () {
  'use strict';

  const STORAGE_KEY = 'f4te_panel_state_v1';
  const TOKEN_KEY   = 'f4te_panel_token_v1';
  const USER_KEY    = 'f4te_panel_user_v1';

  const $ = (sel, root = document) => root.querySelector(sel);

  const panel  = $('#f4te-panel');
  const fab    = $('#f4te-fab');
  const head   = $('#f4te-head');
  const minBtn = $('#f4te-min');
  const toast  = $('#f4te-toast');
  const modalRoot = $('#f4te-modal-root');

  const API = '/api';

  // ---------- ESTADO ----------
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }
  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  // ---------- TOAST ----------
  let toastTimer;
  function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className = 'f4te-toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'f4te-toast ' + type; }, 2800);
  }

  // ---------- AUTH ----------
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
  function clearAuth(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }
  function setUser(u){ localStorage.setItem(USER_KEY, JSON.stringify(u)); }

  async function apiFetch(path, opts = {}) {
    const token = getToken();
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        ...(opts.headers || {})
      }
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data.error || ('Erro HTTP ' + res.status));
    return data;
  }

  async function ensureLogin() {
    if (getToken()) return getUser();
    return await loginDialog();
  }

  function loginDialog() {
    return new Promise((resolve, reject) => {
      const html = `
        <div class="f4te-modal-back" data-close>
          <form class="f4te-modal" id="f4te-login" autocomplete="off">
            <h3>F4TE • Login Staff</h3>
            <label>Usuário</label>
            <input name="username" required maxlength="50">
            <label>Senha</label>
            <input name="password" type="password" required>
            <div id="f4te-login-err" style="color:#ff7080; font-size:12px; margin-top:8px;"></div>
            <div class="f4te-modal-actions">
              <button class="ok" type="submit">Entrar</button>
            </div>
          </form>
        </div>`;
      modalRoot.innerHTML = html;
      const form = $('#f4te-login', modalRoot);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          const r = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
          });
          setToken(r.token);
          setUser(r.user);
          modalRoot.innerHTML = '';
          showToast('Bem-vindo, ' + r.user.display_name + '!', 'ok');
          resolve(r.user);
        } catch (err) {
          $('#f4te-login-err', form).textContent = err.message;
        }
      });
      modalRoot.querySelector('.f4te-modal-back').addEventListener('click', (e) => {
        if (e.target === modalRoot.querySelector('.f4te-modal-back')) {
          modalRoot.innerHTML = '';
          reject(new Error('login cancelado'));
        }
      });
    });
  }

  // ---------- MODAL GENÉRICO ----------
  function openModal({ title, html, onSubmit }) {
    const wrap = document.createElement('div');
    wrap.className = 'f4te-modal-back';
    wrap.innerHTML = `
      <form class="f4te-modal">
        <h3>${title}</h3>
        ${html}
        <div class="f4te-modal-actions">
          <button type="button" class="cancel">Cancelar</button>
          <button type="submit" class="ok">Confirmar</button>
        </div>
      </form>`;
    modalRoot.appendChild(wrap);
    const form = wrap.querySelector('form');
    wrap.querySelector('.cancel').addEventListener('click', () => wrap.remove());
    wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => { if (v !== '') data[k] = v; });
      try { await onSubmit(data, wrap); }
      catch (err) { showToast(err.message, 'error'); }
    });
    return wrap;
  }

  // ---------- MINIMIZAR / DRAG / RESTAURAR ----------
  function applyState() {
    const s = loadState();
    if (s.minimized) {
      panel.classList.add('hidden');
      fab.classList.remove('hidden');
    } else {
      panel.classList.remove('hidden');
      fab.classList.add('hidden');
    }
    if (s.pos) {
      panel.style.top  = s.pos.top;
      panel.style.left = s.pos.left;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    } else {
      panel.style.top  = '16px';
      panel.style.left = '16px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }
  }

  function minimize() {
    const s = loadState();
    s.minimized = true;
    saveState(s);
    applyState();
    showToast('Painel minimizado.');
  }
  function restore() {
    const s = loadState();
    s.minimized = false;
    saveState(s);
    applyState();
  }

  minBtn.addEventListener('click', minimize);
  fab.addEventListener('click', restore);

  // drag
  (function makeDraggable() {
    let ox = 0, oy = 0, dragging = false;
    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      dragging = true;
      const r = panel.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      document.body.style.userSelect = 'none';
    });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(window.innerWidth  - 60, e.clientX - ox));
      const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
      panel.style.left = x + 'px';
      panel.style.top  = y + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      saveState(Object.assign(loadState(), { pos: { top: panel.style.top, left: panel.style.left } }));
    });
  })();

  // ---------- HEADER ACTIONS ----------
  document.querySelectorAll('.f4te-pill').forEach(b => {
    b.addEventListener('click', async () => {
      await ensureLogin();
      const act = b.dataset.act;
      if (act === 'aumentar')  { $('#quarto-count').textContent = String(Number($('#quarto-count').textContent) + 1); showToast('Contador aumentado.', 'ok'); }
      if (act === 'diminuir')  {
        const v = Number($('#quarto-count').textContent) - 1;
        $('#quarto-count').textContent = String(v < 0 ? 0 : v); showToast('Contador diminuído.', 'ok');
      }
      if (act === 'quarto')    { showToast('Selecionar quarto — em breve.', ''); }
      if (act === 'nickname')  { showToast('Definir nickname — em breve.', ''); }
      if (act === 'reset')     {
        $('#quarto-count').textContent = '0';
        showToast('Reset feito.', 'ok');
      }
    });
  });

  // ---------- SIDE ACTIONS ----------
  document.querySelectorAll('.f4te-btn[data-modal]').forEach(b => {
    b.addEventListener('click', async () => {
      await ensureLogin();
      const m = b.dataset.modal;
      if (m === 'tele')       return modalTele();
      if (m === 'alert')      return modalAlert();
      if (m === 'evento')     return modalEvento();
      if (m === 'chooser')    return modalChooser();
      if (m === 'hall')       return modalHall();
      if (m === 'pagamento')  return modalPagamento();
    });
  });

  document.querySelectorAll('.f4te-btn[data-action]').forEach(b => {
    b.addEventListener('click', async () => {
      await ensureLogin();
      if (b.dataset.action === 'zerar-cota') {
        if (!confirm('Tem certeza que deseja ZERAR A COTA?')) return;
        try {
          await apiFetch('/actions/zerar-cota', { method: 'POST' });
          showToast('Cota zerada.', 'ok');
        } catch (e) { showToast(e.message, 'error'); }
      }
    });
  });

  // ---------- MODAIS ESPECÍFICOS ----------
  async function modalTele() {
    openModal({
      title: ':TELE — Move usuário para outro quarto',
      html: `
        <label>Nickname (Habbo)</label>
        <input name="username" required maxlength="80">
        <label>Quarto</label>
        <input name="quarto" required maxlength="80">`,
      onSubmit: async (data) => {
        try {
          const r = await apiFetch('/actions/tele', { method: 'POST', body: JSON.stringify(data) });
          modalRoot.innerHTML = '';
          showToast(r.message, 'ok');
        } catch (e) { throw e; }
      }
    });
  }
  async function modalAlert() {
    openModal({
      title: 'ATT. — Alerta global',
      html: `<label>Mensagem</label><textarea name="mensagem" rows="3" required maxlength="240"></textarea>`,
      onSubmit: async (data) => {
        try {
          await apiFetch('/actions/alert', { method: 'POST', body: JSON.stringify(data) });
          modalRoot.innerHTML = '';
          showToast('Alerta enviado.', 'ok');
        } catch (e) { throw e; }
      }
    });
  }
  async function modalEvento() {
    openModal({
      title: 'ADD EVENTO. — Criar novo evento',
      html: `
        <label>Título</label><input name="titulo" required maxlength="120">
        <label>Tipo</label>
        <select name="tipo">
          <option>EVENTO</option><option>PAGAMENTO</option><option>HALL</option><option>CUSTOM</option>
        </select>
        <label>Descrição</label><textarea name="descricao" rows="3" maxlength="1000"></textarea>`,
      onSubmit: async (data) => {
        try {
          await apiFetch('/events', { method: 'POST', body: JSON.stringify(data) });
          modalRoot.innerHTML = '';
          showToast('Evento adicionado.', 'ok');
        } catch (e) { throw e; }
      }
    });
  }
  async function modalChooser() {
    openModal({
      title: ':CHOOSER — Perguntar ao hotel',
      html: `<label>Opções (uma por linha, até 10)</label><textarea name="opcoes" rows="5" required></textarea>`,
      onSubmit: async (data) => {
        const opcoes = data.opcoes.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10);
        if (!opcoes.length) throw new Error('Informe ao menos uma opção');
        try {
          await apiFetch('/actions/chooser', { method: 'POST', body: JSON.stringify({ opcoes }) });
          modalRoot.innerHTML = '';
          showToast('Chooser aberto.', 'ok');
        } catch (e) { throw e; }
      }
    });
  }
  async function modalHall() {
    openModal({
      title: 'Hall — Definir hall',
      html: `<label>Nome do quarto</label><input name="quarto" required maxlength="80">`,
      onSubmit: async (data) => {
        try {
          await apiFetch('/actions/hall', { method: 'POST', body: JSON.stringify(data) });
          modalRoot.innerHTML = '';
          showToast('Hall definido.', 'ok');
        } catch (e) { throw e; }
      }
    });
  }
  async function modalPagamento() {
    openModal({
      title: 'Reg. Pagamento',
      html: `
        <label>Usuário Habbo</label><input name="usuario_habbo" required maxlength="80">
        <label>Valor</label><input name="valor" type="number" min="0" step="0.01" required>
        <label>Descrição</label><input name="descricao" maxlength="255">`,
      onSubmit: async (data) => {
        try {
          await apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) });
          modalRoot.innerHTML = '';
          showToast('Pagamento registrado.', 'ok');
        } catch (e) { throw e; }
      }
    });
  }

  // ---------- INIT ----------
  applyState();
  showToast('F4TE Panel carregado.', 'ok');
})();
