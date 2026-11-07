/* Preview the future purchase flow without collecting data or creating a subscription. */
(() => {
  const dialog = document.querySelector('#checkout-preview');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let opener;
  document.querySelectorAll('[data-checkout-preview]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (dialog.open) return;
      opener = button;
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-close-preview]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
})();
