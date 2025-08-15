const nombre = localStorage.getItem("usuario");
const id = localStorage.getItem("id");
const rol = localStorage.getItem("rol");
console.log("Usuario: ", nombre, "id: ", id, "rol: ", rol);

function cargarPacientes(filtro = "") {
  const tbody = document.getElementById("tabla-pacientes");
  tbody.innerHTML = "";

  fetch("https://api-railway-production-24f1.up.railway.app/api/test/pacientes")
    .then(response => response.json())
    .then(data => {
      const nombres = data.map(item => item.nombre);
      const filtrados = nombres.filter(nombre => nombre.toLowerCase().includes(filtro.toLowerCase()));

      if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="1">No se encontraron pacientes</td></tr>`;
        return;
      }

      filtrados.forEach(nombre => {
        const fila = document.createElement("tr");
        fila.innerHTML = `<td>${nombre}</td>`;
        tbody.appendChild(fila);
      });
    })
    .catch(error => {
      console.error("Error al cargar pacientes:", error);
    });
}

function abrirModalHC() {
  const modal = new bootstrap.Modal(document.getElementById("modalHC"));
  modal.show();
}

async function guardarHistoriaClinica() {
  const idPaciente = await obtenerIdPaciente(document.getElementById("nombrePaciente").value);
  const diagnosticoMedico = document.getElementById("diagnostico").value;
  const motivo = document.getElementById("motivo").value;
  const problemas = document.getElementById("problemas").value;
  const tratamientos = document.getElementById("tratamientos").value;
  const ahf = document.getElementById("ahf").value;
  const apnp = document.getElementById("apnp").value;
  const app = document.getElementById("app").value;
  const farmacologico = document.getElementById("farmacologico").value;
  const semiologia = document.getElementById("semiologia").value;
  const evaluacion_fisica = document.getElementById("evaluacion_fisica").value;
  const evaluacion_funcional = document.getElementById("evaluacion_funcional").value;
  const objetivos = document.getElementById("objetivos").value;

  const datos = {
    idPaciente: idPaciente,
    diagnosticoMedico: diagnosticoMedico,
    motivoConsulta: motivo,
    problemasIdentificados: problemas,
    tratamientosAfines: tratamientos,
    ahf: ahf,
    apnp: apnp,
    app: app,
    tratamientoFarmacologico: farmacologico,
    semiologiaDolor: semiologia,
    evaluacionFisica: evaluacion_fisica,
    evaluacionFuncional: evaluacion_funcional,
    objetivosTerapeuticos: objetivos,
    elaboradoPor: document.getElementById("usuarioLogueado").value
  };

  try {
    const res = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/historiaClinica", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    if (!res.ok) throw new Error("Error al guardar la historia clínica");
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function notasEvolucion() {
  const idPaciente = await obtenerIdPaciente(document.getElementById("nombrePaciente").value);
  const notas = document.getElementById("notas").value;
  const elaboradoPor = document.getElementById("usuarioLogueado").value;

  const datos = {
    idPaciente: idPaciente,
    nota: notas,
    elaboradoPor: elaboradoPor
  };

  try {
    const res = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/notasEvolucion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al guardar la nota de evolución");
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function obtenerIdPaciente(nombre) {
  console.log("Nombre del paciente seleccionado:", nombre);

  if (!nombre || nombre === "Selecciona un paciente") {
    mostrarAlerta("warning", "Por favor, selecciona un paciente");
    return null;
  }

  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/pacientesByName?nombrePaciente=${nombre}`);
    if (!res.ok) throw new Error("No se encontró al paciente");
    const data = await res.json();
    return data;
  } catch (e) {
    mostrarAlerta("danger", "Error al obtener el ID del paciente");
    console.error(e);
    return null;
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

document.addEventListener("DOMContentLoaded", () => {
  cargarPacientes();
  // Pacientes (datalist)
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/pacientes")
    .then(response => response.json())
    .then(data => {
      const lista = document.getElementById("listaPacientes");
      lista.innerHTML = "";

      data.forEach(paciente => {
        const option = document.createElement("option");
        option.value = paciente.nombre;
        lista.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error al cargar pacientes:", error);
    });

  document.getElementById("buscar").addEventListener("click", () => {
    const filtro = document.getElementById("busqueda").value.trim();
    cargarPacientes(filtro);
  });

  document.getElementById("tabla-pacientes").addEventListener("click", function (e) {
    const nombrePaciente = e.target.textContent.trim();
    const usuarioModal = nombre;
    console.log("Nombre seleccionado:", nombrePaciente);
    console.log("Creado por:", usuarioModal);
    document.getElementById("pacienteNombre").innerText = nombrePaciente || "";
    document.getElementById("nombrePaciente").value = nombrePaciente;
    document.getElementById("userLog").innerText = usuarioModal || "";
    document.getElementById("usuarioLogueado").value = usuarioModal;
    abrirModalHC();
    const usuario = localStorage.getItem("usuario");
  });

  document.getElementById("tipo").addEventListener("change", (e) => {
    const tipo = e.target.value;
    const seccionNotas = document.getElementById("seccionNotas");
    const seccionHC = document.getElementById("seccionHC");

    // Mostrar/ocultar secciones
    seccionNotas.classList.toggle("d-none", tipo !== "nEvolucion");
    seccionHC.classList.toggle("d-none", tipo !== "HC");

    document.getElementById("notas").required = (tipo === "nEvolucion");
    document.getElementById("diagnostico").required = (tipo === "HC");
    document.getElementById("motivo").required = (tipo === "HC");
    document.getElementById("problemas").required = (tipo === "HC");
    document.getElementById("evaluacion_fisica").required = (tipo === "HC");
  });

  document.getElementById('modalHC').addEventListener('show.bs.modal', () => {
    document.getElementById('tipo').value = '';
    document.getElementById('seccionNotas').classList.add('d-none');
    document.getElementById('seccionHC').classList.add('d-none');
  });

  document.getElementById('formDatosHC').addEventListener('submit', async (e) => {
    e.preventDefault();

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalHC'));
    const tipo = document.getElementById('tipo').value.trim();

    try {
      let success = false;
      if (tipo === 'nEvolucion') {
        success = await notasEvolucion();
        if (success) {
          mostrarAlerta("success", "Notas de evolución guardadas correctamente.");
          document.getElementById("seccionNotas").classList.add("d-none");
          e.target.reset(); // solo si todo fue bien
          modal.hide();
        } else {
          mostrarAlerta("danger", "Ocurrió un error al guardar las notas de evolución.");
          return;
        }
      } else if (tipo === 'HC') {
        success = await guardarHistoriaClinica();
        if (success) {
          mostrarAlerta("success", "Historia clínica guardada correctamente.");
          document.getElementById("seccionHC").classList.add("d-none");
          e.target.reset(); // solo si todo fue bien
          modal.hide();
        } else {
          mostrarAlerta("warning", "Ocurrió un error al guardar la historia clínica.");
          return;
        }
      } else {
        mostrarAlerta("warning", "Seleccione un tipo de documento válido.");
        return;
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      mostrarAlerta("danger", "Ocurrió un error al guardar los datos.");
    }
  });
});

function abrirVentanaP() {
  window.location.href = '../pacientes/pacientesmain.html';
}
function abrirVentanaA() {
  window.location.href = '../citas/agenda.html';
}
function abrirVentanaR() {
  window.location.href = '../reportes/reportes.html';
}

function abrirVentanaE() {
  window.location.href = '../eventos/eventos.html';

}
