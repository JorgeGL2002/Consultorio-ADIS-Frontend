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
        alert("⚠️ Debes seleccionar un trabajador válido");
        return null;
    }

    try {
        const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/getRol?nombreUsuario=${nombre}`);
        if (!res.ok) throw new Error("No se encontró al profesional");
        const data = await res.json();
        return data;
    } catch (e) {
        alert("❌ Error al obtener ID del trabajador");
        console.error(e);
        return null;
    }
}

async function obtenerIdTrabajador(nombre) {
    console.log("Nombre del trabajador seleccionado:", nombre);

    if (!nombre || nombre === "Selecciona un trabajador") {
        alert("⚠️ Debes seleccionar un trabajador válido");
        return null;
    }

    try {
        const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${nombre}`);
        if (!res.ok) throw new Error("No se encontró al profesional");
        const data = await res.json();
        return data;
    } catch (e) {
        alert("❌ Error al obtener ID del trabajador");
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
        const type = this.getAttribute('onclick').match(/'([^']+)'/)[1];
        showFilters(type);
    });
});

// Inicializar con el año actual
document.getElementById('year').value = new Date().getFullYear();

async function generateReport(reportType) {
    const urlBase = 'https://api-railway-production-24f1.up.railway.app/api/test';
    let url = urlBase;
    const params = new URLSearchParams();

    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;

    if (!month || !year) {
        alert("⚠️ Debes seleccionar mes y año");
        return;
    }

    params.append('mes', month);
    params.append('anio', year);

    try {
        switch (reportType) {
            case 'monthly':
                if (rol === "ESPECIALISTA") return alert("⚠️ No tienes permisos para este reporte");
                url += '/reporteMensualCitas';
                break;

            case 'personal':
                url += '/reportePersonalCitas';
                if (rol === "ESPECIALISTA") {
                    params.append('ID', userId);
                    params.append('profesional', document.getElementById('trabajador').value || "Especialista");
                } else {
                    const nombreProfesional = document.getElementById('trabajador').value;
                    if (!nombreProfesional || nombreProfesional.includes("Selecciona"))
                        return alert("⚠️ Debes seleccionar un profesional válido");

                    const idProfesional = await obtenerIdTrabajador(nombreProfesional);
                    if (!idProfesional) return alert("❌ No se pudo obtener el ID del profesional");

                    params.append('ID', idProfesional);
                    params.append('profesional', nombreProfesional);
                }
                break;

            case 'workers':
                if (rol !== "SUPER USUARIO") return alert("⚠️ Solo SUPER USUARIO puede generar este reporte");
                url += '/reporteTrabajadores';
                break;

            case 'records':
                url += '/reporteHistoriasClinicas';
                if (rol === "ESPECIALISTA") {
                    params.append('rol', userRole);
                    params.append('id', userId);
                } else {
                    const rolUsuario = document.getElementById('rolInput').value || userRole;
                    const idUsuario = localStorage.getItem("idSelectPrincipal") || '0';
                    params.append('rol', rolUsuario);
                    params.append('id', idUsuario);
                }
                break;

            case 'patients':
                if (rol === "ESPECIALISTA") return alert("⚠️ No tienes permisos para este reporte");
                url += '/reportePacientes';
                break;
        }

        // Descargar el reporte
        window.location.href = `${url}?${params.toString()}`;

    } catch (err) {
        console.error("Error generando el reporte:", err);
        alert("❌ Error al generar el reporte");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const selectPrincipal = document.getElementById("trabajador");
    cargarTrabajadores("trabajador");

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
                cargarHorarios(fechaInput.value); // ahora solo pasamos la fecha
            } else {
                alert("❌ No se pudo obtener el ID del profesional seleccionado");
            }
        });
    }
});