

//  Estado 
const Clientes = {
  lista: [],
  filtrada: [],
  pagina: 1,
  porPagina: 15,
  editandoId: null,
};

//  Fetch helper 
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.mensaje || `Error ${res.status}`);
  return data;
}

//  Renderizar una fila de la tabla 
//  Renderizar una fila de la tabla 
function renderFilaCliente(c) {
  const tr = document.createElement('tr');

  // Columna 1: expand icon (vacía, para alinear con el <th> del thead)
  const tdExpand = document.createElement('td');
  tdExpand.className = 'ps-3';
  tr.appendChild(tdExpand);

  // Columna 2: Documento
  const tdDoc = document.createElement('td');
  const docBadge = document.createElement('span');
  docBadge.className = 'badge text-bg-light border font-monospace';
  docBadge.textContent = c.numero_documento || '—';
  const tipoSmall = document.createElement('div');
  tipoSmall.className = 'small text-muted mt-1';
  tipoSmall.textContent = c.tipo_documento || '';
  tdDoc.appendChild(docBadge);
  tdDoc.appendChild(tipoSmall);

  // Columna 3: Nombre / Razón social
  const tdNombre = document.createElement('td');
  tdNombre.className = 'fw-medium';
  tdNombre.textContent = c.nombre || '—';

  // Columna 4: Teléfono
  const tdTelefono = document.createElement('td');
  tdTelefono.className = 'text-muted small';
  tdTelefono.textContent = c.telefono || '—';

  // Columna 5: Correo
  const tdCorreo = document.createElement('td');
  tdCorreo.className = 'text-muted small';
  tdCorreo.textContent = c.correo || '—';

  // Columna 6: Registro (thead dice "Registro" antes de "Estado")
  const tdFecha = document.createElement('td');
  tdFecha.className = 'text-muted small';
  tdFecha.textContent = formatDate(c.creado_en);

  // Columna 7: Estado
  const tdEstado = document.createElement('td');
  tdEstado.innerHTML = getBadge(c.activo ? 'activo' : 'inactivo');

  // Columna 8: Acciones
  const tdAcciones = document.createElement('td');
  tdAcciones.className = 'text-end pe-3';

  // Botón ver perfil
  const btnPerfil = document.createElement('button');
  btnPerfil.type = 'button';
  btnPerfil.className = 'btn btn-sm me-1';
  btnPerfil.title = 'Ver perfil';
  btnPerfil.innerHTML = '<i class="fa-regular fa-eye fa-fw" aria-hidden="true"></i>';
  btnPerfil.addEventListener('click', () => abrirPerfilCliente(c.id_cliente));

  // Botón editar
  const btnEditar = document.createElement('button');
  btnEditar.type = 'button';
  btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
  btnEditar.title = 'Editar';
  btnEditar.setAttribute('data-bs-toggle', 'offcanvas');
  btnEditar.setAttribute('data-bs-target', '#offcanvas-nuevo-cliente');
  btnEditar.innerHTML = '<i class="fa-solid fa-pen fa-fw" aria-hidden="true"></i>';
  btnEditar.addEventListener('click', () => prepararEdicion(c));

  // Botón desactivar
  const btnDesact = document.createElement('button');
  btnDesact.type = 'button';
  btnDesact.className = 'btn btn-sm btn-outline-danger';
  btnDesact.title = c.activo ? 'Desactivar' : 'Ya inactivo';
  btnDesact.disabled = !c.activo;
  btnDesact.innerHTML = '<i class="fa-solid fa-user-slash fa-fw" aria-hidden="true"></i>';
  btnDesact.addEventListener('click', () => desactivarCliente(c.id_cliente, c.nombre));

  tdAcciones.appendChild(btnPerfil);
  tdAcciones.appendChild(btnEditar);
  tdAcciones.appendChild(btnDesact);

  tr.append(tdDoc, tdNombre, tdTelefono, tdCorreo, tdFecha, tdEstado, tdAcciones);
  return tr;
}

//  Renderizar tabla con paginación 
function renderTabla() {
  const tbody = document.querySelector('#tabla-clientes tbody');
  const footerEl = document.querySelector('#section-lista-clientes .card-footer');
  if (!tbody) return;

  tbody.replaceChildren();

  const inicio = (Clientes.pagina - 1) * Clientes.porPagina;
  const pagina = Clientes.filtrada.slice(inicio, inicio + Clientes.porPagina);
  const fragment = document.createDocumentFragment();

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No se encontraron clientes.';
    tr.appendChild(td);
    fragment.appendChild(tr);
  } else {
    pagina.forEach(c => fragment.appendChild(renderFilaCliente(c)));
  }

  tbody.appendChild(fragment);

  if (footerEl) {
    const spanInfo = footerEl.querySelector('span:not([class*="pagination"])') || footerEl.querySelector('span');
    if (spanInfo) spanInfo.innerHTML = `Mostrando <strong>${inicio + 1}–${Math.min(inicio + Clientes.porPagina, Clientes.filtrada.length)}</strong> de <strong>${Clientes.filtrada.length}</strong> clientes`;
  }

  const navEl = document.querySelector('#section-lista-clientes .card-footer nav');
  if (navEl) {
    if (!navEl.id) navEl.id = 'pagination-clientes';
    renderPaginacion('pagination-clientes', Clientes.filtrada.length, Clientes.porPagina, Clientes.pagina, (p) => {
      Clientes.pagina = p;
      renderTabla();
    });
  }
}

//  Cargar clientes 
async function cargarClientes(filtros = {}) {
  try {
    const { nombre, documento, tipo_documento, activo } = filtros;
    const params = new URLSearchParams();
    if (nombre) params.set('nombre', nombre);
    if (documento) params.set('documento', documento);
    if (tipo_documento) params.set('tipo_documento', tipo_documento);
    if (activo !== undefined && activo !== '') params.set('activo', activo);
    const data = await apiFetch(`/api/clientes?${params}`);
    Clientes.lista = Array.isArray(data) ? data : [];
    Clientes.filtrada = [...Clientes.lista];
    Clientes.pagina = 1;
    renderTabla();
  } catch (err) {
    showToast('Error al cargar clientes: ' + err.message, 'error');
  }
}

//  Abrir perfil de cliente 
async function abrirPerfilCliente(id) {
  const modal = document.getElementById('modal-ficha-cliente');
  if (!modal) return;

  try {
    const data = await apiFetch(`/api/clientes/${id}`);
    const c = data;

    // Rellenar datos del modal de perfil
    const setEl = (sel, val) => { const el = modal.querySelector(sel); if (el) el.textContent = val ?? '—'; };
    setEl('#perfil-nombre', c.nombre);
    setEl('#perfil-documento', `${c.tipo_documento} - ${c.numero_documento}`);
    setEl('#perfil-telefono', c.telefono);
    setEl('#perfil-correo', c.correo);
    setEl('#perfil-estado', c.activo ? 'Activo' : 'Inactivo');
    setEl('#perfil-creado', formatDate(c.creado_en));

    // Historial de compras
    const tbodyH = modal.querySelector('#tabla-historial-cliente');
    if (tbodyH) {
      tbodyH.replaceChildren();
      const compras = c.historial_compras || [];
      if (compras.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.className = 'text-center text-muted py-3';
        td.textContent = 'Sin compras registradas.';
        tr.appendChild(td);
        tbodyH.appendChild(tr);
      } else {
        const frag = document.createDocumentFragment();
        compras.forEach(v => {
          const tr = document.createElement('tr');
          const tdComp = document.createElement('td');
          tdComp.innerHTML = `<span class="badge text-bg-light border font-monospace">${v.numero_comprobante}</span>`;
          const tdFecha = document.createElement('td');
          tdFecha.className = 'text-muted small';
          tdFecha.textContent = formatDate(v.fecha, true);
          const tdTotal = document.createElement('td');
          tdTotal.className = 'fw-semibold';
          tdTotal.textContent = formatMoney(v.total);
          const tdEst = document.createElement('td');
          tdEst.innerHTML = getBadge(v.estado);
          tr.append(tdComp, tdFecha, tdTotal, tdEst);
          frag.appendChild(tr);
        });
        tbodyH.appendChild(frag);
      }
    }

    new bootstrap.Modal(modal).show();
  } catch (err) {
    showToast('Error al cargar perfil: ' + err.message, 'error');
  }
}

//  Preparar edición en offcanvas 
function prepararEdicion(c) {
  Clientes.editandoId = c.id_cliente;
  const titulo = document.getElementById('offcanvas-nuevo-cliente-label');
  if (titulo) titulo.textContent = 'Editar cliente';

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
  setVal('cliente-tipo-doc', c.tipo_documento);
  setVal('cliente-num-doc', c.numero_documento);
  setVal('cliente-nombre', c.nombre);
  setVal('cliente-telefono', c.telefono);
  setVal('cliente-correo', c.correo);

  const chkActivo = document.getElementById('cliente-activo');
  if (chkActivo) chkActivo.checked = !!c.activo;
}


//  Limpiar formulario 
function limpiarFormCliente() {
  Clientes.editandoId = null;
  const titulo = document.getElementById('offcanvas-nuevo-cliente-label');
  if (titulo) titulo.textContent = 'Nuevo cliente';
  const form = document.getElementById('form-nuevo-cliente');
  if (form) { form.reset(); form.classList.remove('was-validated'); }
  const chkActivo = document.getElementById('cliente-activo');
  if (chkActivo) chkActivo.checked = true;
}

//  Formulario crear / editar cliente 
function initFormCliente() {
  const form = document.getElementById('form-nuevo-cliente');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const payload = {
      tipo_documento: document.getElementById('cliente-tipo-doc')?.value,
      numero_documento: document.getElementById('cliente-num-doc')?.value.trim(),
      nombre: document.getElementById('cliente-nombre')?.value.trim(),
      telefono: document.getElementById('cliente-telefono')?.value.trim() || null,
      correo: document.getElementById('cliente-correo')?.value.trim() || null,
    };

    const validacion = validarDocumento(payload.tipo_documento, payload.numero_documento);
    if (!validacion.ok) {
      showToast(validacion.mensaje, 'error');
      return;
    }

    const validacionTelefono = validarTelefono(payload.telefono);
    if (!validacionTelefono.ok) {
      showToast(validacionTelefono.mensaje, 'error');
      return;
    }

    try {
      if (Clientes.editandoId) {
        const chkActivo = document.getElementById('cliente-activo');
        await apiFetch(`/api/clientes/${Clientes.editandoId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, activo: chkActivo ? (chkActivo.checked ? 1 : 0) : 1 }),
        });
        showToast('Cliente actualizado.', 'success');
      } else {
        await apiFetch('/api/clientes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Cliente creado.', 'success');
      }

      bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-nuevo-cliente'))?.hide();
      limpiarFormCliente();
      await cargarClientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// Valida el número de documento según su tipo:
// DNI → 8 dígitos, RUC → 11 dígitos, CE (Carné de Extranjería) → 12 dígitos
function validarDocumento(tipo, numero) {
  if (!tipo || !numero) return { ok: false, mensaje: 'Completa el tipo y número de documento.' };

  const reglas = {
    DNI: { longitud: 8, etiqueta: 'DNI' },
    RUC: { longitud: 11, etiqueta: 'RUC' },
    CE: { longitud: 12, etiqueta: 'Carné de Extranjería' },
  };

  const regla = reglas[tipo];
  if (!regla) return { ok: false, mensaje: 'Tipo de documento no reconocido.' };

  if (!/^\d+$/.test(numero)) {
    return { ok: false, mensaje: `El ${regla.etiqueta} debe contener solo números.` };
  }
  if (numero.length !== regla.longitud) {
    return { ok: false, mensaje: `El ${regla.etiqueta} debe tener exactamente ${regla.longitud} dígitos.` };
  }

  return { ok: true };
}

// Valida que el teléfono contenga solo 9 números
function validarTelefono(telefono) {
  if (!telefono) return { ok: true }; // opcional
  if (!/^\d+$/.test(telefono)) {
    return { ok: false, mensaje: 'El teléfono debe contener solo números.' };
  }
  if (telefono.length < 6 || telefono.length > 9) {
    return { ok: false, mensaje: 'El teléfono debe tener entre 6 y 9 dígitos.' };
  }
  return { ok: true };
}


//  Desactivar cliente 
async function desactivarCliente(id, nombre) {
  confirmAction(`¿Desactivar al cliente "${nombre}"?`, async () => {
    try {
      await apiFetch(`/api/clientes/${id}/desactivar`, { method: 'PATCH' });
      showToast('Cliente desactivado.', 'warning');
      await cargarClientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

//  Búsqueda en tiempo real 
function initBusqueda() {
  const inputBuscar = document.getElementById('input-buscar-cliente');
  const selectTipoDoc = document.getElementById('filtro-tipo-doc');
  const selectEstado = document.getElementById('filtro-estado-cliente');

  const buscar = () => {
    cargarClientes({
      nombre: inputBuscar?.value.trim() || '',
      tipo_documento: selectTipoDoc?.value || '',
      activo: selectEstado?.value ?? '',
    });
  };

  if (inputBuscar) inputBuscar.addEventListener('input', buscar);
  if (selectTipoDoc) selectTipoDoc.addEventListener('change', buscar);
  if (selectEstado) selectEstado.addEventListener('change', buscar);
}
//  Limpiar offcanvas al cerrarse 
function initOffcanvasReset() {
  const oc = document.getElementById('offcanvas-nuevo-cliente');
  if (!oc) return;
  oc.addEventListener('hidden.bs.offcanvas', limpiarFormCliente);
}

//  Paginación genérica 
function renderPaginacion(containerId, total, porPagina, paginaActual, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPaginas = Math.ceil(total / porPagina) || 1;
  const ulEl = document.createElement('ul');
  ulEl.className = 'pagination pagination-sm mb-0';

  const crearLi = (content, disabled, active, pageNum, isIcon = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    if (active) li.setAttribute('aria-current', 'page');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    if (isIcon) {
      const i = document.createElement('i');
      i.className = content;
      i.setAttribute('aria-hidden', 'true');
      a.appendChild(i);
    } else {
      a.textContent = content;
    }
    if (!disabled && !active) {
      a.addEventListener('click', (e) => { e.preventDefault(); onPageChange(pageNum); });
    }
    li.appendChild(a);
    return li;
  };

  ulEl.appendChild(crearLi('fa-solid fa-chevron-left fa-xs', paginaActual === 1, false, paginaActual - 1, true));
  for (let i = 1; i <= totalPaginas; i++) ulEl.appendChild(crearLi(String(i), false, i === paginaActual, i));
  ulEl.appendChild(crearLi('fa-solid fa-chevron-right fa-xs', paginaActual >= totalPaginas, false, paginaActual + 1, true));

  container.replaceChildren(ulEl);
}

// Restringe los inputs de teléfono a solo dígitos mientras se escribe
function initInputsTelefono() {
  ['cliente-telefono'].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 9);
    });
  });
}

// Punto de entrada
document.addEventListener('DOMContentLoaded', () => {
  initFormCliente();
  initBusqueda();
  initOffcanvasReset();
  initInputsTelefono();
  cargarClientes();
});