import { successAlert } from "../alert.js";

const addDriverForm = document.getElementById("addDriverForm");
const name = document.getElementById("name");
const license_no = document.getElementById("license_no");
const contact_no = document.getElementById("contact_no");
const address = document.getElementById("address");

name.addEventListener("keypress", () => {
    name.classList.remove("is-invalid");
})
license_no.addEventListener("keypress", () => {
    license_no.classList.remove("is-invalid");
})
contact_no.addEventListener("keypress", () => {
    contact_no.classList.remove("is-invalid");
})
address.addEventListener("keypress", () => {
    address.classList.remove("is-invalid");
})

addDriverForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const contactRegex = /^[6-9]\d{9}$/;

    if (name.value === "") {
        name.focus();
        name.classList.add("is-invalid");
        return
    }
    if (license_no.value === "") {
        license_no.focus();
        license_no.classList.add("is-invalid");
        return
    }
    if (contact_no.value === "") {
        contact_no.focus();
        contact_no.classList.add("is-invalid");
        return

    } else if (!contactRegex.test(contact_no.value)) {
        contact_no.focus();
        contact_no.classList.add("is-invalid");
        return
    }

    if (address.value === "") {
        address.focus();
        address.classList.add("is-invalid");
        return
    }



    const formData = new FormData(addDriverForm);

    fetch("/driver/addDriver", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {

            if (data.code / 100 >= 3 || !data.success) {
                successAlert(data.message, "error");
                return;
            }

            if (data.success) {
                window.location.href = "/driver";
                return;
            }
        })

})