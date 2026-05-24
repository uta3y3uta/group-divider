/* ============================================
 * Groups: combined random shuffle + manual DnD
 * ============================================ */
const Groups = {
  mode: 'by-groups',     // 'by-groups' | 'by-size'
  groupCount: 4,
  groupSize: 4,
  assignment: {},        // id -> 'pool' | '0' | '1' | ...
  groupNames: {},        // index -> custom name
  layout: 'vertical',
  lastGroups: null,
  isShuffling: false,

  init() {
    this.lastGroups = Storage.loadLastGroups();
    this.groupNames = Storage.loadGroupNames();
    this.layout = Storage.loadLayout();

    // restore layout button state
    document.querySelectorAll('.layout-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.layout === this.layout);
    });

    // mode segment
    document.querySelectorAll('#groups .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#groups .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
        document.getElementById('by-groups-block').classList.toggle('hidden', this.mode !== 'by-groups');
        document.getElementById('by-size-block').classList.toggle('hidden', this.mode !== 'by-size');
        this.rebuildEmpty();
      });
    });

    // steppers
    document.querySelectorAll('.step-btn').forEach(b => {
      b.addEventListener('click', () => {
        const input = document.getElementById(b.dataset.step);
        const delta = parseInt(b.dataset.delta, 10);
        const min = parseInt(input.min, 10) || 1;
        const v = Math.max(min, (parseInt(input.value, 10) || min) + delta);
        input.value = v;
        input.dispatchEvent(new Event('change'));
      });
    });

    document.getElementById('group-count').addEventListener('change', () => {
      this.groupCount = Math.max(1, parseInt(document.getElementById('group-count').value, 10) || 1);
      this.rebuildEmpty();
    });
    document.getElementById('group-size').addEventListener('change', () => {
      this.groupSize = Math.max(2, parseInt(document.getElementById('group-size').value, 10) || 2);
      this.rebuildEmpty();
    });

    // size presets
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const s = parseInt(b.dataset.size, 10);
        document.getElementById('group-size').value = s;
        this.groupSize = s;
        this.rebuildEmpty();
      });
    });

    // layout
    document.querySelectorAll('.layout-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.layout-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.layout = b.dataset.layout;
        Storage.saveLayout(this.layout);
        this.applyLayout();
      });
    });

    // shuffle / reset
    document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffle());
    document.getElementById('reset-btn').addEventListener('click', () => this.resetToPool());

    // initial state
    this.refreshFromSetup();

    // when members change in setup, refresh
    Setup.onChange(() => this.refreshFromSetup());
  },

  computeGroupCount() {
    const members = Setup.getMembers();
    if (this.mode === 'by-groups') {
      return Math.min(Math.max(1, this.groupCount), Math.max(1, members.length));
    }
    return Math.max(1, Math.ceil(members.length / Math.max(2, this.groupSize)));
  },

  refreshFromSetup() {
    this.groupCount = parseInt(document.getElementById('group-count').value, 10) || 4;
    this.groupSize = parseInt(document.getElementById('group-size').value, 10) || 4;
    const members = Setup.getMembers();
    const known = new Set(members.map(m => m.id));
    // drop stale ids
    for (const id of Object.keys(this.assignment)) {
      if (!known.has(id)) delete this.assignment[id];
    }
    // new ids go to pool
    for (const m of members) {
      if (!(m.id in this.assignment)) this.assignment[m.id] = 'pool';
    }
    this.render();
  },

  rebuildEmpty() {
    // when group count changes, fold any members from removed groups back to pool
    const gc = this.computeGroupCount();
    for (const id of Object.keys(this.assignment)) {
      const v = this.assignment[id];
      if (v === 'pool') continue;
      const idx = parseInt(v, 10);
      if (isNaN(idx) || idx >= gc) this.assignment[id] = 'pool';
    }
    this.render();
  },

  resetToPool() {
    for (const id of Object.keys(this.assignment)) this.assignment[id] = 'pool';
    this.render();
  },

  applyLayout() {
    const area = document.getElementById('groups-area');
    area.classList.toggle('layout-vertical', this.layout === 'vertical');
    area.classList.toggle('layout-horizontal', this.layout === 'horizontal');
  },

  // ============ SHUFFLE ============
  async shuffle() {
    if (this.isShuffling) return;
    const members = Setup.getMembers();
    if (members.length === 0) {
      alert('先に「初期設定」でメンバーを登録してください。');
      return;
    }
    this.isShuffling = true;
    const btn = document.getElementById('shuffle-btn');
    btn.disabled = true;

    const groupCount = this.computeGroupCount();
    const avoidLast = document.getElementById('avoid-last').checked;

    // 1) Wobble all existing chips
    const chips = document.querySelectorAll('.card-chip');
    chips.forEach(c => c.classList.add('wobble'));
    await sleep(620);
    chips.forEach(c => c.classList.remove('wobble'));

    // 2) Compute new assignment
    const newGroups = this.computeAssignment(members, groupCount, { avoidLast });

    // 3) FLIP from old positions
    const oldRects = {};
    document.querySelectorAll('.card-chip').forEach(c => {
      oldRects[c.dataset.id] = c.getBoundingClientRect();
    });

    // apply new assignment
    const newMap = {};
    newGroups.forEach((g, i) => g.forEach(m => { newMap[m.id] = String(i); }));
    this.assignment = newMap;
    this.render();

    // animate
    const newChips = document.querySelectorAll('.card-chip');
    newChips.forEach(c => {
      const oldRect = oldRects[c.dataset.id];
      if (!oldRect) {
        c.classList.add('pop-in');
        return;
      }
      const newRect = c.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      c.style.transform = `translate(${dx}px, ${dy}px) rotate(${(Math.random()*10-5)|0}deg)`;
      c.style.transition = 'none';
      c.classList.add('flying');
    });
    // force reflow
    document.body.offsetHeight;
    newChips.forEach((c, i) => {
      requestAnimationFrame(() => {
        c.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.4, 0.5, 1)';
        c.style.transitionDelay = `${(i % 8) * 25}ms`;
        c.style.transform = '';
      });
    });

    await sleep(750);
    newChips.forEach(c => {
      c.style.transition = '';
      c.style.transitionDelay = '';
      c.classList.remove('flying');
      c.classList.remove('pop-in');
    });

    // remember for "avoid-last"
    Storage.saveLastGroups(newGroups);
    this.lastGroups = newGroups.map(g => g.map(m => m.id));

    btn.disabled = false;
    this.isShuffling = false;
  },

  computeAssignment(members, groupCount, opts) {
    const attempts = 60;
    let best = null;
    let bestScore = -Infinity;
    for (let a = 0; a < attempts; a++) {
      const groups = Array.from({ length: groupCount }, () => []);
      const shuffled = shuffleArr(members.slice());
      for (const m of shuffled) {
        const min = Math.min(...groups.map(g => g.length));
        const cand = [];
        groups.forEach((g, i) => { if (g.length === min) cand.push(i); });
        const gi = cand[Math.floor(Math.random() * cand.length)];
        groups[gi].push(m);
      }
      const score = this.scoreGroups(groups, opts);
      if (score > bestScore) {
        bestScore = score;
        best = groups;
        if (score === 0) break;
      }
    }
    return best;
  },

  scoreGroups(groups, opts) {
    let score = 0;
    if (opts.avoidLast && this.lastGroups && this.lastGroups.length > 0) {
      const lastMap = new Map();
      this.lastGroups.forEach((g, i) => g.forEach(id => lastMap.set(id, i)));
      for (const g of groups) {
        const buckets = {};
        for (const m of g) {
          const prev = lastMap.get(m.id);
          if (prev !== undefined) buckets[prev] = (buckets[prev] || 0) + 1;
        }
        for (const k in buckets) {
          if (buckets[k] >= 2) score -= buckets[k] * 5;
        }
      }
    }
    return score;
  },

  // ============ RENDER ============
  render() {
    const members = Setup.getMembers();
    const memberById = new Map(members.map(m => [m.id, m]));
    const groupCount = this.computeGroupCount();

    // pool
    const pool = document.getElementById('pool');
    pool.innerHTML = '';
    const poolMembers = members.filter(m => this.assignment[m.id] === 'pool');
    poolMembers.forEach(m => pool.appendChild(this.buildChip(m)));
    document.getElementById('pool-count').textContent = poolMembers.length + '人';

    // groups
    const area = document.getElementById('groups-area');
    area.innerHTML = '';
    for (let i = 0; i < groupCount; i++) {
      const gmems = members.filter(m => this.assignment[m.id] === String(i));
      area.appendChild(this.buildGroupCard(i, gmems));
    }
    this.applyLayout();
    this.attachDnD();
  },

  buildGroupCard(idx, members) {
    const wrap = document.createElement('div');
    wrap.className = 'group color-' + (idx % 8) + ' dropzone';
    wrap.dataset.group = idx;

    const header = document.createElement('div');
    header.className = 'group-header';

    const nameInput = document.createElement('input');
    nameInput.className = 'group-name';
    nameInput.type = 'text';
    nameInput.placeholder = `グループ${idx + 1}`;
    nameInput.value = this.groupNames[idx] || '';
    nameInput.addEventListener('change', () => {
      const v = nameInput.value.trim();
      if (v) this.groupNames[idx] = v;
      else delete this.groupNames[idx];
      Storage.saveGroupNames(this.groupNames);
    });

    const count = document.createElement('span');
    count.className = 'group-count';
    count.textContent = members.length;
    count.title = members.length + '人';

    header.appendChild(nameInput);
    header.appendChild(count);
    wrap.appendChild(header);

    const ul = document.createElement('div');
    ul.className = 'group-members';
    members.forEach(m => ul.appendChild(this.buildChip(m)));
    wrap.appendChild(ul);

    return wrap;
  },

  buildChip(member) {
    const chip = document.createElement('div');
    chip.className = 'card-chip';
    chip.dataset.id = member.id;
    chip.draggable = true;

    const nm = document.createElement('span');
    nm.className = 'chip-name';
    nm.textContent = member.name;
    nm.title = '名前をタップで変更';

    const x = document.createElement('button');
    x.className = 'chip-x';
    x.textContent = '×';
    x.title = '未配置へ戻す';
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.assignment[member.id] === 'pool') return;
      this.assignment[member.id] = 'pool';
      this.render();
    });

    chip.appendChild(nm);
    chip.appendChild(x);
    return chip;
  },

  // ============ DnD + click-to-rename ============
  attachDnD() {
    document.querySelectorAll('#groups .card-chip').forEach(chip => {
      this.attachChipHandlers(chip);
    });
    document.querySelectorAll('#groups .dropzone').forEach(zone => {
      this.attachDropHandlers(zone);
    });
  },

  attachChipHandlers(chip) {
    let dragStarted = false;

    // ----- name click to edit -----
    chip.querySelector('.chip-name').addEventListener('click', (e) => {
      e.stopPropagation();
      this.startRename(chip);
    });

    // ----- HTML5 drag (mouse) -----
    chip.addEventListener('dragstart', (e) => {
      dragStarted = true;
      chip.classList.add('dragging');
      e.dataTransfer.setData('text/plain', chip.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      dragStarted = false;
    });

    // ----- touch DnD (custom) -----
    let touchData = null;
    chip.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchData = {
        startX: t.clientX,
        startY: t.clientY,
        clone: null,
        moved: false,
      };
    }, { passive: true });

    chip.addEventListener('touchmove', (e) => {
      if (!touchData) return;
      const t = e.touches[0];
      const dx = t.clientX - touchData.startX;
      const dy = t.clientY - touchData.startY;
      if (!touchData.moved && Math.hypot(dx, dy) > 8) {
        touchData.moved = true;
        // start drag clone
        const clone = chip.cloneNode(true);
        clone.classList.add('drag-clone');
        clone.style.left = t.clientX + 'px';
        clone.style.top = t.clientY + 'px';
        document.body.appendChild(clone);
        chip.classList.add('dragging');
        touchData.clone = clone;
      }
      if (touchData.moved) {
        touchData.clone.style.left = t.clientX + 'px';
        touchData.clone.style.top = t.clientY + 'px';
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        touchData.clone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        touchData.clone.style.display = '';
        const zone = el ? el.closest('#groups .dropzone, #pool') : null;
        if (zone) zone.classList.add('drag-over');
        e.preventDefault();
      }
    }, { passive: false });

    chip.addEventListener('touchend', (e) => {
      if (!touchData) return;
      const moved = touchData.moved;
      if (moved) {
        const t = e.changedTouches[0];
        touchData.clone.style.display = 'none';
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const zone = el ? el.closest('#groups .dropzone, #pool') : null;
        touchData.clone.remove();
        chip.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        if (zone) {
          const tg = zone.dataset.group !== undefined ? zone.dataset.group : 'pool';
          this.assignment[chip.dataset.id] = tg;
          this.render();
        }
      } else {
        // treat as tap → if on name area, edit
        const target = e.target;
        if (target && target.classList.contains('chip-name')) {
          this.startRename(chip);
        }
      }
      touchData = null;
    });

    chip.addEventListener('touchcancel', () => {
      if (touchData && touchData.clone) touchData.clone.remove();
      chip.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      touchData = null;
    });
  },

  attachDropHandlers(zone) {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', (e) => {
      if (e.target === zone) zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      const target = zone.dataset.group !== undefined ? zone.dataset.group : 'pool';
      this.assignment[id] = target;
      this.render();
    });
  },

  startRename(chip) {
    const nm = chip.querySelector('.chip-name');
    if (nm.classList.contains('editing')) return;
    const id = chip.dataset.id;
    const original = nm.textContent;
    nm.classList.add('editing');
    nm.contentEditable = 'true';
    nm.spellcheck = false;
    chip.draggable = false;
    // focus + select
    nm.focus();
    const range = document.createRange();
    range.selectNodeContents(nm);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finish = (commit) => {
      nm.classList.remove('editing');
      nm.contentEditable = 'false';
      chip.draggable = true;
      nm.removeEventListener('keydown', onKey);
      nm.removeEventListener('blur', onBlur);
      if (commit) {
        const newName = nm.textContent.trim();
        if (newName && newName !== original) {
          Setup.renameMember(id, newName);
        } else {
          nm.textContent = original;
        }
      } else {
        nm.textContent = original;
      }
    };
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    };
    const onBlur = () => finish(true);
    nm.addEventListener('keydown', onKey);
    nm.addEventListener('blur', onBlur);
  },
};

/* utils */
function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
