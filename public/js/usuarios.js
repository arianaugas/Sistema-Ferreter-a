document.addEventListener('DOMContentLoaded', () => {

    // Tabla usuarios
    const tbodyUsuarios  = document.getElementById('tabla-usuarios-body');
    const totalBadge = document.getElementById('usuarios-total-badge');
    // Filtros
    const filtroNombre  = document.getElementById('filtro-usuario-nombre');
    const filtroRol = document.getElementById('filtro-usuario-rol');
    const filtroEstado   = document.getElementById('filtro-usuario-estado');
    const btnFiltrar = document.getElementById('btn-filtrar-usuarios');
    const btnLimpiarFiltros  = document.getElementById('btn-limpiar-filtros-usuarios');
    // Tabla roles
    const tbodyRoles = document.getElementById('tabla-roles-body');
    // Modal ver usuario
    const modalVerEl = document.getElementById('modal-ver-usuario');
    // Modal nuevo usuario
    const formNuevo = document.getElementById('form-nuevo-usuario');
    const selEmpleadoNuevo   = document.getElementById('nuevo-usr-empleado');
    const selRolNuevo = document.getElementById('nuevo-usr-rol');
    const btnTogglePassNuevo = document.getElementById('btn-toggle-pass-nuevo');
    const inputPassNuevo = document.getElementById('nuevo-usr-contrasena');
    // Modal editar usuario
    const formEditar = document.getElementById('form-editar-usuario');
    const selRolEditar  = document.getElementById('editar-usr-rol');
    const btnTogglePassEdit  = document.getElementById('btn-toggle-pass-editar');
    const inputPassEditar  = document.getElementById('editar-usr-nueva-contrasena');
    // Modal eliminar rol
    const btnConfirmarElimRol = document.getElementById('btn-confirmar-eliminar-rol');
    const elimRolNombre = document.getElementById('eliminar-rol-nombre');
    // Modal nuevo rol
    const formNuevoRol = document.getElementById('form-nuevo-rol');
    // Modal editar rol
    const formEditarRol = document.getElementById('form-editar-rol');

    //ESTADO LOCAL
    let usuariosCache = [];  // para no re-fetch al abrir modales
    let rolesCache    = [];

    //UTILIDADES
    function iniciales(nombre, apellido) {
        const n = (nombre?.[0] ?? '').toUpperCase();
        const a = (apellido?.[0] ?? '').toUpperCase();
        return n + a || '??';
    }

    function limpiarModal(formEl) {
        formEl.reset();
        formEl.classList.remove('was-validated');
    }

    //CARGA INICIAL
    cargarRoles();  // primero roles
    cargarUsuarios();

    //ROLES — getAll y render
    async function cargarRoles() {
        try {
            const res  = await fetch('/api/auth/roles', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar roles');

            rolesCache = data.roles;
            renderTablaRoles(rolesCache);
            poblarSelectsRoles(rolesCache);
        } catch (err) {
            console.error(err);
            showToast('Error al cargar roles', 'error');
        }
    }

    function renderTablaRoles(roles) {
        // Contamos usuarios por rol desde la caché
        const conteo = {};
        usuariosCache.forEach(u => {
            conteo[u.id_rol] = (conteo[u.id_rol] ?? 0) + 1;
        });

        const filas = roles.map(r => `
            <tr>
                <td>${r.id_rol}</td>
                <td><span class="fw-semibold">${r.nombre}</span></td>
                <td class="text-muted small">${r.descripcion ?? '—'}</td>
                <td>${conteo[r.id_rol] ?? 0}</td>
                <td class="text-end">
                    <div class="d-flex gap-1 justify-content-end">
                        <button type="button" class="btn btn-sm"
                            data-accion="editar-rol" data-rol-id="${r.id_rol}"
                            data-bs-toggle="modal" data-bs-target="#modal-editar-rol"
                            aria-label="Editar rol ${r.nombre}">
                            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            </tr>`).join('');

        tbodyRoles.innerHTML = filas || `<tr><td colspan="5" class="text-center text-muted py-3">Sin roles registrados</td></tr>`;
    }

    function poblarSelectsRoles(roles) {
        // Select filtro
        const opcionesFiltro = roles.map(r => `<option value="${r.id_rol}">${r.nombre}</option>`).join('');
        filtroRol.innerHTML  = `<option value="">Todos los roles</option>${opcionesFiltro}`;

        // Selects de nuevo y editar usuario
        const opcionesSelect = roles.map(r => `<option value="${r.id_rol}">${r.nombre}</option>`).join('');
        selRolNuevo.innerHTML  = `<option value="" disabled selected>Seleccionar rol</option>${opcionesSelect}`;
        selRolEditar.innerHTML = opcionesSelect;
    }

    //USUARIOS — getAll y render
    async function cargarUsuarios(params = {}) {
        try {
            const qs  = new URLSearchParams(params).toString();
            const url = `/api/auth/users${qs ? '?' + qs : ''}`;
            const res  = await fetch(url, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar usuarios');

            usuariosCache = data.usuarios;
            renderTablaUsuarios(usuariosCache);
            // Actualizar conteo en tabla de roles si ya están cargados
            if (rolesCache.length) renderTablaRoles(rolesCache);
        } catch (err) {
            console.error(err);
            showToast('Error al cargar usuarios', 'error');
        }
    }

    function renderTablaUsuarios(usuarios) {
        totalBadge.textContent = `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''}`;

        if (!usuarios.length) {
            tbodyUsuarios.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Sin resultados</td></tr>`;
            return;
        }

        const filas = usuarios.map(u => {
            const nombreCompleto = `${u.nombre_empleado} ${u.apellido_empleado}`;
            const ini = iniciales(u.nombre_empleado, u.apellido_empleado);
            const estadoKey = u.activo ? 'activo' : 'inactivo';

            return `
            <tr id="usuario-row-${u.id_usuario}">
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="rounded-circle empleado-avatar-sm d-flex align-items-center justify-content-center flex-shrink-0"
                            aria-hidden="true">${ini}</span>
                        <span class="fw-semibold">${u.username}</span>
                    </div>
                </td>
                <td>${nombreCompleto}</td>
                <td>${getBadge('activo', u.rol)}</td>
                <td><time datetime="${u.ultimo_acceso ?? ''}">${formatDate(u.ultimo_acceso, true)}</time></td>
                <td><time datetime="${u.creado_en}">${formatDate(u.creado_en)}</time></td>
                <td>${getBadge(estadoKey)}</td>
                <td class="text-end">
                    <div class="d-flex gap-1 justify-content-end">
                        <button type="button" class="btn btn-sm"
                            data-accion="ver-usuario" data-usuario-id="${u.id_usuario}"
                            data-bs-toggle="modal" data-bs-target="#modal-ver-usuario"
                            aria-label="Ver usuario ${u.username}">
                            <i class="fa-regular fa-eye" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-sm"
                            data-accion="editar-usuario" data-usuario-id="${u.id_usuario}"
                            data-bs-toggle="modal" data-bs-target="#modal-editar-usuario"
                            aria-label="Editar usuario ${u.username}">
                            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="btn btn-sm ${u.activo ? 'text-warning' : 'text-success'}"
                            data-accion="toggle-usuario" data-usuario-id="${u.id_usuario}"
                            aria-label="${u.activo ? 'Desactivar' : 'Activar'} usuario ${u.username}">
                            <i class="fa-regular ${u.activo ? 'fa-trash-can' : 'fa-circle-check'}" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        tbodyUsuarios.innerHTML = filas;
    }

    //FILTROS
    btnFiltrar.addEventListener('click', () => {
        const params = {};
        const busq = filtroNombre.value.trim();
        const rol = filtroRol.value;
        const estado = filtroEstado.value;

        if (busq) params.busqueda = busq;
        if (rol) params.id_rol   = rol;
        if (estado !== '') params.activo = estado;

        cargarUsuarios(params);
    });

    btnLimpiarFiltros.addEventListener('click', () => {
        filtroNombre.value = '';
        filtroRol.value    = '';
        filtroEstado.value = '';
        cargarUsuarios();
    });

    // Filtrar también con Enter en el input de búsqueda
    filtroNombre.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnFiltrar.click();
    });

    //DELEGACIÓN — Tabla usuarios

    tbodyUsuarios.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accion]');
        if (!btn) return;

        const accion = btn.dataset.accion;
        const id  = parseInt(btn.dataset.usuarioId);

        if (accion === 'ver-usuario')    abrirVerUsuario(id);
        if (accion === 'editar-usuario') abrirEditarUsuario(id);
        if (accion === 'toggle-usuario') toggleUsuario(id);
    });

    //DELEGACIÓN — Tabla roles
    tbodyRoles.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accion]');
        if (!btn) return;

        const accion = btn.dataset.accion;
        const id  = parseInt(btn.dataset.rolId);

        if (accion === 'editar-rol')   abrirEditarRol(id);
        //if (accion === 'eliminar-rol') abrirEliminarRol(id, btn.dataset.rolNombre);
    });

    //MODAL: Ver usuario

    function abrirVerUsuario(id) {
        const u = usuariosCache.find(x => x.id_usuario === id);
        if (!u) return;

        const ini = iniciales(u.nombre_empleado, u.apellido_empleado);
        document.getElementById('ver-usr-avatar').textContent        = ini;
        document.getElementById('ver-usr-username').textContent      = u.username;
        document.getElementById('ver-usr-estado-badge').textContent  = u.activo ? 'Activo' : 'Inactivo';
        document.getElementById('ver-usr-estado-badge').dataset.status = u.activo ? 'activo' : 'inactivo';
        document.getElementById('ver-usr-empleado').textContent      = `${u.nombre_empleado} ${u.apellido_empleado}`;
        document.getElementById('ver-usr-rol').textContent           = u.rol;
        document.getElementById('ver-usr-estado').textContent        = u.activo ? 'Activo' : 'Inactivo';
        document.getElementById('ver-usr-ultimo-acceso').textContent = formatDate(u.ultimo_acceso, true);
        document.getElementById('ver-usr-creado-en').textContent     = formatDate(u.creado_en);
        document.getElementById('ver-usr-id').textContent            = `#${u.id_usuario}`;

        // Botón Editar dentro del modal ver, pasa el id al modal editar
        document.getElementById('ver-usr-btn-editar').dataset.usuarioId = id;
    }

    // Cuando desde "ver" se abre "editar"
    document.getElementById('ver-usr-btn-editar').addEventListener('click', function () {
        const id = parseInt(this.dataset.usuarioId);
        // El modal ver se cierra solo por Bootstrap, abrimos editar con datos
        bootstrap.Modal.getInstance(modalVerEl)?.hide();
        abrirEditarUsuario(id);
    });

    // MODAL: Nuevo usuario

    // Limpiar al abrir
    document.getElementById('modal-nuevo-usuario').addEventListener('show.bs.modal', () => {
        limpiarModal(formNuevo);
        cargarEmpleadosSinUsuario();
    });

    async function cargarEmpleadosSinUsuario() {
    try {
        // Empleados activos desde el endpoint de empleados
        const res  = await fetch('/api/empleados?activo=1', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.mensaje || 'Error al cargar empleados');

        // Excluimos los que ya tienen un usuario asociado
        const idsAsignados = new Set(usuariosCache.map(u => u.id_empleado));
        const disponibles = data.empleados.filter(e => !idsAsignados.has(e.id_empleado));

        if (!disponibles.length) {
            selEmpleadoNuevo.innerHTML = `<option value="" disabled selected>No hay empleados disponibles</option>`;
            return;
        }

        const opciones = disponibles
            .map(e => `<option value="${e.id_empleado}">${e.nombre} ${e.apellido} — DNI ${e.dni}</option>`)
            .join('');
        selEmpleadoNuevo.innerHTML = `<option value="" disabled selected>Seleccionar empleado</option>${opciones}`;
    } catch (err) {
        console.error(err);
        showToast('Error al cargar empleados', 'error');
    }
}

    // Toggle mostrar contraseña
    btnTogglePassNuevo.addEventListener('click', () => {
        const esPassword = inputPassNuevo.type === 'password';
        inputPassNuevo.type = esPassword ? 'text' : 'password';
        btnTogglePassNuevo.querySelector('i').classList.toggle('fa-eye', !esPassword);
        btnTogglePassNuevo.querySelector('i').classList.toggle('fa-eye-slash', esPassword);
    });

    // Submit nuevo usuario
    formNuevo.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formNuevo.checkValidity()) {
            formNuevo.classList.add('was-validated');
            return;
        }

        const body = {
            id_empleado: parseInt(selEmpleadoNuevo.value),
            id_rol:      parseInt(selRolNuevo.value),
            username:    document.getElementById('nuevo-usr-username').value.trim(),
            contrasena:  inputPassNuevo.value
        };

        try {
            const res  = await fetch('/api/auth/users', {
                method:      'POST',
                credentials: 'include',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok && data.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-usuario')).hide();
                showToast('Usuario creado correctamente', 'success');
                cargarUsuarios();
            } else {
                showToast(data.mensaje || 'Error al crear usuario', 'error');
            }
        } catch (err) {
            showToast('No se pudo conectar con el servidor', 'error');
        }
    });

    //MODAL: Editar usuario
    function abrirEditarUsuario(id) {
        const u = usuariosCache.find(x => x.id_usuario === id);
        if (!u) return;

        limpiarModal(formEditar);
        document.getElementById('editar-usr-id').value       = u.id_usuario;
        document.getElementById('editar-usr-empleado').value = `${u.nombre_empleado} ${u.apellido_empleado}`;
        document.getElementById('editar-usr-username').value = u.username;
        document.getElementById('editar-usr-activo').checked = !!u.activo;
        selRolEditar.value = String(u.id_rol);

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-editar-usuario')).show();
    }

    btnTogglePassEdit.addEventListener('click', () => {
        const esPassword = inputPassEditar.type === 'password';
        inputPassEditar.type = esPassword ? 'text' : 'password';
        btnTogglePassEdit.querySelector('i').classList.toggle('fa-eye', !esPassword);
        btnTogglePassEdit.querySelector('i').classList.toggle('fa-eye-slash', esPassword);
    });

    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formEditar.checkValidity()) {
            formEditar.classList.add('was-validated');
            return;
        }

        const id     = parseInt(document.getElementById('editar-usr-id').value);
        const activo = document.getElementById('editar-usr-activo').checked;

        const body = {
            username: document.getElementById('editar-usr-username').value.trim(),
            id_rol:   parseInt(selRolEditar.value),
            activo:   activo
        };

        // Si hay nueva contraseña, llamar al endpoint aparte
        const nuevaPass = inputPassEditar.value.trim();

        try {
            const res  = await fetch(`/api/auth/users/${id}`, {
                method:      'PUT',
                credentials: 'include',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok || !data.ok) {
                showToast(data.mensaje || 'Error al editar usuario', 'error');
                return;
            }

            // Si hay contraseña nueva la mandamos al endpoint de cambio
            if (nuevaPass) {
                const u = usuariosCache.find(x => x.id_usuario === id);
                // El endpoint requiere contrasenaAnterior — no la tenemos aquí,
                // así que usamos el endpoint de admin (PUT users/:id) que ya
                // maneja el campo si decides agregarlo, o mostramos aviso.
                showToast('Usuario editado. Para cambiar la contraseña usa la opción específica.', 'info');
            } else {
                showToast('Usuario actualizado correctamente', 'success');
            }

            bootstrap.Modal.getInstance(document.getElementById('modal-editar-usuario')).hide();
            cargarUsuarios();
        } catch (err) {
            showToast('No se pudo conectar con el servidor', 'error');
        }
    });

    //TOGGLE ACTIVAR / DESACTIVAR usuario

    async function toggleUsuario(id) {
        const u = usuariosCache.find(x => x.id_usuario === id);
        if (!u) return;

        const accion = u.activo ? 'desactivar' : 'activar';

        if (!window.confirm(`¿Deseas ${accion} al usuario "${u.username}"?`)) return;

        try {
            if (u.activo) {
                // Desactivar
                const res  = await fetch(`/api/auth/users/${id}`, {
                    method: 'DELETE', credentials: 'include'
                });
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.mensaje);
            } else {
                // Reactivar vía PUT con activo: true
                const res  = await fetch(`/api/auth/users/${id}`, {
                    method:  'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ username: u.username, id_rol: u.id_rol, activo: true })
                });
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.mensaje);
            }

            showToast(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`, 'success');
            cargarUsuarios();
        } catch (err) {
            showToast(err.message || 'Error al cambiar estado del usuario', 'error');
        }
    }

    //MODAL: Nuevo rol

    document.getElementById('modal-nuevo-rol').addEventListener('show.bs.modal', () => {
        limpiarModal(formNuevoRol);
    });

    formNuevoRol.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formNuevoRol.checkValidity()) {
            formNuevoRol.classList.add('was-validated');
            return;
        }

        const body = {
            nombre:      document.getElementById('nuevo-rol-nombre').value.trim(),
            descripcion: document.getElementById('nuevo-rol-descripcion').value.trim() || null
        };

        try {
            const res  = await fetch('/api/auth/roles', {
                method:      'POST',
                credentials: 'include',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok && data.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modal-nuevo-rol')).hide();
                showToast('Rol creado correctamente', 'success');
                cargarRoles();
            } else {
                showToast(data.mensaje || 'Error al crear rol', 'error');
            }
        } catch (err) {
            showToast('No se pudo conectar con el servidor', 'error');
        }
    });

    //MODAL: Editar rol

    function abrirEditarRol(id) {
        const r = rolesCache.find(x => x.id_rol === id);
        if (!r) return;

        limpiarModal(formEditarRol);
        document.getElementById('editar-rol-id').value          = r.id_rol;
        document.getElementById('editar-rol-nombre').value      = r.nombre;
        document.getElementById('editar-rol-descripcion').value = r.descripcion ?? '';
    }

    formEditarRol.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!formEditarRol.checkValidity()) {
            formEditarRol.classList.add('was-validated');
            return;
        }

        const id   = parseInt(document.getElementById('editar-rol-id').value);
        const body = {
            nombre:      document.getElementById('editar-rol-nombre').value.trim(),
            descripcion: document.getElementById('editar-rol-descripcion').value.trim() || null
        };

        try {
            const res  = await fetch(`/api/auth/roles/${id}`, {
                method:      'PUT',
                credentials: 'include',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok && data.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modal-editar-rol')).hide();
                showToast('Rol actualizado correctamente', 'success');
                cargarRoles();
            } else {
                showToast(data.mensaje || 'Error al editar rol', 'error');
            }
        } catch (err) {
            showToast('No se pudo conectar con el servidor', 'error');
        }
    });

    //MODAL: Eliminar rol

    /*function abrirEliminarRol(id, nombre) {
        elimRolNombre.textContent = nombre;
        btnConfirmarElimRol.dataset.rolId  = id;
    }

    btnConfirmarElimRol.addEventListener('click', async function () {
        const id = parseInt(this.dataset.rolId);

        try {
            const res  = await fetch(`/api/auth/roles/${id}`, {
                method: 'DELETE', credentials: 'include'
            });
            const data = await res.json();

            if (res.ok && data.ok) {
                bootstrap.Modal.getInstance(document.getElementById('modal-eliminar-rol')).hide();
                showToast('Rol eliminado correctamente', 'success');
                cargarRoles();
            } else {
                showToast(data.mensaje || 'Error al eliminar rol', 'error');
            }
        } catch (err) {
            showToast('No se pudo conectar con el servidor', 'error');
        }
    });*/

});