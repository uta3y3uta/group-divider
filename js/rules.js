/* Rules: separate / together constraints */
const Rules = {
  data: { separate: [], together: [] },

  init() {
    this.data = Storage.loadRules();

    document.querySelectorAll('.rule-add-btn').forEach(btn => {
      btn.addEventListener('click', () => this.addRule(btn.dataset.kind));
    });

    this.renderSelects();
    this.renderLists();

    // refresh selects when members change
    Settings.onChange(() => {
      this.cleanupStaleIds();
      this.renderSelects();
      this.renderLists();
    });
  },

  cleanupStaleIds() {
    const known = new Set(Settings.getMembers().map(m => m.id));
    this.data.separate = this.data.separate.filter(p => p.every(id => known.has(id)));
    this.data.together = this.data.together.filter(p => p.every(id => known.has(id)));
    Storage.saveRules(this.data);
  },

  renderSelects() {
    const members = Settings.getMembers();
    const ids = ['separate-a', 'separate-b', 'together-a', 'together-b'];
    for (const id of ids) {
      const sel = document.getElementById(id);
      if (!sel) continue;
      const prev = sel.value;
      sel.innerHTML = '<option value="">— 選択 —</option>';
      for (const m of members) {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        sel.appendChild(opt);
      }
      if (prev && members.find(m => m.id === prev)) sel.value = prev;
    }
  },

  addRule(kind) {
    const a = document.getElementById(`${kind}-a`).value;
    const b = document.getElementById(`${kind}-b`).value;
    if (!a || !b) { alert('2人とも選択してください。'); return; }
    if (a === b) { alert('同じ人は選べません。'); return; }
    // dedupe: order-independent
    const existing = this.data[kind].some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
    if (existing) { alert('そのルールはすでに登録されています。'); return; }
    this.data[kind].push([a, b]);
    Storage.saveRules(this.data);
    // reset selects to placeholder
    document.getElementById(`${kind}-a`).value = '';
    document.getElementById(`${kind}-b`).value = '';
    this.renderLists();
  },

  removeRule(kind, idx) {
    this.data[kind].splice(idx, 1);
    Storage.saveRules(this.data);
    this.renderLists();
  },

  clearAll() {
    if (!confirm('すべてのルールを削除します。よろしいですか？')) return;
    this.data = { separate: [], together: [] };
    Storage.saveRules(this.data);
    this.renderLists();
  },

  getName(id) {
    const m = Settings.getMembers().find(x => x.id === id);
    return m ? m.name : '(不明)';
  },

  renderLists() {
    const total = this.data.separate.length + this.data.together.length;
    const countEl = document.getElementById('rules-count');
    if (countEl) countEl.textContent = total === 0 ? '0件' : `${total}件`;

    const renderOne = (kind, sep) => {
      const ul = document.getElementById(`${kind}-list`);
      ul.innerHTML = '';
      if (this.data[kind].length === 0) {
        const li = document.createElement('li');
        li.className = 'rule-empty';
        li.textContent = 'ルールなし';
        ul.appendChild(li);
        return;
      }
      this.data[kind].forEach((pair, i) => {
        const li = document.createElement('li');
        li.className = 'rule-item';
        const txt = document.createElement('span');
        txt.innerHTML = `<strong>${escapeHTML(this.getName(pair[0]))}</strong> <span class="rule-sep">${sep}</span> <strong>${escapeHTML(this.getName(pair[1]))}</strong>`;
        const del = document.createElement('button');
        del.className = 'del-btn';
        del.textContent = '×';
        del.title = '削除';
        del.addEventListener('click', () => this.removeRule(kind, i));
        li.appendChild(txt);
        li.appendChild(del);
        ul.appendChild(li);
      });
    };
    renderOne('separate', '↔');
    renderOne('together', '＝');
  },

  // build union-find clusters from "together" pairs over members
  buildTogetherClusters(members) {
    const parent = {};
    for (const m of members) parent[m.id] = m.id;
    const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const union = (a, b) => { parent[find(a)] = find(b); };
    for (const [a, b] of this.data.together) {
      if (parent[a] !== undefined && parent[b] !== undefined) union(a, b);
    }
    const clusters = new Map();
    for (const m of members) {
      const root = find(m.id);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(m);
    }
    return Array.from(clusters.values());
  },

  // separate pair penalty for given group assignment
  separatePenalty(groups) {
    let p = 0;
    for (const [a, b] of this.data.separate) {
      let ga = -1, gb = -1;
      groups.forEach((g, i) => {
        for (const m of g) {
          if (m.id === a) ga = i;
          if (m.id === b) gb = i;
        }
      });
      if (ga !== -1 && ga === gb) p -= 100;
    }
    return p;
  },

  togetherPenalty(groups) {
    let p = 0;
    for (const [a, b] of this.data.together) {
      let ga = -1, gb = -1;
      groups.forEach((g, i) => {
        for (const m of g) {
          if (m.id === a) ga = i;
          if (m.id === b) gb = i;
        }
      });
      if (ga !== -1 && gb !== -1 && ga !== gb) p -= 100;
    }
    return p;
  },
};

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
