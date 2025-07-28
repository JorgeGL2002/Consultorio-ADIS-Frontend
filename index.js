function abrirVentana() {
    window.location.href = '/crear_cuenta.html';
}

function abrirVentanaRC() {
    window.location.href = '/recuperar_contraseña.html';
}

function abrirVentanaA() {
    window.location.href = 'citas/agenda.html';
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/trabajadoresActivos")
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById("trabajador");
            select.innerHTML = "<option value='' disabled selected>Usuario</option>";

            data.forEach(trabajador => {
                const option = document.createElement("option");
                option.value = trabajador;
                option.textContent = trabajador;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al cargar trabajadores:", error);
            document.getElementById("trabajador").innerHTML =
                "<option value=''>Error al cargar trabajadores</option>";
        });
});

function mostrarAlerta(tipo, mensaje, recargar = false) {
    const iconos = {
        success: "check-circle-fill",
        warning: "exclamation-triangle-fill",
        danger: "exclamation-triangle-fill",
        info: "info-fill"
    };

    const colores = {
        success: "text-success",
        warning: "text-warning",
        danger: "text-danger",
        info: "text-info"
    };

    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} alert-dismissible fade show d-flex align-items-center mt-2`;
    alerta.style.maxWidth = "800px";
    alerta.style.fontSize = "0.9rem";
    alerta.style.wordWrap = "break-word";

    alerta.innerHTML = `
    <svg class="bi flex-shrink-0 me-2 ${colores[tipo]}" width="20" height="20" role="img" aria-label="${tipo}">
        <use xlink:href="#${iconos[tipo]}"/>
    </svg>
    <div>${mensaje}</div>
    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

    document.getElementById("alertContainer").appendChild(alerta);

    setTimeout(() => {
        alerta.classList.remove("show");
        alerta.classList.add("hide");
        setTimeout(() => alerta.remove(), 500);
        if (recargar) window.location.href = 'citas/agenda.html';
    }, 3000);
}


document.querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const trabajador = document.getElementById("trabajador").value;
    const contraseña = document.getElementById("password").value;

    if (!trabajador || !contraseña) {
        mostrarAlerta("warning", "Completa todos los campos para continuar", false);
        return;
    }

    try {
        console.log("🟡 Enviando datos:", {
            usuario: trabajador,
            contraseña: contraseña
        });
        const response = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario: trabajador,
                contraseña: contraseña
            }),
        });
        const data = await response.json();
        if (data.success) {
            mostrarAlerta("success", `Bienvenido de nuevo ${data.usuario}`, true);
            localStorage.setItem("id", data.id_trabajador);
            localStorage.setItem("rol", data.rol);
            localStorage.setItem("usuario", data.usuario);
            localStorage.setItem("email", data.email);
            console.log("🟢 Inicio de sesión exitoso:", data);
        } else {
            console.log(trabajador, contraseña);
            mostrarAlerta("warning", "Usuario o contraseña incorrectos", false);
        }
    } catch (err) {
        console.error("Error:", err);
        mostrarAlerta("danger", "Error al iniciar sesión",false);
    }
});
