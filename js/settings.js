/* Settings panel — theme picker + member registration (renamed from setup) */
const Settings = {
  members: [],
  listeners: [],
  currentTheme: 'orange',

  init() {
    // load + apply theme/font first
    this.currentTheme = Storage.loadTheme();
    this.currentFont = Storage.loadFont();
    applyTheme(this.currentTheme);
    applyFont(this.currentFont);

    this.members = Storage.loadMembers();
    this.renderThemeAndFontSelects();
    this.renderThemes();
    this.bindMemberEvents();
    this.renderMembers();
  },

  renderThemeAndFontSelects() {
    const tsel = document.getElementById('theme-select');
    tsel.innerHTML = '';
    for (const t of THEMES) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.emoji} ${t.name}`;
      if (t.id === this.currentTheme) opt.selected = true;
      tsel.appendChild(opt);
    }
    tsel.addEventListener('change', () => this.setTheme(tsel.value));

    const fsel = document.getElementById('font-select');
    fsel.innerHTML = '';
    for (const f of FONTS) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      opt.style.fontFamily = f.stack;
      if (f.id === this.currentFont) opt.selected = true;
      fsel.appendChild(opt);
    }
    fsel.addEventListener('change', () => this.setFont(fsel.value));
  },

  setTheme(id) {
    this.currentTheme = id;
    Storage.saveTheme(id);
    applyTheme(id);
    document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.theme === id));
    const sel = document.getElementById('theme-select');
    if (sel.value !== id) sel.value = id;
  },

  setFont(id) {
    this.currentFont = id;
    Storage.saveFont(id);
    applyFont(id);
    const sel = document.getElementById('font-select');
    if (sel.value !== id) sel.value = id;
  },

  renderThemes() {
    const grid = document.getElementById('theme-grid');
    grid.innerHTML = '';
    for (const t of THEMES) {
      const card = document.createElement('button');
      card.className = 'theme-card' + (t.id === this.currentTheme ? ' active' : '');
      card.dataset.theme = t.id;
      card.innerHTML = `
        <div class="theme-emoji">${t.emoji}</div>
        <div class="theme-swatches">
          <span style="background:${t.vars['--primary']}"></span>
          <span style="background:${t.vars['--bg-2']}"></span>
          <span style="background:${t.vars['--secondary']}"></span>
        </div>
        <div class="theme-name">${t.name}</div>
      `;
      card.addEventListener('click', () => this.setTheme(t.id));
      grid.appendChild(card);
    }
  },

  bindMemberEvents() {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        const target = btn.dataset.subtab;
        document.querySelectorAll('.sub-panel').forEach(p => p.classList.toggle('active', p.id === target + '-panel'));
      });
    });

    document.getElementById('add-member-btn').addEventListener('click', () => this.addOne());
    document.getElementById('member-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addOne();
    });
    document.getElementById('paste-import-btn').addEventListener('click', () => this.importPaste());

    const excelFile = document.getElementById('excel-file');
    excelFile.addEventListener('change', (e) => this.importExcel(e.target.files[0]));
    const drop = document.getElementById('excel-drop');
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f) this.importExcel(f);
    });

    document.getElementById('google-import-btn').addEventListener('click', () => this.importGoogle());
    document.getElementById('clear-members-btn').addEventListener('click', () => this.clearAll());
  },

  onChange(fn) { this.listeners.push(fn); },
  notify() { for (const fn of this.listeners) fn(); },
  getMembers() { return this.members.slice(); },

  addOne() {
    const el = document.getElementById('member-name');
    const name = el.value.trim();
    if (!name) return;
    this.members.push({ id: uid(), name });
    el.value = '';
    el.focus();
    this.save();
    this.renderMembers();
  },

  renameMember(id, newName) {
    const m = this.members.find(x => x.id === id);
    if (!m) return;
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    m.name = trimmed;
    this.save();
    this.renderMembers();
  },

  removeMember(id) {
    this.members = this.members.filter(m => m.id !== id);
    this.save();
    this.renderMembers();
  },

  clearAll() {
    if (!confirm('登録済みメンバーをすべて削除します。よろしいですか？')) return;
    this.members = [];
    this.save();
    this.renderMembers();
  },

  parseNames(text) {
    return text.split(/[\r\n,\t]+/)
      .map(s => s.trim())
      .filter(Boolean);
  },

  importNames(names, append) {
    if (!names || names.length === 0) return 0;
    if (!append) this.members = [];
    for (const n of names) this.members.push({ id: uid(), name: n });
    this.save();
    this.renderMembers();
    return names.length;
  },

  importPaste() {
    const text = document.getElementById('paste-text').value;
    const append = document.getElementById('paste-append').checked;
    const names = this.parseNames(text);
    if (names.length === 0) { alert('名前が読み取れませんでした。'); return; }
    if (!append && this.members.length > 0) {
      if (!confirm(`現在の${this.members.length}人を置き換えて、${names.length}人を取り込みます。よろしいですか？`)) return;
    }
    const n = this.importNames(names, append);
    document.getElementById('paste-text').value = '';
    Toast.show(`${n}人を取り込みました`);
  },

  importExcel(file) {
    const status = document.getElementById('excel-status');
    status.className = 'file-status'; status.textContent = '';
    if (!file) return;
    if (typeof XLSX === 'undefined') {
      status.className = 'file-status error';
      status.textContent = 'Excelライブラリの読み込みに失敗しました。';
      return;
    }
    const append = document.getElementById('excel-append').checked;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
        const names = [];
        for (const row of rows) {
          if (!row) continue;
          for (const cell of row) {
            const v = (cell == null ? '' : String(cell)).trim();
            if (v) { names.push(v); break; }
          }
        }
        if (names.length === 0) {
          status.className = 'file-status error';
          status.textContent = '名前が読み取れませんでした。';
          return;
        }
        if (!append && this.members.length > 0) {
          if (!confirm(`現在の${this.members.length}人を置き換えて、${names.length}人を取り込みます。よろしいですか？`)) return;
        }
        this.importNames(names, append);
        status.className = 'file-status';
        status.textContent = `✅ ${names.length}人を取り込みました（${file.name}）`;
      } catch (err) {
        status.className = 'file-status error';
        status.textContent = '読み込みエラー: ' + err.message;
      }
    };
    reader.readAsArrayBuffer(file);
  },

  async importGoogle() {
    const urlEl = document.getElementById('google-url');
    const status = document.getElementById('google-status');
    status.className = 'file-status'; status.textContent = '';
    const url = urlEl.value.trim();
    if (!url) return;
    const append = document.getElementById('google-append').checked;
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      status.className = 'file-status error';
      status.textContent = 'GoogleスプレッドシートのURLではないようです。';
      return;
    }
    const sheetId = idMatch[1];
    const gidMatch = url.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    status.textContent = '読み込み中...';
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const lines = text.split(/\r?\n/);
      const names = [];
      for (const line of lines) {
        const m = line.match(/^"?([^",]*)"?/);
        if (m && m[1].trim()) names.push(m[1].trim());
      }
      if (names.length === 0) {
        status.className = 'file-status error';
        status.textContent = '名前が読み取れませんでした。';
        return;
      }
      if (!append && this.members.length > 0) {
        if (!confirm(`現在の${this.members.length}人を置き換えて、${names.length}人を取り込みます。よろしいですか？`)) return;
      }
      this.importNames(names, append);
      status.className = 'file-status';
      status.textContent = `✅ ${names.length}人を取り込みました`;
    } catch (err) {
      status.className = 'file-status error';
      status.textContent = '取得失敗。シートが「リンクを知っている全員」に共有されているか確認してください。';
    }
  },

  save() {
    Storage.saveMembers(this.members);
    this.notify();
  },

  renderMembers() {
    const ul = document.getElementById('member-list');
    document.getElementById('member-count').textContent = this.members.length;
    ul.innerHTML = '';
    if (this.members.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-msg';
      li.textContent = 'まだメンバーがいません';
      ul.appendChild(li);
      return;
    }
    this.members.forEach((m, i) => {
      const li = document.createElement('li');
      const num = document.createElement('span');
      num.className = 'muted';
      num.textContent = (i + 1).toString();
      num.style.minWidth = '24px';

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = m.name;

      const del = document.createElement('button');
      del.className = 'del-btn';
      del.textContent = '×';
      del.title = '削除';
      del.addEventListener('click', () => this.removeMember(m.id));

      li.appendChild(num);
      li.appendChild(name);
      li.appendChild(del);
      ul.appendChild(li);
    });
  },
};

/* Toast utility */
const Toast = {
  el: null,
  show(msg, ms = 1800) {
    if (!this.el) this.el = document.getElementById('toast');
    if (!this.el) return;
    this.el.textContent = msg;
    this.el.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.classList.remove('show'), ms);
  },
};
