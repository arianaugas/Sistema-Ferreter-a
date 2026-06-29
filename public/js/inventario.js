//  CONSTANTES 
const API = '/api/inventario';

// Cache de datos cargados (evita re-fetches innecesarios)
let _stockCache    = [];   // array completo de stock
let _almacenesCache = [];  // array de almacenes activos

// Paginación
const PAGE_SIZE = 20;
let stockPage = 1;
let kardexPage= 1;
let transfPage= 1;
let lotesPage = 1;

// Producto seleccionado en kardex y ajuste
let kardexProductoId = null;
let ajusteProductoData = null;
// Caché de productos con stock en el almacén de origen elegido para la transferencia
let _transfStockCache = [];

async function actualizarDatalistTransferenciaPorOrigen() {
    const idAlmacen = document.getElementById('transf-origen')?.value;
    const dropdown = document.getElementById('transf-resultados-dropdown');
    if (!dropdown) return;

    ocultarResultadosTransf();

    if (!idAlmacen) {
        _transfStockCache = [];
        return;
    }

    try {
        const data = await apiFetch(`${API}/stock?id_almacen=${idAlmacen}`);
        // Solo productos con stock disponible en ese almacén
        _transfStockCache = (data.stock || []).filter(p => Number(p.stock_actual) > 0);
    } catch (err) {
        _transfStockCache = [];
        showToast('No se pudo cargar el stock del almacén de origen.', 'error');
    }
}

// Pinta el dropdown con los productos del almacén origen que matchean el texto escrito
// (o todos, si el input está vacío y se hace foco/click, para que se puedan explorar).
function renderResultadosTransf(termino = '') {
    const dropdown = document.getElementById('transf-resultados-dropdown');
    if (!dropdown) return;

    if (!_transfStockCache.length) {
        ocultarResultadosTransf();
        return;
    }

    const t = termino.trim().toLowerCase();
    const yaAgregados = new Set(_transfDetalle.map(i => i.id_producto));

    const coincidencias = _transfStockCache
        .filter(p => !t || p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t))
        .slice(0, 30);

    dropdown.innerHTML = '';

    if (coincidencias.length === 0) {
        dropdown.innerHTML = '<p class="small text-muted text-center py-3 mb-0">Sin resultados en este almacén.</p>';
        dropdown.classList.remove('d-none');
        return;
    }

    coincidencias.forEach(p => {
        const yaEsta = yaAgregados.has(p.id_producto);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2';
        btn.disabled = yaEsta;
        btn.innerHTML = `
            <span class="text-truncate">
                <span class="fw-semibold small">${p.codigo}</span> — ${p.nombre}
            </span>
            <span class="badge ${yaEsta ? 'text-bg-secondary' : 'text-bg-success'} flex-shrink-0">
                ${yaEsta ? 'Agregado' : `${Number(p.stock_actual).toFixed(2)} ${p.unidad ?? ''}`}
            </span>`;
        btn.addEventListener('click', () => {
            if (yaEsta) return;
            agregarProductoTransfDesdeDropdown(p);
        });
        dropdown.appendChild(btn);
    });

    dropdown.classList.remove('d-none');
}

function ocultarResultadosTransf() {
    const dropdown = document.getElementById('transf-resultados-dropdown');
    if (dropdown) {
        dropdown.classList.add('d-none');
        dropdown.innerHTML = '';
    }
}

// INIT 
document.addEventListener('DOMContentLoaded', () => {
    cargarAlmacenes();
    cargarCategorias();
    cargarStock();
    initTabListeners();
    initStockFiltros();
    initAjusteOffcanvas();
    initTransferenciaOffcanvas();
    initAlmacenesCrud();
    initKardexBusqueda();
    initTransferenciasFiltros();
    initLotesFiltros();
    initExpandableRowsLive();
});


// HELPERS DE FETCH 

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.mensaje || 'Error del servidor');
    return data;
}


// ALMACENES — carga inicial 

async function cargarAlmacenes() {
    try {
        const data = await apiFetch(`${API}/almacenes`);
        _almacenesCache = data.almacenes;
        poblarSelectsAlmacen(data.almacenes);
        renderTablaAlmacenes(data.almacenes);
    } catch (err) {
        showToast('No se pudieron cargar los almacenes.', 'error');
    }
}

function poblarSelectsAlmacen(almacenes) {
    const almacenSelects = ['filtro-stock-almacen', 'kardex-almacen', 'filtro-lote-almacen'];
    almacenSelects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        almacenes.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id_almacen;
            opt.textContent = a.nombre;
            sel.appendChild(opt);
        });
    });

    // Selects de transferencia (sin opción "Todos")
    ['transf-origen', 'transf-destino', 'ajuste-almacen'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        almacenes.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id_almacen;
            opt.textContent = a.nombre;
            sel.appendChild(opt);
        });
    });
}


//  CATEGORÍAS — carga para filtro stock 

async function cargarCategorias() {
    try {
        const data = await apiFetch('/api/categorias/cat');
        const sel = document.getElementById('filtro-stock-categoria');
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        data.categorias.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_categoria;
            opt.textContent = c.nombre;
            sel.appendChild(opt);
        });
    } catch {
        // Silencioso
    }
}


// STOCK 

async function cargarStock(params = {}) {
    try {
        const qs = new URLSearchParams();
        if (params.buscar)      qs.set('buscar',      params.buscar);
        if (params.id_almacen)  qs.set('id_almacen',  params.id_almacen);
        if (params.estado)      qs.set('estado',       params.estado);
        if (params.id_categoria) qs.set('id_categoria', params.id_categoria);

        const data = await apiFetch(`${API}/stock?${qs}`);
        _stockCache = data.stock;
        stockPage = 1;
        renderStock(_stockCache);
        actualizarAlertas(_stockCache);
        poblarDatalistProductos(_stockCache);
    } catch (err) {
        showToast('No se pudo cargar el stock.', 'error');
    }
}

function renderStock(stock) {
    const tbody     = document.getElementById('tabla-stock-body');
    const emptyRow  = document.getElementById('stock-empty-row');
    const badge     = document.getElementById('stock-total-badge');
    const infoEl    = document.getElementById('stock-paginacion-info');

    tbody.querySelectorAll('tr.stock-dyn').forEach(r => r.remove());

    const inicio = (stockPage - 1) * PAGE_SIZE;
    const pagina = stock.slice(inicio, inicio + PAGE_SIZE);

    if (stock.length === 0) {
        emptyRow.classList.remove('d-none');
        badge.textContent = '0 productos';
        infoEl.textContent = 'Sin resultados';
        renderPaginacion('stock', stock.length);
        return;
    }

    emptyRow.classList.add('d-none');
    badge.textContent = `${stock.length} producto${stock.length !== 1 ? 's' : ''}`;
    infoEl.textContent = `Mostrando ${inicio + 1}–${Math.min(inicio + PAGE_SIZE, stock.length)} de ${stock.length}`;

    pagina.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'stock-dyn' + (item.estado_stock === 'critico' ? ' table-danger' : item.estado_stock === 'sobrestock' ? ' table-warning' : '');
        tr.dataset.productoId = item.id_producto;

        const tdCodigo = document.createElement('td');
        tdCodigo.innerHTML = `<span class="fw-semibold font-monospace">${item.codigo}</span>`;

        const tdNombre = document.createElement('td');
        tdNombre.innerHTML = `<span class="fw-semibold d-block">${item.nombre}</span><span class="small text-muted">${item.subcategoria ?? ''}</span>`;

        const tdCat = document.createElement('td');
        tdCat.textContent = item.categoria;

        const tdUnidad = document.createElement('td');
        tdUnidad.textContent = item.unidad;

        const tdActual = document.createElement('td');
        tdActual.className = 'text-end fw-bold' + (item.estado_stock === 'critico' ? ' text-danger' : '');
        tdActual.textContent = Number(item.stock_actual).toFixed(2);

        const tdMin = document.createElement('td');
        tdMin.className = 'text-end text-muted';
        tdMin.textContent = Number(item.stock_minimo).toFixed(2);

        const tdMax = document.createElement('td');
        tdMax.className = 'text-end text-muted';
        tdMax.textContent = item.stock_maximo != null ? Number(item.stock_maximo).toFixed(2) : '—';

        const tdUbic = document.createElement('td');
        tdUbic.innerHTML = `<span class="small">${item.ubicacion ?? '—'}</span>`;

        const tdEstado = document.createElement('td');
        const badgeEstado = _badgeEstadoStock(item.estado_stock);
        tdEstado.appendChild(badgeEstado);

        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-end';
        const btnKardex = document.createElement('button');
        btnKardex.type = 'button';
        btnKardex.className = 'btn btn-sm me-1';
        btnKardex.dataset.productoId = item.id_producto;
        btnKardex.dataset.productoNombre = item.nombre;
        btnKardex.setAttribute('aria-label', `Ver kardex de ${item.nombre}`);
        btnKardex.innerHTML = '<i class="fa-solid fa-timeline" aria-hidden="true"></i>';
        btnKardex.addEventListener('click', () => abrirKardexDesdeStock(item));

        const btnAjuste = document.createElement('button');
        btnAjuste.type = 'button';
        btnAjuste.className = 'btn btn-sm btn-warning';
        btnAjuste.dataset.productoId = item.id_producto;
        btnAjuste.setAttribute('aria-label', `Ajustar stock de ${item.nombre}`);
        btnAjuste.innerHTML = '<i class="fa-solid fa-sliders" aria-hidden="true"></i>';
        btnAjuste.setAttribute('data-bs-toggle', 'offcanvas');
        btnAjuste.setAttribute('data-bs-target', '#offcanvas-ajuste');
        btnAjuste.addEventListener('click', () => precargarAjuste(item));

        const wrap = document.createElement('div');
        wrap.className = 'd-flex gap-1 justify-content-end';
        wrap.appendChild(btnKardex);
        wrap.appendChild(btnAjuste);
        tdAcciones.appendChild(wrap);

        tr.appendChild(tdCodigo);
        tr.appendChild(tdNombre);
        tr.appendChild(tdCat);
        tr.appendChild(tdUnidad);
        tr.appendChild(tdActual);
        tr.appendChild(tdMin);
        tr.appendChild(tdMax);
        tr.appendChild(tdUbic);
        tr.appendChild(tdEstado);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });

    renderPaginacion('stock', stock.length);
}

function _badgeEstadoStock(estado) {
    const span = document.createElement('span');
    span.className = 'd-flex align-items-center gap-1';
    span.style.width = 'fit-content';
    const i = document.createElement('i');
    i.setAttribute('aria-hidden', 'true');
    if (estado === 'critico') {
        span.classList.add('badge', 'text-bg-danger');
        i.className = 'fa-solid fa-triangle-exclamation fa-xs';
        span.appendChild(i);
        span.appendChild(document.createTextNode('Crítico'));
    } else if (estado === 'sobrestock') {
        span.classList.add('badge', 'text-bg-warning', 'text-dark');
        i.className = 'fa-solid fa-arrow-up fa-xs';
        span.appendChild(i);
        span.appendChild(document.createTextNode('Sobrestock'));
    } else {
        span.classList.add('badge', 'text-bg-success');
        i.className = 'fa-solid fa-circle-check fa-xs';
        span.appendChild(i);
        span.appendChild(document.createTextNode('Normal'));
    }
    return span;
}

function actualizarAlertas(stock) {
    const critico = stock.filter(s => s.estado_stock === 'critico').length;
    const normal = stock.filter(s => s.estado_stock === 'normal').length;
    const sobrestock = stock.filter(s => s.estado_stock === 'sobrestock').length;

    document.getElementById('alerta-critico-count').textContent = critico;
    document.getElementById('alerta-normal-count').textContent = normal;
    document.getElementById('alerta-sobrestock-count').textContent = sobrestock;
    document.getElementById('alerta-total-count').textContent = stock.length;

    // Aplicar colores a las cards de alerta
    const critCard = document.getElementById('alerta-critico-card');
    const normCard = document.getElementById('alerta-normal-card');
    const sobreCard = document.getElementById('alerta-sobrestock-card');
    const totalCard = document.getElementById('alerta-total-card');

    if (critCard) {
        critCard.style.borderLeft = '4px solid var(--bs-danger, #dc3545)';
        const iconEl = critCard.querySelector('.flex-shrink-0 i');
        if (iconEl) { iconEl.className = 'fa-solid fa-triangle-exclamation fa-lg text-danger'; }
        else {
            const iconDiv = critCard.querySelector('.flex-shrink-0');
            if (iconDiv) iconDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation fa-lg text-danger" aria-hidden="true"></i>';
        }
        document.getElementById('alerta-critico-count').style.color = '#dc3545';
    }
    if (normCard) {
        normCard.style.borderLeft = '4px solid var(--bs-success, #198754)';
        const iconDiv = normCard.querySelector('.flex-shrink-0');
        if (iconDiv) iconDiv.innerHTML = '<i class="fa-solid fa-circle-check fa-lg text-success" aria-hidden="true"></i>';
        document.getElementById('alerta-normal-count').style.color = '#198754';
    }
    if (sobreCard) {
        sobreCard.style.borderLeft = '4px solid var(--bs-warning, #ffc107)';
        const iconDiv = sobreCard.querySelector('.flex-shrink-0');
        if (iconDiv) iconDiv.innerHTML = '<i class="fa-solid fa-arrow-up fa-lg text-warning" aria-hidden="true"></i>';
        document.getElementById('alerta-sobrestock-count').style.color = '#856404';
    }
    if (totalCard) {
        totalCard.style.borderLeft = '4px solid var(--bs-primary, #0d6efd)';
        const iconDiv = totalCard.querySelector('.flex-shrink-0');
        if (iconDiv) iconDiv.innerHTML = '<i class="fa-solid fa-boxes-stacked fa-lg text-primary" aria-hidden="true"></i>';
        document.getElementById('alerta-total-count').style.color = '#0d6efd';
    }
}

function poblarDatalistProductos(stock) {
    let dl = document.getElementById('ajuste-productos-lista');
    if (dl) {
        dl.innerHTML = '';
        stock.forEach(p => {
            const opt = document.createElement('option');
            opt.value = `${p.codigo} — ${p.nombre}`;
            opt.dataset.id = p.id_producto;
            dl.appendChild(opt);
        });
    }
    let dlK = document.getElementById('kardex-productos-lista');
    if (dlK) {
        dlK.innerHTML = '';
        stock.forEach(p => {
            const opt = document.createElement('option');
            opt.value = `${p.codigo} — ${p.nombre}`;
            opt.dataset.id = p.id_producto;
            dlK.appendChild(opt);
        });
    }
} 

//  STOCK FILTROS 

function initStockFiltros() {
    document.getElementById('btn-filtrar-stock')?.addEventListener('click', aplicarFiltrosStock);
    document.getElementById('btn-limpiar-stock')?.addEventListener('click', () => {
        document.getElementById('filtro-stock-buscar').value    = '';
        document.getElementById('filtro-stock-categoria').value = '';
        document.getElementById('filtro-stock-almacen').value   = '';
        document.getElementById('filtro-stock-estado').value    = '';
        cargarStock();
    });
    document.getElementById('filtro-stock-buscar')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') aplicarFiltrosStock();
    });
}

function aplicarFiltrosStock() {
    const params = {
        buscar: document.getElementById('filtro-stock-buscar')?.value.trim() || '',
        id_categoria: document.getElementById('filtro-stock-categoria')?.value || '',
        id_almacen: document.getElementById('filtro-stock-almacen')?.value || '',
        estado: document.getElementById('filtro-stock-estado')?.value || '',
    };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    cargarStock(params);
}


//  PAGINACIÓN 

function renderPaginacion(seccion, total) {
    const pageMap = { stock: stockPage, kardex: kardexPage, transf: transfPage, lotes: lotesPage };
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = pageMap[seccion] ?? 1;

    const sectionMap = {
        stock: 'stock-tabla-card',
        kardex: 'kardex-tabla-card',
        transf: 'transferencias-tabla-card',
        lotes: 'lotes-tabla-card',
    };
    const card = document.getElementById(sectionMap[seccion]);
    if (!card) return;
    const nav = card.querySelector('nav[aria-label]');
    if (!nav) return;
    const ul = nav.querySelector('ul.pagination');
    if (!ul) return;

    ul.innerHTML = '';

    const liPrev = document.createElement('li');
    liPrev.className = 'page-item' + (current <= 1 ? ' disabled' : '');
    const aPrev = document.createElement('a');
    aPrev.className = 'page-link';
    aPrev.href = '#';
    aPrev.setAttribute('aria-label', 'Anterior');
    aPrev.innerHTML = '<i class="fa-solid fa-chevron-left fa-xs" aria-hidden="true"></i>';
    if (current > 1) {
        aPrev.addEventListener('click', e => { e.preventDefault(); cambiarPagina(seccion, current - 1, total); });
    }
    liPrev.appendChild(aPrev);
    ul.appendChild(liPrev);

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
        const li = document.createElement('li');
        li.className = 'page-item' + (i === current ? ' active' : '');
        if (i === current) li.setAttribute('aria-current', 'page');
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = i;
        const page = i;
        a.addEventListener('click', e => { e.preventDefault(); cambiarPagina(seccion, page, total); });
        li.appendChild(a);
        ul.appendChild(li);
    }

    const liNext = document.createElement('li');
    liNext.className = 'page-item' + (current >= totalPages ? ' disabled' : '');
    const aNext = document.createElement('a');
    aNext.className = 'page-link';
    aNext.href = '#';
    aNext.setAttribute('aria-label', 'Siguiente');
    aNext.innerHTML = '<i class="fa-solid fa-chevron-right fa-xs" aria-hidden="true"></i>';
    if (current < totalPages) {
        aNext.addEventListener('click', e => { e.preventDefault(); cambiarPagina(seccion, current + 1, total); });
    }
    liNext.appendChild(aNext);
    ul.appendChild(liNext);
}

function cambiarPagina(seccion, page, total) {
    if (seccion === 'stock') { stockPage = page; renderStock(_stockCache); }
    if (seccion === 'kardex') { kardexPage = page; }
    if (seccion === 'transf') { transfPage = page; }
    if (seccion === 'lotes') { lotesPage  = page; }
}


//  TAB LISTENERS 

function initTabListeners() {
    document.getElementById('tab-transferencias')?.addEventListener('shown.bs.tab', () => {
        cargarTransferencias();
    });
    document.getElementById('tab-almacenes')?.addEventListener('shown.bs.tab', () => {
        cargarAlmacenes();
    });
}


//  KARDEX 

function initKardexBusqueda() {
    const dlK = document.getElementById('kardex-productos-lista');
    if (dlK && dlK.options.length === 0) {
        apiFetch(`${API}/stock`).then(data => {
            const items = data.stock || [];
            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = `${item.codigo} — ${item.nombre}`;
                opt.dataset.id = item.id_producto;
                dlK.appendChild(opt);
            });
        }).catch(() => {});
    }

    document.getElementById('btn-buscar-kardex')?.addEventListener('click', buscarKardex);
    document.getElementById('btn-limpiar-kardex')?.addEventListener('click', () => {
        const input = document.getElementById('kardex-producto-input');
        if (input) input.value = '';
        kardexProductoId = null;
        document.getElementById('kardex-almacen').value = '';
        document.getElementById('kardex-tipo').value = '';
        document.getElementById('kardex-fecha-desde').value = '';
        document.getElementById('kardex-fecha-hasta').value = '';
        limpiarTablaKardex();
    });

    const inputKardex = document.getElementById('kardex-producto-input');
    if (inputKardex) {
        inputKardex.addEventListener('change', () => {
            const val = inputKardex.value.trim();
            const producto = _stockCache.find(p => `${p.codigo} — ${p.nombre}` === val);
            kardexProductoId = producto ? producto.id_producto : null;
        });
    }
}

function resolverProductoPorTexto(texto, cache = _stockCache) {
    if (!texto || !cache.length) return null;
    const t = texto.toLowerCase();
    return cache.find(p =>
        `${p.codigo} — ${p.nombre}`.toLowerCase() === t ||
        p.codigo.toLowerCase() === t ||
        p.nombre.toLowerCase() === t
    ) || cache.find(p =>
        p.nombre.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t)
    ) || null;
}

async function buscarKardex() {
    if (!kardexProductoId) {
        const input = document.getElementById('kardex-producto-input');
        const producto = resolverProductoPorTexto(input?.value.trim() ?? '');
        if (!producto) {
            showToast('Seleccione un producto válido para consultar el kardex.', 'warning');
            return;
        }
        kardexProductoId = producto.id_producto;
    }

    const qs = new URLSearchParams();
    const almacen = document.getElementById('kardex-almacen')?.value;
    const tipo = document.getElementById('kardex-tipo')?.value;
    const fechaDesde = document.getElementById('kardex-fecha-desde')?.value;
    const fechaHasta = document.getElementById('kardex-fecha-hasta')?.value;

    if (almacen) qs.set('id_almacen',  almacen);
    if (tipo) qs.set('tipo', tipo);
    if (fechaDesde) qs.set('fecha_desde', fechaDesde);
    if (fechaHasta) qs.set('fecha_hasta', fechaHasta);

    try {
        const data = await apiFetch(`${API}/kardex/${kardexProductoId}?${qs}`);
        renderTablaKardex(data.kardex);
    } catch (err) {
        showToast(err.message || 'Error al consultar el kardex.', 'error');
    }
}

function limpiarTablaKardex() {
    const lista = document.getElementById('kardex-lista');
    lista.querySelectorAll('.kardex-card-item').forEach(el => el.remove());
    document.getElementById('kardex-empty-row').classList.remove('d-none');
    document.getElementById('kardex-total-badge').textContent = '0 movimientos';
}

function renderTablaKardex(movimientos) {
    const lista = document.getElementById('kardex-lista');
    const empty = document.getElementById('kardex-empty-row');
    const badge = document.getElementById('kardex-total-badge');

    lista.querySelectorAll('.kardex-card-item').forEach(el => el.remove());
    badge.textContent = `${movimientos.length} movimiento${movimientos.length !== 1 ? 's' : ''}`;

    if (movimientos.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

    movimientos.forEach((mov, idx) => {
        const cantidad = parseFloat(mov.cantidad);
        const signo = cantidad >= 0 ? '+' : '';
        const clrCant = cantidad > 0 ? 'text-success' : cantidad < 0 ? 'text-danger' : 'text-muted';
        const detailId = `kdx-detail-${idx}`;

        const wrap = document.createElement('div');
        wrap.className = 'kardex-card-item mb-2';

        // — tarjeta principal —
        const card = document.createElement('div');
        card.className = 'card card-body py-2 px-3 kardex-card-head';
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-expanded', 'false');
        card.setAttribute('aria-controls', detailId);

        card.innerHTML = `
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <i class="fa-solid fa-chevron-right fa-xs text-muted kardex-chevron" aria-hidden="true"></i>
                ${_badgeKardexTipo(mov.tipo_movimiento)}
                <span class="fw-semibold small">${_tituloKardex(mov)}</span>
                <span class="ms-auto fw-semibold ${clrCant}">${signo}${Number(mov.cantidad).toFixed(2)}</span>
            </div>
            <div class="d-flex gap-3 mt-1 small text-muted flex-wrap">
                <span><i class="fa-regular fa-calendar fa-xs me-1" aria-hidden="true"></i>${formatDate(mov.registrado_en, true)}</span>
                <span><i class="fa-solid fa-warehouse fa-xs me-1" aria-hidden="true"></i>${mov.almacen}</span>
                <span><i class="fa-regular fa-user fa-xs me-1" aria-hidden="true"></i>${mov.empleado}</span>
            </div>
        `;

        // — panel de detalle colapsable —
        const detail = document.createElement('div');
        detail.id = detailId;
        detail.className = 'kardex-card-detail collapse border border-top-0 rounded-bottom px-3 py-2';

        const docOrigen = _formatReferenciaKardex(mov);
        detail.innerHTML = `
            <div class="row g-2 small mt-0">
                <div class="col-12 col-md-6">
                    <dl class="row g-1 mb-0">
                        <dt class="col-5 text-muted fw-normal">Documento</dt>
                        <dd class="col-7 mb-0">${docOrigen}</dd>
                        <dt class="col-5 text-muted fw-normal">Motivo</dt>
                        <dd class="col-7 mb-0 fw-semibold">${mov.motivo ?? '—'}</dd>
                        <dt class="col-5 text-muted fw-normal">Almacén</dt>
                        <dd class="col-7 mb-0">${mov.almacen}</dd>
                    </dl>
                </div>
                <div class="col-12 col-md-6">
                    <dl class="row g-1 mb-0">
                        <dt class="col-5 text-muted fw-normal">Cantidad</dt>
                        <dd class="col-7 mb-0 fw-bold ${clrCant}">${signo}${Number(mov.cantidad).toFixed(2)}</dd>
                        <dt class="col-5 text-muted fw-normal">Stock anterior</dt>
                        <dd class="col-7 mb-0">${Number(mov.stock_anterior).toFixed(2)}</dd>
                        <dt class="col-5 text-muted fw-normal">Stock posterior</dt>
                        <dd class="col-7 mb-0 fw-bold">${Number(mov.stock_posterior).toFixed(2)}</dd>
                        <dt class="col-5 text-muted fw-normal">Empleado</dt>
                        <dd class="col-7 mb-0">${mov.empleado}</dd>
                    </dl>
                </div>
            </div>
        `;

        // toggle al hacer clic en la tarjeta
        card.addEventListener('click', () => {
            const isOpen = card.getAttribute('aria-expanded') === 'true';
            card.setAttribute('aria-expanded', String(!isOpen));
            card.classList.toggle('rounded-bottom', isOpen);
            card.classList.toggle('rounded-bottom-0', !isOpen);
            card.querySelector('.kardex-chevron').style.transform = isOpen ? '' : 'rotate(90deg)';
            detail.classList.toggle('show', !isOpen);
        });
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });

        wrap.appendChild(card);
        wrap.appendChild(detail);
        lista.appendChild(wrap);
    });
}

function _tituloKardex(mov) {
    const tipo = mov.tipo_movimiento?.toLowerCase();
    if (tipo === 'entrada') return mov.referencia_tipo === 'recepcion' ? 'Recepción de compra' : 'Entrada de stock';
    if (tipo === 'salida')  return mov.referencia_tipo === 'venta' ? 'Venta registrada'    : 'Salida de stock';
    if (tipo === 'ajuste')  return 'Ajuste de inventario';
    if (tipo === 'transferencia') return 'Transferencia entre almacenes';
    return mov.motivo ?? '—';
}

function _formatReferenciaKardex(mov) {
    if (!mov.referencia_tipo) return '<span class="text-muted">—</span>';
    const labels = { venta: 'Venta', recepcion: 'Recepción', devolucion: 'Devolución', transferencia: 'Transferencia', ajuste: 'Ajuste' };
    const label = labels[mov.referencia_tipo] ?? mov.referencia_tipo;
    return mov.referencia_id
        ? `<span class="badge text-bg-light border">${label} #${mov.referencia_id}</span>`
        : `<span class="badge text-bg-light border">${label}</span>`;
}

function _badgeKardexTipo(tipo) {
    const map = {
        entrada: { cls: 'text-bg-success', icon: 'fa-arrow-down', label: 'Entrada' },
        salida: { cls: 'text-bg-danger', icon: 'fa-arrow-up', label: 'Salida' },
        ajuste: { cls: 'text-bg-warning text-dark', icon: 'fa-sliders', label: 'Ajuste' },
        transferencia: { cls: 'text-bg-info text-dark', icon: 'fa-right-left', label: 'Transferencia' },
    };
    const e = map[tipo?.toLowerCase()] ?? { cls: 'text-bg-secondary', icon: 'fa-circle', label: tipo ?? '—' };
    return `<span class="badge ${e.cls}"><i class="fa-solid ${e.icon} fa-xs me-1" aria-hidden="true"></i>${e.label}</span>`;
}

function abrirKardexDesdeStock(item) {
    const tabKardex = document.getElementById('tab-kardex');
    if (tabKardex) bootstrap.Tab.getOrCreateInstance(tabKardex).show();

    const input = document.getElementById('kardex-producto-input');
    if (input) {
        input.value = `${item.codigo} — ${item.nombre}`;
    }
    kardexProductoId = item.id_producto;
    buscarKardex();
}


//  AJUSTE DE INVENTARIO 

function initAjusteOffcanvas() {
    const inputProducto  = document.getElementById('ajuste-producto');
    const inputStockNuevo = document.getElementById('ajuste-stock-nuevo');
    const form = document.getElementById('form-ajuste');

    inputProducto?.addEventListener('change', () => {
        const prod = resolverProductoPorTexto(inputProducto.value.trim());
        if (prod) {
            precargarAjuste(prod);
        } else {
            limpiarInfoAjuste();
        }
    });

    inputStockNuevo?.addEventListener('input', calcularDiferenciaAjuste);

    form?.addEventListener('submit', e => {
        e.preventDefault();
        guardarAjuste();
    });

    document.getElementById('offcanvas-ajuste')?.addEventListener('hidden.bs.offcanvas', limpiarFormAjuste);
}

function precargarAjuste(item) {
    ajusteProductoData = item;
    const inputProducto = document.getElementById('ajuste-producto');
    if (inputProducto) inputProducto.value = `${item.codigo} — ${item.nombre}`;
    document.getElementById('ajuste-producto-id').value = item.id_producto;
    document.getElementById('ajuste-stock-actual').textContent = Number(item.stock_actual).toFixed(2);
    document.getElementById('ajuste-unidad').textContent = item.unidad ?? '—';
    document.getElementById('ajuste-stock-min').textContent = Number(item.stock_minimo).toFixed(2);
    document.getElementById('ajuste-stock-max').textContent = item.stock_maximo != null ? Number(item.stock_maximo).toFixed(2) : '—';
    document.getElementById('ajuste-stock-nuevo').value = '';
    document.getElementById('ajuste-diferencia').value  = '';
}

function limpiarInfoAjuste() {
    ajusteProductoData = null;
    document.getElementById('ajuste-producto-id').value = '';
    document.getElementById('ajuste-stock-actual').textContent = '—';
    document.getElementById('ajuste-unidad').textContent = '—';
    document.getElementById('ajuste-stock-min').textContent = '—';
    document.getElementById('ajuste-stock-max').textContent = '—';
    document.getElementById('ajuste-diferencia').value = '';
}

function limpiarFormAjuste() {
    document.getElementById('form-ajuste')?.reset();
    limpiarInfoAjuste();
    ajusteProductoData = null;
}

function calcularDiferenciaAjuste() {
    const stockActualEl = document.getElementById('ajuste-stock-actual');
    const stockNuevoEl  = document.getElementById('ajuste-stock-nuevo');
    const difEl = document.getElementById('ajuste-diferencia');
    if (!stockActualEl || !stockNuevoEl || !difEl) return;

    const actual = parseFloat(stockActualEl.textContent);
    const nuevo = parseFloat(stockNuevoEl.value);

    if (isNaN(actual) || isNaN(nuevo)) {
        difEl.value = '';
        return;
    }

    const dif = nuevo - actual;
    difEl.value = (dif >= 0 ? '+' : '') + dif.toFixed(2);
}

async function guardarAjuste() {
    const productoId = document.getElementById('ajuste-producto-id').value;
    const almacenId = document.getElementById('ajuste-almacen').value;
    const stockNuevo = parseFloat(document.getElementById('ajuste-stock-nuevo').value);
    const motivo = document.getElementById('ajuste-motivo').value.trim();
    const stockActual = parseFloat(document.getElementById('ajuste-stock-actual').textContent);

    if (!productoId || !almacenId || isNaN(stockNuevo) || !motivo) {
        showToast('Complete todos los campos obligatorios.', 'warning');
        return;
    }
    if (stockNuevo < 0) {
        showToast('El stock contado no puede ser negativo.', 'warning');
        return;
    }

    const cantidad = stockNuevo - stockActual;

    const btn = document.getElementById('btn-confirmar-ajuste');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/ajuste`, {
            method: 'POST',
            body: JSON.stringify({ id_producto: productoId, id_almacen: almacenId, cantidad, motivo }),
        });
        showToast('Ajuste registrado correctamente.', 'success');
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-ajuste'))?.hide();
        cargarStock({});
    } catch (err) {
        showToast(err.message || 'Error al registrar el ajuste.', 'error');
    } finally {
        btn.disabled = false;
    }
}


// ALMACENES — CRUD 

function renderTablaAlmacenes(almacenes) {
    const tbody    = document.getElementById('tabla-almacenes-body');

    tbody.querySelectorAll('tr.almacen-dyn').forEach(r => r.remove());

    if (almacenes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">No hay almacenes registrados</td></tr>';
        return;
    }

    almacenes.forEach(alm => {
        const tr = document.createElement('tr');
        tr.className = 'almacen-dyn';
        tr.dataset.almacenId = alm.id_almacen;

        const tdId = document.createElement('td');
        tdId.textContent = alm.id_almacen;

        const tdNombre = document.createElement('td');
        tdNombre.innerHTML = `<span class="fw-semibold">${alm.nombre}</span>`;

        const tdDir = document.createElement('td');
        tdDir.textContent = alm.direccion ?? '—';

        const tdResp = document.createElement('td');
        tdResp.textContent = alm.responsable ?? '—';

        const tdEstado = document.createElement('td');
        tdEstado.innerHTML = `<span class="badge text-bg-success">Activo</span>`;

        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-end';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn btn-sm me-1';
        btnEditar.setAttribute('aria-label', `Editar ${alm.nombre}`);
        btnEditar.innerHTML = '<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>';
        btnEditar.setAttribute('data-bs-toggle', 'modal');
        btnEditar.setAttribute('data-bs-target', '#modal-editar-almacen');
        btnEditar.addEventListener('click', () => abrirModalEditarAlmacen(alm));

        const btnDesactivar = document.createElement('button');
        btnDesactivar.type = 'button';
        btnDesactivar.className = 'btn btn-sm text-danger';
        btnDesactivar.setAttribute('aria-label', `Desactivar ${alm.nombre}`);
        btnDesactivar.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i>';
        btnDesactivar.addEventListener('click', () => confirmarDesactivarAlmacen(alm));

        const wrap = document.createElement('div');
        wrap.className = 'd-flex gap-1 justify-content-end';
        wrap.appendChild(btnEditar);
        wrap.appendChild(btnDesactivar);
        tdAcciones.appendChild(wrap);

        tr.appendChild(tdId);
        tr.appendChild(tdNombre);
        tr.appendChild(tdDir);
        tr.appendChild(tdResp);
        tr.appendChild(tdEstado);
        tr.appendChild(tdAcciones);
        tbody.appendChild(tr);
    });
}

async function _poblarSelectsResponsable(idResponsableActual = null) {
    try {
        const data = await apiFetch('/api/empleados');
        const empleados = data.empleados ?? [];
        ['nuevo-alm-responsable', 'editar-alm-responsable'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            while (sel.options.length > 1) sel.remove(1);
            empleados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id_empleado;
                opt.textContent = `${e.nombre} ${e.apellido}`;
                sel.appendChild(opt);
            });
        });
        if (idResponsableActual != null) {
            const selEditar = document.getElementById('editar-alm-responsable');
            if (selEditar) selEditar.value = String(idResponsableActual);
        }
    } catch {
        // Silencioso
    }
}

function initAlmacenesCrud() {
    document.getElementById('form-nuevo-almacen')?.addEventListener('submit', e => {
        e.preventDefault();
        guardarNuevoAlmacen();
    });

    document.getElementById('form-editar-almacen')?.addEventListener('submit', e => {
        e.preventDefault();
        guardarEditarAlmacen();
    });

    document.getElementById('btn-confirmar-desactivar-almacen')?.addEventListener('click', ejecutarDesactivarAlmacen);

    document.getElementById('modal-nuevo-almacen')?.addEventListener('show.bs.modal', () => {
        _poblarSelectsResponsable();
    });
}

async function guardarNuevoAlmacen() {
    const nombre = document.getElementById('nuevo-alm-nombre').value.trim();
    const direccion  = document.getElementById('nuevo-alm-direccion').value.trim();
    const responsable = document.getElementById('nuevo-alm-responsable').value;

    if (!nombre) {
        showToast('El nombre del almacén es obligatorio.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-guardar-nuevo-almacen');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/almacenes`, {
            method: 'POST',
            body: JSON.stringify({ nombre, direccion: direccion || null, responsable: responsable || null }),
        });
        showToast('Almacén creado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-almacen'))?.hide();
        document.getElementById('form-nuevo-almacen').reset();
        cargarAlmacenes();
    } catch (err) {
        showToast(err.message || 'Error al crear el almacén.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function abrirModalEditarAlmacen(alm) {
    document.getElementById('editar-alm-id').value = alm.id_almacen;
    document.getElementById('editar-alm-nombre').value = alm.nombre;
    document.getElementById('editar-alm-direccion').value = alm.direccion ?? '';
    // Limpiar select mientras carga
    const selResp = document.getElementById('editar-alm-responsable');
    if (selResp) {
        while (selResp.options.length > 1) selResp.remove(1);
        selResp.value = '';
    }
    // Poblar empleados y setear el responsable actual
    _poblarSelectsResponsable(alm.id_responsable);
}

async function guardarEditarAlmacen() {
    const id = document.getElementById('editar-alm-id').value;
    const nombre = document.getElementById('editar-alm-nombre').value.trim();
    const direccion = document.getElementById('editar-alm-direccion').value.trim();
    const responsable = document.getElementById('editar-alm-responsable').value;

    if (!nombre) {
        showToast('El nombre del almacén es obligatorio.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-guardar-editar-almacen');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/almacenes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, direccion: direccion || null, responsable: responsable || null }),
        });
        showToast('Almacén actualizado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-editar-almacen'))?.hide();
        cargarAlmacenes();
    } catch (err) {
        showToast(err.message || 'Error al editar el almacén.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function confirmarDesactivarAlmacen(alm) {
    document.getElementById('desactivar-alm-nombre').textContent = alm.nombre;
    document.getElementById('btn-confirmar-desactivar-almacen').dataset.almacenId = alm.id_almacen;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-desactivar-almacen')).show();
}

async function ejecutarDesactivarAlmacen() {
    const id = document.getElementById('btn-confirmar-desactivar-almacen').dataset.almacenId;
    const btn = document.getElementById('btn-confirmar-desactivar-almacen');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/almacenes/${id}`, { method: 'DELETE' });
        showToast('Almacén desactivado.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-desactivar-almacen'))?.hide();
        cargarAlmacenes();
    } catch (err) {
        showToast(err.message || 'Error al desactivar el almacén.', 'error');
    } finally {
        btn.disabled = false;
    }
}


//  TRANSFERENCIAS 

function initTransferenciasFiltros() {
    document.getElementById('btn-filtrar-transf')?.addEventListener('click', cargarTransferencias);
    document.getElementById('btn-limpiar-transf')?.addEventListener('click', () => {
        document.getElementById('filtro-transf-estado').value = '';
        document.getElementById('filtro-transf-desde').value = '';
        document.getElementById('filtro-transf-hasta').value = '';
        cargarTransferencias();
    });
}

async function cargarTransferencias() {
    const qs = new URLSearchParams();
    const estado = document.getElementById('filtro-transf-estado')?.value;
    const desde = document.getElementById('filtro-transf-desde')?.value;
    const hasta = document.getElementById('filtro-transf-hasta')?.value;

    if (estado) qs.set('estado', estado);
    if (desde) qs.set('fecha_desde', desde);
    if (hasta) qs.set('fecha_hasta', hasta);

    try {
        const data = await apiFetch(`${API}/transferencias?${qs}`);
        renderTablaTransferencias(data.transferencias);
    } catch (err) {
        showToast('Error al cargar transferencias.', 'error');
    }
}

function renderTablaTransferencias(transferencias) {
    const tbody = document.getElementById('tabla-transferencias-body');
    const emptyRow = document.getElementById('transf-empty-row');
    const badge = document.getElementById('transf-total-badge');
    const info = document.getElementById('transf-paginacion-info');

    tbody.querySelectorAll('tr.transf-dyn').forEach(r => r.remove());
    badge.textContent = `${transferencias.length} transferencia${transferencias.length !== 1 ? 's' : ''}`;

    if (transferencias.length === 0) {
        emptyRow.classList.remove('d-none');
        info.textContent = '';
        return;
    }

    emptyRow.classList.add('d-none');
    info.textContent = `${transferencias.length} transferencia${transferencias.length !== 1 ? 's' : ''}`;

    transferencias.forEach((t, idx) => {
        const rowId = `transf-dyn-row-${idx}`;
        const detailId = `transf-dyn-detail-${idx}`;

        const tr = document.createElement('tr');
        tr.id = rowId;
        tr.className = 'transf-dyn';
        // En vez de eso, el ícono de chevron tiene su propio botón

        const badgeEstado = _badgeTransfEstado(t.estado);

        tr.innerHTML = `
            <td class="ps-3">
                <button type="button" class="btn btn-sm p-0 border-0 bg-transparent transf-expand-btn"
                    data-target="${detailId}" aria-label="Expandir detalle" aria-expanded="false">
                    <i class="fa-solid fa-chevron-down fa-xs text-muted" aria-hidden="true"></i>
                </button>
            </td>
            <td><span class="fw-semibold font-monospace">TRF-${String(t.id_transferencia).padStart(3,'0')}</span></td>
            <td><time datetime="${t.fecha}">${formatDate(t.fecha)}</time></td>
            <td>${t.almacen_origen}</td>
            <td>${t.almacen_destino}</td>
            <td>${t.empleado}</td>
            <td><span class="small">${t.motivo ?? '<em class="text-muted">Sin motivo</em>'}</span></td>
            <td>${badgeEstado}</td>
            <td class="text-end">
                <button type="button" class="btn btn-sm btn-ver-transf"
                    data-transf-id="${t.id_transferencia}"
                    aria-label="Ver detalle de transferencia">
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
            </td>
        `;

        const trDetail = document.createElement('tr');
        trDetail.id = detailId;
        trDetail.className = 'transf-dyn detail-row';
        trDetail.style.display = 'none';
        trDetail.dataset.transfId = t.id_transferencia;
        trDetail.dataset.loaded = 'false';
        trDetail.innerHTML = `<td colspan="9" class="px-4 py-2">
            <div class="d-flex align-items-center gap-2 text-muted small">
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                <span>Cargando detalle…</span>
            </div>
        </td>`;

        tbody.appendChild(tr);
        tbody.appendChild(trDetail);

        // Botón chevron para expandir/colapsar
        const expandBtn = tr.querySelector('.transf-expand-btn');
        expandBtn.addEventListener('click', async () => {
            const isOpen = trDetail.style.display !== 'none';
            if (isOpen) {
                trDetail.style.display = 'none';
                expandBtn.setAttribute('aria-expanded', 'false');
                expandBtn.querySelector('i').className = 'fa-solid fa-chevron-down fa-xs text-muted';
            } else {
                trDetail.style.display = '';
                expandBtn.setAttribute('aria-expanded', 'true');
                expandBtn.querySelector('i').className = 'fa-solid fa-chevron-up fa-xs text-muted';
                if (trDetail.dataset.loaded === 'false') {
                    try {
                        const data = await apiFetch(`${API}/transferencias/${t.id_transferencia}`);
                        const productos = data.detalle || [];
                        if (productos.length === 0) {
                            trDetail.querySelector('td').innerHTML = `<span class="text-muted small py-2 d-block">Sin productos registrados en esta transferencia.</span>`;
                        } else {
                            trDetail.querySelector('td').innerHTML = `
                                <div class="py-1">
                                    <p class="small text-muted mb-2"><strong>Motivo:</strong> ${t.motivo ?? '<em>Sin motivo</em>'}</p>
                                    <table class="table table-sm table-borderless mb-0" style="max-width:600px">
                                        <thead class="text-muted small">
                                            <tr>
                                                <th>Código</th>
                                                <th>Producto</th>
                                                <th class="text-end">Cantidad</th>
                                                <th>Unidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${productos.map(p => `
                                                <tr>
                                                    <td class="font-monospace small">${p.producto_codigo}</td>
                                                    <td class="small">${p.producto_nombre}</td>
                                                    <td class="text-end small fw-semibold">${Number(p.cantidad).toFixed(2)}</td>
                                                    <td class="small text-muted">${p.unidad ?? ''}</td>
                                                </tr>`).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                        }
                        trDetail.dataset.loaded = 'true';
                    } catch {
                        trDetail.querySelector('td').innerHTML = `<span class="text-danger small">Error al cargar los productos de esta transferencia.</span>`;
                    }
                }
            }
        });

        // Botón "Ver" abre modal de detalle
        tr.querySelector('.btn-ver-transf').addEventListener('click', e => {
            e.stopPropagation();
            abrirDetalleTransferencia(t);
        });
    });
}

function _badgeTransfEstado(estado) {
    const map = {
        pendiente: '<span class="badge text-bg-warning text-dark">Pendiente</span>',
        completada: '<span class="badge text-bg-success">Completada</span>',
        anulada: '<span class="badge text-bg-danger">Anulada</span>',
    };
    return map[estado] ?? `<span class="badge text-bg-secondary">${estado}</span>`;
}

function abrirDetalleTransferencia(t) {
    document.getElementById('transf-det-numero').textContent = `TRF-${String(t.id_transferencia).padStart(3,'0')}`;
    document.getElementById('transf-det-fecha').textContent = formatDate(t.fecha);
    document.getElementById('transf-det-origen').textContent = t.almacen_origen;
    document.getElementById('transf-det-destino').textContent = t.almacen_destino;
    document.getElementById('transf-det-empleado').textContent = t.empleado;
    document.getElementById('transf-det-motivo').textContent = t.motivo ?? '—';
    document.getElementById('transf-det-estado').outerHTML =
        `<span id="transf-det-estado">${_badgeTransfEstado(t.estado)}</span>`;

    const tbodyProductos = document.getElementById('tabla-transf-det-productos-body');
    if (tbodyProductos) {
        tbodyProductos.innerHTML = `<tr><td colspan="4" class="text-center text-muted small py-3">
            <i class="fa-solid fa-spinner fa-spin me-1" aria-hidden="true"></i>Cargando…
        </td></tr>`;
        apiFetch(`${API}/transferencias/${t.id_transferencia}`)
            .then(data => {
                const productos = data.detalle || [];
                if (productos.length === 0) {
                    tbodyProductos.innerHTML = `<tr><td colspan="4" class="text-center text-muted small">Sin productos registrados.</td></tr>`;
                } else {
                    tbodyProductos.innerHTML = productos.map(p => `
                        <tr>
                            <td class="font-monospace small">${p.producto_codigo}</td>
                            <td class="small">${p.producto_nombre}</td>
                            <td class="text-end small fw-semibold">${Number(p.cantidad).toFixed(2)}</td>
                            <td class="small text-muted">${p.unidad ?? ''}</td>
                        </tr>`).join('');
                }
            })
            .catch(() => {
                tbodyProductos.innerHTML = `<tr><td colspan="4" class="text-danger small text-center">Error al cargar los productos.</td></tr>`;
            });
    }

    const fieldset = document.getElementById('transf-cambiar-estado-fieldset');

    if (t.estado !== 'pendiente') {
        fieldset.innerHTML = `<p class="small text-muted mb-0">Esta transferencia ya está <strong>${t.estado}</strong> y no puede modificarse.</p>`;
    } else {
        fieldset.innerHTML = `
            <legend class="visually-hidden">Cambiar estado de la transferencia</legend>
            <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-success" id="btn-completar-transf"
                    data-transf-id="${t.id_transferencia}" aria-label="Marcar como completada">
                    <i class="fa-solid fa-circle-check me-1" aria-hidden="true"></i>Marcar como completada
                </button>
                <button type="button" class="btn btn-sm btn-secondary" id="btn-anular-transf"
                    disabled title="Función no disponible aún" aria-disabled="true"
                    aria-label="Anular transferencia (no disponible)">
                    <i class="fa-solid fa-ban me-1" aria-hidden="true"></i>Anular transferencia
                </button>
            </div>`;

        document.getElementById('btn-completar-transf').addEventListener('click', () => {
            confirmAction('¿Marcar esta transferencia como completada? Se actualizará el stock.', () => {
                completarTransferenciaAction(t.id_transferencia);
            });
        });
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-detalle-transferencia')).show();
}


async function completarTransferenciaAction(id) {
    try {
        await apiFetch(`${API}/transferencias/${id}/completar`, { method: 'PATCH' });
        showToast('Transferencia completada correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-detalle-transferencia'))?.hide();
        cargarTransferencias();
        cargarStock({});
    } catch (err) {
        showToast(err.message || 'Error al completar la transferencia.', 'error');
    }
}


let _transfDetalle = [];

function initTransferenciaOffcanvas() {
    const inputBuscar = document.getElementById('transf-buscar-producto');

    // Abre/filtra el dropdown mientras se escribe
    inputBuscar?.addEventListener('input', () => {
        if (!document.getElementById('transf-origen')?.value) return;
        renderResultadosTransf(inputBuscar.value);
    });

    // Al hacer foco/click, si no hay texto, muestra todo el catálogo del almacén
    inputBuscar?.addEventListener('focus', () => {
        const origen = document.getElementById('transf-origen')?.value;
        if (!origen) {
            showToast('Seleccione primero el almacén de origen.', 'warning');
            return;
        }
        renderResultadosTransf(inputBuscar.value);
    });

    // Cierra el dropdown al hacer click afuera
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('transf-resultados-dropdown');
        if (!dropdown || dropdown.classList.contains('d-none')) return;
        if (!e.target.closest('#transf-buscar-producto') && !e.target.closest('#transf-resultados-dropdown')) {
            ocultarResultadosTransf();
        }
    });

    document.getElementById('form-transferencia')?.addEventListener('submit', e => {
        e.preventDefault();
        guardarTransferencia();
    });
    document.getElementById('offcanvas-transferencia')?.addEventListener('hidden.bs.offcanvas', limpiarFormTransferencia);

    document.getElementById('transf-origen')?.addEventListener('change', () => {
        actualizarDatalistTransferenciaPorOrigen();
        _transfDetalle = [];
        renderDetalleTransf();
    });
}

// Agrega un producto al detalle a partir del click en una fila del dropdown
function agregarProductoTransfDesdeDropdown(prod) {
    _transfDetalle.push({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        stock_actual: prod.stock_actual,
        unidad: prod.unidad,
        cantidad: 0
    });

    const input = document.getElementById('transf-buscar-producto');
    if (input) input.value = '';
    ocultarResultadosTransf();
    renderDetalleTransf();
}

function renderDetalleTransf() {
    const lista    = document.getElementById('transf-detalle-lista');
    const emptyMsg = document.getElementById('transf-detalle-empty');

    lista.querySelectorAll('.transf-item-dyn').forEach(el => el.remove());

    if (_transfDetalle.length === 0) {
        emptyMsg.classList.remove('d-none');
        return;
    }

    emptyMsg.classList.add('d-none');

    _transfDetalle.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'transf-item-dyn d-flex align-items-center gap-2 mb-2 p-2 border rounded';
        div.dataset.idx = idx;

        const info = document.createElement('div');
        info.className = 'flex-grow-1';
        info.innerHTML = `<p class="mb-0 small fw-semibold">${item.nombre}</p>
                        <p class="mb-0 small text-muted">Disponible: ${Number(item.stock_actual).toFixed(2)} ${item.unidad ?? ''}</p>`;

        const inputCant = document.createElement('input');
        inputCant.type = 'number';
        inputCant.className = 'form-control form-control-sm';
        inputCant.style.width = '100px';
        inputCant.placeholder = '0.00';
        inputCant.min = '0.01';
        inputCant.step = '0.01';
        inputCant.required = true;
        inputCant.setAttribute('aria-label', `Cantidad a transferir de ${item.nombre}`);
        inputCant.value = item.cantidad > 0 ? item.cantidad : '';
        inputCant.addEventListener('input', () => {
            _transfDetalle[idx].cantidad = parseFloat(inputCant.value) || 0;
        });

        const btnElim = document.createElement('button');
        btnElim.type = 'button';
        btnElim.className = 'btn btn-sm text-danger flex-shrink-0';
        btnElim.setAttribute('aria-label', `Eliminar ${item.nombre} de la transferencia`);
        btnElim.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
        btnElim.addEventListener('click', () => {
            _guardarCantidadesActuales();
            _transfDetalle.splice(idx, 1);
            renderDetalleTransf();
        });

        div.appendChild(info);
        div.appendChild(inputCant);
        div.appendChild(btnElim);
        lista.appendChild(div);
    });
}

function _guardarCantidadesActuales() {
    const inputs = document.querySelectorAll('.transf-item-dyn input[type="number"]');
    inputs.forEach((input, i) => {
        if (_transfDetalle[i] !== undefined) {
            _transfDetalle[i].cantidad = parseFloat(input.value) || 0;
        }
    });
}

async function guardarTransferencia() {
    const origen  = document.getElementById('transf-origen').value;
    const destino = document.getElementById('transf-destino').value;
    const motivo  = document.getElementById('transf-motivo').value.trim();

    if (!origen || !destino) {
        showToast('Seleccione almacén origen y destino.', 'warning');
        return;
    }
    if (parseInt(origen) === parseInt(destino)) {
        showToast('El origen y destino deben ser almacenes distintos.', 'warning');
        return;
    }
    if (!motivo) {
        showToast('El motivo de la transferencia es obligatorio.', 'warning');
        document.getElementById('transf-motivo')?.focus();
        return;
    }

    // Leer cantidades actuales antes de validar
    _guardarCantidadesActuales();

    const detalle = _transfDetalle.filter(i => i.cantidad > 0);
    if (detalle.length === 0) {
        showToast('Agregue al menos un producto con cantidad válida (mayor a 0).', 'warning');
        return;
    }

    const sinCantidad = _transfDetalle.filter(i => !i.cantidad || i.cantidad <= 0);
    if (sinCantidad.length > 0) {
        showToast(`${sinCantidad.length} producto(s) sin cantidad serán ignorados. ¿Continuar solo con los que tienen cantidad?`, 'warning');
        // Esperar un momento para que el usuario vea el mensaje, luego continuar
    }

    const btn = document.getElementById('btn-confirmar-transferencia');
    btn.disabled = true;

    try {
        await apiFetch(`${API}/transferencias`, {
            method: 'POST',
            body: JSON.stringify({
                id_almacen_origen:  parseInt(origen),
                id_almacen_destino: parseInt(destino),
                motivo: motivo,
                detalle: detalle.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
            }),
        });
        showToast('Transferencia creada correctamente.', 'success');
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvas-transferencia'))?.hide();
        cargarTransferencias();
    } catch (err) {
        showToast(err.message || 'Error al crear la transferencia.', 'error');
    } finally {
        btn.disabled = false;
    }
}

function limpiarFormTransferencia() {
    document.getElementById('form-transferencia')?.reset();
    _transfDetalle = [];
    _transfStockCache = [];
    renderDetalleTransf();
}



function initLotesFiltros() {
    document.getElementById('btn-filtrar-lotes')?.addEventListener('click', aplicarFiltrosLotes);
    document.getElementById('btn-limpiar-lotes')?.addEventListener('click', () => {
        document.getElementById('filtro-lote-producto').value = '';
        document.getElementById('filtro-lote-almacen').value  = '';
        document.getElementById('filtro-lote-estado').value   = '';
        limpiarTablaLotes();
    });
}

function aplicarFiltrosLotes() {
    const producto = document.getElementById('filtro-lote-producto')?.value?.trim() || '';
    const almacen = document.getElementById('filtro-lote-almacen')?.value || '';
    const estado = document.getElementById('filtro-lote-estado')?.value || '';
    cargarLotes(producto, almacen, estado);
}

async function cargarLotes(producto, idAlmacen, estadoVencimiento) {
    try {
        const qs = new URLSearchParams();
        if (producto) qs.set('producto', producto);
        if (idAlmacen) qs.set('id_almacen', idAlmacen);
        if (estadoVencimiento) qs.set('estado_vencimiento', estadoVencimiento);
        const data = await apiFetch(`${API}/lotes?${qs}`);
        renderTablaLotes(data.lotes);
    } catch (err) {
        showToast(err.message || 'Error al cargar lotes.', 'error');
    }
}

function limpiarTablaLotes() {
    const tbody = document.getElementById('tabla-lotes-body');
    const emptyRow = document.getElementById('lotes-empty-row');
    tbody.querySelectorAll('tr.lote-dyn').forEach(r => r.remove());
    emptyRow.classList.remove('d-none');
    document.getElementById('lotes-total-badge').textContent = '0 lotes';
    document.getElementById('lotes-paginacion-info').textContent = '';
}

function renderTablaLotes(lotes) {
    const tbody = document.getElementById('tabla-lotes-body');
    const emptyRow = document.getElementById('lotes-empty-row');
    const badge = document.getElementById('lotes-total-badge');
    const info = document.getElementById('lotes-paginacion-info');

    tbody.querySelectorAll('tr.lote-dyn').forEach(r => r.remove());
    badge.textContent = `${lotes.length} lote${lotes.length !== 1 ? 's' : ''}`;

    if (lotes.length === 0) {
        emptyRow.classList.remove('d-none');
        info.textContent = '';
        return;
    }

    emptyRow.classList.add('d-none');
    info.textContent = `${lotes.length} lote${lotes.length !== 1 ? 's' : ''}`;

    lotes.forEach(l => {
        const tr = document.createElement('tr');
        tr.className = 'lote-dyn' + (l.estado_vencimiento === 'vencido' ? ' table-danger' : l.estado_vencimiento === 'proximo' ? ' table-warning' : '');

        tr.innerHTML = `
            <td><span class="fw-semibold font-monospace">${l.numero_lote}</span></td>
            <td>${l.producto ?? '—'}</td>
            <td>${l.almacen}</td> 
            <td class="text-end">${Number(l.cantidad).toFixed(2)}</td>
            <td>${l.fecha_vencimiento ? `<time datetime="${l.fecha_vencimiento}">${formatDate(l.fecha_vencimiento)}</time>` : '—'}</td>
            <td>${_badgeLoteEstado(l.estado_vencimiento)}</td>
            <td><time datetime="${l.creado_en}">${formatDate(l.creado_en)}</time></td>
        `;

        tbody.appendChild(tr);
    });
}

function _badgeLoteEstado(estado) {
    const map = {
        vencido:'<span class="badge text-bg-danger d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-calendar-xmark fa-xs" aria-hidden="true"></i>Vencido</span>',
        proximo:'<span class="badge text-bg-warning text-dark d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-clock fa-xs" aria-hidden="true"></i>Próx. vencer</span>',
        vigente:'<span class="badge text-bg-success d-flex align-items-center gap-1" style="width:fit-content"><i class="fa-solid fa-circle-check fa-xs" aria-hidden="true"></i>Vigente</span>',
        sin_vencimiento: '<span class="badge text-bg-secondary d-flex align-items-center gap-1" style="width:fit-content">Sin vencimiento</span>',
    };
    return map[estado] ?? `<span class="badge text-bg-secondary">${estado}</span>`;
}


function initExpandableRowsLive() {
    document.querySelectorAll('[data-expand-trigger]:not([data-expand-init])').forEach(trigger => {
        trigger.setAttribute('data-expand-init', '1');
        trigger.addEventListener('click', () => {
            const detailRow = document.getElementById(trigger.getAttribute('data-expand-trigger'));
            if (!detailRow) return;
            const isOpen = detailRow.classList.toggle('show');
            const icon = trigger.querySelector('[data-expand-icon]');
            if (icon) {
                icon.classList.toggle('fa-chevron-down', !isOpen);
                icon.classList.toggle('fa-chevron-up', isOpen);
            }
            trigger.closest('tr')?.classList.toggle('table-active', isOpen);
            trigger.setAttribute('aria-expanded', String(isOpen));
            detailRow.setAttribute('aria-hidden', String(!isOpen));
        });
        trigger.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });
    });
}