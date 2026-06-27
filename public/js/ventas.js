

//  Constante de IGV 
let IGV_RATE = 0.18;

async function cargarConfigIGV() {
  try {
    const data = await apiFetch('/api/configuracion/igv');
    if (data.ok && data.configuracion?.valor) {
      IGV_RATE = parseFloat(data.configuracion.valor);
    }
  } catch {
    // Usar valor por defecto 0.18
  }
}


// Estado del módulo 
const VentasState = {
  carrito: [], // [{ id_producto, nombre, codigo, precio_unitario, stock_actual, unidad, cantidad }]
  clienteSeleccionado: null,
  cajaActiva: null,
  series: [],
  tiposPago: [],
  ventasList: [],
  ventasPagina: 1,
  ventasPorPagina: 12,
  // IDs hidden para la venta
  id_almacen: null,
};

// Fetch helper 
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detalle || data.mensaje || `Error ${res.status}`);
  return data;
}

//  Calcular totales del carrito 
function calcularTotales() {
  const subtotal = VentasState.carrito.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
  const igv = parseFloat((subtotal * IGV_RATE).toFixed(2));
  const total = parseFloat((subtotal + igv).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), igv, total };
}

// Actualizar displays de totales 
function actualizarTotales() {
  const { subtotal, igv, total } = calcularTotales();
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = formatMoney(val); };
  setEl('pos-subtotal', subtotal);
  setEl('pos-igv', igv);
  setEl('pos-total', total);
  setEl('pos-resumen-total', total);

  const countEl = document.getElementById('pos-carrito-count');
  if (countEl) countEl.textContent = `${VentasState.carrito.length} ítem${VentasState.carrito.length !== 1 ? 's' : ''}`;
}

//  Renderizar resumen del carrito (columna derecha) 
function renderResumenCarrito() {
  const listaEl = document.getElementById('pos-resumen-lista');
  const vacioEl = document.getElementById('pos-resumen-vacio');
  if (!listaEl) return;

  listaEl.replaceChildren();

  if (VentasState.carrito.length === 0) {
    if (vacioEl) vacioEl.classList.remove('d-none');
    return;
  }
  if (vacioEl) vacioEl.classList.add('d-none');

  const frag = document.createDocumentFragment();
  VentasState.carrito.forEach(item => {
    const li = document.createElement('li');
    li.className = 'd-flex justify-content-between align-items-center py-1 border-bottom small';

    const spanNombre = document.createElement('span');
    spanNombre.className = 'text-truncate me-2';
    spanNombre.textContent = item.nombre;

    const spanMonto = document.createElement('span');
    spanMonto.className = 'text-muted flex-shrink-0';
    const sub = item.cantidad * item.precio_unitario;
    spanMonto.innerHTML = `${item.cantidad} · <strong>${formatMoney(sub)}</strong>`;

    li.appendChild(spanNombre);
    li.appendChild(spanMonto);
    frag.appendChild(li);
  });
  listaEl.appendChild(frag);
}

//  Renderizar tabla del carrito (columna izquierda) 
function renderCarrito() {
  const tbody = document.getElementById('carrito-body');
  const emptyRow = document.getElementById('carrito-empty-row');
  if (!tbody) return;

  // Eliminar filas dinámicas previas (mantiene la fila estática vacía)
  Array.from(tbody.querySelectorAll('tr[data-carrito-id]')).forEach(r => r.remove());

  if (VentasState.carrito.length === 0) {
    if (emptyRow) emptyRow.classList.remove('d-none');
    actualizarTotales();
    renderResumenCarrito();
    return;
  }
  if (emptyRow) emptyRow.classList.add('d-none');

  const frag = document.createDocumentFragment();
  VentasState.carrito.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.carritoId = item.id_producto;

    const tdNombre = document.createElement('td');
    const divNom = document.createElement('div');
    divNom.className = 'fw-semibold small';
    divNom.textContent = item.nombre;
    const smallCod = document.createElement('small');
    smallCod.className = 'text-muted';
    smallCod.textContent = item.codigo || '';
    tdNombre.appendChild(divNom);
    tdNombre.appendChild(smallCod);

    const tdPrecio = document.createElement('td');
    tdPrecio.className = 'small';
    tdPrecio.textContent = formatMoney(item.precio_unitario);

    const tdCant = document.createElement('td');
    const group = document.createElement('div');
    group.className = 'input-group input-group-sm';
    group.style.width = '110px';

    const btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.className = 'btn btn-sm btn-outline-secondary';
    btnMinus.setAttribute('aria-label', 'Restar cantidad');
    btnMinus.textContent = '−';
    btnMinus.addEventListener('click', () => cambiarCantidad(item.id_producto, item.cantidad - 1));

    const inputCant = document.createElement('input');
    inputCant.type = 'number';
    inputCant.className = 'form-control form-control-sm text-center';
    inputCant.value = item.cantidad;
    inputCant.min = '0.01';
    inputCant.step = '0.01';
    inputCant.setAttribute('aria-label', `Cantidad de ${item.nombre}`);
    inputCant.addEventListener('change', () => {
      const val = parseFloat(inputCant.value);
      if (!isNaN(val) && val > 0) cambiarCantidad(item.id_producto, val);
    });

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'btn btn-sm btn-outline-secondary';
    btnPlus.setAttribute('aria-label', 'Sumar cantidad');
    btnPlus.textContent = '+';
    btnPlus.addEventListener('click', () => cambiarCantidad(item.id_producto, item.cantidad + 1));

    group.appendChild(btnMinus);
    group.appendChild(inputCant);
    group.appendChild(btnPlus);
    tdCant.appendChild(group);

    const tdSub = document.createElement('td');
    tdSub.className = 'fw-semibold';
    tdSub.textContent = formatMoney(item.cantidad * item.precio_unitario);

    const tdQuitar = document.createElement('td');
    const btnQuitar = document.createElement('button');
    btnQuitar.type = 'button';
    btnQuitar.className = 'btn btn-sm text-danger';
    btnQuitar.setAttribute('aria-label', `Quitar ${item.nombre} del carrito`);
    btnQuitar.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';
    btnQuitar.addEventListener('click', () => quitarDelCarrito(item.id_producto));
    tdQuitar.appendChild(btnQuitar);

    tr.append(tdNombre, tdPrecio, tdCant, tdSub, tdQuitar);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
  actualizarTotales();
  renderResumenCarrito();
}

//  Agregar al carrito 
function agregarAlCarrito(producto) {
  const existente = VentasState.carrito.find(i => i.id_producto === producto.id_producto);
  if (existente) {
    const nuevaCant = existente.cantidad + 1;
    if (nuevaCant > existente.stock_actual) {
      showToast(`Stock insuficiente. Disponible: ${existente.stock_actual}`, 'warning');
      return;
    }
    existente.cantidad = nuevaCant;
  } else {
    if (producto.stock_actual <= 0) {
      showToast('Este producto no tiene stock disponible.', 'warning');
      return;
    }
    VentasState.carrito.push({ ...producto, cantidad: 1 });
  }
  renderCarrito();
}

//  Cambiar cantidad en carrito 
function cambiarCantidad(id_producto, nuevaCant) {
  if (nuevaCant <= 0) { quitarDelCarrito(id_producto); return; }
  const item = VentasState.carrito.find(i => i.id_producto === id_producto);
  if (!item) return;
  if (nuevaCant > item.stock_actual) {
    showToast(`Stock insuficiente. Disponible: ${item.stock_actual}`, 'warning');
    return;
  }
  item.cantidad = nuevaCant;
  renderCarrito();
}

//  Quitar del carrito 
function quitarDelCarrito(id_producto) {
  VentasState.carrito = VentasState.carrito.filter(i => i.id_producto !== id_producto);
  renderCarrito();
}

//  Limpiar carrito 
function limpiarCarrito() {
  VentasState.carrito = [];
  VentasState.clienteSeleccionado = null;
  renderCarrito();
  ocultarClienteSeleccionado();
  const form = document.getElementById('form-nueva-venta');
  if (form) form.reset();
  cargarSelectTiposPago(); // restaurar select de tipos de pago
}

async function cargarCategoriasPOS() {
  const sel = document.getElementById('pos-filtro-categoria');
  if (!sel) return;
  try {
    const data = await apiFetch('/api/categorias/cat');
    const cats = Array.isArray(data.categorias) ? data.categorias : [];
    sel.innerHTML = '<option value="">Todas</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id_categoria;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  } catch {
    // Si falla deja "Todas"
  }
}


//  Buscar productos 
let buscarTimer;
async function buscarProductos(termino) {
  const tbody = document.getElementById('pos-productos-body');
  if (!tbody) return;

  const selCat = document.getElementById('pos-filtro-categoria');
  const tieneCategoria = !!selCat?.value;

  // Solo abortar si el término es muy corto Y no hay categoría seleccionada
  if (termino && termino.length > 0 && termino.length < 2 && !tieneCategoria) {
    tbody.replaceChildren();
    return;
  }

  try {
    const params = new URLSearchParams({ activo: '1' });
    if (termino && termino.length >= 2) params.set('nombre', termino);
    if (tieneCategoria) params.set('categoria', selCat.value);

    const data = await apiFetch(`/api/productos?${params}`);
    let productos = Array.isArray(data) ? data : (data.productos || []);

    tbody.replaceChildren();
    if (productos.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'text-center text-muted py-3';
      td.textContent = 'Sin resultados.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const frag = document.createDocumentFragment();
    productos.slice(0, 30).forEach(p => {
      const tr = document.createElement('tr');

      const tdCod = document.createElement('td');
      const spanCod = document.createElement('span');
      spanCod.className = 'fw-semibold small';
      spanCod.textContent = p.codigo || '—';
      tdCod.appendChild(spanCod);

      const tdNom = document.createElement('td');
      const divNom = document.createElement('div');
      divNom.textContent = p.nombre;
      const smallMeta = document.createElement('small');
      smallMeta.className = 'text-muted';
      smallMeta.textContent = [p.categoria, p.subcategoria, p.marca].filter(Boolean).join(' · ');
      tdNom.appendChild(divNom);
      tdNom.appendChild(smallMeta);

      const tdStock = document.createElement('td');
      const stockBadge = document.createElement('span');
      const stockNum = parseFloat(p.stock_actual) || 0;
      stockBadge.className = `badge ${stockNum > 5 ? 'text-bg-success' : stockNum > 0 ? 'text-bg-warning' : 'text-bg-danger'}`;
      stockBadge.textContent = `${stockNum} ${p.unidad || ''}`;
      tdStock.appendChild(stockBadge);

      const tdPrecio = document.createElement('td');
      tdPrecio.textContent = `${formatMoney(p.precio_venta)} / ${p.unidad || 'und'}`;

      const tdBtn = document.createElement('td');
      const btnAgregar = document.createElement('button');
      btnAgregar.type = 'button';
      btnAgregar.className = 'btn btn-sm btn-primary';
      btnAgregar.setAttribute('aria-label', `Agregar ${p.nombre} al carrito`);
      btnAgregar.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
      btnAgregar.disabled = stockNum <= 0;
      btnAgregar.addEventListener('click', () => agregarAlCarrito({
        id_producto: p.id_producto,
        nombre: p.nombre,
        codigo: p.codigo,
        precio_unitario: parseFloat(p.precio_venta),
        stock_actual: stockNum,
        unidad: p.unidad,
      }));
      tdBtn.appendChild(btnAgregar);

      tr.append(tdCod, tdNom, tdStock, tdPrecio, tdBtn);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  } catch (err) {
    console.error('Error buscando productos:', err);
    showToast('Error al buscar productos.', 'error');
  }
}

//  Cargar clientes en datalist 
async function cargarClientesDatalist() {
  const datalist = document.getElementById('pos-clientes-lista');
  if (!datalist) return;
  try {
    const data = await apiFetch('/api/clientes');
    const clientes = Array.isArray(data) ? data : [];
    datalist.replaceChildren();
    const frag = document.createDocumentFragment();
    clientes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = `${c.nombre} — ${c.tipo_documento} ${c.numero_documento}`;
      opt.dataset.id = c.id_cliente;
      frag.appendChild(opt);
    });
    datalist.appendChild(frag);
    // Guardar clientes para búsqueda inversa
    window._clientesCache = clientes;
  } catch {
    // Si falla, no es crítico
  }
}

//  Selección de cliente 
function initBusquedaCliente() {
  const input = document.getElementById('pos-buscar-cliente');
  if (!input) return;
  input.addEventListener('change', () => {
    const val = input.value.trim();
    if (!val) return;
    const clientes = window._clientesCache || [];
    const encontrado = clientes.find(c => {
      const label = `${c.nombre} — ${c.tipo_documento} ${c.numero_documento}`;
      return label === val;
    });
    if (encontrado) {
      seleccionarCliente(encontrado);
      input.value = '';
    }
  });

  const btnAnonimo = document.getElementById('btn-pos-cliente-anonimo');
  if (btnAnonimo) {
    btnAnonimo.addEventListener('click', () => {
      VentasState.clienteSeleccionado = null;
      ocultarClienteSeleccionado();
      if (input) input.value = '';
    });
  }

  const btnQuitar = document.getElementById('btn-pos-quitar-cliente');
  if (btnQuitar) {
    btnQuitar.addEventListener('click', () => {
      VentasState.clienteSeleccionado = null;
      ocultarClienteSeleccionado();
      if (input) input.value = '';
    });
  }
}

function seleccionarCliente(c) {
  VentasState.clienteSeleccionado = c;
  const panel = document.getElementById('pos-cliente-seleccionado');
  const nombre = document.getElementById('pos-cliente-nombre');
  const doc = document.getElementById('pos-cliente-doc');
  if (panel) panel.classList.remove('d-none');
  if (nombre) nombre.textContent = c.nombre;
  if (doc) doc.textContent = `${c.tipo_documento} ${c.numero_documento}`;
}

function ocultarClienteSeleccionado() {
  const panel = document.getElementById('pos-cliente-seleccionado');
  if (panel) panel.classList.add('d-none');
}

//  Cargar series y resolver automáticamente 
async function cargarSeries() {
  try {
    const data = await apiFetch('/api/ventas/series');
    VentasState.series = Array.isArray(data) ? data : (data.series || []);
  } catch {
    VentasState.series = [];
  }
}

function resolverSerie(tipoComprobante) {
  return VentasState.series.find(s => s.tipo_comprobante === tipoComprobante && s.activo);
}

//  Cargar tipos de pago en los selects 
async function cargarTiposPago() {
  try {
    const data = await apiFetch('/api/ventas/tipos-pago');
    VentasState.tiposPago = Array.isArray(data) ? data : (data.tipos || []);
  } catch {
    VentasState.tiposPago = [];
  }
  cargarSelectTiposPago();
}

function cargarSelectTiposPago() {
  document.querySelectorAll('.pos-pago-tipo').forEach(sel => {
    const valorActual = sel.value;
    sel.replaceChildren();
    const frag = document.createDocumentFragment();
    VentasState.tiposPago.forEach(tp => {
      const opt = document.createElement('option');
      opt.value = tp.id_tipo_pago;
      opt.textContent = tp.nombre;
      frag.appendChild(opt);
    });
    sel.appendChild(frag);
    if (valorActual) sel.value = valorActual;
  });
}

//  Pagos: agregar nueva fila 
function agregarFilaPago() {
  const contenedor = document.getElementById('pos-pagos-lista');
  if (!contenedor) return;

  const idx = contenedor.querySelectorAll('.pos-pago-row').length;
  const div = document.createElement('div');
  div.className = 'row g-2 mb-2 align-items-end pos-pago-row';
  div.dataset.pagoIndex = idx;

  const col1 = document.createElement('div');
  col1.className = 'col-5';
  const labelT = document.createElement('label');
  labelT.className = 'form-label form-label-sm mb-1';
  labelT.textContent = 'Tipo';
  const sel = document.createElement('select');
  sel.className = 'form-select form-select-sm pos-pago-tipo';
  sel.setAttribute('aria-label', `Tipo de pago ${idx + 1}`);
  VentasState.tiposPago.forEach(tp => {
    const opt = document.createElement('option');
    opt.value = tp.id_tipo_pago;
    opt.textContent = tp.nombre;
    sel.appendChild(opt);
  });
  col1.appendChild(labelT);
  col1.appendChild(sel);

  const col2 = document.createElement('div');
  col2.className = 'col-4';
  const labelM = document.createElement('label');
  labelM.className = 'form-label form-label-sm mb-1';
  labelM.textContent = 'Monto';
  const inputM = document.createElement('input');
  inputM.type = 'number';
  inputM.className = 'form-control form-control-sm pos-pago-monto';
  inputM.placeholder = '0.00';
  inputM.min = '0.01';
  inputM.step = '0.01';
  inputM.setAttribute('aria-label', `Monto pago ${idx + 1}`);
  col2.appendChild(labelM);
  col2.appendChild(inputM);

  const col3 = document.createElement('div');
  col3.className = 'col-3';
  const btnElim = document.createElement('button');
  btnElim.type = 'button';
  btnElim.className = 'btn btn-sm btn-outline-danger w-100';
  btnElim.setAttribute('aria-label', 'Quitar este medio de pago');
  btnElim.innerHTML = '<i class="fa-solid fa-minus" aria-hidden="true"></i>';
  btnElim.addEventListener('click', () => div.remove());
  col3.appendChild(btnElim);

  div.appendChild(col1);
  div.appendChild(col2);
  div.appendChild(col3);
  contenedor.appendChild(div);
}

//  Caja de trabajo de la sesión 
// La lógica de selección/validación de caja vive en global.js
// (asegurarCajaDeTrabajo, compartida con devoluciones.js).
async function inicializarCajaVentas() {
  const caja = await asegurarCajaDeTrabajo();
  VentasState.cajaActiva = caja;
}

//  Formulario: nueva venta 
function initFormNuevaVenta() {
  const form = document.getElementById('form-nueva-venta');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (VentasState.carrito.length === 0) {
      showToast('El carrito está vacío.', 'warning');
      return;
    }
    if (!VentasState.cajaActiva) {
      showToast('Debes tener una caja abierta para registrar ventas.', 'error');
      return;
    }

    const tipoComprobante = document.getElementById('pos-tipo-comprobante')?.value;
    const serie = resolverSerie(tipoComprobante);
    if (!serie) {
      showToast(`No hay una serie activa para "${tipoComprobante}". Configura una en la pestaña Series.`, 'error');
      return;
    }

    // Obtener pagos
    const filasPago = document.querySelectorAll('.pos-pago-row');
    const pagos = [];
    filasPago.forEach(row => {
      const tipoPago = row.querySelector('.pos-pago-tipo')?.value;
      const monto = parseFloat(row.querySelector('.pos-pago-monto')?.value);
      if (tipoPago && !isNaN(monto) && monto > 0) {
        pagos.push({ id_tipo_pago: parseInt(tipoPago), monto });
      }
    });

    if (pagos.length === 0) {
      showToast('Ingresa al menos un monto de pago válido.', 'warning');
      return;
    }

    const { total } = calcularTotales();
    const totalPagado = parseFloat(pagos.reduce((s, p) => s + p.monto, 0).toFixed(2));
    if (totalPagado < total) {
      showToast(`El monto pagado (${formatMoney(totalPagado)}) es menor al total (${formatMoney(total)}). Falta: ${formatMoney(total - totalPagado)}`, 'warning');
      return;
    }
    if (totalPagado > parseFloat((total * 1.0).toFixed(2)) + 0.01) {
      showToast(`El monto pagado (${formatMoney(totalPagado)}) supera el total (${formatMoney(total)}). Revisa los montos ingresados.`, 'warning');
      return;
    }

    // Número de operación (opcional, para el primer pago)
    const numOp = document.getElementById('pos-numero-operacion')?.value.trim() || null;
    if (numOp) pagos[0].numero_operacion = numOp;

    const payload = {
      id_cliente: VentasState.clienteSeleccionado?.id_cliente || null,
      id_caja: VentasState.cajaActiva.id_caja,
      id_serie: serie.id_serie,
      tipo_comprobante: tipoComprobante,
      id_almacen: VentasState.id_almacen || 1, // almacén por defecto
      detalle_venta: VentasState.carrito.map(i => ({
        id_producto: i.id_producto,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
      pagos_venta: pagos,
    };

    const btnConfirmar = document.getElementById('btn-confirmar-venta');
    if (btnConfirmar) btnConfirmar.disabled = true;

    try {
      const res = await apiFetch('/api/ventas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(`✅ Venta registrada: ${res.data?.numero_comprobante || ''} — Total: ${formatMoney(res.data?.total)}`, 'success');
      limpiarCarrito();
      cargarListaVentas();
    } catch (err) {
      showToast('Error al procesar la venta: ' + err.message, 'error');
    } finally {
      if (btnConfirmar) btnConfirmar.disabled = false;
    }
  });

  // Limpiar carrito
  const btnLimpiar = document.getElementById('btn-limpiar-carrito');
  if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarCarrito);

  // Agregar medio de pago
  const btnAgrPago = document.getElementById('btn-agregar-pago');
  if (btnAgrPago) btnAgrPago.addEventListener('click', agregarFilaPago);
}

//  Buscador de productos POS 
function initBuscadorProductos() {
  const input = document.getElementById('pos-buscar-producto');
  if (!input) return;

  // Cargar productos al iniciar (sin filtro) para que la tabla no esté vacía
  buscarProductos('');

  input.addEventListener('input', () => {
    clearTimeout(buscarTimer);
    buscarTimer = setTimeout(() => buscarProductos(input.value.trim()), 300);
  });

  // Filtro por categoría — reconstruir búsqueda al cambiar
  const selCat = document.getElementById('pos-filtro-categoria');
  if (selCat) {
    selCat.addEventListener('change', () => {
      clearTimeout(buscarTimer);
      buscarProductos(input.value.trim());
    });
  }
}

//  Lista de ventas 
async function cargarListaVentas(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.desde) params.set('fecha_desde', filtros.desde);
    if (filtros.hasta) params.set('fecha_hasta', filtros.hasta);
    if (filtros.comprobante) params.set('tipo_comprobante', filtros.comprobante);
    if (filtros.estado) params.set('estado', filtros.estado);

    const data = await apiFetch(`/api/ventas?${params}`);
    VentasState.ventasList = Array.isArray(data) ? data : [];
    VentasState.ventasPagina = 1;
    renderTablaVentas();
  } catch (err) {
    showToast('Error al cargar ventas: ' + err.message, 'error');
  }
}

function renderTablaVentas() {
  const tbody = document.getElementById('tabla-ventas-body');
  const badge = document.getElementById('ventas-total-badge');
  if (!tbody) return;

  tbody.replaceChildren();
  if (badge) badge.textContent = `${VentasState.ventasList.length} ventas`;

  const inicio = (VentasState.ventasPagina - 1) * VentasState.ventasPorPagina;
  const pagina = VentasState.ventasList.slice(inicio, inicio + VentasState.ventasPorPagina);
  const frag = document.createDocumentFragment();

  if (pagina.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 8;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No se encontraron ventas.';
    tr.appendChild(td);
    frag.appendChild(tr);
    tbody.appendChild(frag);
    return;
  }

  pagina.forEach(v => {
    const detailId = `venta-detail-${v.id_venta}`;

    // Fila principal
    const tr = document.createElement('tr');
    tr.id = `venta-row-${v.id_venta}`;

    const tdIco = document.createElement('td');
    const iIco = document.createElement('i');
    iIco.className = 'fa-solid fa-chevron-down fa-xs';
    iIco.setAttribute('aria-hidden', 'true');
    tdIco.appendChild(iIco);

    const tdComp = document.createElement('td');
    const spanComp = document.createElement('span');
    spanComp.className = 'fw-semibold font-monospace small';
    spanComp.textContent = v.numero_comprobante;
    tdComp.appendChild(spanComp);

    const tdFecha = document.createElement('td');
    const time = document.createElement('time');
    time.textContent = formatDate(v.fecha, true);
    tdFecha.appendChild(time);

    const tdCliente = document.createElement('td');
    tdCliente.textContent = v.cliente_nombre || 'Sin cliente';

    const tdVendedor = document.createElement('td');
    tdVendedor.textContent = v.empleado_nombre || '—';

    const tdTotal = document.createElement('td');
    tdTotal.className = 'fw-semibold';
    tdTotal.textContent = formatMoney(v.total);

    const tdEstado = document.createElement('td');
    tdEstado.innerHTML = getBadge(v.estado);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'text-end';

    const divAcc = document.createElement('div');
    divAcc.className = 'd-flex gap-1 justify-content-end';

    const btnVer = document.createElement('button');
    btnVer.type = 'button';
    btnVer.className = 'btn btn-sm';
    btnVer.setAttribute('aria-label', `Ver comprobante ${v.numero_comprobante}`);
    btnVer.innerHTML = '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
    btnVer.addEventListener('click', () => verDetalleVenta(v.id_venta));

    divAcc.appendChild(btnVer);

    if (v.estado === 'pagada') {
      const btnAnular = document.createElement('button');
      btnAnular.type = 'button';
      btnAnular.className = 'btn btn-sm text-danger';
      btnAnular.setAttribute('aria-label', `Anular venta ${v.numero_comprobante}`);
      btnAnular.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i>';
      btnAnular.addEventListener('click', () => anularVenta(v.id_venta, v.numero_comprobante));
      divAcc.appendChild(btnAnular);
    }

    tdAcciones.appendChild(divAcc);
    tr.append(tdIco, tdComp, tdFecha, tdCliente, tdVendedor, tdTotal, tdEstado, tdAcciones);

    // Click en fila para expandir
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const detailRow = document.getElementById(detailId);
      if (!detailRow) return;
      const isOpen = detailRow.classList.toggle('show');
      iIco.classList.toggle('fa-chevron-down', !isOpen);
      iIco.classList.toggle('fa-chevron-up', isOpen);
      tr.classList.toggle('table-active', isOpen);
      if (isOpen && !detailRow.dataset.loaded) {
        cargarDetalleVentaExpandible(v.id_venta, detailId);
      }
    });

    // Fila de detalle (placeholder)
    const trDetail = document.createElement('tr');
    trDetail.id = detailId;
    trDetail.className = 'detail-row collapse';
    const tdDetail = document.createElement('td');
    tdDetail.colSpan = 8;
    tdDetail.className = 'p-0';
    tdDetail.innerHTML = `<div class="px-4 py-3 text-muted small"><i class="fa-solid fa-spinner fa-spin me-1"></i> Cargando detalle...</div>`;
    trDetail.appendChild(tdDetail);

    frag.appendChild(tr);
    frag.appendChild(trDetail);
  });

  tbody.appendChild(frag);
}

//  Cargar y mostrar detalle de venta en fila expandible 
async function cargarDetalleVentaExpandible(id_venta, detailId) {
  const trDetail = document.getElementById(detailId);
  if (!trDetail) return;
  const td = trDetail.querySelector('td');
  try {
    const v = await apiFetch(`/api/ventas/${id_venta}`);
    trDetail.dataset.loaded = '1';

    const div = document.createElement('div');
    div.className = 'px-4 py-3';

    const row = document.createElement('div');
    row.className = 'row g-3';

    // Columna productos
    const colProd = document.createElement('div');
    colProd.className = 'col-12 col-md-8';
    const pTitProd = document.createElement('p');
    pTitProd.className = 'small fw-semibold mb-2';
    pTitProd.textContent = 'Productos vendidos';
    const tblProd = document.createElement('table');
    tblProd.className = 'table table-sm mb-0';
    tblProd.innerHTML = '<thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>';
    const tbodyProd = document.createElement('tbody');
    (v.items || []).forEach(it => {
      const tr2 = document.createElement('tr');
      [it.producto_nombre, it.cantidad, formatMoney(it.precio_unitario), formatMoney(it.subtotal)].forEach(val => {
        const td2 = document.createElement('td');
        td2.textContent = val;
        tr2.appendChild(td2);
      });
      tbodyProd.appendChild(tr2);
    });
    tblProd.appendChild(tbodyProd);
    colProd.appendChild(pTitProd);
    colProd.appendChild(tblProd);

    // Columna pagos
    const colPag = document.createElement('div');
    colPag.className = 'col-12 col-md-4';
    const pTitPag = document.createElement('p');
    pTitPag.className = 'small fw-semibold mb-2';
    pTitPag.textContent = 'Pagos';
    const ulPag = document.createElement('ul');
    ulPag.className = 'list-unstyled small mb-2';
    (v.pagos || []).forEach(pg => {
      const li = document.createElement('li');
      li.className = 'd-flex justify-content-between';
      li.innerHTML = `<span>${pg.tipo_pago_nombre}</span><strong>${formatMoney(pg.monto)}</strong>`;
      ulPag.appendChild(li);
    });

    const hrEl = document.createElement('hr');
    hrEl.className = 'my-1';
    const pTotal = document.createElement('p');
    pTotal.className = 'd-flex justify-content-between fw-bold small mb-0';
    pTotal.innerHTML = `<span>Total</span><span>${formatMoney(v.total)}</span>`;

    colPag.appendChild(pTitPag);
    colPag.appendChild(ulPag);
    colPag.appendChild(hrEl);
    colPag.appendChild(pTotal);

    row.appendChild(colProd);
    row.appendChild(colPag);
    div.appendChild(row);
    if (td) { td.replaceChildren(div); }
  } catch (err) {
    if (td) td.innerHTML = `<div class="px-4 py-2 text-danger small">Error al cargar detalle: ${err.message}</div>`;
  }
}

//  Ver detalle de venta en modal 
async function verDetalleVenta(id_venta) {
  const modal = document.getElementById('modal-detalle-venta');
  if (!modal) return;
  try {
    const v = await apiFetch(`/api/ventas/${id_venta}`);
    const setEl = (sel, val) => { const el = modal.querySelector(sel); if (el) el.textContent = val ?? '—'; };
    setEl('#detalle-comprobante', v.numero_comprobante);
    setEl('#detalle-fecha', formatDate(v.fecha, true));
    setEl('#detalle-cliente', v.cliente_nombre || 'Sin cliente');
    setEl('#detalle-empleado', v.empleado_nombre);
    setEl('#detalle-subtotal', formatMoney(v.subtotal));
    setEl('#detalle-igv', formatMoney(v.igv));
    setEl('#detalle-total', formatMoney(v.total));
    setEl('#detalle-estado', v.estado);
    new bootstrap.Modal(modal).show();
  } catch (err) {
    showToast('Error al cargar el detalle: ' + err.message, 'error');
  }
}

//  Anular venta  
async function anularVenta(id_venta, numero_comprobante) {
  if (!VentasState.cajaActiva) {
    showToast('Necesitas una caja abierta para anular una venta.', 'error');
    return;
  }
  confirmAction(`¿Anular la venta ${numero_comprobante}? Esta acción devolverá el stock y registrará un egreso en caja.`, async () => {
    try {
      await apiFetch(`/api/ventas/${id_venta}/anular`, {
        method: 'PATCH',
        body: JSON.stringify({
          id_caja: VentasState.cajaActiva.id_caja,
          id_almacen: VentasState.id_almacen || 1,
        }),
      });
      showToast('Venta anulada correctamente.', 'success');
      cargarListaVentas();
    } catch (err) {
      showToast('Error al anular: ' + err.message, 'error');
    }
  });
}

//  Filtros de ventas  
function initFiltrosVentas() {
  const btnFiltrar = document.getElementById('btn-filtrar-ventas');
  const btnLimpiar = document.getElementById('btn-limpiar-filtros-ventas');

  const getFiltros = () => ({
    desde: document.getElementById('filtro-venta-desde')?.value,
    hasta: document.getElementById('filtro-venta-hasta')?.value,
    comprobante: document.getElementById('filtro-venta-comprobante')?.value,
    estado: document.getElementById('filtro-venta-estado')?.value,
  });

  if (btnFiltrar) btnFiltrar.addEventListener('click', () => cargarListaVentas(getFiltros()));

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      const ids = ['filtro-venta-desde', 'filtro-venta-hasta', 'filtro-venta-comprobante', 'filtro-venta-estado'];
      ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      cargarListaVentas();
    });
  }
}

//  TAB: Series  
function renderTablaSeries() {
  const tbody = document.querySelector('#tabla-series tbody');
  if (!tbody) return;
  tbody.replaceChildren();
  const frag = document.createDocumentFragment();
  if (VentasState.series.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.className = 'text-center text-muted py-3';
    td.textContent = 'No hay series configuradas.';
    tr.appendChild(td);
    frag.appendChild(tr);
    tbody.appendChild(frag);
    return;
  }
  VentasState.series.forEach((s, i) => {
    const tr = document.createElement('tr');

    const tdNum = document.createElement('td'); tdNum.textContent = i + 1;

    const tdTipo = document.createElement('td');
    tdTipo.textContent = s.tipo_comprobante;

    const tdSerie = document.createElement('td');
    const spanS = document.createElement('span');
    spanS.className = 'badge text-bg-light border font-monospace';
    spanS.textContent = s.serie;
    tdSerie.appendChild(spanS);

    const tdCorr = document.createElement('td');
    tdCorr.textContent = String(s.correlativo_actual).padStart(8, '0');

    const tdProx = document.createElement('td');
    tdProx.className = 'font-monospace small';
    const proxNum = (parseInt(s.correlativo_actual) + 1);
    tdProx.textContent = `${s.serie}-${String(proxNum).padStart(8, '0')}`;

    const tdEstado = document.createElement('td');
    tdEstado.innerHTML = getBadge(s.activo ? 'activo' : 'inactivo');

    const tdAcc = document.createElement('td');
    tdAcc.className = 'text-end';

    tr.append(tdNum, tdTipo, tdSerie, tdCorr, tdProx, tdEstado, tdAcc);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

//  TAB: Tipos de pago  
function renderTablaTiposPago() {
  const tbody = document.querySelector('#tabla-tipos-pago tbody');
  if (!tbody) return;
  tbody.replaceChildren();
  const frag = document.createDocumentFragment();
  if (VentasState.tiposPago.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'text-center text-muted py-3';
    td.textContent = 'No hay tipos de pago configurados.';
    tr.appendChild(td);
    frag.appendChild(tr);
    tbody.appendChild(frag);
    return;
  }
  VentasState.tiposPago.forEach((tp, i) => {
    const tr = document.createElement('tr');

    const tdNum = document.createElement('td'); tdNum.textContent = i + 1;

    const tdNom = document.createElement('td');
    tdNom.className = 'fw-medium';
    tdNom.textContent = tp.nombre;

    const tdVoucher = document.createElement('td');
    tdVoucher.innerHTML = tp.requiere_voucher
      ? '<span class="badge rounded-pill text-bg-primary">Sí</span>'
      : '<span class="badge rounded-pill text-bg-secondary">No</span>';

    const tdActivo = document.createElement('td');
    tdActivo.innerHTML = getBadge(tp.activo ? 'activo' : 'inactivo');

    const tdAcc = document.createElement('td');
    tdAcc.className = 'text-end';

    tr.append(tdNum, tdNom, tdVoucher, tdActivo, tdAcc);
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}


//  Obtener almacén por defecto  
async function obtenerAlmacenDefault() {
  try {
    const data = await apiFetch('/api/inventario/almacenes');
    const almacenes = Array.isArray(data) ? data : (data.almacenes || []);
    if (almacenes.length > 0) VentasState.id_almacen = almacenes[0].id_almacen;
  } catch {
    VentasState.id_almacen = 1;
  }
}

//  Punto de entrada  
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    inicializarCajaVentas(),
    cargarSeries(),
    cargarTiposPago(),
    cargarClientesDatalist(),
    obtenerAlmacenDefault(),
    cargarConfigIGV(),
    cargarCategoriasPOS(),
  ]);

  renderTablaSeries();
  renderTablaTiposPago();
  renderCarrito();
  initBuscadorProductos();
  initBusquedaCliente();
  initFormNuevaVenta();
  initFiltrosVentas();

  // Cargar lista de ventas cuando se activa el tab
  const tabListaVentas = document.getElementById('tab-lista-ventas');
  if (tabListaVentas) {
    tabListaVentas.addEventListener('shown.bs.tab', () => {
      if (VentasState.ventasList.length === 0) cargarListaVentas();
    });
  }
});
