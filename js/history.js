const History = {
  entries: [],

  init() {
    this.entries = Storage.loadHistory();
    document.getElementById('clear-history-btn').addEventListener('click', () => this.clearAll());
    // close any open dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('#history .dropdown.open').forEach(d => d.classList.remove('open'));
    });
    this.render();
  },

  addEntry(entry) {
    entry.id = entry.id || uid();
    this.entries.unshift(entry);
    Storage.saveHistory(this.entries);
    this.render();
  },

  removeEntry(id) {
    this.entries = this.entries.filter(e => e.id !== id);
    Storage.saveHistory(this.entries);
    this.render();
  },

  clearAll() {
    if (this.entries.length === 0) return;
    if (!confirm('履歴をすべて削除します。よろしいですか？')) return;
    this.entries = [];
    Storage.saveHistory(this.entries);
    this.render();
  },

  format(iso) {
    const d = new Date(iso);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  exportEntry(entry, format) {
    const arrangement = { groups: entry.groups, groupNames: entry.groupNames || {} };
    const prefix = `groups-${this.format(entry.date).replace(/[\/\s:]/g, '')}`;
    if (format === 'json') { ExportUtil.toJSON(arrangement, prefix); Toast.show('JSONを書き出しました'); }
    else if (format === 'jpeg') { Toast.show('JPEGを作成中...', 2500); ExportUtil.toImage(arrangement, prefix, 'jpeg').then(() => Toast.show('JPEGを書き出しました')); }
    else if (format === 'pdf') { Toast.show('PDFを作成中...', 2500); ExportUtil.toPDF(arrangement, prefix).then(() => Toast.show('PDFを書き出しました')); }
  },

  render() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    if (this.entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'まだ履歴がありません';
      list.appendChild(empty);
      return;
    }
    for (const entry of this.entries) {
      const total = entry.groups.reduce((sum, g) => sum + g.length, 0);
      const item = document.createElement('div');
      item.className = 'history-item';

      const head = document.createElement('div');
      head.className = 'history-head';
      const left = document.createElement('div');
      left.innerHTML = `
        <div class="history-date">${this.format(entry.date)}</div>
        <div class="history-meta">${entry.groups.length}グループ・${total}人</div>
      `;
      const actions = document.createElement('div');
      actions.className = 'history-actions';

      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'primary';
      restoreBtn.textContent = '復元';
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm('現在の配置をこの履歴で上書きします。よろしいですか？')) return;
        Groups.restoreFromHistory(entry);
        document.querySelector('.tab-btn[data-tab="groups"]').click();
        Toast.show('復元しました');
      });

      // export dropdown
      const dd = document.createElement('div');
      dd.className = 'dropdown';
      const trig = document.createElement('button');
      trig.className = 'ghost';
      trig.textContent = '📤 書き出し ▾';
      trig.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('#history .dropdown.open').forEach(d => { if (d !== dd) d.classList.remove('open'); });
        dd.classList.toggle('open');
      });
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu';
      ['json', 'jpeg', 'pdf'].forEach(fmt => {
        const b = document.createElement('button');
        b.textContent = fmt.toUpperCase();
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          dd.classList.remove('open');
          this.exportEntry(entry, fmt);
        });
        menu.appendChild(b);
      });
      dd.appendChild(trig);
      dd.appendChild(menu);

      const delBtn = document.createElement('button');
      delBtn.className = 'ghost danger';
      delBtn.textContent = '削除';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm('この履歴を削除します。')) return;
        this.removeEntry(entry.id);
      });

      actions.appendChild(restoreBtn);
      actions.appendChild(dd);
      actions.appendChild(delBtn);

      head.appendChild(left);
      head.appendChild(actions);
      item.appendChild(head);

      const body = document.createElement('div');
      body.className = 'history-body';
      entry.groups.forEach((g, i) => {
        if (g.length === 0) return;
        const block = document.createElement('div');
        block.className = 'group-block';
        const gname = (entry.groupNames && entry.groupNames[i]) || `グループ${i + 1}`;
        block.innerHTML = `<span class="gname">${escapeHTML(gname)}</span>${g.map(m => escapeHTML(m.name)).join('・')}`;
        body.appendChild(block);
      });
      item.appendChild(body);

      head.addEventListener('click', () => item.classList.toggle('expanded'));
      list.appendChild(item);
    }
  },
};
