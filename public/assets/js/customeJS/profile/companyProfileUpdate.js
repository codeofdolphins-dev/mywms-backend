import { successAlert } from "../alert.js";

const companyDetailsForm = document.getElementById("companyDetailsForm");
const c_passHeader = document.getElementById("c_passHeader");

const pass = document.getElementById("pass");
const c_pass = document.getElementById("c_pass");


c_pass.addEventListener("keyup", () => {
    if(pass.value !== c_pass.value){
        c_passHeader.classList.add("has-error");
        return;
    }else{
        c_passHeader.classList.remove("has-error");
        return;
    }
});

pass.addEventListener("keypress", () => {
    if(c_pass !== ""){
        c_pass.value = "";
        return;
    }
})

companyDetailsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(companyDetailsForm);

    fetch("/company/updateCompany", {
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
            return;
        };
    })
    .catch(err => {
        console.log(err);
        return;
    });
});