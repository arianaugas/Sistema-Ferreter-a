//EXPORTS DE EMPLEADOSS
// Función genérica para exportar datos a Excel
async function exportarAExcel(datos, nombreArchivo, nombreHoja = 'Datos') {
    try {
        // Verificar que SheetJS esté cargado
        if (typeof XLSX === 'undefined') {
            throw new Error('Librería XLSX no cargada. Verifica que el script esté incluido.');
        }

        // Crear workbook
        const wb = XLSX.utils.book_new();

        // Convertir datos a hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(datos);

        // Agregar hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

        // Generar archivo y descargar
        XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);

        showToast(`Archivo "${nombreArchivo}.xlsx" exportado correctamente.`, 'success');
    } catch (err) {
        console.error('Error al exportar:', err);
        showToast('Error al exportar el archivo: ' + err.message, 'error');
    }
}

// Exportar empleados a Excel
async function exportarEmpleados(filtros = {}) {
    try {
        // Mostrar loading
        showToast('Generando archivo Excel...', 'info');

        // Construir query string con filtros
        const params = new URLSearchParams();
        if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
        if (filtros.id_cargo) params.set('id_cargo', filtros.id_cargo);
        if (filtros.activo !== undefined && filtros.activo !== '') params.set('activo', filtros.activo);

        const qs = params.toString() ? `?${params.toString()}` : '';

        // Obtener datos del backend
        const res = await fetch(`/api/empleados${qs}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const empleados = data.empleados || [];

        if (empleados.length === 0) {
            showToast('No hay datos para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        // Formatear datos para Excel
        const datosExcel = empleados.map(emp => ({
            'DNI': emp.dni,
            'Nombre': emp.nombre,
            'Apellido': emp.apellido,
            'Nombre Completo': `${emp.nombre} ${emp.apellido}`,
            'Cargo': emp.cargo || '—',
            'Teléfono': emp.telefono || '—',
            'Correo': emp.correo || '—',
            'Fecha Ingreso': emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-PE') : '—',
            'Fecha Cese': emp.fecha_cese ? new Date(emp.fecha_cese).toLocaleDateString('es-PE') : '—',
            'Estado': emp.activo ? 'Activo' : 'Inactivo',
            'Turno': emp.turno_nombre || 'Sin turno'
        }));

        // Generar nombre de archivo con fecha
        const fecha = new Date();
        const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        const nombreArchivo = `empleados_${fechaStr}`;

        // Exportar
        await exportarAExcel(datosExcel, nombreArchivo, 'Empleados');

    } catch (err) {
        console.error('Error al exportar empleados:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Exportar cargos a Excel
async function exportarCargos() {
    try {
        showToast('Generando archivo Excel...', 'info');

        const res = await fetch('/api/empleados/cargos', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const cargos = data.cargos || [];

        if (cargos.length === 0) {
            showToast('No hay cargos para exportar.', 'warning');
            return;
        }

        const datosExcel = cargos.map(c => ({
            'ID': c.id_cargo,
            'Nombre': c.nombre,
            'Total Empleados': c.total_empleados || 0,
            'Estado': c.activo ? 'Activo' : 'Inactivo'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `cargos_${fecha}`, 'Cargos');

    } catch (err) {
        console.error('Error al exportar cargos:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}


//EXPORTS DE PRODUCTOS
async function exportarProductos(filtros = {}) {
    try {
        showToast('Generando archivo Excel de productos...', 'info');

        const params = new URLSearchParams();
        if (filtros.nombre) params.set('nombre', filtros.nombre);
        if (filtros.categoria) params.set('categoria', filtros.categoria);
        if (filtros.subcategoria) params.set('subcategoria', filtros.subcategoria);
        if (filtros.marca) params.set('marca', filtros.marca);
        if (filtros.activo) params.set('activo', filtros.activo);
        if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
        if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);

        const qs = params.toString() ? `?${params.toString()}` : '';

        const res = await fetch(`/api/productos${qs}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const productos = data.productos || [];

        if (productos.length === 0) {
            showToast('No hay productos para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        const datosExcel = productos.map(p => ({
            'Código': p.codigo,
            'Nombre': p.nombre,
            'Descripción': p.descripcion || '—',
            'Categoría': p.categoria,
            'Subcategoría': p.subcategoria,
            'Marca': p.marca || '—',
            'Unidad': p.unidad,
            'Ubicación': p.ubicacion || '—',
            'Precio Compra': parseFloat(p.precio_compra),
            'Precio Venta': parseFloat(p.precio_venta),
            'Stock Actual': parseFloat(p.stock_actual),
            'Stock Mínimo': parseFloat(p.stock_minimo),
            'Stock Máximo': parseFloat(p.stock_maximo) || 0,
            'Estado': p.activo ? 'Activo' : 'Inactivo',
            'Stock Crítico': p.stock_critico ? 'Sí' : 'No',
            'Fecha Registro': p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-PE') : '—'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `productos_${fecha}`, 'Productos');

    } catch (err) {
        console.error('Error al exportar productos:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Exportar categorías a Excel
async function exportarCategorias() {
    try {
        showToast('Generando archivo Excel de categorías...', 'info');

        const res = await fetch('/api/categorias/cat', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const categorias = data.categorias || [];

        if (categorias.length === 0) {
            showToast('No hay categorías para exportar.', 'warning');
            return;
        }

        const datosExcel = categorias.map(c => ({
            'ID': c.id_categoria,
            'Nombre': c.nombre,
            'Descripción': c.descripcion || '—',
            'Estado': c.activo ? 'Activo' : 'Inactivo'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `categorias_${fecha}`, 'Categorías');

    } catch (err) {
        console.error('Error al exportar categorías:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Exportar subcategorías a Excel
async function exportarSubcategorias() {
    try {
        showToast('Generando archivo Excel de subcategorías...', 'info');

        const res = await fetch('/api/categorias/sub', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const subcategorias = data.subcategorias || [];

        if (subcategorias.length === 0) {
            showToast('No hay subcategorías para exportar.', 'warning');
            return;
        }

        // Necesitamos cargar las categorías para mostrar el nombre
        const resCat = await fetch('/api/categorias/cat', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const dataCat = await resCat.json();
        const categorias = dataCat.categorias || [];

        const datosExcel = subcategorias.map(s => {
            const cat = categorias.find(c => c.id_categoria === s.id_categoria);
            return {
                'ID': s.id_subcategoria,
                'Nombre': s.nombre,
                'Categoría Padre': cat?.nombre || '—',
                'Descripción': s.descripcion || '—',
                'Estado': s.activo ? 'Activo' : 'Inactivo'
            };
        });

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `subcategorias_${fecha}`, 'Subcategorías');

    } catch (err) {
        console.error('Error al exportar subcategorías:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Exportar marcas a Excel
async function exportarMarcas() {
    try {
        showToast('Generando archivo Excel de marcas...', 'info');

        const res = await fetch('/api/catalogo/marcas', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const marcas = data.marcas || [];

        if (marcas.length === 0) {
            showToast('No hay marcas para exportar.', 'warning');
            return;
        }

        const datosExcel = marcas.map(m => ({
            'ID': m.id_marca,
            'Nombre': m.nombre,
            'País de Origen': m.pais_origen || '—',
            'Estado': m.activo ? 'Activo' : 'Inactivo'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `marcas_${fecha}`, 'Marcas');

    } catch (err) {
        console.error('Error al exportar marcas:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Exportar unidades a Excel
async function exportarUnidades() {
    try {
        showToast('Generando archivo Excel de unidades...', 'info');

        const res = await fetch('/api/catalogo/unidades', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'Error al obtener datos');
        }

        const unidades = data.unidades || [];

        if (unidades.length === 0) {
            showToast('No hay unidades para exportar.', 'warning');
            return;
        }

        const datosExcel = unidades.map(u => ({
            'ID': u.id_unidad,
            'Nombre': u.nombre,
            'Abreviatura': u.abreviatura
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `unidades_${fecha}`, 'Unidades');

    } catch (err) {
        console.error('Error al exportar unidades:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}


//EXPORTS DE REPORTES

// Función genérica para exportar datos a Excel
async function exportarAExcel(datos, nombreArchivo, nombreHoja = 'Datos') {
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('Librería XLSX no cargada. Verifica que el script esté incluido.');
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
        XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);

        showToast(`Archivo "${nombreArchivo}.xlsx" exportado correctamente.`, 'success');
    } catch (err) {
        console.error('Error al exportar:', err);
        showToast('Error al exportar el archivo: ' + err.message, 'error');
    }
}

// Helper para construir query string
function buildQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') qs.append(k, v);
    });
    return qs.toString() ? `?${qs.toString()}` : '';
}

// Helper para formatear fecha
function formatDateExcel(fechaStr) {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '—';
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}

// Helper para formatear moneda
function formatMoneyExcel(valor) {
    if (valor === null || valor === undefined) return 0;
    return parseFloat(valor);
}

//EMPLEADOS 
async function exportarEmpleados(filtros = {}) {
    try {
        showToast('Generando archivo Excel...', 'info');

        const params = new URLSearchParams();
        if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
        if (filtros.id_cargo) params.set('id_cargo', filtros.id_cargo);
        if (filtros.activo !== undefined && filtros.activo !== '') params.set('activo', filtros.activo);

        const res = await fetch(`/api/empleados${params.toString() ? '?' + params.toString() : ''}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const empleados = data.empleados || [];
        if (empleados.length === 0) {
            showToast('No hay datos para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        const datosExcel = empleados.map(emp => ({
            'DNI': emp.dni,
            'Nombre': emp.nombre,
            'Apellido': emp.apellido,
            'Cargo': emp.cargo || '—',
            'Teléfono': emp.telefono || '—',
            'Correo': emp.correo || '—',
            'Fecha Ingreso': formatDateExcel(emp.fecha_ingreso),
            'Fecha Cese': emp.fecha_cese ? formatDateExcel(emp.fecha_cese) : '—',
            'Estado': emp.activo ? 'Activo' : 'Inactivo',
            'Turno': emp.turno_nombre || 'Sin turno'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `empleados_${fecha}`, 'Empleados');
    } catch (err) {
        console.error('Error al exportar empleados:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

//PRODUCTOS 
async function exportarProductos(filtros = {}) {
    try {
        showToast('Generando archivo Excel de productos...', 'info');

        const params = new URLSearchParams();
        if (filtros.nombre) params.set('nombre', filtros.nombre);
        if (filtros.categoria) params.set('categoria', filtros.categoria);
        if (filtros.subcategoria) params.set('subcategoria', filtros.subcategoria);
        if (filtros.marca) params.set('marca', filtros.marca);
        if (filtros.activo) params.set('activo', filtros.activo);
        if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
        if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);

        const res = await fetch(`/api/productos${params.toString() ? '?' + params.toString() : ''}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const productos = data.productos || [];
        if (productos.length === 0) {
            showToast('No hay productos para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        const datosExcel = productos.map(p => ({
            'Código': p.codigo,
            'Nombre': p.nombre,
            'Descripción': p.descripcion || '—',
            'Categoría': p.categoria,
            'Subcategoría': p.subcategoria,
            'Marca': p.marca || '—',
            'Unidad': p.unidad,
            'Ubicación': p.ubicacion || '—',
            'Precio Compra': formatMoneyExcel(p.precio_compra),
            'Precio Venta': formatMoneyExcel(p.precio_venta),
            'Stock Actual': parseFloat(p.stock_actual),
            'Stock Mínimo': parseFloat(p.stock_minimo),
            'Stock Máximo': parseFloat(p.stock_maximo) || 0,
            'Estado': p.activo ? 'Activo' : 'Inactivo',
            'Stock Crítico': p.stock_critico ? 'Sí' : 'No',
            'Fecha Registro': formatDateExcel(p.creado_en)
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `productos_${fecha}`, 'Productos');
    } catch (err) {
        console.error('Error al exportar productos:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

//REPORTES 

// Reporte de Ventas
async function exportarReporteVentas() {
    try {
        showToast('Generando archivo Excel de ventas...', 'info');

        const desde = document.getElementById('rv-desde')?.value || '';
        const hasta = document.getElementById('rv-hasta')?.value || '';
        const agrupacion = document.getElementById('rv-agrupacion')?.value || 'dia';
        const id_empleado = document.getElementById('rv-empleado')?.value || '';
        const tipo_comprobante = document.getElementById('rv-tipo-comp')?.value || '';

        const params = buildQueryString({ desde, hasta, agrupacion, id_empleado, tipo_comprobante });

        const res = await fetch(`/api/reportes/ventas${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay datos de ventas para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Período': r.periodo || '—',
            'N° Ventas': parseInt(r.cantidad_ventas) || 0,
            'Subtotal': formatMoneyExcel(r.subtotal),
            'IGV': formatMoneyExcel(r.igv),
            'Total': formatMoneyExcel(r.total)
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_ventas_${fecha}`, 'Ventas');
    } catch (err) {
        console.error('Error al exportar ventas:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Ganancias
async function exportarReporteGanancias() {
    try {
        showToast('Generando archivo Excel de ganancias...', 'info');

        const desde = document.getElementById('rg-desde')?.value || '';
        const hasta = document.getElementById('rg-hasta')?.value || '';
        const id_categoria = document.getElementById('rg-categoria')?.value || '';
        const id_subcategoria = document.getElementById('rg-subcategoria')?.value || '';

        const params = buildQueryString({ desde, hasta, id_categoria, id_subcategoria });

        const res = await fetch(`/api/reportes/ganancias${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay datos de ganancias para exportar.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Código': r.codigo,
            'Producto': r.producto,
            'Categoría': r.categoria,
            'Subcategoría': r.subcategoria,
            'Unidades Vendidas': parseInt(r.unidades_vendidas) || 0,
            'Precio Venta Prom': formatMoneyExcel(r.precio_venta_prom),
            'Precio Costo Prom': formatMoneyExcel(r.precio_costo_prom),
            'Ingresos': formatMoneyExcel(r.ingresos),
            'Costo Total': formatMoneyExcel(r.costo_total),
            'Ganancia': formatMoneyExcel(r.ganancia)
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_ganancias_${fecha}`, 'Ganancias');
    } catch (err) {
        console.error('Error al exportar ganancias:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Productos Más Vendidos
async function exportarReporteProductosVendidos() {
    try {
        showToast('Generando archivo Excel de productos más vendidos...', 'info');

        const desde = document.getElementById('rpv-desde')?.value || '';
        const hasta = document.getElementById('rpv-hasta')?.value || '';
        const orden = document.getElementById('rpv-ordenar')?.value || 'cantidad';
        const limite = document.getElementById('rpv-top')?.value || '10';

        const params = buildQueryString({ desde, hasta, orden, limite });

        const res = await fetch(`/api/reportes/productos-vendidos${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay datos de productos vendidos para exportar.', 'warning');
            return;
        }

        const datosExcel = rows.map((r, i) => ({
            'Ranking': i + 1,
            'Código': r.codigo,
            'Producto': r.producto,
            'Cantidad Vendida': parseInt(r.total_cantidad) || 0,
            'Monto Generado': formatMoneyExcel(r.total_monto)
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `productos_mas_vendidos_${fecha}`, 'Más Vendidos');
    } catch (err) {
        console.error('Error al exportar productos vendidos:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Stock Crítico
async function exportarReporteStockCritico() {
    try {
        showToast('Generando archivo Excel de stock crítico...', 'info');

        const id_categoria = document.getElementById('rsc-categoria')?.value || '';

        const params = buildQueryString({ id_categoria });

        const res = await fetch(`/api/reportes/stock-bajo${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay productos con stock crítico para exportar.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Código': r.codigo,
            'Producto': r.nombre,
            'Categoría': r.categoria,
            'Subcategoría': r.subcategoria,
            'Ubicación': r.ubicacion || '—',
            'Stock Actual': parseFloat(r.stock_actual),
            'Stock Mínimo': parseFloat(r.stock_minimo),
            'Déficit': parseFloat(r.diferencia),
            'Proveedor Preferido': r.proveedor_preferido || '—'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `stock_critico_${fecha}`, 'Stock Crítico');
    } catch (err) {
        console.error('Error al exportar stock crítico:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Lotes
async function exportarReporteLotes() {
    try {
        showToast('Generando archivo Excel de lotes...', 'info');

        const estado = document.getElementById('rl-estado-lote')?.value || '';
        const vence_antes = document.getElementById('rl-vence-antes')?.value || '';

        const params = buildQueryString({ estado, vence_antes });

        const res = await fetch(`/api/reportes/lotes${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay lotes para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Código Producto': r.codigo_producto,
            'Producto': r.producto,
            'N° Lote': r.numero_lote || '—',
            'Almacén': r.almacen,
            'Cantidad': parseFloat(r.cantidad),
            'Fecha Vencimiento': r.fecha_vencimiento ? formatDateExcel(r.fecha_vencimiento) : '—',
            'Estado': r.estado_lote
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_lotes_${fecha}`, 'Lotes');
    } catch (err) {
        console.error('Error al exportar lotes:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Kardex
async function exportarReporteKardex() {
    try {
        showToast('Generando archivo Excel de kardex...', 'info');

        const id_producto = document.getElementById('rk-producto')?.value || '';
        const desde = document.getElementById('rk-desde')?.value || '';
        const hasta = document.getElementById('rk-hasta')?.value || '';
        const id_categoria = document.getElementById('rk-categoria')?.value || '';

        let url = '/api/reportes/kardex';
        if (id_producto) {
            url += `/${id_producto}`;
        }

        const params = buildQueryString({ desde, hasta, id_categoria });

        const res = await fetch(`${url}${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const movimientos = data.movimientos || [];
        if (movimientos.length === 0) {
            showToast('No hay movimientos de kardex para exportar.', 'warning');
            return;
        }

        const datosExcel = movimientos.map(m => ({
            'Fecha': formatDateExcel(m.registrado_en),
            'Producto': m.producto || '—',
            'Código': m.codigo || '—',
            'Tipo Movimiento': m.tipo_movimiento,
            'Motivo': m.motivo || '—',
            'Referencia': m.referencia_tipo && m.referencia_id ? `${m.referencia_tipo} #${m.referencia_id}` : '—',
            'Almacén': m.almacen,
            'Cantidad': parseFloat(m.cantidad),
            'Stock Anterior': parseFloat(m.stock_anterior),
            'Stock Posterior': parseFloat(m.stock_posterior),
            'Usuario': m.usuario || '—'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `kardex_${fecha}`, 'Kardex');
    } catch (err) {
        console.error('Error al exportar kardex:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Compras
async function exportarReporteCompras() {
    try {
        showToast('Generando archivo Excel de compras...', 'info');

        const id_proveedor = document.getElementById('rc-proveedor')?.value || '';
        const agrupacion = document.getElementById('rc-agrupacion')?.value || 'dia';
        const desde = document.getElementById('rc-desde')?.value || '';
        const hasta = document.getElementById('rc-hasta')?.value || '';

        const params = buildQueryString({ desde, hasta, agrupacion, id_proveedor });

        const res = await fetch(`/api/reportes/compras${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay datos de compras para exportar.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Período': r.periodo || '—',
            'Proveedor': r.proveedor,
            'N° Órdenes': parseInt(r.cantidad_ordenes) || 0,
            'Subtotal': formatMoneyExcel(r.subtotal),
            'IGV': formatMoneyExcel(r.igv),
            'Total': formatMoneyExcel(r.total)
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_compras_${fecha}`, 'Compras');
    } catch (err) {
        console.error('Error al exportar compras:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Gastos
async function exportarReporteGastos() {
    try {
        showToast('Generando archivo Excel de gastos...', 'info');

        const desde = document.getElementById('rg2-desde')?.value || '';
        const hasta = document.getElementById('rg2-hasta')?.value || '';

        const params = buildQueryString({ desde, hasta });

        const res = await fetch(`/api/reportes/gastos${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay gastos registrados en este período.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Fecha': formatDateExcel(r.registrado_en),
            'Concepto': r.concepto || '—',
            'Turno': r.numero_turno || `#${r.id_caja}`,
            'Cajero': r.cajero,
            'Monto': formatMoneyExcel(r.monto)
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_gastos_${fecha}`, 'Gastos');
    } catch (err) {
        console.error('Error al exportar gastos:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Caja
async function exportarReporteCaja() {
    try {
        showToast('Generando archivo Excel de caja...', 'info');

        const desde = document.getElementById('rcaja-desde')?.value || '';
        const hasta = document.getElementById('rcaja-hasta')?.value || '';
        const id_empleado = document.getElementById('rcaja-cajero')?.value || '';

        const params = buildQueryString({ desde, hasta, id_empleado });

        const res = await fetch(`/api/reportes/cierres-caja${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay turnos cerrados en este período.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'Turno': `#${r.numero_turno}`,
            'Cajero': r.cajero,
            'Fecha Apertura': formatDateExcel(r.fecha_apertura),
            'Fecha Cierre': formatDateExcel(r.fecha_cierre),
            'Monto Inicial': formatMoneyExcel(r.monto_inicial),
            'Monto Esperado': formatMoneyExcel(r.monto_esperado),
            'Monto Real': formatMoneyExcel(r.monto_real),
            'Diferencia': formatMoneyExcel(r.diferencia),
            'Observación': r.observacion || 'Sin observación'
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_caja_${fecha}`, 'Caja');
    } catch (err) {
        console.error('Error al exportar caja:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}

// Reporte de Devoluciones
async function exportarReporteDevoluciones() {
    try {
        showToast('Generando archivo Excel de devoluciones...', 'info');

        const desde = document.getElementById('rd-desde')?.value || '';
        const hasta = document.getElementById('rd-hasta')?.value || '';
        const tipo = document.getElementById('rd-tipo')?.value || '';
        const estado = document.getElementById('rd-estado')?.value || '';

        const params = buildQueryString({ desde, hasta, tipo, estado });

        const res = await fetch(`/api/reportes/devoluciones${params}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.mensaje || 'Error al obtener datos');

        const rows = data.datos || [];
        if (rows.length === 0) {
            showToast('No hay devoluciones para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        const datosExcel = rows.map(r => ({
            'ID Devolución': r.id_devolucion,
            'Venta Original': r.numero_comprobante || '—',
            'Cliente': r.cliente_nombre,
            'Empleado': r.empleado_nombre,
            'Tipo': r.tipo,
            'Motivo': r.motivo || '—',
            'Fecha': formatDateExcel(r.fecha),
            'Monto Reembolso': r.monto_reembolso ? formatMoneyExcel(r.monto_reembolso) : 0,
            'Estado': r.estado
        }));

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `reporte_devoluciones_${fecha}`, 'Devoluciones');
    } catch (err) {
        console.error('Error al exportar devoluciones:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}



//EXPORTS VENTAS
async function exportarVentas(filtros = {}) {
    try {
        showToast('Generando archivo Excel de ventas...', 'info');

        const params = new URLSearchParams();
        if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde);
        if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta);
        if (filtros.tipo_comprobante) params.set('tipo_comprobante', filtros.tipo_comprobante);
        if (filtros.estado) params.set('estado', filtros.estado);

        const qs = params.toString() ? `?${params.toString()}` : '';

        const res = await fetch(`/api/ventas${qs}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || data.detalle || data.mensaje || 'Error al obtener datos');
        }

        const ventas = Array.isArray(data) ? data : [];

        if (ventas.length === 0) {
            showToast('No hay ventas para exportar con los filtros seleccionados.', 'warning');
            return;
        }

        // Formatear datos para Excel
        const datosExcel = ventas.map(v => {
            const fecha = new Date(v.fecha);
            const fechaStr = !isNaN(fecha.getTime())
                ? `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}/${fecha.getUTCFullYear()} ${String(fecha.getUTCHours()).padStart(2, '0')}:${String(fecha.getUTCMinutes()).padStart(2, '0')}`
                : v.fecha;

            return {
                'Comprobante': v.numero_comprobante || '—',
                'Fecha': fechaStr,
                'Cliente': v.cliente_nombre || 'Sin cliente',
                'Vendedor': v.empleado_nombre || '—',
                'Subtotal': parseFloat(v.subtotal) || 0,
                'IGV': parseFloat(v.igv) || 0,
                'Total': parseFloat(v.total) || 0,
                'Estado': v.estado || '—',
                'Tipo Comprobante': v.tipo_comprobante || '—'
            };
        });

        const fecha = new Date().toISOString().split('T')[0];
        await exportarAExcel(datosExcel, `ventas_${fecha}`, 'Ventas');

    } catch (err) {
        console.error('Error al exportar ventas:', err);
        showToast('Error al exportar: ' + err.message, 'error');
    }
}


//BOLETA DE VENTA

// Generar comprobante de venta (Boleta/Factura) en PDF
async function generarComprobantePDF(id_venta) {
    try {
        showToast('Generando comprobante...', 'info');
        
        // 1. Obtener datos de la venta
        const resVenta = await fetch(`/api/ventas/${id_venta}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!resVenta.ok) throw new Error('No se pudo obtener la venta');
        const venta = await resVenta.json();
        
        // 2. Obtener configuración del negocio (nuevas claves)
        const resConfig = await fetch('/api/configuracion', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const dataConfig = resConfig.ok ? await resConfig.json() : { configuracion: [] };
        
        const config = {};
        (dataConfig.configuracion || []).forEach(c => {
            if (c.clave && c.valor !== undefined) config[c.clave] = c.valor;
        });
        
        // 3. Obtener datos del cliente (DNI/RUC)
        let clienteDoc = '';
        let clienteTipoDoc = '';
        if (venta.id_cliente) {
            try {
                const resCliente = await fetch(`/api/clientes/${venta.id_cliente}`, {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (resCliente.ok) {
                    const dataCliente = await resCliente.json();
                    if (dataCliente.cliente) {
                        clienteTipoDoc = dataCliente.cliente.tipo_documento || '';
                        clienteDoc = dataCliente.cliente.numero_documento || '';
                    }
                }
            } catch (_) { /* Si falla, seguimos sin el documento */ }
        }
        
        const items = venta.items || [];
        const pagos = venta.pagos || [];
        
        const porcentajeIGV = parseFloat(config.igv_porcentaje) || 18;
        const tasaIGV = porcentajeIGV / 100;
        
        // 4. Crear documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        
        let yPos = 20; 
        
        //   ENCABEZADO  
        if (config.empresa_nombre) {
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 102);
            doc.setFont('helvetica', 'bold');
            doc.text(config.empresa_nombre, margin, yPos);
            yPos += 8;
        }
        
        // RUC 
        if (config.empresa_ruc) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`RUC: ${config.empresa_ruc}`, margin, yPos);
            yPos += 5;
        }
        
        // Dirección 
        if (config.empresa_direccion) {
            doc.text(`Dirección: ${config.empresa_direccion}`, margin, yPos);
            yPos += 5;
        }
        
        // Teléfono 
        if (config.empresa_telefono) {
            doc.text(`Teléfono: ${config.empresa_telefono}`, margin, yPos);
            yPos += 5;
        }
        
        // Email 
        if (config.empresa_correo) {
            doc.text(`Email: ${config.empresa_correo}`, margin, yPos);
            yPos += 5;
        }
        
        // Caja del comprobante (derecha)
        const boxW = 65;
        const boxH = 35;
        const boxX = pageWidth - margin - boxW;
        const boxY = 20; // Alineado con el inicio del título
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(boxX, boxY, boxW, boxH);
        
        // Tipo de comprobante
        const tipoTexto = venta.tipo_comprobante === 'factura' ? 'FACTURA ELECTRÓNICA' : 
                            venta.tipo_comprobante === 'boleta' ? 'BOLETA DE VENTA' : 'NOTA DE VENTA';
        
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        const tipoLineas = doc.splitTextToSize(tipoTexto, boxW - 4);
        doc.text(tipoLineas, boxX + boxW / 2, boxY + 10, { align: 'center' });
        

        let yNumero = boxY + 18;
        if (venta.tipo_comprobante === 'boleta') {
            doc.setFontSize(8);
            doc.text('ELECTRÓNICA', boxX + boxW / 2, boxY + 18, { align: 'center' });
            yNumero = boxY + 28;
        }
        
        doc.setFontSize(11);
        doc.text(venta.numero_comprobante, boxX + boxW / 2, yNumero, { align: 'center' });
        
        // DATOS DEL COMPROBANTE
        yPos = Math.max(yPos, boxY + boxH + 10);
        
        // Fecha
        const fechaEmision = new Date(venta.fecha);
        const fechaStr = !isNaN(fechaEmision.getTime())
            ? `${String(fechaEmision.getUTCDate()).padStart(2, '0')}/${String(fechaEmision.getUTCMonth() + 1).padStart(2, '0')}/${fechaEmision.getUTCFullYear()} ${String(fechaEmision.getUTCHours()).padStart(2, '0')}:${String(fechaEmision.getUTCMinutes()).padStart(2, '0')}`
            : '—';
        
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        doc.text('FECHA DE EMISIÓN:', margin, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(fechaStr, margin + 45, yPos);
        yPos += 6;
        
        // Cliente
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENTE:', margin, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(venta.cliente_nombre || 'Sin cliente', margin + 45, yPos);
        yPos += 6;
        
        // DNI/RUC
        if (clienteDoc) {
            doc.setTextColor(0, 51, 102);
            doc.setFont('helvetica', 'bold');
            doc.text(`${clienteTipoDoc || 'DNI/RUC'}:`, margin, yPos);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(clienteDoc, margin + 45, yPos);
            yPos += 6;
        }
        
        // Vendedor
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        doc.text('VENDEDOR:', margin, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(venta.empleado_nombre || '—', margin + 45, yPos);
        yPos += 8;
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // TABLA DE PRODUCTOS
        const tableData = items.map(item => [
            String(item.cantidad),
            item.unidad || 'und',
            item.producto_nombre || 'Producto',
            `S/ ${parseFloat(item.precio_unitario).toFixed(2)}`,
            '0',
            `S/ ${parseFloat(item.subtotal).toFixed(2)}`
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['CANT.', 'UNIDAD', 'DESCRIPCIÓN', 'P. UNIT.', 'DTO.', 'TOTAL']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 51, 102],
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'center', cellWidth: 18 },
                2: { halign: 'left', cellWidth: 'auto' },
                3: { halign: 'right', cellWidth: 25 },
                4: { halign: 'center', cellWidth: 15 },
                5: { halign: 'right', cellWidth: 27 }
            },
            margin: { left: margin, right: margin }
        });
        
        // TOTALES
        let finalY = doc.lastAutoTable.finalY + 5;
        const totalesX = pageWidth - margin;
        
        // OP. GRAVADAS
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('SUB TOTAL:', totalesX - 40 - 35, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text(`S/ ${parseFloat(venta.subtotal).toFixed(2)}`, totalesX, finalY, { align: 'right' });
        finalY += 6;
        
        // IGV
        doc.setFont('helvetica', 'normal');
        doc.text(`IGV (${porcentajeIGV}%):`, totalesX - 40 - 35, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text(`S/ ${parseFloat(venta.igv).toFixed(2)}`, totalesX, finalY, { align: 'right' });
        finalY += 8;
        
        // TOTAL A PAGAR
        doc.setFillColor(240, 240, 240);
        doc.rect(totalesX - 40 - 40, finalY - 4, 40 + 45, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('TOTAL A PAGAR: S/', totalesX - 40 - 35, finalY + 2);
        doc.setFontSize(11);
        doc.text(`S/ ${parseFloat(venta.total).toFixed(2)}`, totalesX, finalY + 2, { align: 'right' });
        finalY += 12;
        
        // PAGOS
        if (pagos.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(0, 51, 102);
            doc.setFont('helvetica', 'bold');
            doc.text('FORMA DE PAGO:', margin, finalY);
            finalY += 6;
            
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            pagos.forEach(pago => {
                const opText = pago.numero_operacion ? ` · Op. #${pago.numero_operacion}` : '';
                doc.text(`${pago.tipo_pago_nombre}${opText}`, margin + 5, finalY);
                doc.text(`S/ ${parseFloat(pago.monto).toFixed(2)}`, totalesX, finalY, { align: 'right' });
                finalY += 5;
            });
        }
        
        // PIE DE PÁGINA
        const footerY = pageHeight - 15;
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`© ${new Date().getFullYear()} ${config.empresa_nombre || 'Ferretería'} - Todos los derechos reservados`, pageWidth / 2, footerY, { align: 'center' });
        
        // GUARDAR PDF
        const tipoNombre = venta.tipo_comprobante === 'factura' ? 'Factura' : 
                            venta.tipo_comprobante === 'boleta' ? 'Boleta' : 'NotaVenta';
        const nombreArchivo = `${tipoNombre}_${venta.numero_comprobante}.pdf`;
        doc.save(nombreArchivo);
        
        showToast('Comprobante generado correctamente', 'success');
        
    } catch (err) {
        console.error('Error al generar comprobante:', err);
        showToast('Error al generar el comprobante: ' + err.message, 'error');
    }
}


if (typeof window !== 'undefined') {
    window.exportarAExcel = exportarAExcel;
    
    // Empleados
    window.exportarEmpleados = exportarEmpleados;
    window.exportarCargos = exportarCargos;
    
    // Productos
    window.exportarProductos = exportarProductos;
    window.exportarCategorias = exportarCategorias;
    window.exportarSubcategorias = exportarSubcategorias;
    window.exportarMarcas = exportarMarcas;
    window.exportarUnidades = exportarUnidades;
    
    // Reportes
    window.exportarReporteVentas = exportarReporteVentas;
    window.exportarReporteGanancias = exportarReporteGanancias;
    window.exportarReporteProductosVendidos = exportarReporteProductosVendidos;
    window.exportarReporteStockCritico = exportarReporteStockCritico;
    window.exportarReporteLotes = exportarReporteLotes;
    window.exportarReporteKardex = exportarReporteKardex;
    window.exportarReporteCompras = exportarReporteCompras;
    window.exportarReporteGastos = exportarReporteGastos;
    window.exportarReporteCaja = exportarReporteCaja;
    window.exportarReporteDevoluciones = exportarReporteDevoluciones;
    
    // Ventas
    window.exportarVentas = exportarVentas;
    
    // Comprobante
    window.generarComprobantePDF = generarComprobantePDF;
}