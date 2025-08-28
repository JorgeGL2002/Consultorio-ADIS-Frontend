function abrirVentanaA() {
    window.location.href = 'citas/agenda.html';
}

function abrirVentanaHC() {
    window.location.href = 'historias_clinicas/hc.html';
}

function abrirVentanaP() {
    window.location.href = 'pacientes/pacientesmain.html';
}

function abrirVentanaR() {
    window.location.href = 'reportes/reportes.html';
}


function cargarServicios(idSelect) {
    const select = document.getElementById(idSelect);
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/servicios")
        .then(r => r.json())
        .then(data => {
            select.innerHTML = "<option value='' disabled selected>Selecciona un servicio</option>";
            data.forEach(s => {
                const option = new Option(s, s);
                select.appendChild(option);
            });
        }).catch(() => {
            select.innerHTML = "<option>Error al cargar</option>";
        });
}

function cargarSeguros(idSelect) {
    const select = document.getElementById(idSelect);
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/seguros")
        .then(r => r.json())
        .then(data => {
            select.innerHTML = "<option value='' disabled selected>Selecciona una empresa</option>";
            data.forEach(s => {
                const option = new Option(s, s);
                select.appendChild(option);
            });
        }).catch(() => {
            select.innerHTML = "<option>Error al cargar</option>";
        });
}

function mostrarAlerta(tipo, mensaje) {
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
    alerta.style.paddingTop = "70px";

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
    }, 3000);
}

function cargarTrabajadores(idSelect) {
    const select = document.getElementById(idSelect);
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/trabajadoresActivosId")
        .then(r => r.json())
        .then(data => {
            select.innerHTML = "<option value='' disabled selected>Selecciona un trabajador</option>";
            data.forEach(t => {
                const option = new Option(t.nombre, t.id); // value = id, texto = nombre
                select.appendChild(option);
            });
        })
        .catch(() => {
            select.innerHTML = "<option>Error al cargar</option>";
        });
}

function cargarNotas(idSelect) {
    const select = document.getElementById(idSelect);
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/notas")
        .then(r => r.json())
        .then(data => {
            select.innerHTML = "<option value='' disabled selected>Selecciona una nota</option>";
            data.forEach(nota => {
                const option = new Option(nota.titulo, nota.id); // mostrar titulo, pero guardar el id
                select.appendChild(option);
            });
            console.log("Notas encontradas: ", data);
            console.log("Select notas: ", select);
        })
        .catch(() => {
            mostrarAlerta("danger", "Error al cargar las notas");
            select.innerHTML = "<option>Error al cargar</option>";
        });
}

function abrirModalNuevoUsuario() {
    const modal = new bootstrap.Modal(document.getElementById("modalUsuario"));
    modal.show();
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("ID del usuario: " + localStorage.getItem("id"));
    const idUsuario = localStorage.getItem("id");
    cargarSeguros("seguros");
    cargarServicios("servicios");
    cargarTrabajadores("trabajador");
    cargarNotas("notas");

    document.getElementById("formServicio").addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombreServicio = document.getElementById("nombreServicio").value.trim();
        const notasServicio = document.getElementById("notasServicio").value.trim();
        if (!nombreServicio) {
            mostrarAlerta("warning", "El nombre del servicio es obligatorio");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/nuevoServicio?nombreServicio=${encodeURIComponent(nombreServicio)}&causaConsulta=${encodeURIComponent(notasServicio)}`, {
                method: "POST"
            });
            if (!response.ok) throw new Error("Error al crear el servicio");
            mostrarAlerta("success", "Servicio creado correctamente");
            cargarServicios("servicios");
            document.getElementById("formServicio").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al crear el servicio:", error);
            mostrarAlerta("danger", "Error al crear el servicio");
        }
    });

    document.getElementById("formEmpresa").addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombreEmpresa = document.getElementById("nombreEmpresa").value.trim();
        const notasEmpresa = document.getElementById("notasEmpresa").value.trim();
        if (!nombreEmpresa) {
            mostrarAlerta("warning", "El nombre de la empresa es obligatorio");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/nuevoSeguro?nombre=${encodeURIComponent(nombreEmpresa)}&notas=${encodeURIComponent(notasEmpresa)}`, {
                method: "POST"
            });
            if (!response.ok) throw new Error("Error al crear la empresa");
            mostrarAlerta("success", "Empresa creada correctamente");
            document.getElementById("formEmpresa").reset(); // Limpiar el formulario
            cargarSeguros("seguros");
        } catch (error) {
            console.error("Error al crear la empresa:", error);
            mostrarAlerta("danger", "Error al crear la empresa");
        }
    })

    document.getElementById("formNotas").addEventListener("submit", async (e) => {
        e.preventDefault();
        const titulo = document.getElementById("titulo").value.trim();
        const detalles = document.getElementById("detalles").value.trim(); // cambiar a detalle
        const fecha = document.getElementById("fecha").value.trim();
        const horaInicio = document.getElementById("horaInicio").value.trim();
        const horaFin = document.getElementById("horaFin").value.trim();
        const tipo = "ESPECIALISTA";
        const trabajador = document.getElementById("trabajador");
        if (trabajador.selectedOptions.length === 0) {
            mostrarAlerta("warning", "Selecciona un trabajador");
            return;
        }
        const trabajadoresSeleccionados = Array.from(trabajador.selectedOptions).map(opt => parseInt(opt.value));
        const id = localStorage.getItem("id");
        const body = {
            titulo,
            detalle: detalles,
            fecha,
            horaInicio,
            horaFin,
            tipo,
            idProfesionales: trabajadoresSeleccionados,
            creadoPor: id
        };
        try {
            const response = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/nuevaNota", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            console.log(JSON.stringify(body));
            if (!response.ok) throw new Error("Error al crear la nota");

            mostrarAlerta("success", "Nota agregada");
            document.getElementById("formNotas").reset();
            cargarNotas("notas");
        } catch (error) {
            console.error("Error al crear la nota:", error);
            mostrarAlerta("danger", "Error al crear la nota");
        }
    });

    document.getElementById("formBorrarEmpresa").addEventListener("submit", async (e) => {
        e.preventDefault();
        const seguroSeleccionado = document.getElementById("seguros").value.trim();
        if (!seguroSeleccionado) {
            mostrarAlerta("warning", "Selecciona una empresa");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eliminarSeguro?nombre=${encodeURIComponent(seguroSeleccionado)}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Error al borrar la empresa");
            mostrarAlerta("success", "Empresa borrada correctamente");
            cargarSeguros("seguros");
            document.getElementById("formBorrarEmpresa").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al borrar la empresa:", error);
            mostrarAlerta("danger", "Error al borrar la empresa");
        }
    });

    document.getElementById("formBorrarServicio").addEventListener("submit", async (e) => {
        e.preventDefault();
        const servicioSeleccionado = document.getElementById("servicios").value.trim();
        if (!servicioSeleccionado) {
            mostrarAlerta("warning", "Selecciona un servicio");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eliminarServicio?nombreServicio=${encodeURIComponent(servicioSeleccionado)}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Error al borrar el servicio");
            mostrarAlerta("success", "Servicio borrado correctamente");
            cargarServicios("servicios");
            document.getElementById("formBorrarServicio").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al borrar el servicio:", error);
            mostrarAlerta("danger", "Error al borrar el servicio");
        }
    });

    document.getElementById("formEliminarNota").addEventListener("submit", async (e) => {
        e.preventDefault();
        const notaSeleccionado = document.getElementById("notas").value.trim();
        if (!notaSeleccionado) {
            mostrarAlerta("warning", "Selecciona una nota");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eliminarNota?id=${encodeURIComponent(notaSeleccionado)}`, {
                method: "PUT"
            });
            if (!response.ok) throw new Error("Error al borrar la nota");
            mostrarAlerta("success", "Nota borrada correctamente");
            cargarNotas("notas");
            document.getElementById("formEliminarNota").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al borrar la nota:", error);
            mostrarAlerta("danger", "Error al borrar la nota");
        }
    });

    document.getElementById("nuevoUsuariobtn").addEventListener("click", () => {
        abrirModalNuevoUsuario();
    });

    document.getElementById("formCrearCuenta").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre");
        const email = document.getElementById("email");
        const contraseña = document.getElementById("password");
        const confirmar = document.getElementById("confirmar");
        const rol = document.getElementById("rol");
       
        if (!email.value.trim() || !nombre.value.trim() || !contraseña.value.trim() || !confirmar.value.trim() || !rol.value.trim()) {
            mostrarAlerta("warning", "Completa todos los campos", false);
            return;
        }

        if (contraseña.value.length < 8) {
            mostrarAlerta("warning", "La contraseña debe tener minimo 8 caracteres", false);
        }

        if (contraseña.value !== confirmar.value) {
            mostrarAlerta("warning", "Las contraseñas no coinciden", false);
            return;
        }

        try {
            const res = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/registrar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Admin-Id": idUsuario
                },
                body: JSON.stringify({
                    usuario: nombre.value.trim(),
                    nombre: nombre.value.trim(),
                    email: email.value.trim(),
                    contraseña: contraseña.value,
                    rol: rol.value
                })
            });
            if (res.ok) {
                mostrarAlerta("success", "Cuenta registrada", true);
                // Cerrar modal con JS
                const modal = bootstrap.Modal.getInstance(document.getElementById("modalUsuario"));
                modal.hide();
            } else {
                mostrarAlerta("warning", "Error al registrar: ", false);
            }
        } catch (error) {
            mostrarAlerta("danger", "Error del servidor", false);
        }
    });

    const botonesCollapse = document.querySelectorAll('[data-bs-toggle="collapse"]');
    botonesCollapse.forEach(boton => {
        boton.addEventListener("click", e => {
            e.preventDefault();
            const targetId = boton.getAttribute("data-bs-target");
            const targetElement = document.querySelector(targetId);

            // Cerrar todos los elementos collapse visibles excepto el actual
            document.querySelectorAll(".collapse.show").forEach(collapse => {
                if (collapse !== targetElement) {
                    const bsCollapse = bootstrap.Collapse.getInstance(collapse);
                    bsCollapse?.hide();
                }
            });

            // Alternar el colapso del botón presionado
            const bsCollapse = bootstrap.Collapse.getOrCreateInstance(targetElement);
            bsCollapse.toggle();
        });
    });
});