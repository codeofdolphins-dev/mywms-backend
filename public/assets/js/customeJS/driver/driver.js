import { confirmation, successAlert } from '../alert.js';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('tbody');

    // ✅ Use event delegation for delete buttons (with correct selector)
    tableBody.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.btn-delete'); // fixed selector

        if (!deleteBtn) return;

        const id = deleteBtn.dataset.id; // always get from button
        if (!id) return;

        const confirmed = await confirmation("Delete");
        if (confirmed) {
            fetch(`/vehicle/deleteVehicle?id=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        successAlert(data.message, "error");
                        return;
                    }

                    successAlert(data.message);
                    window.location.reload();
                })
                .catch(err => {
                    successAlert("Something went wrong", "error");
                    console.error(err);
                });
        }
    });
});

