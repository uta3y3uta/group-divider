const Setup = {
  members: [],
  listeners: [],

  init() {
    this.members = Storage.loadMembers();

    // sub tabs
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        const target = btn.dataset.subtab;
        document.querySelectorAll('.sub-panel').forEach(p => p.classList.toggle('active', p.id === target + '-panel'));
      });
    });

    // 1人追加
    document.getElementById('add-member-btn').addEventListener('click', () => this.addOne());
    document.getElementById('member-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addOne();
    });

    // コピペ
    document.getElementById('paste-import-btn').addEventListener('click', () => this.importPaste());

    // Excel
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

    // Google
    document.getElementById('google-import-btn').addEventListener('click', () => this.importGoogle());

    // 全削除
    document.getElementById('clear-members-btn').addEventListener('click', () => this.clearAll());

    this.render();
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
    this.render();
  },

  renameMember(id, newName) {
    const m = this.members.find(x => x.id === id);
    if (!m) return;
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    m.name = trimmed;
    this.save();
    this.render();
  },

  removeMember(id) {
    this.members = this.members.filter(m => m.id !== id);
    this.save();
    this.render();
  },

  clearAll() {
    if (!confirm('登録済みメンバーをすべて削除します。よろしいですか？')) return;
    this.members = [];
    this.save();
    this.render();
  },

  parseNames(text) {
    // split on newline / comma / tab
    return text.split(/[\r\n,\t]+/)
      .map(s => s.trim())
      .filter(Boolean);
  },

  importNames(names, append) {
    if (!names || names.length === 0) return 0;
    if (!append) this.members = [];
    for (const n of names) {
      this.members.push({ id: uid(), name: n });
    }
    this.save();
    this.render();
    return names.length;
  },

  importPaste() {
    const text = document.getElementById('paste-text').value;
    const append = document.getElementById('paste-append').checked;
    const names = this.parseNames(text);
    if (names.length === 0) {
      alert('名前が読み取れませんでした。');
      return;
    }
    if (!append && this.members.length > 0) {
      if (!confirm(`現在の${this.members.length}人を置き換えて、${names.length}人を取り込みます。よろしいですか？`)) return;
    }
    const n = this.importNames(names, append);
    document.getElementById('paste-text').value = '';
    alert(`${n}人を取り込みました。`);
  },

  importExcel(file) {
    const status = document.getElementById('excel-status');
    status.className = 'file-status';
    status.textContent = '';
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
        // Flatten cells; take first cell of each row as the name
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
    reader.onerror = () => {
      status.className = 'file-status error';
      status.textContent = 'ファイルの読み込みに失敗しました。';
    };
    reader.readAsArrayBuffer(file);
  },

  async importGoogle() {
    const urlEl = document.getElementById('google-url');
    const status = document.getElementById('google-status');
    status.className = 'file-status';
    status.textContent = '';
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
        // CSV first column, strip quotes
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

  render() {
    const ul = document.getElementById('member-list');
    const countEl = document.getElementById('member-count');
    countEl.textContent = this.members.length;
    ul.innerHTML = '';
    if (this.members.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-msg';
      li.textContent = 'まだメンバーがいません';
      ul.appendChild(li);
      return;
    }
    for (const m of this.members) {
      const li = document.createElement('li');
      const num = document.createElement('span');
      num.className = 'muted';
      num.textContent = (Array.from(ul.children).length + 1).toString();
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
    }
  },
};
