document.addEventListener('DOMContentLoaded', () => {
  Setup.init();
  Groups.init();

  // top tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tab));
      if (tab === 'groups') Groups.refreshFromSetup();
    });
  });
});
