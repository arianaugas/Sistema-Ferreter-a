const express = require('express');
require('dotenv').config();
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
//importamos las rutas creadas
const apiRouter = require('./server/routes/api');
const vistasRouter = require('./server/routes/vistas');
const {notFound} = require('./server/middlewares/notFoundMiddleware');
const auditMiddleware = require('./server/middlewares/auditMiddleware');
const errorMiddleware = require('./server/middlewares/errorMiddleware');


//creamos el servidor
const app = express();
const PORT = process.env.PORT;

//midlewares globales
app.use(express.json())//convertimos to a json
app.use(express.urlencoded({ extended: true }));//para peticiones que vienen desde formularios
app.use(cookieParser());//para cookies
app.use(morgan("dev"));//te duevuelve las peticiones y respuestas por consolaa
app.use(auditMiddleware);

app.use('/public', express.static(path.join(__dirname, 'public')));//carpeta estatica

//registro de enrutadores
app.use('/api', apiRouter);
app.use('/', vistasRouter);

//manejo de rutas no encontradas
app.use(notFound);

//manejo de errores
app.use(errorMiddleware);

// ARRANQUE DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


