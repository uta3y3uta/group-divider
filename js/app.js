document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
  Rules.init();
  Groups.init();
  History.init();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tab));
      if (tab === 'groups') Groups.refreshFromSettings();
      if (tab === 'history') History.render();
    });
  });
});
