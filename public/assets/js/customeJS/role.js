import { confirmation, successAlert } from "./alert.js";

const addRole = document.getElementById("addRole");
const openModalBtn = document.getElementById("openModalBtn");
const newRole = document.getElementById("newRole");
const roleId = document.getElementById("id");



document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('tbody');

    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const confirmed = await confirmation("Delete");

            if (confirmed) {
                fetch(`/role/deleteRole?id=${id}`)
                .then(res => res.json())
                .then(data => {

                    if(!data.success){
                        successAlert(data.message, "error");
                        return;
                    };

                    successAlert(data.message);
                    window.location.reload();
                    return;
                })
            }
        }
        if (e.target.classList.contains('edit-btn')) {
            const submitBtn = document.getElementById("submitBtn");

            const id = e.target.dataset.id;

            fetch(`/role/editRole?id=${id}`)
            .then(res => res.json())
            .then(data => {

                console.log(data);

                if (!data.success) {
                    successAlert(data.message, "error");
                    return;
                };
                if (data.success) {
                    newRole.value = data.data.role;
                    roleId.value = parseInt(data.data.id, 10);

                    submitBtn.innerText = "Update";


                    openModalBtn.click();
                    return;
                };
            })
        }
    });
});

addRole.addEventListener("submit", (e) => {
    e.preventDefault();

    if (roleId.value.trim() === "") {
        // NEW
        console.log("new");
        console.log(roleId.value);

        const formData = new FormData(addRole);

        fetch("/role/addRole", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.code / 100 >= 3 || !data.success) {
                successAlert(data.message, "error");
                return;
            }

            successAlert(data.message);
            window.location.reload();
            return;
        });

    } else {
        // EDIT
        console.log("edit");
        console.log(roleId.value);

        const formData = new FormData(addRole);

        fetch("/role/editRole", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.code / 100 >= 3 || !data.success) {
                successAlert(data.message, "error");
                return;
            }

            successAlert(data.message);
            window.location.reload();
            return
        });
    }
});
