const horarios = [];
const nombre = localStorage.getItem("usuario");
const id = localStorage.getItem("id");
const rol = localStorage.getItem("rol");
const fechaInput = document.getElementById("fechaSeleccionada");
const tabla = document.getElementById("tabla-horarios");
const filtro = document.getElementById("trabajador").value;


async function obtenerProfesionalContexto() {
  const rol = localStorage.getItem("rol");
  let nombre = localStorage.getItem("usuario");
  let id = parseInt(localStorage.getItem("id"));

  // Caso de SUPER USUARIO o RECEPCIÓN → depende del select
  if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
    const select = document.getElementById("trabajador");
    if (select && select.value && !select.value.includes("Selecciona")) {
      nombre = select.value.trim();
      id = await obtenerIdTrabajador(nombre); // Espera el ID correcto
    } else {
      return { nombre: null, id: null }; // Nadie seleccionado
    }
  }

  return { nombre, id };
}

for (let h = 8; h <= 20; h++) {
  horarios.push(`${h}:00`);
  if (h < 20) horarios.push(`${h}:30`);
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

fechaInput.addEventListener("change", async () => {
  const nuevaFecha = fechaInput.value;

  if (rol === "ESPECIALISTA") {
    // Para especialista, usamos el id del localStorage
    await cargarHorarios(nuevaFecha);
  }
  else if (
    (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") &&
    document.getElementById("trabajador").value === "Selecciona un trabajador"
  ) {
    // Si no hay trabajador seleccionado
    await cargarHorarios(nuevaFecha);
  }
  else {
    // Si hay trabajador seleccionado, obtener su ID primero
    const nombreTrabajador = document.getElementById("trabajador").value.trim();
    if (!nombreTrabajador || nombreTrabajador.includes("Selecciona")) {
      console.warn("⚠ No se seleccionó un trabajador válido.");
      return;
    }

    try {
      const idTrabajador = await obtenerIdTrabajador(nombreTrabajador);
      if (idTrabajador) {
        await cargarHorarios(nuevaFecha);
      } else {
        mostrarAlerta("danger", "Error al obtener ID del trabajador.")
      }
    } catch (error) {
      console.error("Error obteniendo ID del trabajador:", error);
      mostrarAlerta("danger", "Error al obtener ID del trabajador.");
    }
  }
});

function construirUrlBloqueos(fecha, rol, idProfesional) {
  let url = `https://api-railway-production-24f1.up.railway.app/api/test/citasBloqueadas?fecha=${fecha}&rol=${rol}&idProfesional=${idProfesional}`;

  return url;
}

function construirUrlCitas(fecha, rol, nombreProfesional, idProfesional) {
  let url = `https://api-railway-production-24f1.up.railway.app/api/test/citas?fecha=${fecha}&rol=${rol}`;

  if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
    if (nombreProfesional && nombreProfesional !== "Selecciona un trabajador") {
      url += `&nombreProfesional=${encodeURIComponent(nombreProfesional)}`;
    }
  } else {
    // Para especialista siempre se usa el ID
    url += `&idProfesional=${idProfesional}`;
  }

  return url;
}

function construirUrlAusencia(fecha, rol, nombreProfesional, idProfesional) {
  let url = `https://api-railway-production-24f1.up.railway.app/api/test/citasAusencia?fecha=${fecha}&rol=${rol}`;

  if (nombreProfesional) {
    url += `&nombreProfesional=${encodeURIComponent(nombreProfesional)}`;
  } else if (rol !== "SUPER USUARIO" && rol !== "RECEPCIÓN") {
    url += `&idProfesional=${idProfesional}`;
  }

  return url;
}

function normalizarHora(hora) {
  if (!hora) return null;
  if (/^\d{1,2}:\d{2}$/.test(hora)) {
    return hora + ":00"; // ej: "13:00" => "13:00:00"
  } else if (/^\d{1,2}:\d{2}:\d{2}$/.test(hora)) {
    return hora; // ya viene bien
  } else {
    return null; // formato inválido
  }
}

async function AgendarUnoMas() {
  const hora = localStorage.getItem("horaCita");
  const fecha = localStorage.getItem("fechaCita");

  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fecha}`;
  document.getElementById("hora").value = hora;
  document.getElementById("fechaSeleccionada").value = fecha;
  bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
  abrirModal(hora);
}

async function obtenerProfesionalParaHorarios() {
  let nombreProfesional = nombre;
  let idProfesional = id;

  if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
    const trabajadorSelect = document.getElementById("trabajador")?.value;
    if (trabajadorSelect && !trabajadorSelect.includes("Selecciona")) {
      nombreProfesional = trabajadorSelect;
      idProfesional = await obtenerIdTrabajador(trabajadorSelect);
    }
  }

  return [nombreProfesional, idProfesional];
}

function desbloquearHorario(fecha, hora, rol, id) {
    const confirmar = confirm("¿Estás seguro de que deseas desbloquear este horario?");
    if (!confirmar) return;

    fetch(`https://api-railway-production-24f1.up.railway.app/api/test/desbloquearHorario?fecha=${fecha}&hora=${hora}&rol=${rol}&idSesion=${id}`, {
      method: "DELETE"
    }).then(response => response.json()).then(data => {
      if (data.success) {
        cargarHorarios(fechaInput.value);
        alert("Horario desbloqueado");
      } else {
        console.error("Error al desbloquear horario");
      }
    }).catch(error => {
      console.error("Error al desbloquear horario:", error);
    });
  }

async function cargarHorarios(fecha) {
  try {
    const { nombre, id } = await obtenerProfesionalContexto();
    const rol = localStorage.getItem("rol");

    if (!id) {
      tabla.innerHTML = "<tr><td colspan='2'>Selecciona un trabajador</td></tr>";
      console.warn("⚠ No se pudo determinar un ID de profesional.");
      return;
    }

    console.log(`Usuario ${nombre} ID ${id} Rol ${rol}`);
    const filtroProfesionalId = rol === "SUPER USUARIO" || rol === "RECEPCIÓN"
      ? obtenerIdTrabajador(document.getElementById("trabajador").value.trim())
      : null;

    const urlCitas = construirUrlCitas(fecha, rol, nombre, id);
    const urlBloqueos = construirUrlBloqueos(fecha, rol, id);
    const urlAusencia = construirUrlAusencia(fecha, rol, nombre, id);

    const [citasResp, bloqueosResp, ausenciaResp] = await Promise.all([
      fetch(urlCitas),
      fetch(urlBloqueos),
      fetch(urlAusencia)
    ]);

    if (!citasResp.ok || !bloqueosResp.ok || !ausenciaResp.ok) {
      console.error("Error en la respuesta del servidor");
      tabla.innerHTML = "<tr><td colspan='2'>Error al cargar datos</td></tr>";
      return;
    }

    const citas = await citasResp.json();
    const bloqueos = await bloqueosResp.json();
    const ausencias = await ausenciaResp.json();

    if (!Array.isArray(citas) || !Array.isArray(bloqueos)) {
      console.error("Datos inválidos recibidos");
      tabla.innerHTML = "<tr><td colspan='2'>Datos no disponibles</td></tr>";
      return;
    }

    console.log("Citas desde API:", citas);
    console.log("Ausencias desde API:", ausencias);
    console.log("Bloqueos desde API:", bloqueos);

    tabla.innerHTML = "";

    for (const hora of horarios) {
      const fila = document.createElement("tr");

      // Celda con checkbox
      const celdaCheck = document.createElement("td");
      celdaCheck.innerHTML = `<input type="checkbox" class="check-horario" value="${hora}">`;
      fila.appendChild(celdaCheck);

      // Celda con hora
      const celdaHora = document.createElement("td");
      celdaHora.textContent = hora;
      fila.appendChild(celdaHora);

      const horaNormalizada = normalizarHora(hora);
      const celdaDetalle = document.createElement("td");

      const citasHora = citas.filter(c => c.hora?.slice(0, 5) === hora.padStart(5, '0'));
      const bloqueo = bloqueos.find(b => b.hora?.slice(0, 5) === hora.padStart(5, '0'));
      const ausencia = ausencias.find(a => a.hora?.slice(0, 5) === hora.padStart(5, '0'));

      if (ausencia) {
        celdaDetalle.innerHTML = `
      <span class="badge bg-warning d-block text-start" style="font-size: 16px; color: #000;">
        AUSENCIA<br>
        Paciente: ${ausencia.nombrePaciente}<br>
        Servicio: ${ausencia.nombreServicio}<br>
      </span>`;
        celdaDetalle.classList.add("celda-ausencia");
      } else if (citasHora.length > 0) {
        celdaDetalle.innerHTML = citasHora.map(cita => `
      <span class="badge ${cita.ausente ? 'bg-warning' : 'bg-success'} d-block text-start mb-1" 
            style="font-size: 16px;" 
            onclick='abrirModalEditarCitaPorID(${cita.idCita})'>
        Paciente: ${cita.nombrePaciente}<br>
        Servicio: ${cita.nombreServicio}<br>
        Seguro: ${cita.seguro}<br>
        ${cita.nseguro ? `No. Seguro: ${cita.nseguro}<br>` : ""}
        ${cita.ausente ? `<b>Estado: Ausente</b>` : ""}
      </span>
    `).join("");
        celdaDetalle.classList.add("celda-cita");
      } else if (bloqueo) {
        celdaDetalle.innerHTML = `
      <span class="badge bg-danger d-block text-start" style="font-size: 16px; background-color: #e9d1d3">
        BLOQUEADO<br>
        Bloqueado por: ${bloqueo.bloqueadoPor}<br>
        Motivo: ${bloqueo.motivo}
      </span>`;
        celdaDetalle.classList.add("celda-bloqueo");
        celdaDetalle.style.cursor = "pointer";
        celdaDetalle.addEventListener("click", () => desbloquearHorario(fecha, horaNormalizada, rol, id));
      } else {
        celdaDetalle.innerHTML = `
      <button class="btn btn-outline-primary btn-sm" onclick="abrirModal('${hora}')">Agendar</button>`;
        celdaDetalle.classList.add("celda-libre");
      }

      fila.appendChild(celdaDetalle);
      tabla.appendChild(fila);
    }
  } catch (error) {
    console.error("Error cargando horarios:", error);
    tabla.innerHTML = "<tr><td colspan='2'>Error inesperado</td></tr>";
  }
}

async function obtenerIdTrabajador(nombre) {
  console.log("Nombre del trabajador seleccionado:", nombre);

  if (!nombre || nombre === "Selecciona un trabajador") {
    mostrarAlerta("error", "Selecciona un trabajador");
    return null;
  }

  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${nombre}`);
    if (!res.ok) throw new Error("No se encontró al profesional");
    const data = await res.json();
    return data;
  } catch (e) {
    mostrarAlerta("error", "No se pudo obtener el ID del trabajador");
    console.error(e);
    return null;
  }
}

async function abrirModalEditarCitaPorID(idCita) {
  try {
    const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/CitasPorId?idCita=${idCita}`);
    if (!response.ok) throw new Error("No se pudo obtener la cita");
    const datosCita = await response.json();
    console.log("Datos de la cita:", datosCita);
    abrirModalEditarCita(datosCita.hora, datosCita);
  } catch (error) {
    console.error("Error al obtener la cita:", error);
    mostrarAlerta("error", "Error al obtener la cita");
  }
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

function abrirModal(hora) {
  const fechaSeleccionada = fechaInput.value;
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  document.getElementById("hora").value = hora;

  const modal = new bootstrap.Modal(document.getElementById("modalCita"));
  modal.show();
}

function abrirModalBloqueo() {
  const hora = document.getElementById("hora").value;
  const fechaSeleccionada = fechaInput.value;
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  document.getElementById("hora").value = hora;

  bootstrap.Modal.getInstance(document.getElementById("modalCita")).hide();

  const modal = new bootstrap.Modal(document.getElementById("modalMotivo"));
  modal.show();
}

function abrirModalAusencia() {
  bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();

  const modal = new bootstrap.Modal(document.getElementById("modalAusencia"));
  modal.show();
}

function abrirModalDesbloqueo() {
  bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();

  const modal = new bootstrap.Modal(document.getElementById("modalCancelar"));
  modal.show();
}

function abrirModalRepetirCita() {
  bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();

  const modal = new bootstrap.Modal(document.getElementById("modalRepetirCita"));
  modal.show();
}

function abrirModalCambiarHorario() {
  bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();

  const modal = new bootstrap.Modal(document.getElementById("modalCambiarHorario"));
  modal.show();
}

function abrirModalDesbloquearHorario() {
  const hora = document.getElementById("hora").value;
  const fechaSeleccionada = fechaInput.value;
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  document.getElementById("hora").value = hora;
  const modal = new bootstrap.Modal(document.getElementById("modalDesbloquearHorario"));
  modal.show();
}

function abrirModalEditarCita(hora, datosCita) {
  const fechaSeleccionada = fechaInput.value;
  localStorage.setItem("horaCita", hora);
  localStorage.setItem("fechaCita", datosCita.fecha);
  // ID de la cita
  document.getElementById("modalEditarCita").dataset.idCita = datosCita.idCita;
  // 🔍 Muestra los datos que vienen de la API
  console.log("Cita recibida para editar:", datosCita);

  // 📅 Actualiza encabezado con hora y fecha
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  document.getElementById("hora").value = hora;

  // 📝 Llenar campos
  document.getElementById("Editarpaciente").value = datosCita.nombrePaciente;
  document.getElementById("Editarvalor").value = datosCita.cuota || "";
  document.getElementById("Editarservicio").value = datosCita.nombreServicio;
  document.getElementById("Editarseguro").value = datosCita.seguro;
  document.getElementById("Editarseguro").dispatchEvent(new Event("change"));
  if (datosCita.cuota) {
    document.getElementById("Editarvalor").disabled = false;
    document.getElementById("Editarvalor").value = datosCita.cuota;
  } else {
    document.getElementById("Editarvalor").value = "";
  }
  document.getElementById("Editarnseguro").value = datosCita.nseguro || "";
  document.getElementById("EditartrabajadorModal").value = datosCita.nombreProfesional;
  document.getElementById("Editardetalles").value = datosCita.detalles || "";
  document.getElementById("Editarpaciente").readOnly = true;

  // 🟦 Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById("modalEditarCita"));
  modal.show();
}

document.getElementById("modalEditarCita").addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = {
    nombrePaciente: document.getElementById("Editarpaciente").value,
    nombreProfesional: document.getElementById("EditartrabajadorModal").value,
    cuota: parseInt(document.getElementById("Editarvalor").value.trim()) || 0,
    nombreServicio: document.getElementById("Editarservicio").value,
    seguro: document.getElementById("Editarseguro").value,
    nseguro: document.getElementById("Editarnseguro").value,
    detalles: document.getElementById("Editardetalles").value,
    fecha: fechaInput.value,
    hora: document.getElementById("hora").value
  };
  console.log("Editando cita, datos enviados:", datos);
  const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/editarcita?rol=${rol}&SessionId=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  });

  const resultado = await response.json();
  if (response.ok && resultado.success) {
    mostrarAlerta("success", "Cambios guardados correctamente");
    bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
    cargarHorarios(fechaInput.value);
  } else {
    mostrarAlerta("error", "No se pudieron aplicar los cambios");
  }
});

 

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Establecer fecha de hoy al iniciar
  fechaInput.valueAsDate = new Date();
  const fechaHoy = fechaInput.value;
  cargarTrabajadores("trabajador");
  cargarTrabajadores("trabajadorModal");
  cargarTrabajadores("EditartrabajadorModal");
  cargarSeguros("seguros");
  cargarSeguros("Editarseguro");
  cargarServicios("servicios");
  cargarServicios("Editarservicio");
  const selectModal = document.getElementById("trabajadorModal");
  const selectPrincipal = document.getElementById("trabajador");
  // Cargar horarios iniciales (ya no pasamos nombre e id manualmente)
  console.log("Usuario", nombre, "ID", id, "Rol", rol);
  cargarHorarios(fechaHoy);
  if (nombre !== "Psic Majo García" && id !== 6) {
    document.getElementById("hora").disabled = true;
  }
  const celdaCheck = document.createElement("td");
  celdaCheck.innerHTML = `<input type="checkbox" class="check-horario" value="${hora}">`;

  document.querySelectorAll(".check-horario").forEach(chk => {
    chk.addEventListener("change", actualizarBotonBloqueo);
  });

  if (selectPrincipal) {
    selectPrincipal.addEventListener("change", async () => {
      const nombreSelect = selectPrincipal.value.trim();
      if (!nombreSelect || nombreSelect.includes("Selecciona")) return;

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

  if (selectModal) {
    selectModal.addEventListener("change", async () => {
      const nombreModal = selectModal.value.trim();
      if (!nombreModal || nombreModal.includes("Selecciona")) return;

      const modalIdProfesional = await obtenerIdTrabajador(nombreModal);
      console.log("Profesional modal:", nombreModal, "ID:", modalIdProfesional);
      localStorage.setItem("idTrabajadorSeleccionado", modalIdProfesional);
    });
  }

  if (fechaInput) {
    fechaInput.addEventListener("change", async () => {
      const fechaValor = fechaInput.value;

      if (rol === "ESPECIALISTA") {
        cargarHorarios(fechaValor);
      } else {
        const nombre = selectPrincipal?.value?.trim();
        if (nombre && !nombre.includes("Selecciona")) {
          const id = await obtenerIdTrabajador(nombre);
          if (id) {
            localStorage.setItem("idSelectPrincipal", id);
          }
        }
        cargarHorarios(fechaValor);
      }
    });
  }

  if (selectModal) {
    selectModal.addEventListener("change", async () => {
      const nombre = selectModal.value.trim();
      if (!nombre) {
        localStorage.removeItem("idTrabajadorSeleccionado");
        return;
      }

      try {
        const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${nombre}`);
        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        mostrarAlerta("success", "✅ Profesional seleccionado correctamente");
        console.log("ID del trabajador guardado:", data);
        localStorage.setItem("idTrabajadorSeleccionado", data);
      } catch (e) {
        console.error("Error al obtener el ID del trabajador:", e);
        alert("❌ No se pudo obtener el ID del profesional seleccionado.");
      }
    });
  }

  if (rol !== "RECEPCIÓN") {
    document.getElementById("trabajador").addEventListener("change", () => {
      cargarHorarios(fechaInput.value);
    });
  }

  const btnBloqueo = document.getElementById("btnBloquearSeleccion");
  const modalMotivo = new bootstrap.Modal(document.getElementById("modalMotivo"));
  let seleccionados = [];

  function actualizarBotonBloqueo() {
    const btnBloqueo = document.getElementById("btnBloquearSeleccion"); // ✅ Buscarlo aquí
    const seleccionados = document.querySelectorAll(".check-horario:checked").length > 0;

    if (btnBloqueo) { // ✅ Aseguramos que existe
      btnBloqueo.disabled = !seleccionados;
      btnBloqueo.hidden = !seleccionados;
    }
  }

  btnBloqueo.addEventListener("click", async () => {
    seleccionados = Array.from(document.querySelectorAll(".check-horario:checked")).map(chk => chk.value);
    if (seleccionados.length === 0) {
      alert("Por favor, selecciona al menos un horario.");
      return;
    }
    modalMotivo.show();
  });

  document.getElementById("checkAll").addEventListener("change", function () {
    const check = document.querySelectorAll(".check-horario");
    check.forEach(chk => chk.checked = this.checked);
    actualizarBotonBloqueo();
  });

  document.getElementById("Editarseguro").addEventListener("change", () => {
    const seguro = document.getElementById("Editarseguro").value.toLowerCase();
    const valorInput = document.getElementById("Editarvalor");
    const noSeguroInput = document.getElementById("Editarnseguro");

    if (seguro === "ninguno" || seguro.includes("cita")) {
      valorInput.disabled = false;
      valorInput.value = "";
      noSeguroInput.disabled = true;
      noSeguroInput.value = "";
    } else {
      valorInput.disabled = true;
      valorInput.value = "0";
      noSeguroInput.disabled = false;
    }
  });

  document.getElementById("btnDesbloquearHorario").addEventListener("click", () => {
    const hora = document.getElementById("hora").value;
    const fecha = document.getElementById("fechaSeleccionada").value;
    desbloquearHorario(fecha, hora);
  })

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

  document.getElementById("seguros").addEventListener("change", () => {
    const seguros = document.getElementById("seguros").value.toLowerCase();
    const valorInput = document.getElementById("valor");
    const noseguros = document.getElementById("noseguros");

    if (seguros.includes("cita") || seguros.includes("ninguno")) {
      valorInput.disabled = false;
      valorInput.value = "";
      noseguros.disabled = true;
      noseguros.value = "";
    } else {
      valorInput.disabled = true;
      valorInput.value = "0";
      noseguros.disabled = false;
      noseguros.value = "";
    }
  });

  document.getElementById("formCita").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombrePaciente = document.getElementById("pacientes").value;
    const nombreProfesional = (rol === "SUPER USUARIO" || rol === "RECEPCIÓN")
      ? document.getElementById("trabajadorModal").value : nombre;

    const [idPaciente, idEspecialista, idServicio] = await Promise.all([
      fetch(`https://api-railway-production-24f1.up.railway.app/api/test/pacientesByName?nombrePaciente=${encodeURIComponent(nombrePaciente)}`).then(r => r.json()),
      fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${encodeURIComponent(nombreProfesional)}`).then(r => r.json()),
      fetch(`https://api-railway-production-24f1.up.railway.app/api/test/serviciosByName?nombreServicio=${encodeURIComponent(document.getElementById("servicios").value)}`).then(r => r.json())
    ]);

    let horaInput = document.getElementById("hora").value.trim();

    // Asegura formato HH:mm:ss
    let hora;
    if (horaInput.length === 5) {
      hora = horaInput + ":00"; // Ej: "13:00" → "13:00:00"
    } else if (horaInput.length === 4) {
      hora = "0" + horaInput + ":00"; // Ej: "9:00" → "09:00:00"
    } else {
      hora = horaInput; // ya podría estar en formato HH:mm:ss
    }

    const datosCita = {
      idPaciente,
      idEspecialista,
      idTipoServicio: idServicio,
      nombrePaciente,
      nombreProfesional,
      fecha: document.getElementById("fechaSeleccionada").value,
      hora: hora,
      cuota: parseInt(document.getElementById("valor").value) || 0,
      detalles: document.getElementById("detalles").value,
      seguro: document.getElementById("seguros").value,
      nseguro: document.getElementById("noseguros").value || "",
      estadoCita: "Agendada"
    };

    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/agendarCitas?rol=${rol}&SessionId=${id}&SessionUser=${nombre}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosCita)
    });
    const resultado = await res.json();
    if (res.ok && resultado.success) {
      mostrarAlerta("success", "Cita agendada correctamente.");
      bootstrap.Modal.getInstance(document.getElementById("modalCita")).hide();
      cargarHorarios(fechaInput.value); // ya no pasa nombre/id
      document.getElementById("formCita").reset();
    } else {
      mostrarAlerta("warning", "No se pudo agendar la cita.");
    }
  });

  document.getElementById("formMotivo").addEventListener("submit", async (e) => {
    e.preventDefault();

    const motivo = document.getElementById("motivo").value.trim();
    if (!motivo) return mostrarAlerta("warning", "Por favor, ingrese un motivo válido.");

    const fecha = document.getElementById("fechaSeleccionada").value;
    const idSesion = (rol === "SUPER USUARIO" || rol === "RECEPCIÓN")
      ? (selectedIdProfesional || id)
      : id;

    if (!idSesion) return mostrarAlerta("warning", "No hay un ID válido para el profesional.");

    await Promise.all(seleccionados.map(async (horaNormal) => {
      const hora = horaNormal.length === 5 ? horaNormal + ":00"
        : horaNormal.length === 4 ? "0" + horaNormal + ":00"
          : horaNormal;
      const datosBloqueo = { idProfesional: idSesion, hora, fecha, motivo };

      const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/BloquearHorarios?Sessionrol=${rol}&Sessionid=${idSesion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosBloqueo)
      });

      const resultado = await response.json().catch(() => ({}));
      if (!response.ok || !resultado.success) {
        console.error("Error al bloquear:", resultado.error || response.statusText);
      }
    }));

    mostrarAlerta("success", "Horarios bloqueados correctamente.");
    modalMotivo.hide();
    document.getElementById("formMotivo").reset();
    document.querySelectorAll(".check-horario").forEach(chk => chk.checked = false);
    document.getElementById("checkAll").checked = false;
    actualizarBotonBloqueo();
    cargarHorarios(fecha);
  });

  document.getElementById("formAusencia").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idCita = document.getElementById("modalEditarCita").dataset.idCita;
    if (!idCita) {
      mostrarAlerta("warning", "No hay un ID válido para la cita");
      return;
    }

    try {
      const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/ausenciaCita?idCita=${idCita}`, {
        method: "PUT"
      });

      const data = await res.json();

      if (res.ok && data.success) {
        mostrarAlerta("success", "Cita marcada como ausente");
        bootstrap.Modal.getInstance(document.getElementById("modalAusencia")).hide();
        cargarHorarios(fechaInput.value);
      } else {
        mostrarAlerta("warning", "Error al marcar la cita como ausente");
      }
    } catch (err) {
      console.error(err);
      mostrarAlerta("danger", "Error de conexión con el servidor");
    }
  });

  document.getElementById("formCancelar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idCita = document.getElementById("modalEditarCita").dataset.idCita;
    if (!idCita) {
      mostrarAlerta("warning", "No hay un ID válido para la cita");
      return;
    }

    try {
      const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/cancelarCita?idCita=${idCita}`, {
        method: "PUT"
      });

      const data = await res.json();

      if (res.ok && data.success) {
        mostrarAlerta("success", "Cita cancelada");
        bootstrap.Modal.getInstance(document.getElementById("modalCancelar")).hide();
        cargarHorarios(fechaInput.value);
      } else {
        mostrarAlerta("warning", "Error al cancelar la cita");
      }
    } catch (err) {
      console.error(err);
      mostrarAlerta("danger", "Error de conexión con el servidor");
    }
  });

  document.getElementById("modalRepetirCita").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idCita = document.getElementById("modalEditarCita").dataset.idCita;
    if (!idCita) return mostrarAlerta("warning", "No hay un ID válido para la cita");

    const nuevaFecha = document.getElementById("fechaRC").value;
    const nuevaHora = document.getElementById("horaRC").value;
    console.log(nuevaHora);
    const horaNormalizada = normalizarHora(nuevaHora);
    console.log(horaNormalizada);
    if (!nuevaFecha || !horaNormalizada) return mostrarAlerta("warning", "Por favor, ingrese una fecha y hora válidas.");

    try {
      const url = `https://api-railway-production-24f1.up.railway.app/api/test/repetirCita?idCita=${idCita}&nuevaFecha=${nuevaFecha}&nuevaHora=${horaNormalizada}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        mostrarAlerta("success", "Cita repetida");
        bootstrap.Modal.getInstance(document.getElementById("modalRepetirCita")).hide();

        const [nombreProfesional, idProfesional] = await obtenerProfesionalParaHorarios();
        document.getElementById("formRepetirCita").reset();
        cargarHorarios(fechaInput.value);
      } else {
        mostrarAlerta("warning", "Error al repetir la cita");
      }
    } catch (e) {
      console.error("Error de red o parsing:", e);
      mostrarAlerta("danger", "Error al procesar la solicitud.");
    }
  });

  document.getElementById("modalCambiarHorario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idCita = document.getElementById("modalEditarCita").dataset.idCita;
    if (!idCita) return alert("No hay un ID");

    const nuevaFecha = document.getElementById("fechaCH").value;
    const nuevaHora = document.getElementById("horaCH").value;
    const horaNormalizada = normalizarHora(nuevaHora);

    if (!nuevaFecha || !horaNormalizada) return;

    try {
      const url = `https://api-railway-production-24f1.up.railway.app/api/test/cambiarHorario?idCita=${idCita}&nuevaFecha=${nuevaFecha}&nuevaHora=${horaNormalizada}`;
      const res = await fetch(url, { method: "PUT" });
      const data = await res.json();

      if (res.ok && data.success) {
        mostrarAlerta("success", "Horario editado");
        const [nombreProfesional, idProfesional] = await obtenerProfesionalParaHorarios();
        bootstrap.Modal.getInstance(document.getElementById("modalCambiarHorario")).hide();
        document.getElementById("formCambiarHorario").reset();
        cargarHorarios(fechaInput.value);
      } else {
        mostrarAlerta("warning", "Error al cambiar el horario");
        console.error("Respuesta no exitosa:", data);
      }
    } catch (e) {
      console.error("Error de red o parsing:", e);
      mostrarAlerta("danger", "Error al procesar la solicitud.");
    }
  });
});

function abrirVentanaConfiguracion() {
  if (rol !== "SUPER USUARIO") {
    mostrarAlerta("danger", "No tiene permisos para acceder a esta sección");
    return;
  } else {
    window.location.href = '/configuracion.html';
  }
}

function abrirVentanaHC() {
  window.location.href = '../historias_clinicas/hc.html';
}

function abrirVentanaP() {
  window.location.href = '../pacientes/pacientesmain.html';
}

function abrirVentanaR() {
  window.location.href = '../reportes/reportes.html';
}

function CerrarSesion() {
  window.location.href = '/index.html';
  localStorage.clear(); // Limpiar todos los datos almacenados en localStorage a8588c2 (Actualizacion urls):Citas/Agenda.js
}
