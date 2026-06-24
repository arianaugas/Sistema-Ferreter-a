

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
  const tr = document.createElement('tr');

  const tdId = document.createElement('td');
  tdId.className = 'ps-3';
  const idSpan = document.createElement('span');
  idSpan.className = 'badge text-bg-light border font-monospace';
  idSpan.textContent = `DEV-${String(d.id_devolucion).padStart(5, '0')}`;
  tdId.appendChild(idSpan);

  const tdVenta = document.createElement('td');
  const compSpan = document.createElement('span');
  compSpan.className = 'badge text-bg-light border font-monospace';
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

  // Botón ver detalle
  const btnVer = document.createElement('button');
  btnVer.type = 'button';
  btnVer.className = 'btn btn-sm';
  btnVer.setAttribute('aria-label', 'Ver detalle');
  btnVer.innerHTML = '<i class="fa-regular fa-eye fa-fw" aria-hidden="true"></i>';
  btnVer.addEventListener('click', () => verDetalleDev(d.id_devolucion));

  divAcc.appendChild(btnVer);

  if (d.estado === 'pendiente') {
    const btnProcesar = document.createElement('button');
    btnProcesar.type = 'button';
    btnProcesar.className = 'btn btn-sm btn-outline-success';
    btnProcesar.setAttribute('aria-label', 'Procesar devolución');
    btnProcesar.innerHTML = '<i class="fa-solid fa-check fa-fw" aria-hidden="true"></i>';
    btnProcesar.addEventListener('click', () => procesarDevolucion(d.id_devolucion));

    const btnAnular = document.createElement('button');
    btnAnular.type = 'button';
    btnAnular.className = 'btn btn-sm btn-outline-danger';
    btnAnular.setAttribute('aria-label', 'Anular devolución');
    btnAnular.innerHTML = '<i class="fa-solid fa-ban fa-fw" aria-hidden="true"></i>';
    btnAnular.addEventListener('click', () => anularDevolucion(d.id_devolucion));

    divAcc.appendChild(btnProcesar);
    divAcc.appendChild(btnAnular);
  }

  tdAcciones.appendChild(divAcc);
  tr.append(tdId, tdVenta, tdCliente, tdEmpleado, tdTipo, tdEstado, tdMonto, tdFecha, tdAcciones);
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
    td.colSpan = 9;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No se encontraron devoluciones.';
    tr.appendChild(td);
    frag.appendChild(tr);
  } else {
    pagina.forEach(d => frag.appendChild(renderFilaDevolucion(d)));
  }

  tbody.appendChild(frag);
  actualizarFooter();
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

    const tbody = modal.querySelector('#tabla-det-dev-productos tbody');
    if (tbody) {
      tbody.replaceChildren();
      const frag = document.createDocumentFragment();
      (data.detalle || []).forEach(it => {
        const tr = document.createElement('tr');
        const tdNom = document.createElement('td'); tdNom.textContent = it.producto_nombre;
        const tdCant = document.createElement('td'); tdCant.textContent = it.cantidad;
        const tdReingresa = document.createElement('td');
        tdReingresa.innerHTML = getBadge(it.reingresa_stock ? 'activo' : 'inactivo', it.reingresa_stock ? 'Sí' : 'No');
        const tdPrecio = document.createElement('td'); tdPrecio.textContent = formatMoney(it.precio_devuelto);
        tr.append(tdNom, tdCant, tdReingresa, tdPrecio);
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
    const ventas = Array.isArray(data) ? data : [];
    if (ventas.length === 0) {
      showToast('No se encontró ninguna venta con ese comprobante.', 'warning');
      return;
    }
    const ventaRes = await apiFetch(`/api/ventas/${ventas[0].id_venta}`);
    DevState.ventaOriginal = ventaRes;

    if (panelVenta) {
      const setEl = (sel, val) => { const el = panelVenta.querySelector(sel); if (el) el.textContent = val ?? '—'; };
      setEl('#dev-venta-comprobante', ventaRes.numero_comprobante);
      setEl('#dev-venta-cliente', ventaRes.cliente_nombre || 'Sin cliente');
      setEl('#dev-venta-total', formatMoney(ventaRes.total));
      setEl('#dev-venta-estado', ventaRes.estado);
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
  const tbody = document.querySelector('#tabla-dev-productos-venta tbody');
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
  // Buscar venta
  const btnBuscar = document.getElementById('btn-buscar-venta');
  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      const comprobante = document.getElementById('nd-buscar-venta')?.value.trim();
      buscarVentaParaDevolucion(comprobante);
    });
  }
  const inputComp = document.getElementById('nd-buscar-venta');
  if (inputComp) {
    inputComp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarVentaParaDevolucion(inputComp.value.trim());
      }
    });
  }

  // Formulario de devolución
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
      document.getElementById('tbdy-productos-devolucion')?.classList.add('d-none');
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
      // Usar los IDs correctos que sí existen en el HTML
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

//  Obtener caja activa 
async function obtenerCajaActiva() {
  try {
    const data = await apiFetch('/api/caja/activa');
    DevState.cajaActiva = data.tieneCajaActiva ? data.caja : null;
  } catch { DevState.cajaActiva = null; }
}

// Punto de entrada 
document.addEventListener('DOMContentLoaded', async () => {
  await obtenerCajaActiva();
  initFiltros();
  initFormNuevaDevolucion();
  cargarDevoluciones();
});
