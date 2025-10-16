const rol = localStorage.getItem("rol");
const id  = localStorage.getItem("id");  
function cargarSelect(idSelect, opciones, valorSeleccionado = "") {
  const select = document.getElementById(idSelect);
  select.innerHTML = '<option value="" disabled selected>Selecciona una opción</option>';

  opciones.forEach(op => {
    const option = new Option(op.texto, op.valor);
    if (op.valor.toLowerCase() === valorSeleccionado.toLowerCase()) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function abrirVentanaConfiguracion() {
  if (rol === "SUPER USUARIO" || id === "6") {
    window.location.href = '/configuracion.html';
  } else {
    mostrarAlerta("danger", "No tiene permisos para acceder a esta sección");
  }
}


function CerrarSesion() {
  window.location.href = '/index.html';
  localStorage.clear(); // Limpiar todos los datos almacenados en localStorage a8588c2 (Actualizacion urls):Citas/Agenda.js
}

const opcionesSelect = {
  nivelEstudio: [
    { valor: "primaria", texto: "Primaria" },
    { valor: "secundaria", texto: "Secundaria" },
    { valor: "preparatoria", texto: "Preparatoria" },
    { valor: "universidad", texto: "Universidad" },
    { valor: "posgrado", texto: "Posgrado" },
    { valor: "doctorado", texto: "Doctorado" }
  ],
  modalidad: [
    { valor: "linea", texto: "En línea" },
    { valor: "presencial", texto: "Presencial" }
  ],
  discapacidad: [
    { valor: "motriz", texto: "Motriz" },
    { valor: "visual", texto: "Visual" },
    { valor: "auditiva", texto: "Auditiva" },
    { valor: "intelectual", texto: "Intelectual" },
    { valor: "multiple", texto: "Múltiple" },
    { valor: "ninguna", texto: "Ninguna" }
  ]
};

async function recuperarDatos(nombre) {
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/recuperarPacientes?nombre=${encodeURIComponent(nombre)}`);
    if (!res.ok) throw new Error("Error al recuperar datos del paciente");
    const datos = await res.json();
    console.log("Datos recibidos: ", datos);
    const paciente = datos[0];
    console.log(paciente);
    // DATOS GENERALES
    document.getElementById("pacienteNombre").value = paciente.nombre || "";
    document.getElementById("pacienteId").value = paciente.id || "";
    document.getElementById("telefono").value = paciente.telefono || "";
    cargarSexo(paciente.sexo);
    document.getElementById("fechaNacimiento").value = paciente.fechaNacimiento || "";
    document.getElementById("edad").value = paciente.edad || "";

    // DATOS PERSONALES
    document.getElementById("lugarNacimiento").value = paciente.lugarNacimiento || "";
    cargarSelect("nivelEstudio", opcionesSelect.nivelEstudio, datos.nivelEstudio);
    document.getElementById("gradoEstudio").value = paciente.gradoEstudio || "";
    document.getElementById("ocupacion").value = paciente.ocupacion || "";
    document.getElementById("estadoCivil").value = paciente.estadoCivil || "";
    document.getElementById("CURP").value = paciente.curp || "";
    document.getElementById("RFC").value = paciente.rfc || "";

    // DATOS PROFESIONALES
    cargarEmpresa(paciente.empresa);
    document.getElementById("numero_empleado").value = paciente.numero_empleado || "";
    document.getElementById("modalidad").value = cargarModalidad(paciente.modalidad);
    document.getElementById("planta").value = paciente.planta || "";
    document.getElementById("area").value = paciente.area || "";
    document.getElementById("trabajador").value = paciente.profesional || "";
    document.getElementById("estadoProfesional").value = paciente.estadoProfesional || "";
    document.getElementById("discapacidad").value = cargarDiscapacidad(paciente.discapacidad);

    // DATOS EMERGENCIA
    document.getElementById("nombreContacto").value = paciente.contEmergencia || "";
    document.getElementById("numeroEmergencia").value = paciente.telefonoE || "";
    document.getElementById("parentesco").value = paciente.parentescoEmergencia || "";
    document.getElementById("motivo").value = paciente.motivoConsulta || "";
    document.getElementById("detalles").value = paciente.detalles || "";
    document.getElementById("fechaInicio").value = paciente.fechaConsulta || "";
    document.getElementById("fechaAlta").value = paciente.fechaAlta || "";

    // DATOS DOMICILIO
    document.getElementById("CP").value = paciente.codPostal || "";
    document.getElementById("estadosInput").value = paciente.estado || "";
    document.getElementById("municipio").value = paciente.municipio || "";
    document.getElementById("localidad").value = paciente.localidad || "";
    document.getElementById("manzana").value = paciente.manzana || "";
    document.getElementById("calle").value = paciente.calle || "";
    document.getElementById("numeroInt").value = paciente.nExterior || "";
    document.getElementById("numeroExt").value = paciente.nInterior || "";
    cargarColonia(paciente.colonia);
    document.getElementById("comoSupiste").value = paciente.comoSeEntero || "";
  } catch (error) {
    console.error("❌ Error al recuperar datos del paciente:", error);
  }
}

async function actualizarDatos(id) {
  const datos = {
    // DATOS GENERALES
    nombre: document.getElementById("pacienteNombre").value,
    telefono: document.getElementById("telefono").value,
    sexo: document.getElementById("sexo").value,
    fechaNacimiento: document.getElementById("fechaNacimiento").value,
    edad: document.getElementById("edad").value,

    // DATOS PERSONALES
    lugarNacimiento: document.getElementById("lugarNacimiento").value,
    nivelEstudio: document.getElementById("nivelEstudio").value,
    gradoEstudio: document.getElementById("gradoEstudio").value,
    ocupacion: document.getElementById("ocupacion").value,
    estadoCivil: document.getElementById("estadoCivil").value,
    curp: document.getElementById("CURP").value,
    rfc: document.getElementById("RFC").value,

    // DATOS PROFESIONALES
    empresa: document.getElementById("seguros").value,
    numero_empleado: document.getElementById("numero_empleado").value,
    modalidad: document.getElementById("modalidad").value,
    planta: document.getElementById("planta").value,
    area: document.getElementById("area").value,
    profesional: document.getElementById("trabajador").value,
    estadoProfesional: document.getElementById("estadoProfesional").value,
    discapacidad: document.getElementById("discapacidad").value,

    // DATOS EMERGENCIA
    contEmergencia: document.getElementById("nombreContacto").value,
    telefonoE: document.getElementById("numeroEmergencia").value,
    parentescoEmergencia: document.getElementById("parentesco").value,
    motivoConsulta: document.getElementById("motivo").value,
    detalles: document.getElementById("detalles").value,
    fechaConsulta: document.getElementById("fechaInicio").value,
    fechaAlta: document.getElementById("fechaAlta").value,

    // DATOS DOMICILIO
    codPostal: parseInt(document.getElementById("CP").value) || 0,
    estado: document.getElementById("estadosInput").value,
    municipio: document.getElementById("municipio").value,
    localidad: document.getElementById("localidad").value,
    manzana: document.getElementById("manzana").value,
    calle: document.getElementById("calle").value,
    nInterior: parseInt(document.getElementById("numeroInt").value) || 0,
    nExterior: parseInt(document.getElementById("numeroExt").value) || 0,
    colonia: document.getElementById("colonia").value,
    comoSeEntero: document.getElementById("comoSupiste").value,
  };
  console.log(datos);
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/actualizarPaciente?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error al actualizar los datos");
    mostrarAlerta("success", "Datos actualizados correctamente.");
    document.getElementById("formPaciente").reset();
    bootstrap.Modal.getInstance(document.getElementById("modalPaciente")).hide();
  } catch (error) {
    mostrarAlerta("danger", "No se pudieron actualizar los datos.");
    console.log(error);
  }
}

function cargarTrabajadores(idSelect) {
  const select = document.getElementById(idSelect);
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/trabajadoresActivos")
    .then(r => r.json())
    .then(data => {
      select.innerHTML = "<option value='' disabled selected>Especialista a cargo</option>";
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

function cargarEstados(idSelect) {
  const select = document.getElementById(idSelect);
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/Estados")
    .then(r => r.json())
    .then(data => {
      select.innerHTML = "Estado";
      data.forEach(t => {
        const option = new Option(t, t);
        select.appendChild(option);
      });
    })
    .catch(() => {
      select.innerHTML = "<option>Error al cargar</option>";
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

function cargarColonia(coloniaPaciente, idSelect = "colonia") {
  const select = document.getElementById(idSelect);

  // Limpia el select
  select.innerHTML = '<option value="" disabled selected>Colonia</option>';

  fetch("https://api-railway-production-24f1.up.railway.app/api/test/colonia")
    .then(r => r.json())
    .then(data => {
      data.forEach(nombre => {
        const option = new Option(nombre, nombre);
        if (typeof coloniaPaciente === 'string' && nombre.toLowerCase() === coloniaPaciente.toLowerCase()) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Error al cargar colonias:", err));
}

function cargarEmpresa(empresaPaciente, idSelect = "seguros") {
  const select = document.getElementById(idSelect);
  // Limpia el select
  select.innerHTML = '<option value="" disabled selected>Empresa</option>';
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/empresa")
    .then(r => r.json())
    .then(data => {
      data.forEach(nombre => {
        const option = new Option(nombre, nombre);
        if (typeof empresaPaciente === 'string' && nombre.toLowerCase() === empresaPaciente.toLowerCase()) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Error al cargar empresas:", err));
}

function cargarModalidad(modalidadPaciente, idSelect = "modalidad") {
  const select = document.getElementById(idSelect);
  // Limpia el select
  select.innerHTML = '<option value="" disabled selected>Modalidad</option>';
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/modalidad")
    .then(r => r.json())
    .then(data => {
      data.forEach(nombre => {
        const option = new Option(nombre, nombre);
        if (nombre.toLowerCase() === modalidadPaciente.toLowerCase()) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Error al cargar modalidad:", err));
}

function cargarDiscapacidad(discapacidadPaciente, idSelect = "discapacidad") {
  const select = document.getElementById(idSelect);
  // Limpia el select
  select.innerHTML = '<option value="" disabled selected>Discapacidad</option>';
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/discapacidad")
    .then(r => r.json())
    .then(data => {
      data.forEach(nombre => {
        const option = new Option(nombre, nombre);
        if (nombre.toLowerCase() === discapacidadPaciente.toLowerCase()) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Error al cargar discapacidades:", err));
}

function cargarSexo(sexoPaciente, idSelect = "sexo") {
  const select = document.getElementById(idSelect);

  select.innerHTML = '<option value="" disabled selected>Sexo</option>';

  fetch("https://api-railway-production-24f1.up.railway.app/api/test/sexo")
    .then(r => r.json())
    .then(data => {
      data.forEach(nombre => {
        const option = new Option(nombre, nombre);
        if (typeof sexoPaciente === 'string' && nombre.toLowerCase() === sexoPaciente.toLowerCase()) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Error al cargar el tipo de sexo:", err));
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

function abrirModalPacientes() {
  const modal = new bootstrap.Modal(document.getElementById("modalPaciente"));
  modal.show();
  cargarSeguros("seguros");
}

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

function abrirModalNuevoPaciente() {
  const modal = new bootstrap.Modal(document.getElementById("modalNuevoPaciente"));
  modal.show();
  cargarSeguros("Nuevoseguro");
  cargarLugarNacimiento("NuevolugarNacimiento");
  cargarTrabajadores("Nuevotrabajador");
}

async function nuevoPaciente() {
  const datos = {
    // DATOS GENERALES
    nombre: document.getElementById("NuevonombrePaciente").value,
    telefono: document.getElementById("Nuevotelefono").value,
    sexo: document.getElementById("Nuevosexo").value,
    fechaNacimiento: document.getElementById("NuevofechaNacimiento").value,
    edad: document.getElementById("Nuevoedad").value,

    // DATOS PERSONALES
    lugarNacimiento: document.getElementById("NuevolugarNacimiento").value,
    nivelEstudio: document.getElementById("NuevonivelEstudio").value,
    gradoEstudio: document.getElementById("NuevogradoEstudio").value,
    ocupacion: document.getElementById("Nuevoocupacion").value,
    estadoCivil: document.getElementById("NuevoestadoCivil").value,
    curp: document.getElementById("NuevoCURP").value,
    rfc: document.getElementById("NuevoRFC").value,

    // DATOS PROFESIONALES
    empresa: document.getElementById("Nuevoseguro").value,
    numero_empleado: document.getElementById("Nuevonumero_empleado").value,
    modalidad: document.getElementById("Nuevomodalidad").value,
    planta: document.getElementById("Nuevoplanta").value,
    area: document.getElementById("Nuevoarea").value,
    profesional: document.getElementById("Nuevotrabajador").value,
    estadoProfesional: document.getElementById("NuevoestadoProfesional").value,
    discapacidad: document.getElementById("Nuevodiscapacidad").value,

    // DATOS EMERGENCIA
    contEmergencia: document.getElementById("NuevonombreContacto").value,
    telefonoE: document.getElementById("NuevonumeroEmergencia").value,
    parentescoEmergencia: document.getElementById("Nuevoparentesco").value,
    motivoConsulta: document.getElementById("Nuevomotivo").value,
    detalles: document.getElementById("Nuevodetalles").value,
    fechaConsulta: document.getElementById("NuevofechaInicio").value,
    fechaAlta: document.getElementById("NuevofechaAlta").value,

    // DATOS DOMICILIO
    codPostal: parseInt(document.getElementById("NuevoCP").value) || 0,
    estado: document.getElementById("NuevoestadosInput").value,
    municipio: document.getElementById("Nuevomunicipio").value,
    localidad: document.getElementById("Nuevolocalidad").value,
    manzana: document.getElementById("Nuevomanzana").value,
    calle: document.getElementById("Nuevocalle").value,
    nInterior: parseInt(document.getElementById("NuevonumeroInt").value) || 0,
    nExterior: parseInt(document.getElementById("NuevonumeroExt").value) || 0,
    colonia: document.getElementById("Nuevocolonia").value,
    comoSeEntero: document.getElementById("NuevocomoSupiste").value,
  };

  console.log(datos);
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/nuevoPaciente`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)

    });
    if (!res.ok) throw new Error("Error al crear el nuevo paciente");
    mostrarAlerta("success", "Paciente creado correctamente");
    document.getElementById("formPacienteNuevo").reset();
    bootstrap.Modal.getInstance(document.getElementById("modalNuevoPaciente")).hide();
  } catch (error) {
    mostrarAlerta("danger", "El paciente ya existe o no se puede crear.");
    console.log(error);
  }
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

document.addEventListener("DOMContentLoaded", () => {
  cargarTrabajadores("trabajador");
  cargarEstados("lugarNacimiento");
  cargarPacientes();
  console.log("ID: ", id);
  //cargarTrabajadores("NuevoTrabajador");
  //cargarEstados("NuevoLugarNacimiento");
  let otro = document.getElementById("otro");
  const labelOtro = document.getElementById("labelOtro");
  otro.hidden = true;
  labelOtro.hidden = true;
  const modalElement = document.getElementById("modalNuevoPaciente");
  let valorComoSupiste = document.getElementById("comoSupiste").value.toLowerCase();
  const empresaSelects = [
    { selectId: "seguros", inputId: "numero_empleado" },
    { selectId: "Nuevoseguro", inputId: "Nuevonumero_empleado" }
  ];

  empresaSelects.forEach(({ selectId, inputId }) => {
    const select = document.getElementById(selectId);
    const input = document.getElementById(inputId);

    // Inicialmente ocultamos el input y le asignamos 0
    input.value = 0;
    input.style.display = "none";

    select.addEventListener("change", () => {
      if (select.value === "") {
        input.value = 0;
        input.style.display = "none";
      } else {
        input.value = "";
        input.style.display = "block";
      }
    });
  });

     const modalNotificaciones = document.getElementById("modalNotificaciones");
  modalNotificaciones.addEventListener("hidden.bs.modal", async (event) => {
    const form = document.getElementById("formNotificaciones");
    form.reset();
  });

  document.getElementById("comoSupiste").addEventListener("change", (e) => {
    if (valorComoSupiste === "otro") {
      labelOtro.hidden = false;
      otro.hidden = false;
      otro.value = ""; // permitir que el usuario escriba
    } else {
      labelOtro.hidden = true;
      otro.hidden = true;
      otro.value = "No aplica";
    }
  });

  document.getElementById("buscarCP").addEventListener("click", async () => {
    const campoDetalleCP = document.getElementById("CP").value.trim();
    let res = "";
    try {
      console.log("Buscando CP en paciente existente");
      res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/domicilio?cp=${campoDetalleCP}`);
      if (!res.ok) throw new Error("Error de CP");
      const datos = await res.json();
      if (datos.length > 0) {
        document.getElementById("estadosInput").value = datos[0].estado;
        document.getElementById("municipio").value = datos[0].municipio;
        document.getElementById("localidad").value = datos[0].localidad;

        const coloniaInputSelect = document.getElementById("colonia");
        coloniaInputSelect.innerHTML = "<option value=''>Colonia</option>";
        datos.forEach(d => {
          const opt = document.createElement("option");
          opt.value = d.colonia;
          opt.textContent = d.colonia;
          coloniaInputSelect.appendChild(opt);
        });
      }
    } catch (error) {
      mostrarAlerta("danger", "No se pudo encontrar información del código postal.");
      console.log(error);
    }
  });

  document.getElementById("buscarNuevoCP").addEventListener("click", async () => {
    const campoNuevoCP = document.getElementById("NuevoCP").value.trim();
    let res = "";
    try {
      console.log("Buscando CP en nuevo paciente");
      res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/domicilio?cp=${campoNuevoCP}`);
      if (!res.ok) throw new Error("Error de CP");
      const datos = await res.json();
      if (datos.length > 0) {
        document.getElementById("NuevoestadosInput").value = datos[0].estado;
        document.getElementById("Nuevomunicipio").value = datos[0].municipio;
        document.getElementById("Nuevolocalidad").value = datos[0].localidad;

        const coloniaSelect = document.getElementById("Nuevocolonia");
        coloniaSelect.innerHTML = "<option value=''>Colonia</option>";
        datos.forEach(d => {
          const opt = document.createElement("option");
          opt.value = d.colonia;
          opt.textContent = d.colonia;
          coloniaSelect.appendChild(opt);
        });
      }
    } catch (error) {
      mostrarAlerta("danger", "No se pudo encontrar información del código postal.");
      console.log(error);
    }
  });


  document.getElementById('modalPaciente').addEventListener('hidden.bs.modal', function () {
    document.getElementById('formPaciente').reset();
  });

  document.getElementById("fechaNacimiento").addEventListener("change", () => {
    const fechaInput = document.getElementById("fechaNacimiento").value;
    if (!fechaInput) return;
    const Nacimiento = new Date(fechaInput);
    const hoy = new Date();
    let edad = hoy.getFullYear() - Nacimiento.getFullYear();
    const mes = hoy.getMonth() - Nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < Nacimiento.getDate())) {
      edad--;
    }
    document.getElementById("edad").value = edad > 0 ? edad : "0";
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
  })

  document.getElementById("btnAplicarCambios").addEventListener("click", () => {
    const id = document.getElementById("pacienteId").value.trim();
    document.getElementById("busqueda").value = "";
    cargarPacientes();
    actualizarDatos(id);
  })

  document.getElementById("btnGuardarPaciente").addEventListener("click", () => {
    nuevoPaciente();
  });

  document.getElementById("tabla-pacientes").addEventListener("click", function (e) {
    if (e.target.tagName === "TD") {
      const nombre = e.target.textContent.trim();
      console.log("Nombre seleccionado:", nombre);
      document.getElementById("nombrePaciente").value = nombre;
      abrirModalPacientes();
      recuperarDatos(nombre);
    }
  })
});

function abrirVentanaHC() {
  window.location.href = '../historias_clinicas/hc.html';
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











