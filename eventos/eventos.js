function abrirVentanaP() {
  window.location.href = '../pacientes/pacientesmain.html';
}
function abrirVentanaA() {
  window.location.href = '../citas/agenda.html';
}
function abrirVentanaR() {
  window.location.href = '../reportes/reportes.html';
}

function abrirVentanaH() {
  window.location.href = '../historias_clinicas/hc.html';
}

function abrirVentanaConfiguracion() {
  if (rol !== "SUPER USUARIO") {
    mostrarAlerta("danger", "No tiene permisos para acceder a esta sección");
    return;
  } else {
    window.location.href = '/configuracion.html';
  }
}

function CerrarSesion() {
  window.location.href = '/index.html';
  localStorage.clear(); // Limpiar todos los datos almacenados en localStorage a8588c2 (Actualizacion urls):Citas/Agenda.js
}

function cargarTrabajadores(idSelect) {
  const select = document.getElementById(idSelect);
  fetch("https://api-railway-production-24f1.up.railway.app/api/test/trabajadoresActivosId")
    .then(r => r.json())
    .then(data => {
      select.innerHTML = "<option value='' disabled selected>Selecciona un trabajador</option>";
      data.forEach(t => {
        const option = new Option(t.nombre, t.id); // value = id, texto = nombre
        select.appendChild(option);
      });
    })
    .catch(() => {
      select.innerHTML = "<option>Error al cargar</option>";
    });
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

// Inicializar Swiper
let swiper = new Swiper('.mySwiper', {
  slidesPerView: 3,
  spaceBetween: 20,
  navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
  pagination: { el: ".swiper-pagination", clickable: true },
});

function abrirModalNuevoEvento() {
  const modal = new bootstrap.Modal(document.getElementById('modalNuevoEvento'));
  modal.show();
  cargarTrabajadores("trabajador");
}

async function nombreTrabajador(id) {
  if (!id) return "No asignado";
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/especialistasByID?id_trabajador=${id}`);
    if (!res.ok) throw new Error("Error al cargar");
    const nombre = await res.text(); // 👈 Aquí el cambio
    return nombre || "Sin nombre";
  } catch (err) {
    console.error("Error al obtener nombre:", err);
    return "Error al cargar";
  }
}

async function cargarEventos(fecha) {
  try {
    const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eventosAgenda?fecha=${fecha}`);
    if (!res.ok) return mostrarAlerta("danger", "Error al cargar eventos: " + res.statusText);
    const eventos = await res.json();
    console.log("Eventos cargados:", eventos);
    swiper.removeAllSlides();
    swiper.update();

    eventos.forEach((evento) => {
      const slide = `
          <div class="swiper-slide">
            <div class="evento-card shadow-sm border-0 h-100 new-event-card" data-evento='${JSON.stringify(evento).replace(/'/g, "&apos;")}'>
              <img src="${evento.imagen || 'https://via.placeholder.com/300x150'}" alt="">
              <h6>${evento.nombre}</h6>
              <p>${evento.horaInicio || ''} - ${evento.horaFin || ''}</p>
            </div>
          </div>
        `;
      swiper.appendSlide(slide);
    });
  } catch (err) {
    console.error(err);
    mostrarAlerta("danger", "No se pudieron cargar los eventos");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const carrusel = document.getElementById("eventosCarrusel");
  const fechaInput = document.getElementById("fecha");
  const fechaNuevoCalendar = document.getElementById("fechaCalendar");

  cargarEventos(fechaInput.value);
  console.log("Eventos cargados para la fecha:", fechaInput.value || new Date().toISOString().split('T')[0]);
  let imagenBase64 = "";
  // Convertir imagen a Base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  document.getElementById("formNuevoEvento").addEventListener("submit", async function (e) {
    e.preventDefault();
    // Tomar valores del formulario
    const nombre = document.getElementById("nombreEvento").value.trim();
    const detalles = document.getElementById("detalles").value.trim();
    const horaInicio = document.getElementById("horaInicio").value;
    const horaFin = document.getElementById("horaFin").value;

    // Responsable(s) → si quieres permitir múltiples seleccionados
    const responsableSelect = document.getElementById("trabajador");
    const responsables = Array.from(responsableSelect.selectedOptions).map(opt => parseInt(opt.value));
    if (!responsableSelect.value) {
      mostrarAlerta("warning", "Por favor, selecciona al menos un responsable.");
      return;
    }
    // Imagen → convertir a Base64
    const imagenFile = document.getElementById("imagenInput").files[0];
    if (imagenFile) {
      imagenBase64 = await toBase64(imagenFile);
    }
     const [inicio, fin] = fechaNuevoCalendar.value.split(" a ");
    if (!fechaNuevoCalendar.value) {
      mostrarAlerta("warning", "Por favor, selecciona una fecha.");
      return;
    }
    function setFechaCalendario(start, end) {
      let arr = [];
      let current = new Date(start);
      let last = new Date(end);
      if (isNaN(new Date(end)) || end === null || !end) return [current.toISOString().split('T')[0]]; // Si solo es una fecha
      while (current <= last) {
        arr.push(current.toISOString().split('T')[0]); // Formato YYYY-MM-DD
        current.setDate(current.getDate() + 1);
      }
      return arr;
    }
    const fechasCalendario = setFechaCalendario(inicio, fin);
    // Construir objeto del evento
    const nuevoEvento = {
      nombre: nombre,
      detalles: detalles,
      fecha: fechasCalendario, // Usar fecha del calendario
      horaInicio: horaInicio,
      horaFin: horaFin,
      responsable: responsables, // arreglo de IDs
      imagen: imagenBase64 // cadena Base64
    };
    console.log("Nuevo evento:", nuevoEvento);

    try {
      const response = await fetch("https://api-railway-production-24f1.up.railway.app/api/test/nuevoEvento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nuevoEvento)
      });

      if (response.ok) {
        mostrarAlerta("success", "Evento creado");
        document.getElementById("formNuevoEvento").reset();
        document.getElementById("preview").style.display = "none";
        imagenBase64 = ""; // Limpiar Base64
        await cargarEventos(fechaInput.value);
      } else {
        const errorText = await response.text();
        mostrarAlerta("danger", "Error al crear evento: " + errorText);
      }
    } catch (err) {
      console.error("Error al crear evento:", err);
      mostrarAlerta("danger", "Error al crear evento: " + err.message);
    }
  });

  // Vista previa de imagen
  document.getElementById("imagenInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) {
      preview.style.display = "none";
      imagenBase64 = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imagenBase64 = e.target.result; // Guardar Base64
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  fechaInput.addEventListener("change", async () => {
    const fecha = fechaInput.value;
    console.log("Fecha seleccionada:", fecha);
    cargarEventos(fecha);
  });
  let eventoActual = null;
  document.getElementById("btnEliminarEvento").addEventListener("click", async () => {
    try {
      const res = await fetch(`https://api-railway-production-24f1.up.railway.app/api/test/eliminarEvento?id=${eventoActual.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        mostrarAlerta("success", "Evento eliminado");
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalInfoEvento'));
        modal.hide();
        // Recargar eventos (suponiendo que tienes la función cargarEventos)
        const fecha = document.getElementById("fecha").value || new Date().toISOString().split('T')[0];
        cargarEventos(fecha);
      } else {
        const errorText = await res.text();
        mostrarAlerta("danger", "Error al eliminar el evento: " + errorText);
      }
    } catch (err) {
      console.error(err);
      mostrarAlerta("danger", "Error al eliminar el evento: " + err.message);
    }
  });

  // Click en tarjeta
  document.querySelector(".mySwiper").addEventListener("click", (ev) => {
    const card = ev.target.closest(".evento-card");
    if (!card) return;
    const eventoData = JSON.parse(card.dataset.evento);
    mostrarEvento(eventoData);
  });

  async function mostrarEvento(e) {
    eventoActual = e;
    document.getElementById("eventoTitulo").textContent = e.nombre;
    document.getElementById("eventoDetalles").textContent = e.detalles;
    document.getElementById("eventoHoraInicio").textContent = e.horaInicio;
    document.getElementById("eventoHoraFin").textContent = e.horaFin;
    document.getElementById("eventoResponsable").textContent = e.responsable || "No asignado";
    const modal = new bootstrap.Modal(document.getElementById('modalInfoEvento'));
    modal.show();
  }

});

