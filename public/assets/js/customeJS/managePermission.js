import { successAlert } from "./alert.js";

const allPermissionsForm = document.getElementById("allPermissionsForm");

allPermissionsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(allPermissionsForm);

    for (const [a, b] of formData) {
        console.log(a, b);        
    }

    fetch("/manage-permission/assignPermission", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        
        if(!data.success){
            successAlert(data.message, "error");
        }

        if(data.success){
            successAlert(data.message);
            setTimeout(() => {
                window.location.reload();
            }, 2000)
        }
    })

})