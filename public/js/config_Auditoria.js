
// Estado
const AuditState = {
  logs: [],
  filtrados: [],
  pagina: 1,
  porPagina: 15,
};

// Fetch helper
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

// Cargar parámetros de configuración
async function cargarConfiguracion() {
  try {
    const data = await apiFetch('/api/configuracion');
    const configs = Array.isArray(data.configuracion) ? data.configuracion : [];

    configs.forEach(cfg => {
      // Intentar encontrar un input con id = cfg-<clave>
      const input = document.getElementById(`cfg-${cfg.clave}`);
      if (input) {
        input.value = cfg.valor ?? '';
        input.dataset.clave = cfg.clave;
      }
    });

    // Renderizar tabla de parámetros si existe
    const tbody = document.querySelector('#tabla-configuracion tbody');
    if (tbody) {
      tbody.replaceChildren();
      const frag = document.createDocumentFragment();
      configs.forEach(cfg => {
        const tr = document.createElement('tr');

        const tdClave = document.createElement('td');
        const claveBadge = document.createElement('span');
        claveBadge.className = 'badge text-bg-light border font-monospace';
        claveBadge.textContent = cfg.clave;
        tdClave.appendChild(claveBadge);

        const tdValor = document.createElement('td');
        tdValor.className = 'fw-medium';
        tdValor.textContent = cfg.valor;

        const tdDesc = document.createElement('td');
        tdDesc.className = 'text-muted small';
        tdDesc.textContent = cfg.descripcion || '—';

        const tdAcc = document.createElement('td');
        tdAcc.className = 'text-end pe-3';
        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-sm btn-outline-primary';
        btnEdit.title = 'Editar';
        btnEdit.innerHTML = '<i class="fa-solid fa-pen fa-fw" aria-hidden="true"></i>';
        btnEdit.addEventListener('click', () => abrirEditorConfig(cfg));
        tdAcc.appendChild(btnEdit);

        tr.append(tdClave, tdValor, tdDesc, tdAcc);
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
    }
  } catch (err) {
    showToast('Error al cargar configuración: ' + err.message, 'error');
  }
}

// Abrir editor de un parámetro
function abrirEditorConfig(cfg) {
  const modal = document.getElementById('modal-editar-config');
  if (!modal) return;

  const labelEl = modal.querySelector('#edit-cfg-label');
  const inputEl = modal.querySelector('#edit-cfg-valor');
  const claveEl = modal.querySelector('#edit-cfg-clave');

  if (labelEl) labelEl.textContent = cfg.clave;
  if (inputEl) inputEl.value = cfg.valor;
  if (claveEl) claveEl.value = cfg.clave;

  new bootstrap.Modal(modal).show();
}

// Inicializar formulario de edición de config
function initFormEditarConfig() {
  const form = document.getElementById('form-editar-config');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clave = document.getElementById('edit-cfg-clave')?.value;
    const valor = document.getElementById('edit-cfg-valor')?.value.trim();
    if (!clave || valor === undefined) return;

    try {
      await apiFetch(`/api/configuracion/${clave}`, {
        method: 'PUT',
        body: JSON.stringify({ valor }),
      });
      showToast(`Parámetro "${clave}" actualizado.`, 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-editar-config'))?.hide();
      await cargarConfiguracion();
    } catch (err) {
      showToast('Error al actualizar: ' + err.message, 'error');
    }
  });
}

// Formulario inline de configuración
function initFormConfiguracion() {
  const form = document.getElementById('form-configuracion');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const inputs = form.querySelectorAll('[data-clave]');
    const promesas = [];

    inputs.forEach(input => {
      const clave = input.dataset.clave;
      const valor = input.value.trim();
      if (clave && valor !== '') {
        promesas.push(
          apiFetch(`/api/configuracion/${clave}`, {
            method: 'PUT',
            body: JSON.stringify({ valor }),
          })
        );
      }
    });

    try {
      await Promise.all(promesas);
      showToast('Configuración guardada.', 'success');
    } catch (err) {
      showToast('Error al guardar: ' + err.message, 'error');
    }
  });
}

// Renderizar fila de auditoría
function renderFilaAuditoria(log) {
  const tr = document.createElement('tr');

  const tdId = document.createElement('td');
  tdId.className = 'ps-3 text-muted small font-monospace';
  tdId.textContent = `#${log.id_auditoria}`;

  const tdOp = document.createElement('td');
  tdOp.innerHTML = getBadge(log.operacion?.toLowerCase());

  const tdTabla = document.createElement('td');
  const tablaSpan = document.createElement('span');
  tablaSpan.className = 'badge text-bg-light border font-monospace';
  tablaSpan.textContent = log.tabla_afectada;
  tdTabla.appendChild(tablaSpan);

  const tdReg = document.createElement('td');
  tdReg.className = 'text-muted small';
  tdReg.textContent = log.registro_id ?? '—';

  const tdUsuario = document.createElement('td');
  tdUsuario.textContent = log.usuario_nombre || '—';

  const tdEmpleado = document.createElement('td');
  tdEmpleado.className = 'text-muted small';
  tdEmpleado.textContent = log.empleado_nombre || '—';

  const tdFecha = document.createElement('td');
  tdFecha.className = 'text-muted small';
  tdFecha.textContent = formatDate(log.registrado_en, true);

  const tdAcc = document.createElement('td');
  tdAcc.className = 'text-end pe-3';
  const btnVer = document.createElement('button');
  btnVer.type = 'button';
  btnVer.className = 'btn btn-sm';
  btnVer.title = 'Ver detalle';
  btnVer.innerHTML = '<i class="fa-regular fa-eye fa-fw" aria-hidden="true"></i>';
  btnVer.addEventListener('click', () => verDetalleAuditoria(log.id_auditoria));
  tdAcc.appendChild(btnVer);

  //ALTO AQUI CAMBIAAR tdReg POR EL IP VERDADER LO DJO PQ TENGO SUEÑO
  tr.append(tdOp, tdTabla, tdId, tdUsuario, tdEmpleado, tdFecha, tdReg, tdAcc);
  return tr;
}

// Renderizar tabla de auditoría
function renderTablaAuditoria() {
  const tbody = document.querySelector('#tabla-auditoria tbody');
  if (!tbody) return;

  tbody.replaceChildren();
  const inicio = (AuditState.pagina - 1) * AuditState.porPagina;
  const pagina = AuditState.filtrados.slice(inicio, inicio + AuditState.porPagina);
  const frag = document.createDocumentFragment();

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No hay registros de auditoría.';
    tr.appendChild(td);
    frag.appendChild(tr);
  } else {
    pagina.forEach(log => frag.appendChild(renderFilaAuditoria(log)));
  }
  tbody.appendChild(frag);

  const footerSpan = document.querySelector('#section-auditoria .card-footer span');
  if (footerSpan) {
    footerSpan.innerHTML = `Mostrando <strong>${inicio + 1}–${Math.min(inicio + AuditState.porPagina, AuditState.filtrados.length)}</strong> de <strong>${AuditState.filtrados.length}</strong> registros`;
  }

  const nav = document.querySelector('#section-auditoria .card-footer nav');
  if (nav) {
    if (!nav.id) nav.id = 'pagination-auditoria';
    renderPaginacion('pagination-auditoria', AuditState.filtrados.length, AuditState.porPagina, AuditState.pagina, (p) => {
      AuditState.pagina = p;
      renderTablaAuditoria();
    });
  }
}

// Cargar logs de auditoría
async function cargarAuditoria(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.tabla) params.set('tabla', filtros.tabla);
    if (filtros.operacion) params.set('operacion', filtros.operacion);
    if (filtros.usuario) params.set('usuario', filtros.usuario);
    if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);

    const data = await apiFetch(`/api/configuracion/auditoria?${params}`);
    AuditState.logs = Array.isArray(data.logs) ? data.logs : [];
    AuditState.filtrados = [...AuditState.logs];
    AuditState.pagina = 1;
    renderTablaAuditoria();
  } catch (err) {
    showToast('Error al cargar auditoría: ' + err.message, 'error');
  }
}

// Ver detalle de un log
async function verDetalleAuditoria(id) {
  const modal = document.getElementById('modal-detalle-auditoria');
  if (!modal) return;
  try {
    const data = await apiFetch(`/api/configuracion/auditoria/${id}`);
    const log = data.log;

    const setEl = (sel, val) => { const el = modal.querySelector(sel); if (el) el.textContent = val ?? '—'; };
    setEl('#aud-id', `#${log.id_auditoria}`);
    setEl('#aud-tabla', log.tabla_afectada);
    setEl('#aud-operacion', log.operacion);
    setEl('#aud-reg', log.registro_id);
    setEl('#aud-usuario', log.usuario_nombre);
    setEl('#aud-empleado', log.empleado_nombre);
    setEl('#aud-ip', log.ip);
    setEl('#aud-fecha', formatDate(log.registrado_en, true));

    const prevEl = modal.querySelector('#aud-datos-prev');
    const nuevoEl = modal.querySelector('#aud-datos-nuevo');
    if (prevEl) prevEl.textContent = log.datos_anteriores ? JSON.stringify(log.datos_anteriores, null, 2) : '—';
    if (nuevoEl) nuevoEl.textContent = log.datos_nuevos ? JSON.stringify(log.datos_nuevos, null, 2) : '—';

    new bootstrap.Modal(modal).show();
  } catch (err) {
    showToast('Error al cargar detalle: ' + err.message, 'error');
  }
}

// Filtros de auditoría
function initFiltrosAuditoria() {
  const btnFiltrar = document.getElementById('btn-filtrar-auditoria');
  const btnLimpiar = document.getElementById('btn-limpiar-auditoria');

  const getFiltros = () => ({
    tabla: document.getElementById('filtro-aud-tabla')?.value,
    operacion: document.getElementById('filtro-aud-operacion')?.value,
    usuario: document.getElementById('input-buscar-auditoria')?.value.trim(),
    fecha_desde: document.getElementById('filtro-aud-desde')?.value,
    fecha_hasta: document.getElementById('filtro-aud-hasta')?.value,
  });

  if (btnFiltrar) btnFiltrar.addEventListener('click', () => cargarAuditoria(getFiltros()));
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      ['filtro-aud-tabla', 'filtro-aud-operacion', 'input-buscar-auditoria', 'filtro-aud-desde', 'filtro-aud-hasta'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      cargarAuditoria();
    });
  }
}

// Paginación genérica
function renderPaginacion(containerId, total, porPagina, paginaActual, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalPaginas = Math.ceil(total / porPagina) || 1;
  const ul = document.createElement('ul');
  ul.className = 'pagination pagination-sm mb-0';
  const crearLi = (content, disabled, active, pageNum, isIcon = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    if (active) li.setAttribute('aria-current', 'page');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    if (isIcon) { const i = document.createElement('i'); i.className = content; i.setAttribute('aria-hidden', 'true'); a.appendChild(i); } else { a.textContent = content; }
    if (!disabled && !active) a.addEventListener('click', (e) => { e.preventDefault(); onPageChange(pageNum); });
    li.appendChild(a);
    return li;
  };
  ul.appendChild(crearLi('fa-solid fa-chevron-left fa-xs', paginaActual === 1, false, paginaActual - 1, true));
  for (let i = 1; i <= totalPaginas; i++) ul.appendChild(crearLi(String(i), false, i === paginaActual, i));
  ul.appendChild(crearLi('fa-solid fa-chevron-right fa-xs', paginaActual >= totalPaginas, false, paginaActual + 1, true));
  container.replaceChildren(ul);
}

// Punto de entrada
document.addEventListener('DOMContentLoaded', () => {
  cargarConfiguracion();
  initFormConfiguracion();
  initFormEditarConfig();
  initFiltrosAuditoria();
  cargarAuditoria();
});
