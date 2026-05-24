const Manual = {
  groupCount: 4,
  assignment: {},

  init() {
    document.getElementById('manual-rebuild-btn').addEventListener('click', () => this.rebuild());
    document.getElementById('manual-reset-btn').addEventListener('click', () => this.reset());
    document.getElementById('manual-auto-fill-btn').addEventListener('click', () => this.autoFill());
    this.rebuild();
  },

  refresh() {
    const members = Setup.getMembers();
    const known = new Set(members.map(m => m.id));
    for (const id of Object.keys(this.assignment)) {
      if (!known.has(id)) delete this.assignment[id];
    }
    for (const m of members) {
      if (!(m.id in this.assignment)) this.assignment[m.id] = 'pool';
    }
    this.render();
  },

  rebuild() {
    const n = parseInt(document.getElementById('manual-group-count').value, 10) || 1;
    this.groupCount = Math.max(1, n);
    const members = Setup.getMembers();
    this.assignment = {};
    for (const m of members) this.assignment[m.id] = 'pool';
    this.render();
  },

  reset() {
    const members = Setup.getMembers();
    for (const m of members) this.assignment[m.id] = 'pool';
    this.render();
  },

  autoFill() {
    const members = Setup.getMembers();
    const pool = members.filter(m => this.assignment[m.id] === 'pool');
    const sizes = [];
    for (let i = 0; i < this.groupCount; i++) {
      sizes[i] = members.filter(m => this.assignment[m.id] === String(i)).length;
    }
    const shuffled = shuffleArr(pool);
    for (const m of shuffled) {
      let minIdx = 0;
      for (let i = 1; i < this.groupCount; i++) {
        if (sizes[i] < sizes[minIdx]) minIdx = i;
      }
      this.assignment[m.id] = String(minIdx);
      sizes[minIdx]++;
    }
    this.render();
  },

  render() {
    const members = Setup.getMembers();
    const pool = document.getElementById('pool');
    pool.innerHTML = '';
    members.filter(m => this.assignment[m.id] === 'pool').forEach(m => {
      pool.appendChild(buildChip(m, true));
    });

    const groupsArea = document.getElementById('manual-groups');
    groupsArea.innerHTML = '';
    for (let i = 0; i < this.groupCount; i++) {
      const members_i = members.filter(m => this.assignment[m.id] === String(i));
      const card = buildGroupCard(i, members_i, { editableName: true, draggable: true });
      card.classList.add('dropzone');
      groupsArea.appendChild(card);
    }
    this.attachDnD();
  },

  attachDnD() {
    document.querySelectorAll('#manual .card-chip').forEach(chip => {
      attachDragHandlers(chip);
    });
    document.querySelectorAll('#manual .dropzone, #pool').forEach(zone => {
      attachDropHandlers(zone, (id, targetGroup) => {
        this.assignment[id] = targetGroup;
        this.render();
      });
    });
  },
};

/* ===== drag & drop (mouse + touch) ===== */
let dragState = null;

function attachDragHandlers(chip) {
  chip.addEventListener('dragstart', (e) => {
    chip.classList.add('dragging');
    e.dataTransfer.setData('text/plain', chip.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  chip.addEventListener('dragend', () => {
    chip.classList.remove('dragging');
  });

  chip.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const clone = chip.cloneNode(true);
    clone.classList.add('drag-clone');
    clone.style.left = t.clientX + 'px';
    clone.style.top = t.clientY + 'px';
    document.body.appendChild(clone);
    chip.classList.add('dragging');
    dragState = { chip, clone, id: chip.dataset.id };
    e.preventDefault();
  }, { passive: false });

  chip.addEventListener('touchmove', (e) => {
    if (!dragState) return;
    const t = e.touches[0];
    dragState.clone.style.left = t.clientX + 'px';
    dragState.clone.style.top = t.clientY + 'px';

    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragState.clone.style.display = 'none';
    const el = document.elementFromPoint(t.clientX, t.clientY);
    dragState.clone.style.display = '';
    const zone = el ? el.closest('.dropzone, #pool') : null;
    if (zone) zone.classList.add('drag-over');
    e.preventDefault();
  }, { passive: false });

  chip.addEventListener('touchend', (e) => {
    if (!dragState) return;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    dragState.clone.style.display = 'none';
    const el = t ? document.elementFromPoint(t.clientX, t.clientY) : null;
    const zone = el ? el.closest('.dropzone, #pool') : null;
    dragState.clone.remove();
    dragState.chip.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    if (zone) {
      const target = zone.dataset.group !== undefined ? zone.dataset.group : 'pool';
      const id = dragState.id;
      dragState = null;
      Manual.assignment[id] = target;
      Manual.render();
    } else {
      dragState = null;
    }
  });

  chip.addEventListener('touchcancel', () => {
    if (!dragState) return;
    dragState.clone.remove();
    dragState.chip.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragState = null;
  });
}

function attachDropHandlers(zone, onDrop) {
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
    onDrop(id, target);
  });
}
