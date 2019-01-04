
// Guardar  en el cache dinamico
function actualizaCacheDinamico( dynamicCache, req, res ) {


    if ( res.ok) {

        return caches.open( dynamicCache ).then( cache => {

            cache.put( req, res.clone() );
            
            return res.clone();

        });

    } else {
        return res;
    }

}

// Cache with network update
function actualizaCacheStatico( staticCache, req, APP_SHELL_INMUTABLE ) {


    if ( APP_SHELL_INMUTABLE.includes(req.url) ) {
        // No hace falta actualizar el inmutable
        // console.log('existe en inmutable', req.url );

    } else {
        // console.log('actualizando', req.url );
        return fetch( req )
                .then( res => {
                    return actualizaCacheDinamico( staticCache, req, res );
                });
    }

}

function hayConexion(){
    if(navigator.onLine)
        return true;
    else
        return false;
}

function manejoApiMensajes(nombreCache, request){

    if(request.url.indexOf('/api/key')>=0 ||request.url.indexOf('/api/subscribe')>=0){
        return fetch(request);
    }
    else{

        if(request.clone().method=== 'POST'){
            // POSTEO
            // SI FALLA EL FETCH TIRO DE CACHE E INSERTO EN INDEXDB
            if(self.registration.sync){
                console.log('manejoApiMensajes: tiene sync');
                return request.clone().text().then(body => {
                    const bodyObj = JSON.parse(body);
                    console.log('manejoApiMensajes: Pasa por aqui manejo Mensajes');
                    return guardarMensajeBD(bodyObj);
                });

            }
            else{
                console.log('manejoApiMensajes: No tiene sync valor de conexion ' + hayConexion());
                if(!hayConexion()){
                    request.clone().text().then(body => {
                        const bodyObj = JSON.parse(body);
                        console.log('manejoApiMensajes: Pasa por aqui manejo Mensajes');
                        return guardarMensajeSinConexBD(bodyObj);
                    });
                }
                else{
                    console.log('manejoApiMensajes: hace el fetch');
                    return fetch(request);
                }

            }
            
        }
        else{
            return fetch(request).then( res => {
                console.log('manejoApiMensajes: No es una peticion POST ', request.url);
                if(res.ok){
                    actualizaCacheDinamico( nombreCache, request, res.clone());
                    return res.clone();
                }
                else{
                    return caches.match(request);
                }
            }).catch(err => {
                console.log(err);
                return caches.match(request);
            });

        }
    }
}