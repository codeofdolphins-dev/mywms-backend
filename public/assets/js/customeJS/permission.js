import { confirmation, successAlert } from "./alert.js";

const addPermission = document.getElementById("addPermission");
const openModalBtn = document.getElementById("openModalBtn");
const moduleInput = document.getElementById("module");
const permissionType = document.getElementById("permissionType");
const permissionId = document.getElementById("id");



document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('tbody');

    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const confirmed = await confirmation("Delete");

            if (confirmed) {
                fetch(`/permission/deletePermission?id=${id}`)
                    .then(res => res.json())
                    .then(data => {

                        if (!data.success) {
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

            fetch(`/permission/editPermission?id=${id}`)
                .then(res => res.json())
                .then(data => {

                    console.log(data);

                    if (!data.success) {
                        successAlert(data.message, "error");
                        return;
                    };
                    if (data.success) {
                        moduleInput.value = data.data.permission.split(":")[0];
                        permissionType.value = data.data.permission.split(":")[1];
                        permissionId.value = parseInt(data.data.id, 10);

                        submitBtn.innerText = "Update";


                        openModalBtn.click();
                        return;
                    };
                })
        }
    });
});

addPermission.addEventListener("submit", (e) => {
    e.preventDefault();

    if (permissionId.value.trim() === "") {
        // NEW
        console.log("new");

        const formData = new FormData(addPermission);

        fetch("/permission/addPermission", {
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
        console.log(permissionId.value);

        const formData = new FormData(addPermission);

        fetch("/permission/editPermission", {
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
