const Storage = {
  KEY_MEMBERS: 'gd_members',
  KEY_LAST: 'gd_last_groups',
  KEY_GROUP_NAMES: 'gd_group_names',
  KEY_THEME: 'gd_theme',
  KEY_FONT: 'gd_font',
  KEY_HISTORY: 'gd_history',
  KEY_RULES: 'gd_rules',

  loadMembers() {
    try {
      const raw = localStorage.getItem(this.KEY_MEMBERS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(m => m && typeof m.name === 'string' && m.name.trim())
        .map(m => ({ id: m.id || uid(), name: m.name }));
    } catch (e) { return []; }
  },

  saveMembers(members) {
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(members));
  },

  loadLastGroups() {
    try {
      const raw = localStorage.getItem(this.KEY_LAST);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
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
    } catch (e) { return {}; }
  },

  saveGroupNames(map) {
    localStorage.setItem(this.KEY_GROUP_NAMES, JSON.stringify(map));
  },

  loadTheme() {
    return localStorage.getItem(this.KEY_THEME) || 'sky';
  },

  saveTheme(id) {
    localStorage.setItem(this.KEY_THEME, id);
  },

  loadFont() {
    return localStorage.getItem(this.KEY_FONT) || 'default';
  },

  saveFont(id) {
    localStorage.setItem(this.KEY_FONT, id);
  },

  loadRules() {
    try {
      const raw = localStorage.getItem(this.KEY_RULES);
      if (!raw) return { separate: [], together: [] };
      const obj = JSON.parse(raw);
      return {
        separate: Array.isArray(obj.separate) ? obj.separate : [],
        together: Array.isArray(obj.together) ? obj.together : [],
      };
    } catch (e) {
      return { separate: [], together: [] };
    }
  },

  saveRules(rules) {
    localStorage.setItem(this.KEY_RULES, JSON.stringify(rules));
  },

  loadHistory() {
    try {
      const raw = localStorage.getItem(this.KEY_HISTORY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  },

  saveHistory(arr) {
    // Cap at 50 entries
    const trimmed = arr.slice(0, 50);
    localStorage.setItem(this.KEY_HISTORY, JSON.stringify(trimmed));
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
