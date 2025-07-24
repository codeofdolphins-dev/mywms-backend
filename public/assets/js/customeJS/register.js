import { successAlert } from "./alert.js";

const registerForm = document.getElementById("registerForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const full_name = document.getElementById("full_name");
const check_box = document.getElementById("check_box");


check_box.addEventListener("click", () => {
    check_box.classList.remove("errorCircle");
});

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if(email.value === ""){
        email.focus();
        return;
    }
    if(full_name.value === ""){
        full_name.focus();
        return;
    }
    if(password.value === ""){
        password.focus();
        return;
    }
    if(!check_box.checked){
        check_box.classList.add("errorCircle");
        return;
    }


    const formData = new FormData(registerForm);

    fetch("/auth/register", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        
        if(data.code / 100 >= 3 || !data.success){
            successAlert(data.message, "error");
            return;
        };

        if(data.success){
            successAlert(data.message);
            window.location.href = "/";
        };
    })
    .catch(err => {
        console.log(err);        
    });
});