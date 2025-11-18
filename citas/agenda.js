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
  alerta.style.zIndex = "2000";

  alerta.innerHTML = `
    <svg style="z-index: 2000" class="bi flex-shrink-0 me-2 ${colores[tipo]}" width="20" height="20" role="img" aria-label="${tipo}">
        <use xlink:href="#${iconos[tipo]}"/>
    </svg>
    <div style="z-index: 2000">${mensaje}</div>
    <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  document.getElementById("alertContainer").appendChild(alerta);

  setTimeout(() => {
    alerta.classList.remove("show");
    alerta.classList.add("hide");
    setTimeout(() => alerta.remove(), 500);
  }, 6000);
}

fechaInput.addEventListener("change", async () => {
  const nuevaFecha = fechaInput.value;

  if (rol === "ESPECIALISTA") {
    // Para especialista, usamos el id del localStorage
    await cargarHorarios(nuevaFecha);
    await cargarCitasCanceladas(nuevaFecha);
  }
  else if (
    (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") &&
    document.getElementById("trabajador").value === "Selecciona un trabajador"
  ) {
    // Si no hay trabajador seleccionado
    await cargarHorarios(nuevaFecha);
    await cargarCitasCanceladas(nuevaFecha);
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

function contruirUrlCitasCanceladas(fecha, rol, nombreProfesional, idProfesional) {
  let url = `https://api-railway-production-24f1.up.railway.app/api/test/citasCanceladas?fecha=${fecha}&rol=${rol}`;

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
  if (!empresaPaciente) return "vacio";
  const select = document.getElementById(idSelect);
  const currentValue = select.value;
  try {
    const response = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/empresa");
    const empresasAPI = await response.json();

    //Coincidencia exacta (case insensitive)
    const coincidencia = Array.from(select.options).find(option =>
      option.value.toLowerCase() === empresaPaciente.toLowerCase()
    );

    if (coincidencia) {
      select.value = coincidencia.value;
    }
    // Si no hay coincidencia pero existe en la API
    else if (empresasAPI.some(emp => emp.toLowerCase() === empresaPaciente.toLowerCase())) {
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

async function cargarEmpresaPaciente(nombre) {
  if (!nombre || nombre.trim() === "") {
    mostrarAlerta("warning", "El nombre del paciente está vacío o no se pudo recuperar.");
    return null;
  }
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/datosCitaPaciente?nombrePaciente=${encodeURIComponent(nombre)}`);
    if (!res.ok) throw new Error("Paciente sin empresa o no encontrada");

    const data = await res.json();
    const campoSeguros = document.getElementById("seguros");
    if (campoSeguros) campoSeguros.value = data.empresa || "";

    return data;
  } catch (e) {
    console.error("Se produjo un error al recuperar la empresa del paciente: " + e);
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
let numeroCitas = 0;

async function cargarHorarios(fecha) {
  try {
    const { nombre, id } = await obtenerProfesionalContexto();
    const rol = localStorage.getItem("rol");

    if (!id) {
      tabla.innerHTML = "<tr><td colspan='2'>Selecciona un trabajador</td></tr>";
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
      tabla.innerHTML = "<tr><td colspan='2'>Error al cargar datos</td></tr>";
      return;
    }

    const citas = await citasResp.json();
    const bloqueos = await bloqueosResp.json();
    const ausencias = await ausenciaResp.json();

    if (!Array.isArray(citas) || !Array.isArray(bloqueos)) {
      tabla.innerHTML = "<tr><td colspan='2'>Datos no disponibles</td></tr>";
      return;
    }
    // Combinar, evitar duplicados y ordenar
    const horariosBase = generarHorariosBase("08:00", "20:00", 30);
    numeroCitas = citas.length;
    tabla.innerHTML = "";

    const horariosExtras = [
      ...citas.map(c => c.hora?.slice(0, 5)),
      ...bloqueos.map(b => b.hora?.slice(0, 5)),
      ...ausencias.map(a => a.hora?.slice(0, 5))
    ];

    const horariosTotales = [...new Set([...horariosBase, ...horariosExtras])]
      .sort((a, b) => {
        const [ha, ma] = a.split(':').map(Number);
        const [hb, mb] = b.split(':').map(Number);
        return ha * 60 + ma - (hb * 60 + mb);
      });

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

      const citasHora = citas.filter(c => c.hora?.slice(0, 5) === hora);
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
        celdaDetalle.innerHTML = citasHora.map(cita => {
          const esAusencia = cita.estado_cita?.toUpperCase() === "AUSENCIA";
          return `
    <span class="badge ${esAusencia ? 'bg-warning' : 'bg-success-light'} d-block text-start mb-1" 
          style="font-size: 16px; ${esAusencia ? 'color:#000;' : ''}" 
          onclick='abrirModalEditarCitaPorID(${cita.idCita})'>
      <i class="bi bi-file-person icono-animado" style="font-size: 16px;"></i> Paciente: ${cita.nombrePaciente}<br>
      <i class="bi bi-wrench-adjustable-circle icono-animado" style="font-size: 16px;"></i> Servicio: ${cita.nombreServicio}<br>
      <i class="bi bi-list-columns-reverse icono-animado" style="font-size: 16px;"></i> Estado: ${cita.estado_cita}<br>
      ${cita.nseguro ? `No. Seguro: ${cita.nseguro}<br>` : ""}
    </span>
  `;
        }).join("");
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

async function cargarCitasCanceladas(fecha) {
  const tablaCanceladas = document.getElementById("tabla-Citas-Canceladas");
  tablaCanceladas.innerHTML = "";
  try {
    const { nombre, id } = await obtenerProfesionalContexto();
    const rol = localStorage.getItem("rol");
    if (!id) {
      tablaCanceladas.innerHTML = "<tr><td colspan='2'>Selecciona un trabajador</td></tr>";
      return;
    }
    console.log(`Usuario ${nombre} ID ${id} Rol ${rol}`);
    const filtroProfesionalId = rol === "SUPER USUARIO" || rol === "RECEPCIÓN"
      ? obtenerIdTrabajador(document.getElementById("trabajador").value.trim())
      : null;

    const urlCitasCanceladas = contruirUrlCitasCanceladas(fecha, rol, nombre, id);
    console.log("🔗 URL generada:", urlCitasCanceladas);
    const response = await fetch(urlCitasCanceladas);
    if (!response.ok) {
      tablaCanceladas.innerHTML = "<tr><td colspan='2'>Error al cargar citas canceladas</td></tr>";
      return;
    }
    const data = await response.json();
    const citasCanceladas = data.filter(cita => cita.estado_cita === "Cancelada");
    for (const cita of citasCanceladas) {
      const fila = document.createElement("tr");
      const celdaHora = document.createElement("td");
      celdaHora.textContent = cita.hora;
      fila.appendChild(celdaHora);

      const celdaDetalle = document.createElement("td");
      celdaDetalle.innerHTML = `
      <div class="badge bg-danger text-start w-100 p-2" style="font-size: 16px; color: #000">
      <strong>CANCELADA</strong><br>
      Paciente: ${cita.nombrePaciente}<br>
      Fecha: ${cita.fecha}
      </div>`;
      fila.appendChild(celdaDetalle);
      tablaCanceladas.appendChild(fila);
    }
    return citasCanceladas;
  } catch (error) {
    console.error("Error cargando citas canceladas:", error);
  }
}

async function cargarCitasHoy(fecha) {
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/citasHoy?fecha=${fecha}`);
    if (!res.ok) {
      mostrarAlerta("info", "No hay citas para hoy o la busqueda no se pudo completar.");
    }
    const datos = await res.json();
    if (datos.length === 0) {
      mostrarAlerta("info", "Sin citas para hoy");
      return;
    }
    console.log("Historial recibido: ", datos);
    const tbody = document.getElementById("tabla-CitasHoy");
    tbody.innerHTML = "";
    datos.forEach(cita => {
      const fila = document.createElement("tr");
      const celdaHora = document.createElement("td");
      celdaHora.textContent = cita.hora;
      fila.appendChild(celdaHora);

      const celdaDetalle = document.createElement("td");
      celdaDetalle.innerHTML = `
      <div class="badge bg-info text-start w-100 p-2" style="font-size: 16px; color: #000">
      Paciente: ${cita.nombrePaciente}<br>
      Profesional: ${cita.nombreProfesional}<br>
      Estado: ${cita.estado_cita}<br>
      </div>`;
      fila.appendChild(celdaDetalle);
      tbody.appendChild(fila);
    });
  } catch (error) {
    mostrarAlerta("danger", "Paciente sin citas o mal registrado.");
  }
}

function generarHorariosBase(inicio, fin, intervalo) {
  const [hInicio, mInicio] = inicio.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);
  const start = hInicio * 60 + mInicio;
  const end = hFin * 60 + mFin;

  const horarios = [];
  for (let i = start; i <= end; i += intervalo) {
    const h = String(Math.floor(i / 60)).padStart(2, '0');
    const m = String(i % 60).padStart(2, '0');
    horarios.push(`${h}:${m}`);
  }
  return horarios;
}

async function obtenerIdTrabajador(nombre) {
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
    console.log("Datos de la cita obtenidos:", datosCita);
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
    data.forEach(n => {
      const card = document.createElement("div");
      card.classList.add("col-12", "mt-3");

      card.innerHTML = `
      <div style="background-color: #4f96dc; color: white; border-radius: 10px; padding: 10px; width: 100%; display: flex; align-items: center; gap: 10px;">
        <i class="bi bi-exclamation-diamond-fill" style ="font-size = 24px" ></i>
        <span style="flex: 1;" readonly>${n.titulo || ""}</label>
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

async function cargarEventos(fecha, idProfesional) {
  const contenedor = document.getElementById("contenedorEventos");
  contenedor.innerHTML = "";
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eventosAgenda?fecha=${fecha}&idProfesional=${idProfesional}`);
    if (!res.ok) throw new Error("No se encontró al profesional");
    const data = await res.json();
    if (!data || data.length === 0) {
      const card = document.createElement("div");
      card.classList.add("col-12", "mt-3");
      card.innerHTML = `
    <div class="card notas-card">
      <div class="card-body text-center">
        <div class="card-icon">
          <i class="bi bi-exclamation-diamond-fill"></i>
        </div>
        <label class="fw-bold">Sin eventos</label>
      </div>
    </div>
  `;
      contenedor.appendChild(card);
    }

    data.forEach((n, index) => {
      const item = document.createElement("div");
      item.classList.add("carousel-item");
      if (index === 0) item.classList.add("active");
      const card = document.createElement("div");
      card.innerHTML = `
    <div class="card notas-card">
      <div class="card-body text-center">
        <div class="card-icon">
          <i class="bi bi-exclamation-diamond-fill"></i>
        </div>
        <label class="fw-bold">Titulo: ${n.nombre}</label>
        <textarea class="form-control" rows="3" readonly>${n.detalles || ""}</textarea>
      </div>
    </div>
  `;
      item.appendChild(card);
      contenedor.appendChild(item);
    });
    return data;
  } catch (e) {
    mostrarAlerta("error", "No se pudo obtener el ID del trabajador para eventos");
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

function abrirModalEventos() {
  const modal = new bootstrap.Modal(document.getElementById("modalEventos"));
  modal.show();
}

function abrirModalDesbloquearHorario(hora) {
  document.getElementById("horaD").value = hora;
  const fechaSeleccionada = fechaInput.value;
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  const modal = new bootstrap.Modal(document.getElementById("modalDesbloquearHorario"));
  modal.show();
}

async function abrirModalEditarCita(hora, datosCita) {
  const fechaSeleccionada = fechaInput.value;
  localStorage.setItem("horaCita", hora);
  localStorage.setItem("fechaCita", datosCita.fecha);
  // ID de la cita
  document.getElementById("modalEditarCita").dataset.idCita = datosCita.idCita;
  localStorage.setItem("idCita", datosCita.idCita);
  // 📅 Actualiza encabezado con hora y fecha
  document.getElementById("CitaHoraFecha").textContent = `${hora} - ${fechaSeleccionada}`;
  document.getElementById("hora").value = hora;
  localStorage.setItem("horaCita", hora);
  // 📝 Llenar campos
  document.getElementById("Editarpaciente").value = datosCita.nombrePaciente;
  localStorage.setItem("nombrePaciente", datosCita.nombrePaciente);
  document.getElementById("Editarvalor").value = datosCita.cuota || "";
  document.getElementById("Editarservicio").value = datosCita.nombreServicio;
  document.getElementById("Editarseguro").value = datosCita.seguro || "";
  if (datosCita.cuota) {
    document.getElementById("Editarvalor").disabled = false;
    document.getElementById("Editarvalor").value = datosCita.cuota;
  } else {
    document.getElementById("Editarvalor").value = "";
  }
  document.getElementById("EditartrabajadorModal").value = datosCita.nombreProfesional;
  document.getElementById("Editardetalles").value = datosCita.detalles || "";
  document.getElementById("Editarpaciente").readOnly = true;

  // 🟦 Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById("modalEditarCita"));
  modal.show();
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
  abrirNotificacionesEstadoCita();
  const modal = new bootstrap.Modal(document.getElementById("modalNotificaciones"));
  modal.show();
}

let estadosAnteriores = JSON.parse(localStorage.getItem("estadosCitas")) || {};
let notificaciones = JSON.parse(localStorage.getItem("notificacionesCitas")) || [];

function verificarCambiosEnCitas(fechaA, idProfesional) {
  const label = document.getElementById("estadoCita");

  fetch(`https://api-railway-production-24f1.up.railway.app/api/test/estadoCita?fecha=${fechaA}&idEspecialista=${idProfesional}`)
    .then(res => res.json())
    .then(citas => {
      citas.forEach(cita => {
        const id = cita.idCita;
        const nuevoEstado = cita.estado;
        const estadoAnterior = estadosAnteriores[id];
        const nombrePaciente = cita.nombrePaciente;
        const fecha = cita.fecha;
        const hora = cita.hora;

        if (estadoAnterior && estadoAnterior !== nuevoEstado) {
          const mensaje = `[${fecha} ${hora}] ${nombrePaciente} ha ${nuevoEstado.toLowerCase()} su cita`;

          if (!notificaciones.includes(mensaje)) {
            notificaciones.push(mensaje);
            mostrarAlerta("info", mensaje);
            label.innerHTML += `<br>${mensaje}`;
          }
        }
        // Actualizar estado guardado
        estadosAnteriores[id] = nuevoEstado;
      });

      // Guardar en localStorage
      localStorage.setItem("estadosCitas", JSON.stringify(estadosAnteriores));
      localStorage.setItem("notificacionesCitas", JSON.stringify(notificaciones));
    })
    .catch(err => {
      console.error("Error al verificar los estados de las citas", err);
    });
}

function abrirNotificacionesEstadoCita() {
  const label = document.getElementById("estadoCita");
  if (notificaciones.length > 0) {
    label.innerHTML = notificaciones.join("<br>");
  } else {
    label.innerHTML = "Sin notificaciones de estado de citas";
  }
}

function registrarError(id, mensaje) {
  if (!id || !mensaje) {
    console.log("ID o mensaje nulo, no se registra el error");
    return;
  }
  fetch(`https://api-railway-production-24f1.up.railway.app/api/test/registrarErrores?id=${id}&mensaje=${mensaje}`, {
    method: "POST"
  }).then(response => {
    if (!response.ok) {
      console.error("Error al registrar el error");
    } else {
      console.log("Error registrado correctamente");
    }
  }).catch(error => {
    console.error
      ("Error al registrar el error:", error);
  });
}

async function obtenerTelefonoPaciente(nombre) {
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
  if (limpio.length === 10) {
    return '521' + limpio;
  } else if (limpio.startsWith('521')) {
    return limpio;
  } else {
    return '521' + limpio;
  }
}
/**
 * Sends a reminder notification for an appointment via API call
 * @param {string} telefono - The phone number to send the reminder to
 * @param {string} idCita - The ID of the appointment to send reminder for
 */
function enviarRecordatorio(telefono, idCita) {
  // Format the phone number before sending
  const telefonoFormateado = formatearNumero(telefono);
  // Make API request to send reminder
  fetch('https://api-railway-production-24f1.up.railway.app/api/test/enviarRecordatorio', {
    method: 'POST', // Using POST method to send data
    headers: {
      'Content-Type': 'application/json' // Setting content type to JSON
    },
    body: JSON.stringify({ // Converting JavaScript object to JSON string
      telefono: telefonoFormateado, // Formatted phone number
      idCita: idCita, // Appointment ID
      plantilla: 'recordatorio_de_cita' // Template for the reminder message
    })
  })
    .then(res => res.json()) // Parse response as JSON
    .then(data => {
      // Show success message to user
      mostrarAlerta("success", "Recordatorio enviado");
    })
    .catch(err => {
      // Show error message to user and log error to console
      mostrarAlerta("error", "Error al enviar recordatorio");
      console.error(err);
    });
}

function notificarCancelacion(telefono, idCita) {
  const telefonoFormateado = formatearNumero(telefono);
  if (!telefonoFormateado) {
    mostrarAlerta("error", "Paciente sin numero o inválido");
    return;
  }
  if (!idCita) {
    mostrarAlerta("error", "Cita sin ID");
    return;
  }
  console.log("Notificando cancelación a:", telefonoFormateado, "Cita ID:", idCita);
  fetch('https://api-railway-production-24f1.up.railway.app/api/test/notificarCancelacion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      telefono: telefonoFormateado,
      idCita: idCita
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Notificación de cancelación enviada:", data);
    })
    .catch(err => {
      mostrarAlerta("error", "Error al enviar recordatorio");
      console.error(err);
    });
}

const iconos = document.querySelectorAll(".icono-animado");
function animacionSecuencial() {
  iconos.forEach((icono, index) => {
    setTimeout(() => {
      icono.classList.add("icono-iluminado");
      setTimeout(() => icono.classList.remove("icono-iluminado"), 800);
    }, index * 500); // 500ms entre cada ícono
  });
}

function cargarLugarNacimiento(idSelect) {
  const select = document.getElementById(idSelect);
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/Estados")
    .then(r => r.json())
    .then(data => {
      select.innerHTML = '<option value="" disabled selected>Lugar de nacimiento</option>';
      data.forEach(t => {
        const option = new Option(t, t);
        select.appendChild(option);
      });
    })
    .catch(() => {
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

async function nuevoPaciente() {
  const discapacidad = "ninguna";
  const datos = {
    nombre: document.getElementById("NuevonombrePaciente").value,
    telefono: document.getElementById("Nuevotelefono").value,
    sexo: document.getElementById("Nuevosexo").value,
    fechaNacimiento: document.getElementById("NuevofechaNacimiento").value,
    edad: document.getElementById("Nuevoedad").value,
    lugarNacimiento: document.getElementById("NuevolugarNacimiento").value,
    empresa: document.getElementById("Nuevoseguro").value,
    discapacidad: discapacidad
  };

  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/nuevoPaciente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    if (!res.ok) throw new Error("Error al crear el nuevo paciente");

    mostrarAlerta("success", "Paciente creado");
    document.getElementById("formPacienteNuevo").reset();
    bootstrap.Modal.getInstance(document.getElementById("modalNuevoPaciente")).hide();

    // 🔄 Recargar lista de pacientes
    const pacientes = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/pacientes")
      .then(res => res.json());

    recargarListaPacientes(pacientes);

  } catch (error) {
    mostrarAlerta("danger", "El paciente ya existe o no se puede crear.");
    console.error(error);
  }
}

function recargarListaPacientes(pacientes) {
  const input = document.getElementById("pacientesInput");
  const lista = document.getElementById("sugerencias");
  input.oninput = () => {
    const texto = input.value.toLowerCase();
    lista.innerHTML = "";

    if (!texto) {
      lista.style.display = "none";
      return;
    }

    const filtrados = pacientes.filter(p => p.nombre.toLowerCase().includes(texto));
    filtrados.forEach(p => {
      const li = document.createElement("li");
      li.textContent = p.nombre;
      li.onclick = () => {
        input.value = p.nombre;
        lista.style.display = "none";
      };
      lista.appendChild(li);
    });
    lista.style.display = filtrados.length > 0 ? "block" : "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Establecer fecha de hoy al iniciar
  console.log("Usuario: ", nombre, "id: ", id, "rol: ", rol);
  fechaInput.valueAsDate = new Date();
  const fechaHoy = fechaInput?.value || new Date().toISOString().split("T")[0];
  document.getElementById("fechaTabla").textContent = fechaHoy;
  cargarTrabajadores("trabajador");
  cargarTrabajadores("trabajadorModal");
  cargarTrabajadores("EditartrabajadorModal");
  cargarSeguros("seguros");
  cargarSeguros("Editarseguro");
  cargarServicios("servicios");
  cargarServicios("Editarservicio");
  cargarNotas(fechaHoy || new Date().toISOString().split("T")[0], id);
  cargarEventos(fechaHoy || new Date().toISOString().split("T")[0], id);
  const selectModal = document.getElementById("trabajadorModal");
  const selectPrincipal = document.getElementById("trabajador");
  // Cargar horarios iniciales
  cargarHorarios(fechaHoy || new Date().toISOString().split("T")[0]);
  cargarCitasCanceladas(fechaHoy || new Date().toISOString().split("T")[0]);
  cargarCitasHoy(fechaHoy || new Date().toISOString().split("T")[0]);
  const inputHora = document.getElementById("hora");
  setInterval(() => {
    const fechaHoy = new Date().toISOString().split("T")[0];
    verificarCambiosEnCitas(fechaHoy, id);
  }, 60000);
  setInterval(() => {
    animacionSecuencial();
  }, 10000);
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

  if (rol !== "ESPECIALISTA") {
    document.getElementById("EditartrabajadorModal").required = true;
    document.getElementById("EditartrabajadorModal").disabled = false;
  } else {
    document.getElementById("EditartrabajadorModal").required = false;
    document.getElementById("EditartrabajadorModal").disabled = true;
  }

  document.getElementById("citasHoy").disabled = rol === "ESPECIALISTA";

  if (selectPrincipal) {
    selectPrincipal.addEventListener("change", async () => {
      const nombreSelect = selectPrincipal.value.trim();
      if (!nombreSelect || nombreSelect.includes("Selecciona")) return;
      const selectedIdProfesional = await obtenerIdTrabajador(nombreSelect);
      if (selectedIdProfesional) {
        localStorage.setItem("idSelectPrincipal", selectedIdProfesional);
        cargarHorarios(fechaInput?.value || new Date().toISOString().split("T")[0]); // ahora solo pasamos la fecha
        cargarCitasCanceladas(fechaInput?.value || new Date().toISOString().split("T")[0]);
        cargarNotas(fechaInput?.value || new Date().toISOString().split("T")[0], selectedIdProfesional);
        cargarEventos(fechaInput?.value || new Date().toISOString().split("T")[0], selectedIdProfesional);
        setInterval(() => {
          verificarCambiosEnCitas(fechaInput?.value || new Date().toISOString().split("T")[0], selectedIdProfesional);
        }, 60000);
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
      localStorage.setItem("idTrabajadorSeleccionado", modalIdProfesional);
    });
  }

  if (fechaInput) {
    fechaInput.addEventListener("change", async () => {
      const fechaValor = fechaInput.value;
      if (rol === "ESPECIALISTA") {
        document.getElementById("fechaTabla").textContent = fechaValor;
        cargarHorarios(fechaValor || new Date().toISOString().split("T")[0]);
        cargarCitasCanceladas(fechaValor || new Date().toISOString().split("T")[0]);
        cargarCitasHoy(fechaValor || new Date().toISOString().split("T")[0]);
        cargarNotas(fechaValor || new Date().toISOString().split("T")[0], id);
        cargarEventos(fechaValor || new Date().toISOString().split("T")[0], id);
        setInterval(() => {
          verificarCambiosEnCitas(fechaValor || new Date().toISOString().split("T")[0], id);
        }, 60000);
      } else {
        const nombre = selectPrincipal?.value?.trim();
        if (nombre && !nombre.includes("Selecciona")) {
          const id = await obtenerIdTrabajador(nombre);
          if (id) {
            localStorage.setItem("idSelectPrincipal", id);
          }
        }
        document.getElementById("fechaTabla").textContent = fechaValor;
        cargarHorarios(fechaValor || new Date().toISOString().split("T")[0]);
        cargarCitasHoy(fechaValor || new Date().toISOString().split("T")[0]);
        cargarCitasCanceladas(fechaValor || new Date().toISOString().split("T")[0]);
        cargarNotas(fechaValor || new Date().toISOString().split("T")[0], localStorage.getItem("idSelectPrincipal") || id);
        cargarEventos(fechaValor || new Date().toISOString().split("T")[0], localStorage.getItem("idSelectPrincipal") || id);
        setInterval(() => {
          verificarCambiosEnCitas(fechaValor || new Date().toISOString().split("T")[0], id);
        }, 60000);
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
      cargarCitasHoy(fechaInput.value);
      cargarCitasCanceladas(fechaInput.value);
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
    let idTrabajador = id;

    if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
      if (selectPrincipal.value && selectPrincipal.value !== "Selecciona un trabajador") {
        idTrabajador = await obtenerIdTrabajador(selectPrincipal.value);
      }
    }

    if (!idTrabajador) {
      mostrarAlerta("error", "El id del usuario es nulo");
      return;
    }

    try {
      const res = await fetch('https://api-railway-production-24f1.up.railway.app/api/test/enviarRecordatoriosDia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, idTrabajador })
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarAlerta("danger", data.error || "Error enviando recordatorios");
        return;
      }

      if (data.total === 0) {
        mostrarAlerta("warning", data.mensaje);
      } else {
        mostrarAlerta("success", `Recordatorios enviados`);
        if (data.fallidos.length > 0) {
          console.warn("No se pudieron enviar a estos teléfonos:", data.fallidos);
        }
      }

    } catch (err) {
      console.error(err);
      mostrarAlerta("danger", "Error al enviar recordatorios");
    }
  });

  document.getElementById("cancelarCitasDia").addEventListener("click", async () => {
    const fecha = fechaInput.value || new Date().toISOString().split("T")[0];
    let idTrabajador = id;
    if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
      if (selectPrincipal.value && selectPrincipal.value !== "Selecciona un trabajador") {
        idTrabajador = await obtenerIdTrabajador(selectPrincipal.value);
      }
    }

    if (!idTrabajador) {
      mostrarAlerta("error", "El id del usuario es nulo o no existe");
      return;
    }

    try {
      const res = await fetch('https://api-railway-production-24f1.up.railway.app/api/test/notificarCancelaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, idTrabajador })
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarAlerta("danger", data.error || "Las notificaciones no puedieron ser enviadas")
        return;
      }

      if (data.total === 0) {
        mostrarAlerta("warning", "No hay citas para este día");
        return;
      } else {
        mostrarAlerta("success", `Notificaciones enviadas`);
        if (data.fallidos.length > 0) {
          console.warn("No se pudieron enviar a estos teléfonos:", data.fallidos);
        }
      }
    } catch {
      mostrarAlerta("danger", "Error al enviar notificaciones");
      return;
    }
  });

  btnBloqueo.addEventListener("click", async () => {
    seleccionados = Array.from(document.querySelectorAll(".check-horario:checked")).map(chk => chk.value);
    if (seleccionados.length === 0) {
      mostrarAlerta("warning", "Por favor, selecciona al menos un horario.");
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
      if (!telefono || telefono.length === 0) {
        mostrarAlerta("error", "No se pudo obtener el teléfono del paciente");
        return;
      }
      enviarRecordatorio(telefono[0], idCita);
    } catch (error) {
      console.log("Error al enviar el recordatorio:", error);
      mostrarAlerta("error", "No se pudo enviar el recordatorio");
    }
  });

  document.getElementById("btnAucensia").addEventListener("click", async () => {
    try {
      const nombrePacienteCancelacion = document.getElementById("Editarpaciente").value;
      if (!nombrePacienteCancelacion) {
        mostrarAlerta("error", "Por favor, selecciona un paciente");
        return;
      }
      const telefono = await obtenerTelefonoPaciente(nombrePacienteCancelacion);
      if (!telefono || telefono.length === 0) {
        mostrarAlerta("error", "No se pudo obtener el teléfono del paciente");
        return;
      }
      const idCita = localStorage.getItem("idCita");
      const fecha = localStorage.getItem("fechaCita");
      const hora = localStorage.getItem("horaCita");
      if (!idCita || !fecha || !hora) {
        mostrarAlerta("error", "La fecha, hora o el ID de la cita es nulo o no se recupero");
        return;
      }
    } catch (error) {
      console.log("Error al enviar el recordatorio por SMS:", error);
      mostrarAlerta("error", "No se pudo enviar la notificación de cancelación");
    }
  });

  document.getElementById("cancelarCitasDia").addEventListener("click", async (e) => {
    e.preventDefault();
    const fecha = fechaInput.value || new Date().toISOString().split("T")[0];
    let idTrabajador = id;

    if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
      if (selectPrincipal.value && selectPrincipal.value !== "Selecciona un trabajador") {
        idTrabajador = await obtenerIdTrabajador(selectPrincipal.value);
      }
    }

    if (!idTrabajador) {
      mostrarAlerta("error", "El id del usuario es nulo");
      return;
    }

    try {
      const res = await fetch('https://api-railway-production-24f1.up.railway.app/api/test/notificarCancelaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, idTrabajador })
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarAlerta("danger", data.error || "Error enviando recordatorios");
        return;
      }

      if (data.total === 0) {
        mostrarAlerta("warning", data.mensaje);
      } else {
        mostrarAlerta("success", `Recordatorios enviados`);
        if (data.fallidos.length > 0) {
          console.warn("No se pudieron enviar a estos teléfonos:", data.fallidos);
        }
      }

    } catch (err) {
      console.error(err);
      mostrarAlerta("danger", "Error al enviar recordatorios");
    }
  });

  document.getElementById("citasHoy").addEventListener("click", async (e) => {
    e.preventDefault();
    const fecha = fechaInput.value || new Date().toISOString().split("T")[0];
    const modal = new bootstrap.Modal(document.getElementById("modalCitasHoy"));
    modal.show();
    cargarCitasHoy(fecha);
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
        cargarCitasCanceladas(fechaInput.value);
        mostrarAlerta("success", "Horario desbloqueado correctamente");
      } else {
        console.error("Error al desbloquear horario");
      }
    }).catch(error => {
      console.error("Error al desbloquear horario:", error);
    });
  });

  document.getElementById("nuevoPaciente").addEventListener("click", () => {
    const modal = new bootstrap.Modal(document.getElementById("modalNuevoPaciente"));
    modal.show();
    cargarSeguros("Nuevoseguro");
    cargarLugarNacimiento("NuevolugarNacimiento");
  });

  document.getElementById("btnGuardarPaciente").addEventListener("click", async (e) => {
    nuevoPaciente();
  });

  document.getElementById("NuevofechaNacimiento").addEventListener("change", () => {
    const fechaInput = document.getElementById("NuevofechaNacimiento").value;
    if (!fechaInput) return;
    const Nacimiento = new Date(fechaInput);
    const hoy = new Date();
    let edad = hoy.getFullYear() - Nacimiento.getFullYear();
    const mes = hoy.getMonth() - Nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < Nacimiento.getDate())) {
      edad--;
    }
    document.getElementById("Nuevoedad").value = edad > 0 ? edad : "0";
  });

  const input = document.getElementById("pacientesInput");
  const lista = document.getElementById("sugerencias");
  let pacientes = [];

  // cargar pacientes
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/pacientes")
    .then(res => res.json())
    .then(data => pacientes = data);

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

  document.getElementById("formCita").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombrePaciente = document.getElementById("pacientesInput").value.trim();
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
      estadoCita: "Agendada"
    };

    if (!nombreProfesional || !datosCita.fecha || !datosCita.hora) {
      mostrarAlerta("warning", "Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (!nombrePaciente || nombrePaciente.length === 0) {
      mostrarAlerta("warning", "Por favor, ingrese un nombre de paciente válido.");
      return;
    }

   try {
      const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/agendarCitas?rol=${rol}&SessionId=${id}&SessionUser=${nombre}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosCita)
      });
      if (!res.ok) {
        console.error("Error en la respuesta de la API al agendar cita:", res.statusText);
        mostrarAlerta("error", "Error al agendar la cita. Por favor, inténtelo de nuevo.");
        registrarError(id, `Error al agendar cita: ${res.status} ${res.statusText}`);
        return;
      }
      const resultado = await res.json();
      if (resultado?.success) {
        mostrarAlerta("success", "Cita agendada correctamente.");
        document.getElementById("formCita").reset();
        bootstrap.Modal.getInstance(document.getElementById("modalCita")).hide();
        cargarHorarios(fechaInput.value); // ya no pasa nombre/id
        cargarCitasHoy(fechaInput.value);
        cargarCitasCanceladas(fechaInput.value);
      } else {
        mostrarAlerta("warning", "El paciente no existe o lleno mal algun campo");
      }
    } catch (error) {
      console.error("Error al agendar la cita:", error);
      mostrarAlerta("error", "Error al agendar la cita. Por favor, inténtelo de nuevo.");
      registrarError(id, `Error al agendar cita: ${error.message}`);
    }
  });

  document.getElementById("modalEditarCita").addEventListener("submit", async (e) => {
    e.preventDefault();
    const datos = {
      nombrePaciente: document.getElementById("Editarpaciente").value,
      nombreProfesional: document.getElementById("EditartrabajadorModal").value,
      cuota: parseInt(document.getElementById("Editarvalor").value.trim()) || 0,
      nombreServicio: document.getElementById("Editarservicio").value,
      seguro: document.getElementById("Editarseguro").value,
      detalles: document.getElementById("Editardetalles").value,
      fecha: fechaInput.value,
      hora: document.getElementById("hora").value
    };
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
      cargarCitasHoy(fechaInput.value);
      cargarCitasCanceladas(fechaInput.value);
    } else {
      mostrarAlerta("error", "No se pudieron aplicar los cambios");
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
    cargarCitasHoy(fecha);
    cargarCitasCanceladas(fecha);
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
        cargarCitasHoy(fechaInput.value);
        cargarCitasCanceladas
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
    const telefono = await obtenerTelefonoPaciente(localStorage.getItem("nombrePaciente"));
    console.log("Teléfono obtenido para cancelación:", telefono);
    if (!telefono || telefono.length === 0) {
      mostrarAlerta("error", "No se pudo obtener el teléfono del paciente");
      return;
    }
    if (!idCita) {
      mostrarAlerta("warning", "No hay un ID válido para la cita");
      return;
    }
    console.log("Cancelando cita con ID:", idCita);
    console.log("Teléfono para notificación:", telefono[0]);
    console.log("Fecha de la cita:", localStorage.getItem("fechaCita"));
    console.log("Hora de la cita:", localStorage.getItem("horaCita"));
    try {
      const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/cancelarCita?idCita=${idCita}`, {
        method: "PUT"
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notificarCancelacion(telefono[0], idCita);
        bootstrap.Modal.getInstance(document.getElementById("modalCancelar")).hide();
        cargarHorarios(fechaInput.value);
        cargarCitasHoy(fechaInput.value);
        cargarCitasCanceladas(fechaInput.value);
        mostrarAlerta("success", "Cita cancelada, notificación de cancelación enviada");
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
    const horaNormalizada = normalizarHora(nuevaHora);
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
        cargarCitasHoy(fechaInput.value);
        cargarCitasCanceladas(fechaInput.value);
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
        cargarCitasHoy(fechaInput.value);
        cargarCitasCanceladas(fechaInput.value);
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
  const modalNotificaciones = document.getElementById("modalNotificaciones");

  modalCita.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formCita");
    form.reset();
  });

  modalEditarCita.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formEditarCita");
    form.reset();
  });

  modalMotivoAccion.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formMotivoAccion");
    form.reset();
  });

  modalAusencia.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formAusencia");
    form.reset();
  });

  modalCancelar.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formCancelar");
    form.reset();
  });

  modalRepetirCita.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formRepetirCita");
    form.reset();
  });

  modalCambiarHorario.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formCambiarHorario");
    form.reset();
  });

  modalNotificaciones.addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("formNotificaciones");
    form.reset();
  });

  document.getElementById("pacientesInput").addEventListener("change", async (e) => {
    const nombre = document.getElementById("pacientesInput").value.trim();
    if (nombre) {  
        const data = await cargarEmpresaPaciente(nombre);    
    }
  });
});

function abrirVentanaConfiguracion() {
  if (rol === "SUPER USUARIO" || id === "6") {
    window.location.href = '/configuracion.html';
  } else {
    mostrarAlerta("danger", "No tiene permisos para acceder a esta sección");
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
