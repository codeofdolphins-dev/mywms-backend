import { successAlert } from "../alert.js";

const loginForm = document.getElementById("loginForm");
const check_box = document.getElementById("check_box");


check_box.addEventListener("click", () => {
    check_box.classList.remove("is-invalid");
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const password = document.getElementById("password");
    const email = document.getElementById("email");

    if(email.value === ""){
        email.focus();
        return;
    }
    if(password.value === ""){
        password.focus();
        return;
    }

    if(!check_box.checked){
        check_box.classList.add("is-invalid");
        return;
    }
    

    const formData = new FormData(loginForm);

    fetch("/auth/login", {
        method: "POST",
        body: formData        
    })
    .then(data => data.json())
    .then(data => {

        if(data.code === 401){
            successAlert(data.message, "error");
            password.value = "";
            password.focus();
            return;
        }

        if(!data.success){
            successAlert(data.message, "error");
            return;
        }
        
        if(data.success){
            window.location.href = "/";
        }
    });
});