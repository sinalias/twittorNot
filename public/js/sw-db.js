// utilidades para almacenar informacion en Indexed DB

const db = new PouchDB('mensajesHeroes');

function guardarMensajeBD(mensaje) {
    mensaje._id = new Date().toISOString();
    mensaje.sincronizado = false;
    
    console.log('guardarMensajeBD: Paso por aqui');
    return db.put(mensaje)
        .then(() => {
            self.registration.sync.register('nuevo-post');

            const newResp = {ok: true, offline: true};

            console.log('mensaje insertado');

            return new Response (JSON.stringify(newResp));
        })
        .catch(err => console.log('Error al insertar en bd:', err));
  }

  function guardarMensajeSinConexBD(mensaje) {
    mensaje._id = new Date().toISOString();
    mensaje.sincronizado = false;
    
    console.log('guardarMensajeBD: Paso por aqui');
    return db.put(mensaje)
        .then(() => {
            console.log('guardarMensajeSinConexBD: mensaje insertado');
        })
        .catch(err => console.log('Error al insertar en bd:', err));
  }  