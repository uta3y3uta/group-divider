const Storage = {
  KEY_MEMBERS: 'gd_members',
  KEY_LAST: 'gd_last_groups',
  KEY_GROUP_NAMES: 'gd_group_names',
  KEY_LAYOUT: 'gd_layout',

  loadMembers() {
    try {
      const raw = localStorage.getItem(this.KEY_MEMBERS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      // Normalize: ensure id + name; drop legacy fields silently
      return arr
        .filter(m => m && typeof m.name === 'string' && m.name.trim())
        .map(m => ({ id: m.id || uid(), name: m.name }));
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

  loadGroupNames() {
    try {
      const raw = localStorage.getItem(this.KEY_GROUP_NAMES);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : {};
    } catch (e) {
      return {};
    }
  },

  saveGroupNames(map) {
    localStorage.setItem(this.KEY_GROUP_NAMES, JSON.stringify(map));
  },

  loadLayout() {
    return localStorage.getItem(this.KEY_LAYOUT) || 'vertical';
  },

  saveLayout(layout) {
    localStorage.setItem(this.KEY_LAYOUT, layout);
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
