const Random = {
  mode: 'by-groups',
  lastGroups: null,

  init() {
    this.lastGroups = Storage.loadLastGroups();

    document.querySelectorAll('#random .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#random .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
        document.getElementById('by-groups-row').classList.toggle('hidden', this.mode !== 'by-groups');
        document.getElementById('by-size-row').classList.toggle('hidden', this.mode !== 'by-size');
      });
    });

    document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffle());
  },

  shuffle() {
    const members = Setup.getMembers();
    if (members.length === 0) {
      alert('先に「初期設定」でメンバーを登録してください。');
      return;
    }

    let groupCount;
    if (this.mode === 'by-groups') {
      groupCount = parseInt(document.getElementById('group-count').value, 10) || 1;
    } else {
      const size = parseInt(document.getElementById('group-size').value, 10) || 2;
      groupCount = Math.max(1, Math.ceil(members.length / size));
    }
    if (groupCount > members.length) groupCount = members.length;

    const mixGender = document.getElementById('mix-gender').checked;
    const avoidLast = document.getElementById('avoid-last').checked;

    const groups = this.assign(members, groupCount, { mixGender, avoidLast });
    this.renderGroups(groups);

    Storage.saveLastGroups(groups);
    this.lastGroups = groups.map(g => g.map(m => m.id));
  },

  assign(members, groupCount, opts) {
    const attempts = 60;
    let best = null;
    let bestScore = -Infinity;

    for (let a = 0; a < attempts; a++) {
      const groups = this.assignOnce(members, groupCount, opts);
      const score = this.scoreGroups(groups, opts);
      if (score > bestScore) {
        bestScore = score;
        best = groups;
        if (score === 0) break;
      }
    }
    return best;
  },

  assignOnce(members, groupCount, opts) {
    const groups = Array.from({ length: groupCount }, () => []);

    if (opts.mixGender) {
      const males = shuffleArr(members.filter(m => m.gender === 'M'));
      const females = shuffleArr(members.filter(m => m.gender === 'F'));
      const others = shuffleArr(members.filter(m => !m.gender));
      this.distributeRoundRobin(males, groups);
      this.distributeRoundRobin(females, groups);
      this.distributeRoundRobin(others, groups);
    } else {
      const all = shuffleArr(members.slice());
      this.distributeBalanced(all, groups);
    }
    return groups;
  },

  distributeRoundRobin(list, groups) {
    for (const m of list) {
      const minSize = Math.min(...groups.map(g => g.length));
      const candidates = [];
      groups.forEach((g, i) => { if (g.length === minSize) candidates.push(i); });
      const gi = candidates[Math.floor(Math.random() * candidates.length)];
      groups[gi].push(m);
    }
  },

  distributeBalanced(list, groups) {
    this.distributeRoundRobin(list, groups);
  },

  scoreGroups(groups, opts) {
    let score = 0;
    if (opts.avoidLast && this.lastGroups) {
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
    if (opts.mixGender) {
      for (const g of groups) {
        const mCount = g.filter(m => m.gender === 'M').length;
        const fCount = g.filter(m => m.gender === 'F').length;
        if ((mCount === 0 && fCount > 0) || (fCount === 0 && mCount > 0)) {
          const total = mCount + fCount;
          if (total >= 2) score -= 3;
        }
      }
    }
    return score;
  },

  renderGroups(groups) {
    const area = document.getElementById('random-result');
    area.innerHTML = '';
    groups.forEach((members, i) => {
      area.appendChild(buildGroupCard(i, members, { editableName: true, draggable: false }));
    });
  },
};

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGroupCard(idx, members, opts) {
  const wrap = document.createElement('div');
  wrap.className = 'group';
  wrap.dataset.group = idx;

  const header = document.createElement('div');
  header.className = 'group-header';

  const nameInput = document.createElement('input');
  nameInput.className = 'group-name';
  nameInput.type = 'text';
  nameInput.placeholder = `グループ${idx + 1}`;
  nameInput.value = '';

  const count = document.createElement('span');
  count.className = 'group-count';
  count.textContent = members.length + '人';

  header.appendChild(nameInput);
  header.appendChild(count);
  wrap.appendChild(header);

  const ul = document.createElement('div');
  ul.className = 'group-members';
  members.forEach(m => ul.appendChild(buildChip(m, opts && opts.draggable)));
  wrap.appendChild(ul);

  return wrap;
}

function buildChip(member, draggable) {
  const chip = document.createElement('div');
  chip.className = 'card-chip';
  chip.dataset.id = member.id;

  const dot = document.createElement('span');
  dot.className = 'gender-dot ' + (member.gender || 'none');
  const nm = document.createElement('span');
  nm.className = 'chip-name';
  nm.textContent = member.name;

  chip.appendChild(dot);
  chip.appendChild(nm);

  if (draggable) {
    chip.draggable = true;
  }
  return chip;
}
