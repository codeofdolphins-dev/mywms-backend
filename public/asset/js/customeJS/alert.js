const successAlert = (message = "Login Successfull.", icon = "success") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  Toast.fire({
    icon,
    title: message,
  });
};

const confirmation = async (text = 'Logout') => {
    const result = await Swal.fire({
        title: "Are you sure?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#cc0000",
        cancelButtonColor: "#3085d6",
        confirmButtonText: text
    })

  return result.isConfirmed;
};

export { successAlert, confirmation };