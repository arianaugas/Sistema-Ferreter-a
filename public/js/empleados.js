
const API = '/api/empleados';

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...options,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.mensaje || 'Error del servidor');
    return data;
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '—';
    const dia  = String(fecha.getUTCDate()).padStart(2, '0');
    const mes  = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
}

function inicialesAvatar(nombre, apellido) {
    return `${nombre?.charAt(0) ?? ''}${apellido?.charAt(0) ?? ''}`.toUpperCase();
}

//CARGOS
async function cargarCargos() {
    try {
        const data = await apiFetch(`${API}/cargos`);
        renderTablaCargos(data.cargos);
        poblarSelectsCargo(data.cargos);
    } catch (err) {
        showToast(err.message || 'Error al cargar cargos.', 'error');
    }
}

function renderTablaCargos(cargos) {
    const tbody = document.getElementById('tabla-cargos-body');
    const emptyRow = tbody.querySelector('#cargos-empty-row');

    tbody.querySelectorAll('tr.cargo-dyn').forEach(r => r.remove());

    if (cargos.length === 0) {
        if (emptyRow) emptyRow.classList.remove('d-none');
        return;
    }
    if (emptyRow) emptyRow.classList.add('d-none');

    cargos.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.className = 'cargo-dyn';
        tr.id = `cargo-row-${c.id_cargo}`;
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td><span class="fw-semibold">${c.nombre}</span></td>
            <td><span class="fw-semibold">${c.total_empleados ?? 0}</span></td>
            <td><span class="badge" data-status="${c.activo ? 'activo' : 'inactivo'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm btn-editar-cargo"
                        data-cargo-id="${c.id_cargo}" data-nombre="${c.nombre}" data-activo="${c.activo}"
                        aria-label="Editar cargo ${c.nombre}">
                        <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn btn-sm text-danger btn-eliminar-cargo"
                        data-cargo-id="${c.id_cargo}" data-nombre="${c.nombre}"
                        aria-label="Eliminar cargo ${c.nombre}">
                        <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                    </button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

function poblarSelectsCargo(cargos) {
    const selects = [
        document.getElementById('nuevo-emp-cargo'),
        document.getElementById('editar-emp-cargo'),
        document.getElementById('filtro-empleado-cargo')
    ];
    selects.forEach(sel => {
        if (!sel) return;
        const primerOption = sel.options[0];
        sel.innerHTML = '';
        sel.appendChild(primerOption);
        cargos.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_cargo;
            opt.textContent = c.nombre;
            sel.appendChild(opt);
        });
    });
}

//Nuevo cargo
document.getElementById('form-nuevo-cargo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nuevo-cargo-nombre').value.trim();
    const activo = document.getElementById('nuevo-cargo-activo').checked;

    if (!nombre) return showToast('El nombre del cargo es obligatorio.', 'warning');

    try {
        await apiFetch(`${API}/cargos`, {
            method: 'POST',
            body: JSON.stringify({ nombre, activo })
        });
        showToast('Cargo creado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-cargo'))?.hide();
        document.getElementById('form-nuevo-cargo').reset();
        cargarCargos();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Editar cargo — abrir modal
document.getElementById('tabla-cargos-body')?.addEventListener('click', (e) => {
    const btnEditar = e.target.closest('.btn-editar-cargo');
    const btnEliminar = e.target.closest('.btn-eliminar-cargo');

    if (btnEditar) {
        document.getElementById('editar-cargo-id').value = btnEditar.dataset.cargoId;
        document.getElementById('editar-cargo-nombre').value = btnEditar.dataset.nombre;
        document.getElementById('editar-cargo-activo').checked = btnEditar.dataset.activo === '1' || btnEditar.dataset.activo === 'true';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-editar-cargo')).show();
    }

    if (btnEliminar) {
        document.getElementById('eliminar-cargo-nombre').textContent = btnEliminar.dataset.nombre;
        document.getElementById('btn-confirmar-eliminar-cargo').dataset.cargoId = btnEliminar.dataset.cargoId;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-eliminar-cargo')).show();
    }
});

// Editar cargo — guardar
document.getElementById('form-editar-cargo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editar-cargo-id').value;
    const nombre = document.getElementById('editar-cargo-nombre').value.trim();
    const activo = document.getElementById('editar-cargo-activo').checked;

    if (!nombre) return showToast('El nombre del cargo es obligatorio.', 'warning');

    try {
        await apiFetch(`${API}/cargos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, activo })
        });
        showToast('Cargo actualizado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-editar-cargo'))?.hide();
        cargarCargos();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Eliminar cargo — confirmar
document.getElementById('btn-confirmar-eliminar-cargo')?.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.cargoId;
    try {
        await apiFetch(`${API}/cargos/${id}`, { method: 'DELETE' });
        showToast('Cargo eliminado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-eliminar-cargo'))?.hide();
        cargarCargos();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

//EMPLEADOS 
let empleadoActivoId = null; //ID del empleado en ficha/edición actual

async function cargarEmpleados(params = {}) {
    try {
        const qs = new URLSearchParams(params).toString();
        const data = await apiFetch(`${API}${qs ? '?' + qs : ''}`);
        renderTablaEmpleados(data.empleados);
    } catch (err) {
        showToast(err.message || 'Error al cargar empleados.', 'error');
    }
}

function renderTablaEmpleados(empleados) {
    const tbody = document.getElementById('tabla-empleados-body');
    const emptyRow = document.getElementById('empleados-empty-row');
    const badge = document.getElementById('empleados-total-badge');
    const info = document.getElementById('empleados-paginacion-info');

    tbody.querySelectorAll('tr.emp-dyn').forEach(r => r.remove());

    badge.textContent = `${empleados.length} empleado${empleados.length !== 1 ? 's' : ''}`;
    info.textContent = `Mostrando ${empleados.length} empleado${empleados.length !== 1 ? 's' : ''}`;

    if (empleados.length === 0) {
        emptyRow?.classList.remove('d-none');
        return;
    }
    emptyRow?.classList.add('d-none');

    empleados.forEach(emp => {
        const activo = emp.activo;
        const tr = document.createElement('tr');
        tr.className = 'emp-dyn';
        tr.id = `empleado-row-${emp.id_empleado}`;
        tr.innerHTML = `
            <td><span class="fw-semibold">${emp.dni}</span></td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <span class="rounded-circle empleado-avatar-sm d-flex align-items-center justify-content-center flex-shrink-0"
                        aria-hidden="true">${inicialesAvatar(emp.nombre, emp.apellido)}</span>
                    <span>${emp.nombre} ${emp.apellido}</span>
                </div>
            </td>
            <td>${emp.cargo}</td>
            <td>${emp.telefono ?? '—'}</td>
            <td>${emp.correo ?? '—'}</td>
            <td><time datetime="${emp.fecha_ingreso}">${formatFecha(emp.fecha_ingreso)}</time></td>
            <td><span class="badge" data-status="${activo ? 'activo' : 'inactivo'}">${activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="text-end">
                <div class="d-flex gap-1 justify-content-end">
                    <button type="button" class="btn btn-sm btn-ver-empleado"
                        data-empleado-id="${emp.id_empleado}" aria-label="Ver ficha de ${emp.nombre} ${emp.apellido}">
                        <i class="fa-regular fa-eye" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-editar-empleado"
                        data-empleado-id="${emp.id_empleado}" aria-label="Editar empleado ${emp.nombre} ${emp.apellido}">
                        <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    ${activo
                        ? `<button type="button" class="btn btn-sm text-danger btn-desactivar-empleado"
                                data-empleado-id="${emp.id_empleado}" data-nombre="${emp.nombre} ${emp.apellido}"
                                aria-label="Desactivar empleado ${emp.nombre} ${emp.apellido}">
                                <i class="fa-solid fa-user-slash" aria-hidden="true"></i>
                            </button>`
                        : `<button type="button" class="btn btn-sm text-success btn-reactivar-empleado"
                                data-empleado-id="${emp.id_empleado}" data-nombre="${emp.nombre} ${emp.apellido}"
                                aria-label="Reactivar empleado ${emp.nombre} ${emp.apellido}">
                                <i class="fa-solid fa-user-check" aria-hidden="true"></i>
                            </button>`
                    }
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

// Delegación de clicks en tabla de empleados
document.getElementById('tabla-empleados-body')?.addEventListener('click', async (e) => {
    const btnVer = e.target.closest('.btn-ver-empleado');
    const btnEditar = e.target.closest('.btn-editar-empleado');
    const btnDesactivar = e.target.closest('.btn-desactivar-empleado');
    const btnReactivar = e.target.closest('.btn-reactivar-empleado');

    if (btnVer) {
        await abrirFichaEmpleado(btnVer.dataset.empleadoId);
    }
    if (btnEditar) {
        await abrirEditarEmpleado(btnEditar.dataset.empleadoId);
    }
    if (btnDesactivar) {
        document.getElementById('desactivar-emp-nombre').textContent = btnDesactivar.dataset.nombre;
        document.getElementById('btn-confirmar-desactivar').dataset.empleadoId = btnDesactivar.dataset.empleadoId;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-desactivar-empleado')).show();
    }
    if (btnReactivar) {
        document.getElementById('reactivar-emp-nombre').textContent = btnReactivar.dataset.nombre;
        document.getElementById('btn-confirmar-reactivar').dataset.empleadoId = btnReactivar.dataset.empleadoId;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-reactivar-empleado')).show();
    }
});

// Ver ficha
async function abrirFichaEmpleado(id) {
    try {
        const data = await apiFetch(`${API}/${id}`);
        const emp = data.empleado;
        empleadoActivoId = emp.id_empleado;

        const iniciales = inicialesAvatar(emp.nombre, emp.apellido);
        document.getElementById('ficha-emp-avatar').textContent = iniciales;
        document.getElementById('ficha-emp-nombre-completo').textContent = `${emp.nombre} ${emp.apellido}`;
        document.getElementById('ficha-emp-cargo').textContent = emp.cargo;
        document.getElementById('ficha-emp-estado').textContent = emp.activo ? 'Activo' : 'Inactivo';
        document.getElementById('ficha-emp-estado').dataset.status = emp.activo ? 'activo' : 'inactivo';
        document.getElementById('ficha-emp-dni').textContent = emp.dni;
        document.getElementById('ficha-emp-telefono').textContent = emp.telefono ?? '—';
        document.getElementById('ficha-emp-correo').textContent = emp.correo ?? '—';
        document.getElementById('ficha-emp-fecha-ingreso').textContent = formatFecha(emp.fecha_ingreso);
        document.getElementById('ficha-emp-fecha-cese').textContent = formatFecha(emp.fecha_cese);

        // Botón editar en la ficha
        document.getElementById('btn-ficha-editar').dataset.empleadoId = emp.id_empleado;

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-ficha-empleado')).show();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Abrir modal editar con datos precargados
async function abrirEditarEmpleado(id) {
    try {
        const data = await apiFetch(`${API}/${id}`);
        const emp = data.empleado;
        empleadoActivoId = emp.id_empleado;

        document.getElementById('editar-emp-id').value = emp.id_empleado;
        document.getElementById('editar-emp-dni').value = emp.dni;
        document.getElementById('editar-emp-nombre').value = emp.nombre;
        document.getElementById('editar-emp-apellido').value = emp.apellido;
        document.getElementById('editar-emp-cargo').value = emp.id_cargo;
        document.getElementById('editar-emp-turno').value = emp.id_turno ?? '';
        document.getElementById('editar-emp-telefono').value = emp.telefono ?? '';
        document.getElementById('editar-emp-correo').value = emp.correo ?? '';
        document.getElementById('editar-emp-fecha-ingreso').value = emp.fecha_ingreso?.split('T')[0] ?? '';
        document.getElementById('editar-emp-fecha-cese').value = emp.fecha_cese?.split('T')[0] ?? '';
        document.getElementById('editar-emp-activo').checked = !!emp.activo;

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-editar-empleado')).show();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Botón editar desde ficha
document.getElementById('btn-ficha-editar')?.addEventListener('click', () => {
    bootstrap.Modal.getInstance(document.getElementById('modal-ficha-empleado'))?.hide();
    if (empleadoActivoId) abrirEditarEmpleado(empleadoActivoId);
});

// Nuevo empleado
// REEMPLAZAR el addEventListener de 'form-nuevo-empleado' completo:
document.getElementById('form-nuevo-empleado')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const telefonoRaw = document.getElementById('nuevo-emp-telefono').value.trim();
    if (telefonoRaw && !/^9\d{8}$/.test(telefonoRaw)) {
        return showToast('El teléfono debe tener 9 dígitos y empezar con 9.', 'warning');
    }
    const body = {
        dni: document.getElementById('nuevo-emp-dni').value.trim(),
        nombre: document.getElementById('nuevo-emp-nombre').value.trim(),
        apellido: document.getElementById('nuevo-emp-apellido').value.trim(),
        id_cargo: document.getElementById('nuevo-emp-cargo').value,
        id_turno: document.getElementById('nuevo-emp-turno').value || null,
        telefono: telefonoRaw || null,
        correo: document.getElementById('nuevo-emp-correo').value.trim() || null,
        fecha_ingreso: document.getElementById('nuevo-emp-fecha-ingreso').value,
        fecha_cese: document.getElementById('nuevo-emp-fecha-cese').value || null
    };

    try {
        const res = await apiFetch(API, { method: 'POST', body: JSON.stringify(body) });
        showToast('Empleado registrado. Ahora crea su usuario de acceso.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-empleado'))?.hide();
        document.getElementById('form-nuevo-empleado').reset();
        cargarEmpleados();

        // Abrir modal de creación de usuario con el empleado preseleccionado
        const idEmpleado = res.empleado?.id_empleado;
        if (idEmpleado) {
            abrirModalNuevoUsuarioParaEmpleado(idEmpleado, `${body.nombre} ${body.apellido}`);
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Función para abrir el modal de usuario preseleccionado desde empleados
async function abrirModalNuevoUsuarioParaEmpleado(id_empleado, nombreEmpleado) {
    sessionStorage.setItem('nuevo_usuario_para_empleado', JSON.stringify({ id_empleado, nombreEmpleado }));
    // Redirigir directamente a la página de usuarios para abrir el modal
    window.location.href = '/usuarios';
}
// Editar empleado
document.getElementById('form-editar-empleado')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const telefonoRaw = document.getElementById('editar-emp-telefono').value.trim();
    if (telefonoRaw && !/^9\d{8}$/.test(telefonoRaw)) {
        return showToast('El teléfono debe tener 9 dígitos y empezar con 9.', 'warning');
    }
    const id = document.getElementById('editar-emp-id').value;
    const body = {
        dni: document.getElementById('editar-emp-dni').value.trim(),
        nombre: document.getElementById('editar-emp-nombre').value.trim(),
        apellido: document.getElementById('editar-emp-apellido').value.trim(),
        id_cargo: document.getElementById('editar-emp-cargo').value,
        id_turno: document.getElementById('editar-emp-turno').value || null,
        telefono: telefonoRaw || null,
        correo: document.getElementById('editar-emp-correo').value.trim() || null,
        fecha_ingreso: document.getElementById('editar-emp-fecha-ingreso').value,
        fecha_cese: document.getElementById('editar-emp-fecha-cese').value || null,
        activo: document.getElementById('editar-emp-activo').checked
    };

    try {
        await apiFetch(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('Empleado actualizado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-editar-empleado'))?.hide();
        cargarEmpleados();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Desactivar empleado
document.getElementById('btn-confirmar-desactivar')?.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.empleadoId;
    const body = await apiFetch(`${API}/${id}`).then(d => d.empleado);

    try {
        await apiFetch(`${API}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...body, activo: false })
        });
        showToast('Empleado desactivado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-desactivar-empleado'))?.hide();
        cargarEmpleados();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Reactivar empleado
document.getElementById('btn-confirmar-reactivar')?.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.empleadoId;
    const body = await apiFetch(`${API}/${id}`).then(d => d.empleado);

    try {
        await apiFetch(`${API}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...body, activo: true })
        });
        showToast('Empleado reactivado correctamente.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-reactivar-empleado'))?.hide();
        cargarEmpleados();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

//FILTROS
document.getElementById('btn-aplicar-filtros-empleados')?.addEventListener('click', () => {
    const params = {};
    const busqueda = document.getElementById('filtro-empleado-nombre').value.trim();
    const id_cargo = document.getElementById('filtro-empleado-cargo').value;
    const activo = document.getElementById('filtro-empleado-estado').value;

    if (busqueda) params.busqueda = busqueda;
    if (id_cargo) params.id_cargo = id_cargo;
    if (activo !== '') params.activo = activo;

    cargarEmpleados(params);
});

document.getElementById('btn-limpiar-filtros-empleados')?.addEventListener('click', () => {
    document.getElementById('filtro-empleado-nombre').value = '';
    document.getElementById('filtro-empleado-cargo').value = '';
    document.getElementById('filtro-empleado-estado').value = '';
    cargarEmpleados();
});

async function cargarTurnosParaEmpleados() {
    try {
        const data = await apiFetch('/api/configuracion/turnos');
        const turnos = (data.turnos || []).filter(t => t.activo);
        const selects = [
            document.getElementById('nuevo-emp-turno'),
            document.getElementById('editar-emp-turno')
        ];
        selects.forEach(sel => {
            if (!sel) return;
            const primera = sel.options[0];
            sel.innerHTML = '';
            sel.appendChild(primera);
            turnos.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id_turno;
                opt.textContent = t.nombre;
                sel.appendChild(opt);
            });
        });
    } catch (err) {
        showToast('Error al cargar turnos.', 'error');
    }
}

//Inicializamos el dom
document.addEventListener('DOMContentLoaded', () => {
    cargarCargos();
    cargarTurnosParaEmpleados();
    cargarEmpleados();
});