/* Shared export helpers: takes an arrangement and writes JSON/JPEG/PDF */
const ExportUtil = {
  /**
   * arrangement: { groups: [[{id,name}], ...], groupNames: {0: '...'} }
   */
  toJSON(arrangement, prefix = 'groups') {
    const data = {
      exportedAt: new Date().toISOString(),
      groups: arrangement.groups.map((g, i) => ({
        name: (arrangement.groupNames && arrangement.groupNames[i]) || `グループ${i + 1}`,
        members: g.map(m => m.name),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${prefix}-${dateStamp()}.json`);
  },

  async toImage(arrangement, prefix = 'groups', format = 'jpeg') {
    if (typeof html2canvas === 'undefined') {
      alert('画像書き出しライブラリの読み込みに失敗しました。');
      return;
    }
    const stage = this.buildStage(arrangement);
    try {
      await new Promise(r => requestAnimationFrame(r));
      const canvas = await html2canvas(stage, { backgroundColor: '#ffffff', scale: 2 });
      await new Promise((res) => {
        canvas.toBlob((blob) => {
          if (blob) this.downloadBlob(blob, `${prefix}-${dateStamp()}.jpg`);
          res();
        }, 'image/jpeg', 0.92);
      });
    } finally {
      stage.remove();
    }
  },

  async toPDF(arrangement, prefix = 'groups') {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      alert('PDF書き出しライブラリの読み込みに失敗しました。');
      return;
    }
    const stage = this.buildStage(arrangement);
    try {
      await new Promise(r => requestAnimationFrame(r));
      const canvas = await html2canvas(stage, { backgroundColor: '#ffffff', scale: 2 });
      const img = canvas.toDataURL('image/jpeg', 0.92);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt', format: 'a4',
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`${prefix}-${dateStamp()}.pdf`);
    } finally {
      stage.remove();
    }
  },

  buildStage(arrangement) {
    const colors = [
      ['#fff5ec', '#ffd4a8'], ['#ede9fe', '#c4b5fd'], ['#fce7f3', '#f9a8d4'],
      ['#d1fae5', '#6ee7b7'], ['#dbeafe', '#93c5fd'], ['#fef3c7', '#fcd34d'],
      ['#cffafe', '#67e8f5'], ['#fecaca', '#fca5a5'],
    ];
    const stage = document.createElement('div');
    stage.className = 'export-stage-render';
    stage.style.cssText = 'position:fixed;left:-99999px;top:0;background:#fff;padding:24px;width:800px;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic UI",sans-serif;color:#1f2937;';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:18px;font-weight:800;margin-bottom:6px;color:#3b82f6;';
    title.textContent = '👥 グループ分け';
    stage.appendChild(title);

    const date = document.createElement('div');
    date.style.cssText = 'font-size:12px;color:#888;margin-bottom:18px;';
    date.textContent = new Date().toLocaleString('ja-JP');
    stage.appendChild(date);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;';
    arrangement.groups.forEach((g, i) => {
      if (!g || g.length === 0) return;
      const [bg, border] = colors[i % colors.length];
      const card = document.createElement('div');
      card.style.cssText = `background:linear-gradient(135deg,${bg} 0%,#fff 100%);border:2px solid ${border};border-radius:16px;padding:12px;`;
      const head = document.createElement('div');
      head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed rgba(0,0,0,0.08);padding-bottom:6px;margin-bottom:10px;';
      const name = document.createElement('strong');
      name.style.cssText = 'font-size:15px;color:#1f2937;';
      name.textContent = (arrangement.groupNames && arrangement.groupNames[i]) || `グループ${i + 1}`;
      const cnt = document.createElement('span');
      cnt.style.cssText = 'font-size:12px;font-weight:800;background:#fff;color:#3b82f6;padding:2px 10px;border-radius:999px;';
      cnt.textContent = g.length;
      head.appendChild(name);
      head.appendChild(cnt);
      card.appendChild(head);

      const list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
      for (const m of g) {
        const chip = document.createElement('span');
        chip.style.cssText = 'display:inline-block;padding:6px 10px;background:#fff;border:2px solid #e5e7eb;border-radius:8px;font-size:13px;font-weight:700;';
        chip.textContent = m.name;
        list.appendChild(chip);
      }
      card.appendChild(list);
      grid.appendChild(card);
    });
    stage.appendChild(grid);

    document.body.appendChild(stage);
    return stage;
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};

function dateStamp() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
