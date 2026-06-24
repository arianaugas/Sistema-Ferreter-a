const bcrypt = require('bcryptjs');

const usuarios = [
    { id_empleado: 1, id_rol: 1, username: 'ana.admin',   password: 'admin123'    },
    { id_empleado: 2, id_rol: 2, username: 'luis.vend',   password: 'vendedor123' },
    { id_empleado: 3, id_rol: 3, username: 'carlos.alm',  password: 'almacen123'  },
    { id_empleado: 4, id_rol: 4, username: 'maria.caj',   password: 'cajero123'   },
    { id_empleado: 5, id_rol: 2, username: 'pedro.vend',  password: 'vendedor123' },
    { id_empleado: 6, id_rol: 4, username: 'sofia.caj',   password: 'cajero123'   },
    { id_empleado: 7, id_rol: 2, username: 'diego.vend',  password: 'vendedor123' },
    { id_empleado: 8, id_rol: 3, username: 'valeria.alm', password: 'almacen123'  },
];

async function main() {
    console.log('INSERT INTO usuarios (id_empleado, id_rol, username, contrasena, activo) VALUES');

    const filas = [];
    for (const u of usuarios) {
        const hash = await bcrypt.hash(u.password, 10);
        filas.push(`(${u.id_empleado}, ${u.id_rol}, '${u.username}', '${hash}', 1)`);
    }

    console.log(filas.join(',\n') + ';');
}

main();

//node database/generadorHash.js