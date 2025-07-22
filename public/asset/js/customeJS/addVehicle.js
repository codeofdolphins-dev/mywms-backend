import { successAlert } from "./alert.js";

const addVehicle = document.getElementById("addVehicle");
const v_number = document.getElementById("v_number");

addVehicle.addEventListener("submit", (e) => {
    e.preventDefault();

    if(v_number.value === ""){
        v_number.focus();
        return;
    }

    const formData = new FormData(addVehicle);

    fetch("/vehicle/addVehicle", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {

        if(data.code / 100 >= 3){
            successAlert(data.message, "error");
            return;
        }

        if(data.success){
            window.location.href = "/vehicle";
            return;
        }
    })

})