 async function cargarCitasPaciente(nombrePaciente, nombreProfesional) {
      const selectCita = document.getElementById("cita");
      selectCita.innerHTML = "<option value='' disabled selected>Selecciona una cita</option>";

      try {
        // 1. Obtener ID del paciente
        const resPaciente = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/pacientesByName?nombrePaciente=${encodeURIComponent(nombrePaciente)}`);
        const pacienteData = await resPaciente.json();
        const idPaciente = pacienteData;

        // 2. Obtener ID del profesional
        const resProfesional = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByName?nombreProfesional=${encodeURIComponent(nombreProfesional)}`);
        const profesionalData = await resProfesional.json();
        const idProfesional = profesionalData;

        // 3. Obtener citas del paciente
        const resCitas = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/citasPorPaciente?idPaciente=${idPaciente}&idTrabajador=${idProfesional}`);
        const citas = await resCitas.json();

        if (Array.isArray(citas) && citas.length > 0) {
          citas.forEach(cita => {
            const texto = `${cita.fecha} ${cita.hora} - ${cita.tipo}`;
            const option = new Option(texto, cita.idCita);
            selectCita.appendChild(option);
          });
        } else {
          const option = new Option("No hay citas registradas", "", true, true);
          option.disabled = true;
          selectCita.appendChild(option);
        }

      } catch (error) {
        console.error("Error al cargar citas:", error);
        const option = new Option("Error al cargar citas", "", true, true);
        option.disabled = true;
        selectCita.appendChild(option);
      }
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

    function abrirModalHC() {
      const modal = new bootstrap.Modal(document.getElementById("modalHC"));
      modal.show();
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
        const nombre = e.target.textContent.trim();
        console.log("Nombre seleccionado:", nombre);
        document.getElementById("pacienteNombre").innerText = nombre || "";
        document.getElementById("nombrePaciente").value = nombre;
        abrirModalHC();
        const usuario = localStorage.getItem("usuario");
        console.log(usuario);
        cargarCitasPaciente(nombre, usuario);
      });

      document.getElementById("formDatosHC").addEventListener("submit", async function (e) {
        e.preventDefault();
        // 1. Obtener ID del paciente
        const resPaciente = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/pacientesByName?nombrePaciente=${encodeURIComponent(document.getElementById("pacienteNombre").innerText.trim())}`);
        const pacienteData = await resPaciente.json();
        const idPaciente = pacienteData;
        const idProfesional = localStorage.getItem("id"); // trabajador logueado
        const correoProfesional = localStorage.getItem("email") || "Sin correo"; // email o nombre de usuario
        const nombrePaciente = document.getElementById("pacienteNombre").textContent.trim();
        const idCita = document.getElementById("cita").value;
        const notas = document.getElementById("notas").value.trim();
        const complemento = document.getElementById("complemento").value.trim();

        if (!idCita || !notas) {
          alert("⚠️ Completa todos los campos requeridos.");
          return;
        }

        const datos = {
          idPaciente: parseInt(idPaciente),
          idCita: parseInt(idCita),
          idProfesional: parseInt(idProfesional),
          nombrePaciente,
          tipo: "Notas de evolución",
          notas,
          complement: complemento || "Sin complementos",
          correoProfesional
        };
        
        console.log("🟢 Enviando historia clínica:", datos);

        try {
          const res = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/guardarHistoria", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
          });

          if (!res.ok) throw new Error("Error al guardar historia clínica");

          alert("✅ Notas guardadas correctamente.");
          document.getElementById("formDatosHC").reset();
          bootstrap.Modal.getInstance(document.getElementById("modalHC")).hide();

        } catch (err) {
          console.error("❌ Error al guardar historia:", err);
          alert("❌ Error al guardar las notas.");
        }
      });
    });

    function abrirVentanaP() {
      window.location.href = '../pacientes/pacientesmain.html';
    }
    function abrirVentanaA() {
      window.location.href = '../citas/Agenda.html';
    }
    function abrirVentanaR() {
      window.location.href = '../reportes/reportes.html';
    }