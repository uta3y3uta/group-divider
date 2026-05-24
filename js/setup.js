const Setup = {
  members: [],

  init() {
    this.members = Storage.loadMembers();
    this.render();

    document.getElementById('add-member-btn').addEventListener('click', () => this.addMember());
    document.getElementById('member-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addMember();
    });
    document.getElementById('bulk-add-btn').addEventListener('click', () => this.bulkAdd());
    document.getElementById('clear-members-btn').addEventListener('click', () => this.clearAll());
  },

  addMember() {
    const nameEl = document.getElementById('member-name');
    const genderEl = document.getElementById('member-gender');
    const tagEl = document.getElementById('member-tag');
    const name = nameEl.value.trim();
    if (!name) return;
    this.members.push({
      id: uid(),
      name,
      gender: genderEl.value || '',
      tag: tagEl.value.trim() || '',
    });
    nameEl.value = '';
    tagEl.value = '';
    nameEl.focus();
    this.save();
    this.render();
  },

  bulkAdd() {
    const textEl = document.getElementById('bulk-text');
    const lines = textEl.value.split('\n').map(l => l.trim()).filter(Boolean);
    let added = 0;
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0];
      if (!name) continue;
      let gender = '';
      if (parts[1]) {
        const g = parts[1].toUpperCase();
        if (g === 'M' || g === '男' || g === 'B' || g === 'BOY') gender = 'M';
        else if (g === 'F' || g === '女' || g === 'G' || g === 'GIRL') gender = 'F';
      }
      this.members.push({
        id: uid(),
        name,
        gender,
        tag: parts[2] || '',
      });
      added++;
    }
    if (added > 0) {
      textEl.value = '';
      this.save();
      this.render();
    }
  },

  removeMember(id) {
    this.members = this.members.filter(m => m.id !== id);
    this.save();
    this.render();
  },

  clearAll() {
    if (!confirm('全員削除しますか？')) return;
    this.members = [];
    this.save();
    this.render();
  },

  save() {
    Storage.saveMembers(this.members);
  },

  render() {
    const ul = document.getElementById('member-list');
    const countEl = document.getElementById('member-count');
    countEl.textContent = this.members.length;
    ul.innerHTML = '';
    if (this.members.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'まだメンバーがいません';
      li.style.justifyContent = 'center';
      ul.appendChild(li);
      return;
    }
    for (const m of this.members) {
      const li = document.createElement('li');

      const gBadge = document.createElement('span');
      gBadge.className = 'gender-badge ' + (m.gender || 'none');
      gBadge.textContent = m.gender === 'M' ? '男' : m.gender === 'F' ? '女' : '—';

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = m.name;

      li.appendChild(gBadge);
      li.appendChild(name);

      if (m.tag) {
        const tag = document.createElement('span');
        tag.className = 'tag-badge';
        tag.textContent = m.tag;
        li.appendChild(tag);
      }

      const del = document.createElement('button');
      del.className = 'del-btn';
      del.textContent = '×';
      del.title = '削除';
      del.addEventListener('click', () => this.removeMember(m.id));
      li.appendChild(del);

      ul.appendChild(li);
    }
  },

  getMembers() {
    return this.members.slice();
  },
};
