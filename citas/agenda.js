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

async function AgendarUnoMas() {
  const hora = localStorage.getItem("horaCita");
  const horaFormateada = hora.split(':').slice(0, 2).join(':');
  console.log("Hora: ", horaFormateada);
  const fecha = localStorage.getItem("fechaCita");

  document.getElementById("CitaHoraFecha").textContent = `${horaFormateada} - ${fecha}`;
  document.getElementById("hora").value = horaFormateada;
  document.getElementById("fechaSeleccionada").value = fecha;
  bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
  abrirModal(horaFormateada);
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

async function cargarEmpresa(empresaPaciente, idSelect = "seguros") {
  const select = document.getElementById(idSelect);
  const currentValue = select.value;
  try {
    const response = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/empresa");
    const empresasAPI = await response.json();

    //Coincidencia exacta (case insensitive)
    const coincidencia = Array.from(select.options).find(option =>
      option.value.toLowerCase() === empresaPaciente.toLowerCase()
    );

    // Si encontramos coincidencia en las opciones existentes
    if (coincidencia) {
      select.value = coincidencia.value;
    }
    // Si no hay coincidencia pero existe en la API
    else if (empresasAPI.some(emp => emp.toLowerCase() === empresaPaciente.toLowerCase())) {
      // Creamos nueva opción solo si no existe
      if (!Array.from(select.options).some(opt => opt.value === empresaPaciente)) {
        const newOption = new Option(empresaPaciente, empresaPaciente);
        select.add(newOption);
      }
      select.value = empresaPaciente;
    }
    // Restauramos el valor anterior si no hubo coincidencia
    else if (currentValue) {
      select.value = currentValue;
    }

  } catch (err) {
    console.error("Error al verificar empresas:", err);
    // Restauramos el valor original si hay error
    if (currentValue) {
      select.value = currentValue;
    }
  }
}

async function cargarEmpresayNempleado(nombre) {
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/datosCitaPaciente?nombrePaciente=${nombre}`);
    if (!res.ok) throw new Error("Paciente no encontrado");
    const data = await res.json();

    const empresaSelect = document.getElementById("seguros");
    empresaSelect.value = cargarEmpresa(data.empresa);

    const inputEmpleado = document.getElementById("noseguros");
    inputEmpleado.value = data.empleado;

    return data;
  } catch (e) {
    mostrarAlerta("error", "No se pudo cargar empresa/empleado");
    console.error(e);
    return null;
  }
}

function normalizarHora(hora) {
  if (!hora) return null;

  // Si viene con segundos, los removemos
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(hora)) {
    hora = hora.slice(0, 5); // ej: "08:10:00" -> "08:10"
  }

  const [h, m] = hora.split(':');
  if (!h || !m) return null;

  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function extraerHorariosIntermedios(citas, bloqueos, ausencias) {
  const horariosSet = new Set();

  const procesar = (array) => {
    array.forEach(item => {
      const h = item.hora?.slice(0, 5);
      if (h && !horarios.includes(h)) {
        const [hh, mm] = h.split(':').map(Number);
        // Solo agregar si no está dentro de un bloque estándar
        const minutosTotales = hh * 60 + mm;
        const bloqueInicio = Math.floor(minutosTotales / 30) * 30;
        const diff = minutosTotales - bloqueInicio;

        if (diff > 0 && diff < 30) {
          horariosSet.add(h);
        }
      }
    });
  };

  procesar(citas);
  procesar(bloqueos);
  procesar(ausencias);

  return [...horariosSet];
}
let numeroCitas = 0;
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
    const horariosIntermedios = extraerHorariosIntermedios(citas, bloqueos, ausencias);

    // Combinar, evitar duplicados y ordenar
    const horariosTotales = [...new Set([...horarios])].sort((a, b) => {
      const [ha, ma] = a.split(':').map(Number);
      const [hb, mb] = b.split(':').map(Number);
      return ha * 60 + ma - (hb * 60 + mb);
    });
    numeroCitas = citas.length;
    console.log("Citas desde API:", citas);
    console.log("Ausencias desde API:", ausencias);
    console.log("Bloqueos desde API:", bloqueos);
    tabla.innerHTML = "";

    for (const hora of horariosTotales) {
      const fila = document.createElement("tr");

      // Celda con checkbox
      const celdaCheck = document.createElement("td");
      celdaCheck.innerHTML = `<input type="checkbox" class="check-horario" value="${hora}">`;
      fila.appendChild(celdaCheck);

      // Celda con hora
      const celdaHora = document.createElement("td");
      celdaHora.textContent = hora;
      fila.appendChild(celdaHora);
      const celdaDetalle = document.createElement("td");
      const [horaInicioH, horaInicioM] = hora.split(':').map(Number);
      const horaInicioMinutos = horaInicioH * 60 + horaInicioM;
      const horaFinMinutos = horaInicioMinutos + 30;

      const citasHora = citas.filter(c => {
        const [ch, cm] = c.hora?.split(':').map(Number);
        const citaMinutos = ch * 60 + cm;
        return citaMinutos >= horaInicioMinutos && citaMinutos < horaFinMinutos;
      });
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
        celdaDetalle.addEventListener("click", () => abrirModalDesbloquearHorario(bloqueo.hora));
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

async function cargarNotas(fecha, id) {
  const contenedor = document.getElementById("contenedorNotas");
  contenedor.innerHTML = "";
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/notasAgenda?fecha=${fecha}&idProfesional=${id}`);
    if (!res.ok) throw new Error("No se encontró al profesional");
    const data = await res.json();
    if (!data || data.length === 0) {
      mostrarAlerta("info", "No hay notas para hoy");
      return null;
    }
    data.forEach(n => {
      const card = document.createElement("div");
      card.classList.add("col-12", "mt-3");

      card.innerHTML = `
    <div class="card notas-card">
      <div class="card-body text-center">
        <div class="card-icon">
          <i class="bi bi-exclamation-diamond-fill"></i>
        </div>
        <label class="fw-bold">Titulo: ${n.titulo}</label>
        <textarea class="form-control" rows="3" readonly>${n.detalle || ""}</textarea>
        <label>Hora de inicio: ${n.horaInicio || "-"}</label><br>
        <label>Hora de fin: ${n.horaFin || "-"}</label>
      </div>
    </div>
  `;

      contenedor.appendChild(card);
    });
    return data;
  } catch (e) {
    mostrarAlerta("error", "No se pudo obtener el ID del trabajador");
    console.error(e);
    return null;
  }
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

function abrirModalDesbloquearHorario(hora) {
  document.getElementById("horaD").value = hora;
  const fechaSeleccionada = fechaInput.value;
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  const modal = new bootstrap.Modal(document.getElementById("modalDesbloquearHorario"));
  modal.show();
}

function abrirModalEditarCita(hora, datosCita) {
  const fechaSeleccionada = fechaInput.value;
  localStorage.setItem("horaCita", hora);
  localStorage.setItem("fechaCita", datosCita.fecha);
  // ID de la cita
  document.getElementById("modalEditarCita").dataset.idCita = datosCita.idCita;
  localStorage.setItem("idCita", datosCita.idCita);
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

function abrirNotificaciones() {
  const label = document.getElementById("cumpleaños");
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

async function obtenerTelefonoPaciente(nombre) {
  console.log("Nombre del paciente:", nombre);

  if (!nombre) {
    mostrarAlerta("error", "No hay paciente");
    return null;
  }

  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/telefonoPaciente?nombrePaciente=${encodeURIComponent(nombre)}`);
    if (!res.ok) throw new Error("No se encontró al paciente");
    const data = await res.json();
    return data;
  } catch (e) {
    mostrarAlerta("error", "No se pudo obtener el teléfono del paciente");
    console.error(e);
  }
}

function formatearNumero(numero) {
  const limpio = numero.replace(/\D/g, ''); // Eliminar todo lo que no sea dígito
  if(limpio.length === 10) {
    return '521'+limpio;
  } else if(limpio.startsWith('521')){
    return limpio;
  } else {
    return '521' + limpio;
  }
}

let estadosAnteriores = JSON.parse(localStorage.getItem("estadosCitas")) || {};
function verificarCambiosEnCitas() {
  fetch('https://api-railway-production-24f1.up.railway.app/api/test/estadosCita')
    .then(res => res.json())
    .then(citas => {
      citas.forEach(cita => {
        const id = cita.idCita;
        const nuevoEstado = cita.estado;
        const estadoAnterior = estadosAnteriores[id];

        if (estadoAnterior && estadoAnterior !== nuevoEstado) {
          mostrarAlerta('info', `La cita ${id} ha cambiado de estado a ${nuevoEstado}`);
        }

        // Actualizar el estado almacenado
        estadosAnteriores[id] = nuevoEstado;
      });

      // Guardar en localStorage para futuras comparaciones
      localStorage.setItem("estadosCitas", JSON.stringify(estadosAnteriores));
    })
    .catch(err => {
      console.error("Error al verificar los estados de las citas", err);
    });
}

function enviarRecordatorio(telefono, idCita) {
  const telefonoFormateado = formatearNumero(telefono);
  fetch('https://api-railway-production-24f1.up.railway.app/api/test/enviarRecordatorio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      telefono: telefonoFormateado,
      idCita: idCita,
      plantilla: 'recordatorio_de_cita'
    })
  })
    .then(res => res.json())
    .then(data => {
      mostrarAlerta("success", "Recordatorio enviado");
      console.log(data);
    })
    .catch(err => {
      mostrarAlerta("error", "Error al enviar recordatorio");
      console.error(err);
    });
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
  const fechaHoy = fechaInput?.value  || new Date().toISOString().split("T")[0];
  document.getElementById("fechaTabla").textContent = fechaHoy;
  cargarTrabajadores("trabajador");
  cargarTrabajadores("trabajadorModal");
  cargarTrabajadores("EditartrabajadorModal");
  cargarSeguros("seguros");
  cargarSeguros("Editarseguro");
  cargarServicios("servicios");
  cargarServicios("Editarservicio");
  cargarNotas(fechaHoy  || new Date().toISOString().split("T")[0], id);
  const selectModal = document.getElementById("trabajadorModal");
  const selectPrincipal = document.getElementById("trabajador");
  // Cargar horarios iniciales (ya no pasamos nombre e id manualmente)
  console.log("Usuario", nombre, "ID", id, "Rol", rol);
  cargarHorarios(fechaHoy  || new Date().toISOString().split("T")[0]);
  const inputHora = document.getElementById("hora");
  setInterval(verificarCambiosEnCitas(), 30000);
  inputHora.disabled = true;
  selectPrincipal.addEventListener("change", () => {
    const nombre = selectPrincipal.value;
    const esMajo = nombre === "Psic Majo García";

    inputHora.disabled = !esMajo;
    console.log("Select cambió a:", nombre, "| ¿Desbloquear hora?", esMajo);
  });
  const celdaCheck = document.createElement("td");
  celdaCheck.innerHTML = `<input type="checkbox" class="check-horario" value="${hora}">`;

  document.querySelectorAll(".check-horario").forEach(chk => {
    chk.addEventListener("change", actualizarBotonBloqueo);
  });

  document.getElementById("modalEditarCita").addEventListener("shown.bs.modal", () => {
    document.getElementById("EditartrabajadorModal").required = true;
  });

  document.getElementById("modalEditarCita").addEventListener("hidden.bs.modal", () => {
    document.getElementById("EditartrabajadorModal").required = false;
  });

  if (selectPrincipal) {
    selectPrincipal.addEventListener("change", async () => {
      const nombreSelect = selectPrincipal.value.trim();
      if (!nombreSelect || nombreSelect.includes("Selecciona")) return;

      const selectedIdProfesional = await obtenerIdTrabajador(nombreSelect);
      console.log("ID del profesional seleccionado:", selectedIdProfesional);

      if (selectedIdProfesional) {
        localStorage.setItem("idSelectPrincipal", selectedIdProfesional);
        cargarHorarios(fechaInput?.value  || new Date().toISOString().split("T")[0]); // ahora solo pasamos la fecha
        cargarNotas(fechaInput?.value  || new Date().toISOString().split("T")[0], selectedIdProfesional);
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
        document.getElementById("fechaTabla").textContent = fechaValor;
        cargarHorarios(fechaValor  || new Date().toISOString().split("T")[0]);
        cargarNotas(fechaValor  || new Date().toISOString().split("T")[0], id);
      } else {
        const nombre = selectPrincipal?.value?.trim();
        if (nombre && !nombre.includes("Selecciona")) {
          const id = await obtenerIdTrabajador(nombre);
          if (id) {
            localStorage.setItem("idSelectPrincipal", id);
          }
        }
        document.getElementById("fechaTabla").textContent = fechaValor;
        cargarHorarios(fechaValor  || new Date().toISOString().split("T")[0]);
        cargarNotas(fechaValor  || new Date().toISOString().split("T")[0], localStorage.getItem("idSelectPrincipal") || id);
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

  document.getElementById("recordatorioWhastAppDIA").addEventListener("click", async (e) => {
    e.preventDefault();
    const fecha = fechaInput.value || new Date().toISOString().split("T")[0];

    try {
      const res = await fetch('https://api-railway-production-24f1.up.railway.app/api/test/enviarRecordatoriosDia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha })
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarAlerta("danger", data.error || "Error enviando recordatorios");
        return;
      }

     if (data.total === 0) {
        mostrarAlerta("warning", data.mensaje);
      } else {
        mostrarAlerta("success", `Se enviaron ${data.enviados} de ${data.total} recordatorios`);
        if (data.fallidos.length > 0) {
          console.warn("No se pudieron enviar a estos teléfonos:", data.fallidos);
        }
      }

    } catch (err) {
      console.error(err);
      mostrarAlerta("danger", "Error al enviar recordatorios");
    }
  });


  btnBloqueo.addEventListener("click", async () => {
    seleccionados = Array.from(document.querySelectorAll(".check-horario:checked")).map(chk => chk.value);
    if (seleccionados.length === 0) {
      alert("Por favor, selecciona al menos un horario.");
      return;
    }
    modalMotivo.show();
  });

  document.getElementById("recordatorioWhastApp").addEventListener("click", async () => {
    try {
      const nombrePacienteRecordatorio = document.getElementById("Editarpaciente").value;
      const idCita = localStorage.getItem("idCita");
      if (!nombrePacienteRecordatorio) {
        mostrarAlerta("error", "Por favor, selecciona un paciente");
        return;
      }
      const telefono = await obtenerTelefonoPaciente(nombrePacienteRecordatorio);
      console.log("Teléfono del paciente:", telefono);
      if (!telefono || telefono.length === 0) {
        mostrarAlerta("error", "No se pudo obtener el teléfono del paciente");
        return;
      }
      console.log("ID de la cita:", idCita);
      console.log("Teléfono a enviar:", telefono[0]);
      enviarRecordatorio(telefono[0], idCita);
    } catch (error) {
      console.log("Error al enviar el recordatorio:", error);
      mostrarAlerta("error", "No se pudo enviar el recordatorio");
    }
  });

  document.getElementById("formMotivo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const motivo = document.getElementById("motivo").value;
    const fecha = document.getElementById("fechaSeleccionada").value;
    const hora = seleccionados.join(",");
    const rol = localStorage.getItem("rol");
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

  document.getElementById("formDesbloquearHorario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const hora = document.getElementById("horaD").value;
    const normalizar = normalizarHora(hora);
    const fecha = document.getElementById("fechaSeleccionada").value;
    fetch(`https://api-railway-production-24f1.up.railway.app/api/test/desbloquearHorario?fecha=${fecha}&hora=${normalizar}&rol=${rol}&idSesion=${id}`, {
      method: "DELETE"
    }).then(response => response.json()).then(data => {
      if (data.success) {
        bootstrap.Modal.getInstance(document.getElementById("modalDesbloquearHorario")).hide();
        cargarHorarios(fechaInput.value);
        mostrarAlerta("success", "Horario desbloqueado correctamente");
      } else {
        console.error("Error al desbloquear horario");
      }
    }).catch(error => {
      console.error("Error al desbloquear horario:", error);
    });
  });

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

  document.getElementById("seguros").addEventListener("change", (e) => {
    // Variables comunes
    const seleccionada = e.target.value.trim();
    const inputEmpleado = document.getElementById("noseguros");
    const valorInput = document.getElementById("valor");
    const segurosValue = seleccionada.toLowerCase();

    // Primera parte: Manejo del número de empleado
    if (seleccionada !== empresaPacienteOriginal) {
      inputEmpleado.value = "";
    } else {
      inputEmpleado.value = numeroEmpleadoOriginal;
    }

    // Segunda parte: Habilitar/deshabilitar campos según tipo de seguro
    if (segurosValue.includes("cita") || segurosValue.includes("ninguno")) {
      valorInput.disabled = false;
      valorInput.value = "";
      inputEmpleado.disabled = true;
      inputEmpleado.value = "";
    } else {
      valorInput.disabled = true;
      valorInput.value = "0";
      inputEmpleado.disabled = false;

      // Mantener el valor original si corresponde
      if (seleccionada === empresaPacienteOriginal) {
        inputEmpleado.value = numeroEmpleadoOriginal;
      }
    }
  });

  document.getElementById("formCita").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombrePaciente = document.getElementById("pacientes").value;
    const nombreProfesional = (rol === "SUPER USUARIO" || rol === "RECEPCIÓN")
      ? document.getElementById("trabajadorModal").value : nombre;
    cargarEmpresayNempleado(nombrePaciente);
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
      document.getElementById("formCita").reset();
      bootstrap.Modal.getInstance(document.getElementById("modalCita")).hide();
      cargarHorarios(fechaInput.value); // ya no pasa nombre/id
    } else {
      mostrarAlerta("warning", "No se pudo agendar la cita.");
    }
  });

  document.getElementById("formMotivo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const motivo = document.getElementById("motivo").value.trim();
    if (!motivo) return mostrarAlerta("warning", "Por favor, ingrese un motivo válido.");

    const fecha = document.getElementById("fechaSeleccionada").value;
    let idProfesional = id;
    if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
      idProfesional = await obtenerIdTrabajador(document.getElementById("trabajador").value);
      console.log("El id por parte del select es:", idProfesional);
    }

    if (!idProfesional) return mostrarAlerta("warning", "No hay un ID válido para el profesional.");

    await Promise.all(seleccionados.map(async (horaNormal) => {
      const hora = horaNormal.length === 5 ? horaNormal + ":00"
        : horaNormal.length === 4 ? "0" + horaNormal + ":00"
          : horaNormal;
      const datosBloqueo = { idProfesional, hora, fecha, motivo };

      const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/BloquearHorarios?Sessionrol=${rol}&Sessionid=${idProfesional}`, {
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

  const modalCita = document.getElementById("modalCita");
  const modalEditarCita = document.getElementById("modalEditarCita");
  const modalMotivoAccion = document.getElementById("modalMotivo");
  const modalAusencia = document.getElementById("modalAusencia");
  const modalCancelar = document.getElementById("modalCancelar");
  const modalRepetirCita = document.getElementById("modalRepetirCita");
  const modalCambiarHorario = document.getElementById("modalCambiarHorario");
  let empresaPacienteOriginal = ""; // Para comparar si el usuario regresa a la empresa original
  let numeroEmpleadoOriginal = "";

  modalCita.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formCita");
    form.reset();
  });

  modalEditarCita.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formEditarCita");
    form.reset();
  });

  modalMotivoAccion.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formMotivoAccion");
    form.reset();
  });

  modalAusencia.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formAusencia");
    form.reset();
  });

  modalCancelar.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formCancelar");
    form.reset();
  });

  modalRepetirCita.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formRepetirCita");
    form.reset();
  });

  modalCambiarHorario.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formCambiarHorario");
    form.reset();
  });

  document.getElementById("pacientes").addEventListener("change", async (e) => {
    const nombre = e.target.value.trim();
    if (nombre) {
      const data = await cargarEmpresayNempleado(nombre);
      if (data) {
        empresaPacienteOriginal = data.empresa;
        numeroEmpleadoOriginal = data.empleado;
      }
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

function abrirVentanaE() {
  window.location.href = '../eventos/eventos.html';
}

function CerrarSesion() {
  window.location.href = '/index.html';
  localStorage.clear(); // Limpiar todos los datos almacenados en localStorage a8588c2 (Actualizacion urls):Citas/Agenda.js
}
