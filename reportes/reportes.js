const nombre = localStorage.getItem("usuario");
const id = localStorage.getItem("id");
const rol = localStorage.getItem("rol");
function abrirVentanaP() {
    window.location.href = '../pacientes/pacientesmain.html';
}
function abrirVentanaA() {
    window.location.href = '../citas/agenda.html';
}
function abrirVentanaHC() {
    window.location.href = '../historias_clinicas/hc.html';
}

function abrirVentanaE() {
    window.location.href = '../eventos/eventos.html';
}

function abrirVentanaConfiguracion() {
    if (rol === "SUPER USUARIO" || id === "6") {
        window.location.href = '/configuracion.html';
    } else {
        mostrarAlerta("danger", "No tiene permisos para acceder a esta sección");
    }
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

function abrirNotificaciones() {
    const label = document.getElementById("cumpleaños");
    label.innerHTML = "";
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/notificaciones")
        .then(r => r.json())
        .then(data => {
            data.forEach(s => {
                label.innerHTML += `${s} <br>`;
            });
        }).catch(() => {
            label.innerHTML = "Error al cargar los cumpleaños";
        });
    const modal = new bootstrap.Modal(document.getElementById("modalNotificaciones"));
    modal.show();
}

function CerrarSesion() {
    window.location.href = '/index.html';
    localStorage.clear(); // Limpiar todos los datos almacenados en localStorage a8588c2 (Actualizacion urls):Citas/Agenda.js
}

function cargarTrabajadores(idSelect) {
    const select = document.getElementById(idSelect);
    if (rol === "ESPECIALISTA") {
        select.classList.add("d-none");
        return;
    }

    fetch("https://api-railway-production-24f1.up.railway.app/api/test/trabajadoresActivos")
        .then(r => r.json())
        .then(data => {
            select.innerHTML = "<option value='' disabled selected>Selecciona un trabajador</option>";
            data.forEach(t => {
                const option = new Option(t, t);
                select.appendChild(option);
            });
        })
        .catch(() => {
            select.innerHTML = "<option>Error al cargar</option>";
        });
}

async function getRolTrabajador(nombre) {
    console.log("Nombre del trabajador seleccionado:", nombre);

    if (!nombre || nombre === "Selecciona un trabajador") {
        mostrarAlerta("warning", "Debes seleccionar un trabajador válido");
        return null;
    }

    try {
        const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/getRol?nombreUsuario=${nombre}`);
        if (!res.ok) throw new Error("No se encontró al profesional");
        const data = await res.json();
        return data;
    } catch (e) {
        mostrarAlerta("danger", "Error al obtener ID del trabajador");
        console.error(e);
        return null;
    }
}

async function obtenerIdTrabajador(nombre) {
    console.log("Nombre del trabajador seleccionado:", nombre);

    if (!nombre || nombre === "Selecciona un trabajador") {
        mostrarAlerta("warning", "Debes seleccionar un trabajador válido");
        return null;
    }

    try {
        const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${nombre}`);
        if (!res.ok) throw new Error("No se encontró al profesional");
        const data = await res.json();
        return data;
    } catch (e) {
        mostrarAlerta("danger", "Error al obtener ID del trabajador");
        console.error(e);
        return null;
    }
}

function showFilters(reportType) {
    // Ocultar todos los filtros adicionales primero
    document.getElementById('personalFilters').style.display = 'none';
    document.getElementById('hcFilters').style.display = 'none';

    // Mostrar los filtros correspondientes
    if (reportType === 'personal') {
        if (rol !== "ESPECIALISTA") {
            document.getElementById('personalFilters').style.display = 'flex';
            cargarTrabajadores("trabajador");
        }
    } else if (reportType === 'records' && rol !== "ESPECIALISTA") {
        document.getElementById('hcFilters').style.display = 'flex';
    }
}

// Asignar eventos a las cards
document.querySelectorAll('.report-card').forEach(card => {
    card.addEventListener('click', function () {
        const type = this.dataset.type; // más limpio que buscar onclick
        if (type) {
            showFilters(type);
        }
    });
});

// Inicializar con el año actual
document.getElementById('year').value = new Date().getFullYear();

async function generateReport(reportType) {
    // Pacientes
    const nombrePaciente = document.getElementById('pacientesCPP')?.value || "";
    const nombrePacienteNE = document.getElementById('pacientesNEP')?.value || "";
    const nombrePacienteHC = document.getElementById('pacientesHEP')?.value || "";

    // Mes y año
    const month = document.getElementById('month')?.value;
    const year = document.getElementById('year')?.value;

    let permitidos;

    try {
        const params = new URLSearchParams();
        const urlBase = 'https://api-railway-production-24f1.up.railway.app/api/test';
        let url = urlBase;

        switch (reportType) {
            case 'monthly':
                if (!month || !year) {
                    mostrarAlerta("warning", "Debes seleccionar mes y año");
                    return;
                }
                if (rol === "ESPECIALISTA") {
                    mostrarAlerta("warning", "No tienes permisos para este reporte");
                    return;
                }
                params.append('mes', month);
                params.append('anio', year);
                url += '/reporteMensualCitas';
                break;
            case 'workers':
                if (rol !== "SUPER USUARIO") {
                    mostrarAlerta("warning", "No tienes permisos para este reporte");
                    return;
                }
                url += '/reporteTrabajadores';
                break;

            case 'patients':
                if (rol === "ESPECIALISTA") {
                    mostrarAlerta("warning", "No tienes permisos para este reporte");
                    return;
                }
                url += '/reportePacientes';
                break;

            case 'citaspatients':
                if (rol === "ESPECIALISTA") {
                    mostrarAlerta("warning", "No tienes permisos para este reporte");
                    return;
                }
                if (!nombrePaciente) {
                    mostrarAlerta("warning", "Debes buscar y escoger a un paciente primero");
                    return;
                }
                url += `/reporteCitasPorPaciente?nombrePaciente=${encodeURIComponent(nombrePaciente)}`;
                window.location.href = url;
                return;

            case 'notasEvolucion':
                if (!nombrePacienteNE) {
                    mostrarAlerta("warning", "Debes seleccionar un paciente");
                    return;
                }
                permitidos = empiezaCon(nombre, ['LTFR', 'Psic', 'LN']);
                if (rol === "ESPECIALISTA" || !permitidos) {
                    mostrarAlerta("warning", "No tienes permisos para este reporte");
                    return;
                }
                url += `/reportesNE?nombrePaciente=${encodeURIComponent(nombrePacienteNE)}`;
                window.location.href = url;
                return;

            case 'historiasClinicas':
                if (!nombrePacienteHC) {
                    mostrarAlerta("warning", "Debes seleccionar un paciente");
                    return;
                }
                permitidos = empiezaCon(nombre, ['LTFR']);
                if (rol === "ESPECIALISTA" || !permitidos) {
                    mostrarAlerta("warning", "No tienes permisos para este reporte");
                    return;
                }
                url += `/reportesHC?nombrePaciente=${encodeURIComponent(nombrePacienteHC)}`;
                window.location.href = url;
                return;
        }

        // Descargar el reporte
        const finalURL = params.toString().length > 0 ? `${url}?${params.toString()}` : url;
        window.location.href = finalURL;

    } catch (err) {
        console.error("Error generando el reporte:", err);
        mostrarAlerta("danger", "Error al generar el reporte");
    }
}


function empiezaCon(n, prefijos = []) {
    return prefijos.some(p => n.startsWith(p.toUpperCase()));
}

document.addEventListener("DOMContentLoaded", () => {
    const selectPrincipal = document.getElementById("trabajador");
    cargarTrabajadores("trabajador");
    console.log("Usuario:", nombre, "ID:", id, "Rol:", rol);

    if (selectPrincipal) {
        selectPrincipal.addEventListener("change", async () => {
            const nombreSelect = selectPrincipal.value.trim();
            if (!nombreSelect || nombreSelect.includes("Selecciona")) return;
            let getRol = getRolTrabajador(nombreSelect);
            getRolTrabajador(nombreSelect).then((rol) => {
                document.getElementById("rolInput").value = rol;
            });
            const selectedIdProfesional = await obtenerIdTrabajador(nombreSelect);
            console.log("ID del profesional seleccionado:", selectedIdProfesional);

            if (selectedIdProfesional) {
                localStorage.setItem("idSelectPrincipal", selectedIdProfesional);
            } else {
                mostrarAlerta("warning", "No se pudo obtener el ID del profesional seleccionado");
            }
        });
    }

    const modalNotificaciones = document.getElementById("modalNotificaciones");
    modalNotificaciones.addEventListener("hidden.bs.modal", async (event) => {
        const form = document.getElementById("formNotificaciones");
        form.reset();
    });

    const inputHEP = document.getElementById("pacientesHEP");
    const listaHEP = document.getElementById("sugerenciasHEP");
    const inputNEP = document.getElementById("pacientesNEP");
    const listaNEP = document.getElementById("sugerenciasNEP");
    const inputCPP = document.getElementById("pacientesCPP");
    const listaCPP = document.getElementById("sugerenciasCPP");
    let pacientes = [];

    // cargar pacientes
    fetch("https://api-railway-production-24f1.up.railway.app/api/test/pacientes")
        .then(res => res.json())
        .then(data => pacientes = data);

    function configurarInput(input, lista) {
        input.addEventListener("input", () => {
            const texto = input.value.toLowerCase();
            lista.innerHTML = "";
            if (!texto) {
                lista.style.display = "none";
                return;
            }

            const filtrados = pacientes.filter(p => p.nombre.toLowerCase().includes(texto));
            filtrados.forEach(p => {
                const li = document.createElement("li");
                li.className = "list-group-item list-group-item-action";
                li.textContent = p.nombre;
                li.onclick = () => {
                    input.value = p.nombre;
                    lista.style.display = "none";
                };
                lista.appendChild(li);
            });

            lista.style.display = filtrados.length ? "block" : "none";
        });
    }

    // Aplicación
    configurarInput(inputHEP, listaHEP);
    configurarInput(inputNEP, listaNEP);
    configurarInput(inputCPP, listaCPP);

});













