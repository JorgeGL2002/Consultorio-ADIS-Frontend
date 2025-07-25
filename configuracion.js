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


document.addEventListener("DOMContentLoaded", () => {
    cargarSeguros("seguros");
    cargarServicios("servicios");

    document.getElementById("formServicio").addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombreServicio = document.getElementById("nombreServicio").value.trim();
        const notasServicio = document.getElementById("notasServicio").value.trim();
        if (!nombreServicio) {
            alert("warning", "El nombre del servicio es obligatorio");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/nuevoServicio?nombreServicio=${encodeURIComponent(nombreServicio)}&causaConsulta=${encodeURIComponent(notasServicio)}`, {
                method: "POST"
            });
            if (!response.ok) throw new Error("Error al crear el servicio");
            alert("success", "Servicio creado correctamente", true);
            cargarServicios("servicios");
            document.getElementById("formServicio").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al crear el servicio:", error);
            alert("danger", "Error al crear el servicio");
        }
    });

    document.getElementById("formEmpresa").addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombreEmpresa = document.getElementById("nombreEmpresa").value.trim();
        const notasEmpresa = document.getElementById("notasEmpresa").value.trim();
        if (!nombreEmpresa) {
            alert("warning", "El nombre de la empresa es obligatorio");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/nuevoSeguro?nombre=${encodeURIComponent(nombreEmpresa)}&notas=${encodeURIComponent(notasEmpresa)}`, {
                method: "POST"
            });
            if (!response.ok) throw new Error("Error al crear la empresa");
            alert("success", "Empresa creada correctamente", true);
            document.getElementById("formEmpresa").reset(); // Limpiar el formulario
            cargarSeguros("seguros");
        } catch (error) {
            console.error("Error al crear la empresa:", error);
            alert("danger", "Error al crear la empresa");
        }
    })

    document.getElementById("formBorrarEmpresa").addEventListener("submit", async (e) => {
        e.preventDefault();
        const seguroSeleccionado = document.getElementById("seguros").value.trim();
        if (!seguroSeleccionado) {
            alert("warning", "Selecciona una empresa");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eliminarSeguro?nombre=${encodeURIComponent(seguroSeleccionado)}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Error al borrar la empresa");
            alert("success", "Empresa borrada correctamente", true);
            cargarSeguros("seguros");
            document.getElementById("formBorrarEmpresa").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al borrar la empresa:", error);
            alert("danger", "Error al borrar la empresa");
        }
    });

    document.getElementById("formBorrarServicio").addEventListener("submit", async (e) => {
        e.preventDefault();
        const servicioSeleccionado = document.getElementById("servicios").value.trim();
        if (!servicioSeleccionado) {
            alert("warning", "Selecciona un servicio");
            return;
        }
        try {
            const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eliminarServicio?nombreServicio=${encodeURIComponent(servicioSeleccionado)}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Error al borrar el servicio");
            alert("success", "Servicio borrado correctamente", true);
            cargarServicios("servicios");
            document.getElementById("formBorrarServicio").reset(); // Limpiar el formulario
        } catch (error) {
            console.error("Error al borrar el servicio:", error);
            alert("danger", "Error al borrar el servicio");
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