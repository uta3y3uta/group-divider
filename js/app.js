document.addEventListener('DOMContentLoaded', () => {
  Setup.init();
  Random.init();
  Manual.init();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tab));
      if (tab === 'manual') Manual.refresh();
    });
  });
});
