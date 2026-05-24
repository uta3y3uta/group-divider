const THEMES = [
  {
    id: 'sky', name: 'スカイ', emoji: '☁️',
    vars: {
      '--bg-1': '#eff6ff', '--bg-2': '#dbeafe',
      '--card': '#ffffff', '--text': '#1e293b', '--muted': '#64748b',
      '--border': '#bfdbfe', '--primary': '#3b82f6', '--primary-hover': '#2563eb',
      '--secondary': '#8b5cf6', '--accent': '#06b6d4',
    },
  },
  {
    id: 'orange', name: 'オレンジ', emoji: '🍊',
    vars: {
      '--bg-1': '#fff7f0', '--bg-2': '#ffe9d6',
      '--card': '#ffffff', '--text': '#2d2d3a', '--muted': '#8a8a9a',
      '--border': '#ffe0c2', '--primary': '#ff7a59', '--primary-hover': '#ff6342',
      '--secondary': '#6366f1', '--accent': '#fbbf24',
    },
  },
  {
    id: 'sakura', name: 'さくら', emoji: '🌸',
    vars: {
      '--bg-1': '#fdf2f8', '--bg-2': '#fce7f3',
      '--card': '#ffffff', '--text': '#3b1a30', '--muted': '#9d6f87',
      '--border': '#fbcfe8', '--primary': '#ec4899', '--primary-hover': '#db2777',
      '--secondary': '#a855f7', '--accent': '#f43f5e',
    },
  },
  {
    id: 'forest', name: 'フォレスト', emoji: '🌳',
    vars: {
      '--bg-1': '#ecfdf5', '--bg-2': '#d1fae5',
      '--card': '#ffffff', '--text': '#1f2937', '--muted': '#6b7280',
      '--border': '#a7f3d0', '--primary': '#10b981', '--primary-hover': '#059669',
      '--secondary': '#06b6d4', '--accent': '#84cc16',
    },
  },
  {
    id: 'lavender', name: 'ラベンダー', emoji: '💜',
    vars: {
      '--bg-1': '#faf5ff', '--bg-2': '#ede9fe',
      '--card': '#ffffff', '--text': '#2e1065', '--muted': '#7c6f9c',
      '--border': '#ddd6fe', '--primary': '#a855f7', '--primary-hover': '#9333ea',
      '--secondary': '#ec4899', '--accent': '#6366f1',
    },
  },
  {
    id: 'sun', name: 'サンシャイン', emoji: '☀️',
    vars: {
      '--bg-1': '#fffbeb', '--bg-2': '#fef3c7',
      '--card': '#ffffff', '--text': '#451a03', '--muted': '#92725a',
      '--border': '#fde68a', '--primary': '#f59e0b', '--primary-hover': '#d97706',
      '--secondary': '#ef4444', '--accent': '#10b981',
    },
  },
  {
    id: 'mint', name: 'ミント', emoji: '🍃',
    vars: {
      '--bg-1': '#f0fdfa', '--bg-2': '#ccfbf1',
      '--card': '#ffffff', '--text': '#134e4a', '--muted': '#6b7c79',
      '--border': '#99f6e4', '--primary': '#14b8a6', '--primary-hover': '#0d9488',
      '--secondary': '#0ea5e9', '--accent': '#a3e635',
    },
  },
  {
    id: 'rose', name: 'ローズ', emoji: '🌹',
    vars: {
      '--bg-1': '#fff1f2', '--bg-2': '#ffe4e6',
      '--card': '#ffffff', '--text': '#4c0519', '--muted': '#9a6678',
      '--border': '#fecdd3', '--primary': '#f43f5e', '--primary-hover': '#e11d48',
      '--secondary': '#8b5cf6', '--accent': '#fbbf24',
    },
  },
  {
    id: 'mono', name: 'モノクロ', emoji: '⚫',
    vars: {
      '--bg-1': '#f9fafb', '--bg-2': '#e5e7eb',
      '--card': '#ffffff', '--text': '#1f2937', '--muted': '#6b7280',
      '--border': '#d1d5db', '--primary': '#374151', '--primary-hover': '#1f2937',
      '--secondary': '#6b7280', '--accent': '#9ca3af',
    },
  },
  {
    id: 'dark', name: 'ダーク', emoji: '🌙',
    vars: {
      '--bg-1': '#1f2937', '--bg-2': '#111827',
      '--card': '#374151', '--text': '#f9fafb', '--muted': '#9ca3af',
      '--border': '#4b5563', '--primary': '#fb923c', '--primary-hover': '#f97316',
      '--secondary': '#a78bfa', '--accent': '#34d399',
    },
  },
];

function applyTheme(id) {
  const t = THEMES.find(x => x.id === id) || THEMES[0];
  for (const [k, v] of Object.entries(t.vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  document.body.className = '';
  document.body.classList.add('theme-' + t.id);
}
