// public/js/main.js (module)
import { confirmation } from './alert.js';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('tbody');

    // ✅ Use event delegation for clicks on Delete buttons
    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const confirmed = await confirmation("Delete");
            if (confirmed) {
            }
        }

        if (e.target.classList.contains('edit-btn')) {
            
            const id = e.target.dataset.id;
            
            fetch(`/vehicle/editVehicle?id=${id}`)
        }
    });
});
