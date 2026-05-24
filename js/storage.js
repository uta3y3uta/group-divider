const Storage = {
  KEY_MEMBERS: 'gd_members',
  KEY_LAST: 'gd_last_groups',

  loadMembers() {
    try {
      const raw = localStorage.getItem(this.KEY_MEMBERS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  },

  saveMembers(members) {
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(members));
  },

  loadLastGroups() {
    try {
      const raw = localStorage.getItem(this.KEY_LAST);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  saveLastGroups(groups) {
    const simplified = groups.map(g => g.map(m => m.id));
    localStorage.setItem(this.KEY_LAST, JSON.stringify(simplified));
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
