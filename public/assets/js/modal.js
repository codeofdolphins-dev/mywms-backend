document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('myModal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const closeFooterBtn = document.getElementById('modalCloseFooter');
  const newRole = document.getElementById('newRole');
  const submitBtn = document.getElementById('submitBtn');

  const closeModal = () => {
    modal.classList.remove('active');
    newRole.value = "";
  };

  openBtn?.addEventListener('click', () => modal.classList.add('active'));
  closeBtn?.addEventListener('click', closeModal);
  closeFooterBtn?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  submitBtn.addEventListener("click", () => {
    setTimeout(() => closeModal(), 50);
  }
);
});
