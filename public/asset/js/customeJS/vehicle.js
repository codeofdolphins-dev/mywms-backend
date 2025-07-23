// public/js/main.js (module)
import { confirmation, successAlert } from './alert.js';

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('tbody');

    // ✅ Use event delegation for clicks on Delete buttons
    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const confirmed = await confirmation("Delete");
            if (confirmed) {
                fetch(`/vehicle/deleteVehicle?id=${id}`)
                .then(res => res.json())
                .then(data => {

                    if(!data.success){
                        successAlert(data.message, "error");
                        return;
                    };
                    if(data.success){
                        successAlert(data.message);
                        window.location.reload();
                    };
                })
            }
        }
    });
});
