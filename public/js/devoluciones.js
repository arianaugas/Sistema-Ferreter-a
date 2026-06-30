// Estado 
const DevState = {
  lista: [],
  filtrada: [],
  pagina: 1,
  porPagina: 10,
  cajaActiva: null,
  id_almacen: 1,
  ventaOriginal: null, // venta buscada para nueva devolución
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

// Renderizar fila de la tabla de devoluciones 
function renderFilaDevolucion(d) {
  const detailId = `dev-detail-${d.id_devolucion}`;
  const tr = document.createElement('tr');
  tr.style.cursor = 'pointer';

  const tdIco = document.createElement('td');
  tdIco.className = 'ps-3';
  const iIco = document.createElement('i');
  iIco.className = 'fa-solid fa-chevron-down fa-fw fa-xs';
  iIco.setAttribute('aria-hidden', 'true');
  tdIco.appendChild(iIco);

  const tdId = document.createElement('td');
  const idSpan = document.createElement('span');
  idSpan.className = 'fw-semibold font-monospace';
  idSpan.textContent = `DEV-${String(d.id_devolucion).padStart(5, '0')}`;
  tdId.appendChild(idSpan);

  const tdVenta = document.createElement('td');
  const compSpan = document.createElement('span');
  compSpan.className = 'fw-semibold font-monospace';
  compSpan.textContent = d.numero_comprobante;
  tdVenta.appendChild(compSpan);

  const tdCliente = document.createElement('td');
  tdCliente.textContent = d.cliente_nombre || 'Sin cliente';

  const tdEmpleado = document.createElement('td');
  tdEmpleado.className = 'text-muted small';
  tdEmpleado.textContent = d.empleado_nombre || '—';

  const tdTipo = document.createElement('td');
  tdTipo.innerHTML = getBadge(d.tipo);

  const tdEstado = document.createElement('td');
  tdEstado.innerHTML = getBadge(d.estado);

  const tdMonto = document.createElement('td');
  tdMonto.className = 'fw-semibold';
  tdMonto.textContent = d.tipo === 'reembolso' ? formatMoney(d.monto_reembolso) : '—';

  const tdFecha = document.createElement('td');
  tdFecha.className = 'text-muted small';
  tdFecha.textContent = formatDate(d.fecha, true);

  const tdAcciones = document.createElement('td');
  tdAcciones.className = 'text-end pe-3';
  const divAcc = document.createElement('div');
  divAcc.className = 'd-flex gap-1 justify-content-end';

  const btnVer = document.createElement('button');
  btnVer.type = 'button';
  btnVer.className = 'btn btn-sm';
  btnVer.setAttribute('aria-label', 'Ver detalle');
  btnVer.innerHTML = '<i class="fa-regular fa-eye fa-fw" aria-hidden="true"></i>';
  btnVer.addEventListener('click', (e) => { e.stopPropagation(); verDetalleDev(d.id_devolucion); });
  divAcc.appendChild(btnVer);

  if (d.estado === 'pendiente') {
    const btnProcesar = document.createElement('button');
    btnProcesar.type = 'button';
    btnProcesar.className = 'btn btn-sm btn-outline-success';
    btnProcesar.setAttribute('aria-label', 'Procesar devolución');
    btnProcesar.innerHTML = '<i class="fa-solid fa-check fa-fw" aria-hidden="true"></i>';
    btnProcesar.addEventListener('click', (e) => { e.stopPropagation(); procesarDevolucion(d.id_devolucion); });

    const btnAnular = document.createElement('button');
    btnAnular.type = 'button';
    btnAnular.className = 'btn btn-sm btn-outline-danger';
    btnAnular.setAttribute('aria-label', 'Anular devolución');
    btnAnular.innerHTML = '<i class="fa-solid fa-ban fa-fw" aria-hidden="true"></i>';
    btnAnular.addEventListener('click', (e) => { e.stopPropagation(); anularDevolucion(d.id_devolucion); });

    divAcc.appendChild(btnProcesar);
    divAcc.appendChild(btnAnular);
  }

  tdAcciones.appendChild(divAcc);

  // Fila de detalle expandible
  tr.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const detailRow = document.getElementById(detailId);
    if (!detailRow) return;
    const isOpen = detailRow.classList.toggle('show');
    iIco.classList.toggle('fa-chevron-down', !isOpen);
    iIco.classList.toggle('fa-chevron-up', isOpen);
    tr.classList.toggle('table-active', isOpen);
    if (isOpen && !detailRow.dataset.loaded) cargarDetalleDevExpandible(d.id_devolucion, detailId);
  });

  tr.append(tdIco, tdId, tdVenta, tdCliente, tdEmpleado, tdTipo, tdMonto, tdFecha, tdEstado, tdAcciones);
  return tr;
}

//  Renderizar tabla principal 
function renderTabla() {
  const tbody = document.querySelector('#tabla-devoluciones tbody');
  if (!tbody) return;

  tbody.replaceChildren();

  const inicio = (DevState.pagina - 1) * DevState.porPagina;
  const pagina = DevState.filtrada.slice(inicio, inicio + DevState.porPagina);
  const frag = document.createDocumentFragment();

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No se encontraron devoluciones.';
    tr.appendChild(td);
    frag.appendChild(tr);
  } else {
    pagina.forEach(d => {
      frag.appendChild(renderFilaDevolucion(d));
      // Fila de detalle colapsable
      const detailId = `dev-detail-${d.id_devolucion}`;
      const trDetail = document.createElement('tr');
      trDetail.id = detailId;
      trDetail.className = 'detail-row collapse';
      const tdDetail = document.createElement('td');
      tdDetail.colSpan = 10;
      tdDetail.className = 'p-0';
      tdDetail.innerHTML = '<div class="px-4 py-3 text-muted small"><i class="fa-solid fa-spinner fa-spin me-1"></i> Cargando...</div>';
      trDetail.appendChild(tdDetail);
      frag.appendChild(trDetail);
    });
  }

  tbody.appendChild(frag);

  // Recalcula en vivo cada vez que cambia una cantidad a devolver
  tbody.addEventListener('input', (e) => {
    if (e.target.classList.contains('dev-cant-devolver')) recalcularMontoReembolso();
  });
  recalcularMontoReembolso();
  actualizarFooter();
}


//  Recalcular monto a reembolsar segun cantidades ingresadas 
function recalcularMontoReembolso() {
  const inputMonto = document.getElementById('nd-monto-reembolso');
  if (!inputMonto) return;

  let monto = 0;
  document.querySelectorAll('.dev-cant-devolver').forEach(input => {
    const cant = parseFloat(input.value);
    const precio = parseFloat(input.dataset.precioUnitario);
    if (cant > 0 && !isNaN(precio)) monto += cant * precio;
  });

  inputMonto.value = monto.toFixed(2);
}

function actualizarFooter() {
  const inicio = (DevState.pagina - 1) * DevState.porPagina;
  const footerSpan = document.querySelector('#section-lista-devoluciones .card-footer span');
  if (footerSpan) {
    footerSpan.innerHTML = `Mostrando <strong>${inicio + 1}–${Math.min(inicio + DevState.porPagina, DevState.filtrada.length)}</strong> de <strong>${DevState.filtrada.length}</strong> devoluciones`;
  }
  const nav = document.querySelector('#section-lista-devoluciones .card-footer nav');
  if (nav) {
    if (!nav.id) nav.id = 'pagination-devoluciones';
    renderPaginacion('pagination-devoluciones', DevState.filtrada.length, DevState.porPagina, DevState.pagina, (p) => {
      DevState.pagina = p;
      renderTabla();
    });
  }
}

// Cargar devoluciones 
async function cargarDevoluciones(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.tipo) params.set('tipo', filtros.tipo);
    if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);

    const data = await apiFetch(`/api/devoluciones?${params}`);
    DevState.lista = Array.isArray(data.devoluciones) ? data.devoluciones : [];
    DevState.filtrada = [...DevState.lista];
    DevState.pagina = 1;
    renderTabla();
  } catch (err) {
    showToast('Error al cargar devoluciones: ' + err.message, 'error');
  }
}

// Ver detalle de devolución 
async function verDetalleDev(id) {
  const modal = document.getElementById('modal-detalle-devolucion');
  if (!modal) return;
  try {
    const data = await apiFetch(`/api/devoluciones/${id}`);
    const d = data.devolucion;

    const setEl = (sel, val) => { const el = modal.querySelector(sel); if (el) el.textContent = val ?? '—'; };
    setEl('#modal-dev-id', `DEV-${String(d.id_devolucion).padStart(5, '0')}`);
    setEl('#modal-dev-venta', d.numero_comprobante);
    setEl('#modal-dev-cliente', d.cliente_nombre);
    setEl('#modal-dev-empleado', d.empleado_nombre);
    setEl('#modal-dev-tipo', d.tipo);
    setEl('#modal-dev-estado', d.estado);
    setEl('#modal-dev-motivo', d.motivo || 'Sin motivo');
    setEl('#modal-dev-monto', d.tipo === 'reembolso' ? formatMoney(d.monto_reembolso) : '—');
    setEl('#modal-dev-fecha', formatDate(d.fecha, true));

    const tbody = modal.querySelector('#modal-dev-detalle');
    if (tbody) {
      tbody.replaceChildren();
      const frag = document.createDocumentFragment();
      (data.detalle || []).forEach(it => {
        const tr = document.createElement('tr');
        const tdNom = document.createElement('td'); tdNom.textContent = it.producto_nombre;
        const tdCant = document.createElement('td'); tdCant.textContent = it.cantidad;
        const tdPrecio = document.createElement('td'); tdPrecio.textContent = formatMoney(it.precio_devuelto);
        const tdSubtotal = document.createElement('td');
        tdSubtotal.className = 'fw-semibold';
        tdSubtotal.textContent = formatMoney(it.cantidad * it.precio_devuelto);
        const tdReingresa = document.createElement('td');
        tdReingresa.innerHTML = getBadge(it.reingresa_stock ? 'activo' : 'inactivo', it.reingresa_stock ? 'Sí' : 'No');
        tr.append(tdNom, tdCant, tdPrecio, tdSubtotal, tdReingresa);
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
    }

    new bootstrap.Modal(modal).show();
  } catch (err) {
    showToast('Error al cargar detalle: ' + err.message, 'error');
  }
}

//  Procesar devolución 
async function procesarDevolucion(id) {
  if (!DevState.cajaActiva) {
    showToast('Necesitas una caja abierta para procesar la devolución.', 'error');
    return;
  }
  confirmAction('¿Marcar esta devolución como procesada? Se ejecutarán los movimientos de stock y caja.', async () => {
    try {
      await apiFetch(`/api/devoluciones/${id}/procesar`, {
        method: 'PATCH',
        body: JSON.stringify({
          id_caja: DevState.cajaActiva.id_caja,
          id_almacen: DevState.id_almacen,
        }),
      });
      showToast('Devolución procesada.', 'success');
      cargarDevoluciones();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

//  Anular devolución 
async function anularDevolucion(id) {
  confirmAction('¿Anular esta devolución?', async () => {
    try {
      await apiFetch(`/api/devoluciones/${id}/anular`, { method: 'PATCH' });
      showToast('Devolución anulada.', 'warning');
      cargarDevoluciones();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

//  Buscar venta para devolución 
async function buscarVentaParaDevolucion(comprobante) {
  const panelVenta = document.getElementById('nd-venta-encontrada');
  const panelProductos = document.getElementById('tbody-productos-devolucion');

  if (!comprobante) return;
  try {
    const data = await apiFetch(`/api/ventas?numero_comprobante=${encodeURIComponent(comprobante)}`);
    const ventas = Array.isArray(data) ? data : (data.ventas || []);
    if (ventas.length === 0) {
      showToast('No se encontró ninguna venta con ese comprobante.', 'warning');
      return;
    }
    const ventaRes = await apiFetch(`/api/ventas/${ventas[0].id_venta}`);
    DevState.ventaOriginal = ventaRes;

    if (panelVenta) {
      const setEl = (sel, val) => { const el = panelVenta.querySelector(sel); if (el) el.textContent = val ?? '—'; };
      setEl('#nd-venta-numero', ventaRes.numero_comprobante);
      setEl('#nd-venta-cliente', ventaRes.cliente_nombre || 'Sin cliente');
      setEl('#nd-venta-fecha', formatDate(ventaRes.fecha, false));
      setEl('#nd-venta-total', formatMoney(ventaRes.total));
      panelVenta.classList.remove('d-none');
    }

    renderProductosParaDevolucion(ventaRes.items || []);
    if (panelProductos) panelProductos.classList.remove('d-none');
  } catch (err) {
    showToast('Error al buscar venta: ' + err.message, 'error');
  }
}

//  Renderizar productos de la venta para seleccionar devolución 
function renderProductosParaDevolucion(items) {
  const tbody = document.getElementById('tbody-productos-devolucion');
  if (!tbody) return;
  tbody.replaceChildren();

  if (items.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'text-center text-muted py-3';
    td.textContent = 'Sin productos.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const tr = document.createElement('tr');

    const tdNom = document.createElement('td');
    tdNom.textContent = item.producto_nombre;

    const tdCantVend = document.createElement('td');
    tdCantVend.textContent = item.cantidad;

    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = formatMoney(item.precio_unitario);

    const tdCantDev = document.createElement('td');
    const inputCant = document.createElement('input');
    inputCant.type = 'number';
    inputCant.className = 'form-control form-control-sm dev-cant-devolver';
    inputCant.min = '0';
    inputCant.max = item.cantidad;
    inputCant.step = '0.01';
    inputCant.value = '0';
    inputCant.dataset.idProducto = item.id_producto;
    inputCant.dataset.precioUnitario = item.precio_unitario;
    inputCant.setAttribute('aria-label', `Cantidad a devolver de ${item.producto_nombre}`);
    tdCantDev.appendChild(inputCant);

    const tdReingresa = document.createElement('td');
    const chkReingresa = document.createElement('input');
    chkReingresa.type = 'checkbox';
    chkReingresa.className = 'form-check-input dev-reingresa-stock';
    chkReingresa.checked = true;
    chkReingresa.dataset.idProducto = item.id_producto;
    chkReingresa.setAttribute('aria-label', `Reingresa al stock ${item.producto_nombre}`);
    tdReingresa.appendChild(chkReingresa);

    tr.append(tdNom, tdCantVend, tdPrecio, tdCantDev, tdReingresa);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

//  Formulario: nueva devolución 
function initFormNuevaDevolucion() {
  // Cargar ventas en el select
  const selVenta = document.getElementById('nd-select-venta');
  if (selVenta) {
    apiFetch('/api/ventas?estado=pagada').then(data => {
      const ventas = Array.isArray(data) ? data : (data.ventas || []);
      selVenta.innerHTML = '<option value="">Seleccionar venta...</option>';
      ventas.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id_venta;
        opt.textContent = `${v.numero_comprobante} — ${v.cliente_nombre || 'Sin cliente'} — ${formatMoney(v.total)}`;
        selVenta.appendChild(opt);
      });
    }).catch(() => {
      selVenta.innerHTML = '<option value="">Error al cargar ventas</option>';
    });

    selVenta.addEventListener('change', async () => {
      const id_venta = selVenta.value;
      const panelVenta = document.getElementById('nd-venta-encontrada');
      const tbody = document.getElementById('tbody-productos-devolucion');
      if (!id_venta) {
        panelVenta?.classList.add('d-none');
        if (tbody) tbody.innerHTML = '<tr id="dev-productos-empty"><td colspan="5" class="text-center text-muted py-3">Busca una venta para ver sus productos.</td></tr>';
        document.getElementById('nd-monto-reembolso').value = '0.00';
        DevState.ventaOriginal = null;
        return;
      }
      try {
        const ventaRes = await apiFetch(`/api/ventas/${id_venta}`);
        DevState.ventaOriginal = ventaRes;
        if (panelVenta) {
          const setEl = (sel, val) => { const el = panelVenta.querySelector(sel); if (el) el.textContent = val ?? '—'; };
          setEl('#nd-venta-numero', ventaRes.numero_comprobante);
          setEl('#nd-venta-cliente', ventaRes.cliente_nombre || 'Sin cliente');
          setEl('#nd-venta-fecha', formatDate(ventaRes.fecha, false));
          setEl('#nd-venta-total', formatMoney(ventaRes.total));
          panelVenta.classList.remove('d-none');
        }
        renderProductosParaDevolucion(ventaRes.items || []);
      } catch (err) {
        showToast('Error al cargar venta: ' + err.message, 'error');
      }
    });
  }

  // Botón limpiar venta
  document.getElementById('btn-limpiar-venta')?.addEventListener('click', () => {
    if (selVenta) selVenta.value = '';
    document.getElementById('nd-venta-encontrada')?.classList.add('d-none');
    const tbody = document.getElementById('tbody-productos-devolucion');
    if (tbody) tbody.innerHTML = '<tr id="dev-productos-empty"><td colspan="5" class="text-center text-muted py-3">Busca una venta para ver sus productos.</td></tr>';
    DevState.ventaOriginal = null;
  });

  const form = document.getElementById('form-nueva-devolucion');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    if (!DevState.ventaOriginal) { showToast('Primero busca la venta original.', 'warning'); return; }
    if (!DevState.cajaActiva) { showToast('Necesitas una caja abierta.', 'error'); return; }

    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    const motivo = document.getElementById('nd-motivo')?.value.trim();

    // Recoger productos
    const productos = [];
    document.querySelectorAll('.dev-cant-devolver').forEach(input => {
      const cant = parseFloat(input.value);
      if (cant > 0) {
        const id_producto = parseInt(input.dataset.idProducto);
        const chk = document.querySelector(`.dev-reingresa-stock[data-id-producto="${id_producto}"]`);
        productos.push({
          id_producto,
          cantidad: cant,
          reingresa_stock: chk ? chk.checked : true,
        });
      }
    });

    if (productos.length === 0) {
      showToast('Selecciona al menos un producto a devolver.', 'warning');
      return;
    }

    const payload = {
      id_venta: DevState.ventaOriginal.id_venta,
      id_caja: DevState.cajaActiva.id_caja,
      id_almacen: DevState.id_almacen,
      motivo,
      tipo,
      productos,
    };

    try {
      await apiFetch('/api/devoluciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Devolución registrada correctamente.', 'success');
      form.reset();
      form.classList.remove('was-validated');
      DevState.ventaOriginal = null;
      document.getElementById('nd-venta-encontrada')?.classList.add('d-none');
      if (selVenta) selVenta.value = '';
      const tbody = document.getElementById('tbody-productos-devolucion');
      if (tbody) tbody.innerHTML = '<tr id="dev-productos-empty"><td colspan="5" class="text-center text-muted py-3">Busca una venta para ver sus productos.</td></tr>';
      cargarDevoluciones();
    } catch (err) {
      showToast('Error al registrar devolución: ' + err.message, 'error');
    }
  });
}

//  Filtros de devoluciones
function initFiltros() {
  const btnFiltrar = document.getElementById('btn-filtrar-devoluciones');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros-dev');

  const getFiltros = () => ({
    estado: document.getElementById('filtro-estado-devolucion')?.value,
    tipo: document.getElementById('filtro-tipo-devolucion')?.value,
    fecha_desde: document.getElementById('filtro-fecha-desde-dev')?.value,
    fecha_hasta: document.getElementById('filtro-fecha-hasta-dev')?.value,
  });

  if (btnFiltrar) btnFiltrar.addEventListener('click', () => cargarDevoluciones(getFiltros()));
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      ['filtro-estado-devolucion', 'filtro-tipo-devolucion',
        'filtro-fecha-desde-dev', 'filtro-fecha-hasta-dev'].forEach(id => {
          const el = document.getElementById(id); if (el) el.value = '';
        });
      cargarDevoluciones();
    });
  }

  // Filtrar también al cambiar los selects
  ['filtro-estado-devolucion', 'filtro-tipo-devolucion'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => cargarDevoluciones(getFiltros()));
  });
}

//  Paginación genérica 
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
// Cargar detalle en fila expandible
async function cargarDetalleDevExpandible(id, detailId) {
  const trDetail = document.getElementById(detailId);
  if (!trDetail) return;
  const td = trDetail.querySelector('td');
  try {
    const data = await apiFetch(`/api/devoluciones/${id}`);
    trDetail.dataset.loaded = '1';
    const d = data.devolucion;
    const detalle = data.detalle || [];
    td.innerHTML = `
      <div class="px-4 py-3">
        <div class="row g-3">
          <div class="col-12 col-md-8">
            <p class="small fw-semibold mb-2">Productos devueltos</p>
            <table class="table table-sm mb-0">
              <thead><tr><th>Producto</th><th>Cantidad</th><th>P. unitario</th><th>Reingresa stock</th></tr></thead>
              <tbody>
                ${detalle.map(it => `<tr>
                  <td>${it.producto_nombre}</td>
                  <td>${it.cantidad}</td>
                  <td>${formatMoney(it.precio_devuelto)}</td>
                  <td>${it.reingresa_stock ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="col-12 col-md-4">
            <p class="small fw-semibold mb-2">Resumen</p>
            <ul class="list-unstyled small">
              <li class="d-flex justify-content-between"><span class="text-muted">Tipo</span><strong>${d.tipo}</strong></li>
              <li class="d-flex justify-content-between"><span class="text-muted">Motivo</span><strong>${d.motivo || '—'}</strong></li>
              ${d.tipo === 'reembolso' ? `<li class="d-flex justify-content-between"><span class="text-muted">Monto</span><strong>${formatMoney(d.monto_reembolso)}</strong></li>` : ''}
            </ul>
          </div>
        </div>
      </div>`;
  } catch (err) {
    if (td) td.innerHTML = `<div class="px-4 py-2 text-danger small">Error: ${err.message}</div>`;
  }
}

//  Caja de trabajo de la sesión (reutiliza la misma elegida en Ventas) 
async function inicializarCajaDevoluciones() {
  const caja = await asegurarCajaDeTrabajo();
  DevState.cajaActiva = caja;
}

// Punto de entrada 
document.addEventListener('DOMContentLoaded', async () => {
  await inicializarCajaDevoluciones();
  initFiltros();
  initFormNuevaDevolucion();
  cargarDevoluciones();
});