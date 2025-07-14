const horarios = [];
    const nombre = localStorage.getItem("usuario");
    const id = localStorage.getItem("id");
    const rol = localStorage.getItem("rol");
    const fechaInput = document.getElementById("fechaSeleccionada");
    const tabla = document.getElementById("tabla-horarios");

    for (let h = 8; h <= 20; h++) {
      horarios.push(`${h}:00`);
      if (h < 20) horarios.push(`${h}:30`);
    }

    fechaInput.addEventListener("change", () => {
      const nuevaFecha = fechaInput.value;
      cargarHorarios(nuevaFecha);
    });

    function construirUrlBloqueos(fecha, rol, idProfesional) {
      let url = `https://api-railway-production-24f1.up.railway.app/api/test/citasBloqueadas?fecha=${fecha}&rol=${rol}`;

      if (rol !== "SUPER USUARIO" && rol !== "RECEPCIÓN") {
        url += `&idProfesional=${idProfesional}`;
      }

      return url;
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

    function construirUrlCitas(fecha, rol, nombreProfesional, idProfesional) {
      let url = `https://api-railway-production-24f1.up.railway.app/api/test/citas?fecha=${fecha}&rol=${rol}`;

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

    async function repetirCita() {
      const idCita = document.getElementById("modalEditarCita").dataset.idCita;
      if (!idCita) return alert("No hay un ID");

      const nuevaFecha = prompt("nueva fecha (YYYY-MM-DD):");
      const nuevaHora = prompt("nueva hora (HH:MM):");
      console.log("nuevaHora: ", nuevaHora)
      const horaNormalizada = normalizarHora(nuevaHora);
      console.log("horaNormalizada: ", horaNormalizada);
      if (!nuevaFecha || !horaNormalizada) return;
      console.log("hora: ", horaNormalizada);
      const url = `https://api-railway-production-24f1.up.railway.app/api/test/repetirCita?idCita=${idCita}&nuevaFecha=${nuevaFecha}&nuevaHora=${horaNormalizada}`;
      const res = await fetch(url, {
        method: "POST"
      })

      try {
        const data = await res.json();
        if (res.ok && data.success) {
          alert("Cita repetida");
          bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
          cargarHorarios(fechaInput.value);
        } else {
          alert("Error al repetir la cita");
        }
      } catch (e) {
        console.error("Error de red o parsing:", e);
        alert("Error al procesar la solicitud.");
      }
    }

    async function cancelarCita() {
      const idCita = document.getElementById("modalEditarCita").dataset.idCita;
      if (!idCita) return alert("No hay un ID");

      const confirmar = confirm("¿Estás seguro de que deseas cancelar esta cita?");
      if (!confirmar) return;

      const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/cancelarCita?idCita=${idCita}`, {
        method: "PUT"
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert("Cita cancelada");
        bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
        cargarHorarios(fechaInput.value);
      } else {
        alert("Error al cancelar la cita");
      }
    }

    async function cambiarHorario() {
      const idCita = document.getElementById("modalEditarCita").dataset.idCita;
      if (!idCita) return alert("No hay un ID");

      const nuevaFecha = prompt("nueva fecha (YYYY-MM-DD):");
      const nuevaHora = prompt("nueva hora (HH:MM):");
      const horaNormalizada = normalizarHora(nuevaHora);

      if (!nuevaFecha || !horaNormalizada) return;

      console.log("ID:", idCita, "fecha:", nuevaFecha, "hora:", horaNormalizada);
      const url = `https://api-railway-production-24f1.up.railway.app/api/test/cambiarHorario?idCita=${idCita}&nuevaFecha=${nuevaFecha}&nuevaHora=${horaNormalizada}`;

      try {
        const res = await fetch(url, { method: "PUT" });
        const data = await res.json();

        if (res.ok && data.success) {
          alert("Horario editado");
          bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
          cargarHorarios(fechaInput.value);
        } else {
          alert("Error al editar el horario");
          console.error("Respuesta no exitosa:", data);
        }
      } catch (e) {
        console.error("Error de red o parsing:", e);
        alert("Error al procesar la solicitud.");
      }
    }

    async function cargarHorarios(fecha, nombreProfesional = nombre) {
      try {
        const urlCitas = construirUrlCitas(fecha, rol, nombreProfesional, id);
        const urlBloqueos = construirUrlBloqueos(fecha, rol, id);

        const [citasResp, bloqueosResp] = await Promise.all([
          fetch(urlCitas),
          fetch(urlBloqueos)
        ]);

        if (!citasResp.ok || !bloqueosResp.ok) {
          console.error("Error en la respuesta del servidor");
          tabla.innerHTML = "<tr><td colspan='2'>Error al cargar datos</td></tr>";
          return;
        }

        const citas = await citasResp.json();
        const bloqueos = await bloqueosResp.json();

        if (!Array.isArray(citas) || !Array.isArray(bloqueos)) {
          console.error("Datos inválidos recibidos");
          tabla.innerHTML = "<tr><td colspan='2'>Datos no disponibles</td></tr>";
          return;
        }
        console.log("Cita desde API:", citas);
        tabla.innerHTML = "";
        for (const hora of horarios) {
          const fila = document.createElement("tr");
          const celdaHora = document.createElement("td");
          celdaHora.textContent = hora;
          const horaNormalizada = normalizarHora(hora)
          const celdaDetalle = document.createElement("td");
          const cita = citas.find(c => c.hora?.slice(0, 5) === hora.padStart(5, '0'));
          const bloqueo = bloqueos.find(b => b.hora?.slice(0, 5) === hora.padStart(5, '0'));
          if (cita) {
            const rol = localStorage.getItem("rol");
            let id = localStorage.getItem("id");
            const trabajadorSeleccionado = document.getElementById("trabajador").value;
            if (rol === "SUPER USUARIO" || rol === "RECEPCIÓN") {
              if (trabajadorSeleccionado && trabajadorSeleccionado !== "--- Seleccione un trabajador ---") {
                id = await obtenerIdTrabajadorModal(trabajadorSeleccionado);
                localStorage.setItem("id", id);
              } else {
                id = localStorage.getItem("id");
              }
            }
            console.log("ID de la cita:", cita.idCita);
            celdaDetalle.innerHTML = `
    <span class="badge bg-success d-block text-start" style="font-size: 16px;" onclick='abrirModalEditarCitaPorID(${cita.idCita})'>
      Paciente: ${cita.nombrePaciente}<br>
      Servicio: ${cita.nombreServicio}<br>
      Seguro: ${cita.seguro}<br>
      ${cita.nseguro ? `No. Seguro: ${cita.nseguro}<br>` : ""}
    </span>`;
            celdaDetalle.classList.add("celda-cita");
          } else if (bloqueo) {
            celdaDetalle.innerHTML = `
    <span class="badge bg-danger d-block text-start" style="font-size: 16px; background-color: #e9d1d3">
      BLOQUEADO<br>
      Bloqueado ${bloqueo.bloqueadoPor}<br>
      Motivo:    ${bloqueo.motivo}
    </span>`;
            celdaDetalle.classList.add("celda-bloqueo");
            celdaDetalle.style.cursor = "pointer";
            console.log("celdaDetalle", horaNormalizada);
            celdaDetalle.addEventListener("click", () => desbloquearHorario(fecha, horaNormalizada, rol, id));
          } else {
            celdaDetalle.innerHTML = `
    <button class="btn btn-outline-primary btn-sm" onclick="abrirModal('${hora}')">Agendar</button>`;
            celdaDetalle.classList.add("celda-libre");
          }
          fila.appendChild(celdaHora);
          fila.appendChild(celdaDetalle);
          tabla.appendChild(fila);
        }
      } catch (error) {
        console.error("Error cargando horarios:", error);
        tabla.innerHTML = "<tr><td colspan='2'>Error inesperado</td></tr>";
      }
    }

    async function obtenerIdTrabajadorModal() {
      const nombre = document.getElementById("trabajadorModal").value?.trim();
      console.log("Nombre del trabajador seleccionado:", nombre);

      if (!nombre || nombre === "Selecciona un trabajador") {
        alert("⚠️ Debes seleccionar un trabajador válido");
        return null;
      }

      try {
        const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${nombre}`);
        if (!res.ok) throw new Error("No se encontró al profesional");
        const data = await res.json();
        return data.id;
      } catch (e) {
        alert("❌ Error al obtener ID del trabajador");
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
        alert("❌ No se pudo obtener la información de la cita");
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
          select.innerHTML = "<option value='' disabled selected>Selecciona un seguro</option>";
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

    function mostrarAlerta(tipo, mensaje, recargar = false) {
      const iconos = {
        success: "check-circle-fill",
        warning: "exclamation-triangle-fill",
        danger: "exclamation-triangle-fill",
        info: "info-fill"
      };
      const alerta = document.createElement("div");
      alerta.className = `alert alert-${tipo} alert-dismissible fade show d-flex align-items-center mt-2`;
      alerta.role = "alert";
      alerta.innerHTML = `
        <svg class="bi flex-shrink-0 me-2" role="img" aria-label="${tipo}">
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

        if (recargar) {
          location.reload(); // 🔄 recarga la página después del tiempo
        }
      }, 5000);
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
        alert("✅ Cambios guardados correctamente");
        bootstrap.Modal.getInstance(document.getElementById("modalEditarCita")).hide();
        cargarHorarios(fechaInput.value);
      } else {
        alert("❌ " + (resultado.error || "No se pudieron aplicar los cambios"));
      }
    });

    document.addEventListener("DOMContentLoaded", () => {
      // ✅ Establecer fecha de hoy al iniciar
      fechaInput.valueAsDate = new Date();
      cargarTrabajadores("trabajador");
      cargarTrabajadores("trabajadorModal");
      cargarTrabajadores("EditartrabajadorModal");
      cargarSeguros("seguros");
      cargarSeguros("Editarseguro");
      cargarServicios("servicios");
      cargarServicios("Editarservicio");
      let hora = document.getElementById("hora").value.trim();
      let fecha = document.getElementById("fechaSeleccionada").value;
      const fechaHoy = fechaInput.value;
      cargarHorarios(fechaHoy);
      const motivo = document.getElementById("motivo").value.trim();
      const rol = localStorage.getItem("rol");
      const id = localStorage.getItem("id");
      const select = document.getElementById("trabajadorModal");

      select.addEventListener("change", async () => {
        const nombre = select.value.trim();
        console.log("Nombre seleccionado en el change select:", nombre);
        if (!nombre) {
          localStorage.removeItem("idTrabajadorSeleccionado");
          return;
        }

        try {
          const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${nombre}`);
          if (!res.ok) {
            throw new Error(`Error: ${res.status} ${res.statusText}`);
          }
          const data = await res.json();
          mostrarAlerta("success", "✅ Cita agendada correctamente");
          console.log("Respuesta completa de la API:", data);
          localStorage.setItem("idTrabajadorSeleccionado", data);
          console.log("ID del trabajador guardado:", data);
        } catch (e) {
          console.error("Error al obtener el ID del trabajador:", e);
          alert("❌ No se pudo obtener el ID del profesional seleccionado.");
        }
      });

      if (rol !== "RECEPCIÓN") {
        document.getElementById("trabajador").addEventListener("change", () => {
          const nombreSeleccionado = document.getElementById("trabajador").value;
          cargarHorarios(fechaInput.value, nombreSeleccionado);
        });
      }

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
          alert("✅ " + resultado.message);
          bootstrap.Modal.getInstance(document.getElementById("modalCita")).hide();
          cargarHorarios(fechaInput.value);
          document.getElementById("formCita").reset();
        } else {
          alert("❌ Error: " + (resultado.error || "No se pudo agendar la cita."));
        }
      });

      document.getElementById("formMotivo").addEventListener("submit", async (e) => {
        e.preventDefault();

        const horaInput = document.getElementById("hora").value.trim();
        let hora = horaInput.length === 5 ? horaInput + ":00" :
          horaInput.length === 4 ? "0" + horaInput + ":00" : horaInput;

        const fecha = document.getElementById("fechaSeleccionada").value;
        const motivo = document.getElementById("motivo").value.trim();
        const rol = localStorage.getItem("rol");
        const id = parseInt(localStorage.getItem("id"));
        const nombreProfesional = document.getElementById("trabajadorModal").value.trim();
        const idSeleccionado = parseInt(localStorage.getItem("idTrabajadorSeleccionado"));

        if (!motivo) {
          alert("⚠️ Debes ingresar un motivo para bloquear el horario.");
          return;
        }

        let idProfesional = id;
        if ((rol === "SUPER USUARIO" || rol === "RECEPCIÓN") && nombreProfesional !== "--- Seleccione un profesional ---") {
          if (!idSeleccionado || isNaN(idSeleccionado)) {
            alert("❌ No se pudo obtener el ID del profesional seleccionado.");
            return;
          }
          idProfesional = idSeleccionado;
        }

        if (!idProfesional || isNaN(idProfesional)) {
          alert("❌ ID de profesional inválido. No se realizará el bloqueo.");
          return;
        }

        const datosBloqueo = {
          idProfesional,
          fecha,
          hora,
          motivo
        };

        const response = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/BloquearHorarios?Sessionrol=${rol}&Sessionid=${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosBloqueo)
        });

        const resultado = await response.json().catch(() => ({}));
        console.log("fetch BloquearHorarios response:", response, resultado);
        console.log("Enviando bloqueo:", datosBloqueo);

        if (response.ok && resultado.success) {
          alert("✅ " + resultado.message);
          bootstrap.Modal.getInstance(document.getElementById("modalMotivo")).hide();
          cargarHorarios(fecha);
          document.getElementById("formMotivo").reset();
        } else {
          alert("❌ " + (resultado.error || "No se pudo bloquear el horario."));
        }
      });
    });

    function abrirVentanaHC() {
      window.location.href = '../Historias clinicas/hc.html';
    }

    function abrirVentanaP() {
      window.location.href = '../Pacientes/pacientesmain.html';
    }

    function abrirVentanaR() {
      window.location.href = '../Reportes/reportes.html';
    }

    function CerrarSesion() {
      window.location.href = '/frontend/index.html';
      localStorage.clear(); // Limpiar todos los datos almacenados en localStorage
    }