import { successAlert } from "./alert.js";

const registerForm = document.getElementById("registerForm");

const c_name = document.getElementById("c_name");
const email = document.getElementById("email");
const ph_no = document.getElementById("ph_no");
const pass = document.getElementById("pass");
const c_pass = document.getElementById("c_pass");
const check_box = document.getElementById("check_box");


check_box.addEventListener("click", () => {
    check_box.classList.remove("is-invalid");
});


c_pass.addEventListener("keyup", () => {
    if(pass.value !== c_pass.value){
        c_pass.classList.add("is-invalid");
        return;
    }else{
        c_pass.classList.remove("is-invalid");
        return;
    }
});

pass.addEventListener("keypress", () => {
    if(c_pass !== ""){
        c_pass.value = "";
        return;
    }
})

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if(c_name.value === ""){
        c_name.focus();
        return;
    }
    if(email.value === ""){
        email.focus();
        return;
    }
    if(ph_no.value === ""){
        ph_no.focus();
        return;
    }
    if(pass.value === ""){
        pass.focus();
        return;
    }
    if(c_pass.value === ""){
        c_pass.focus();
        return;
    }
    if(!check_box.checked){
        check_box.classList.add("is-invalid");
        return;
    }


    const formData = new FormData(registerForm);

    fetch("/auth/companyRegister", {
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
            window.location.href = "/auth/login";
        };
    })
    .catch(err => {
        console.log(err);        
    });
});