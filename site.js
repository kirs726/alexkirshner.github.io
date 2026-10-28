(() => {
  const form = document.querySelector('#inquiry-form');
  const type = document.querySelector('#inquiry-type');
  const status = document.querySelector('#contact-status');
  const address = ['alex', 'splitzoneduo.com'].join('@');
  const subjects = {
    partnership: 'Brand partnership inquiry',
    assignment: 'Writing assignment inquiry',
    other: 'Getting in touch',
  };

  form.hidden = false;
  document.querySelectorAll('[data-inquiry]').forEach(link => {
    link.addEventListener('click', () => { type.value = link.dataset.inquiry; });
  });
  document.querySelector('#copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address);
      status.textContent = 'Email address copied.';
    } catch (_) {
      const addressLink = document.createElement('a');
      addressLink.href = `mailto:${address}`;
      addressLink.textContent = address;
      status.replaceChildren('Copy this address: ', addressLink);
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity() || !subjects[type.value]) return;
    const draft = document.createElement('a');
    draft.href = `mailto:${address}?subject=${encodeURIComponent(subjects[type.value])}`;
    document.body.append(draft);
    draft.click();
    draft.remove();
  });
})();
