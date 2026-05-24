const FONTS = [
  { id: 'default', name: '標準', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", "Meiryo", system-ui, sans-serif' },
  { id: 'maru', name: '丸ゴシック', stack: '"Hiragino Maru Gothic ProN", "Hiragino Maru Gothic Pro", "Yu Gothic UI", "Meiryo", sans-serif' },
  { id: 'kaku', name: '角ゴシック', stack: '"Yu Gothic", "Yu Gothic UI", "Meiryo", "MS Gothic", sans-serif' },
  { id: 'mincho', name: '明朝', stack: '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif' },
  { id: 'pop', name: 'ポップ', stack: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif' },
  { id: 'kawaii', name: 'やわらか', stack: '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif' },
  { id: 'clear', name: '読みやすさ重視', stack: '"BIZ UDPGothic", "Yu Gothic UI", "Meiryo", sans-serif' },
];

function applyFont(id) {
  const f = FONTS.find(x => x.id === id) || FONTS[0];
  document.documentElement.style.setProperty('--font-family', f.stack);
  // also tag body for any font-specific CSS
  document.body.classList.forEach(c => { if (c.startsWith('font-')) document.body.classList.remove(c); });
  document.body.classList.add('font-' + f.id);
}
