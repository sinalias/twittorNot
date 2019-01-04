// imports
importScripts("https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js");

importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');

const STATIC_CACHE    = 'static-v1';
const DYNAMIC_CACHE   = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js',
    'js/libs/plugin/mdtoast.min.css',
    'js/libs/plugin/mdtoast.min.js'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];



self.addEventListener('install', e => {


    const cacheStatic = caches.open( STATIC_CACHE ).then(cache => 
        cache.addAll( APP_SHELL ));

    const cacheInmutable = caches.open( INMUTABLE_CACHE ).then(cache => 
        cache.addAll( APP_SHELL_INMUTABLE ));



    e.waitUntil( Promise.all([ cacheStatic, cacheInmutable ])  );

});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then( keys => {

        keys.forEach( key => {

            if (  key !== STATIC_CACHE && key.includes('static') ) {
                return caches.delete(key);
            }

            if (  key !== DYNAMIC_CACHE && key.includes('dynamic') ) {
                return caches.delete(key);
            }

        });

    });

    e.waitUntil( respuesta );

});





self.addEventListener( 'fetch', e => {

    let respuesta;

    if(e.request.url.includes('/api')){
        respuesta = manejoApiMensajes(DYNAMIC_CACHE,e.request);
    }
    else{

        respuesta = caches.match( e.request ).then( res => {

                
                if ( res ) {
                    
                    actualizaCacheStatico( STATIC_CACHE, e.request, APP_SHELL_INMUTABLE );
                    return res;
                } else {

                    return fetch( e.request ).then( newRes => {

                        return actualizaCacheDinamico( DYNAMIC_CACHE, e.request, newRes );

                    });

                }

            });

    }

    e.respondWith( respuesta );

});



// tareas asincronas

self.addEventListener('sync', e => {

        console.log('SW: Sync');

        if(e.tag === 'nuevo-post'){
            // postear al backend
            const respuesta = postearMensajes(e);

            e.waitUntil(respuesta);
        }

});

// postear mensajes a base de datos
function postearMensajes(){
    const posteos = [];

    return db.allDocs({include_docs:true}).then(docs => {
        docs.rows.forEach(row => {
            const doc= row.doc;

            const fetchProm = fetch('api',{
                method:'POST', 
                body: JSON.stringify(doc), 
                headers: {'Content-Type':'application/json'}
              }).then(resp => {
                  db.remove(doc);
              });
        
            posteos.push(fetchProm);
        }); // fin del fetch del forEach

        return Promise.all(posteos);
    });
}


// escuchar push
self.addEventListener('push', e => {
    console.log(e);

    const data = e.data.json();

    console.log(data);
    //const title = e.data.json().titulo;
    const title = data.titulo; //data.titulo;
    
    const options = {
            body: data.cuerpo,
            icon: 'https://vignette.wikia.nocookie.net/avengersassemble/images/6/6e/Torre_de_los_Vengadores.png/revision/latest?cb=20130531150349&path-prefix=es',//`img/avatars/{data.usuario}.jpg`,
            badge: 'img/favicon.ico',
            image: 'https://vignette.wikia.nocookie.net/avengersassemble/images/6/6e/Torre_de_los_Vengadores.png/revision/latest?cb=20130531150349&path-prefix=es',
            vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500],
            openUrl: '/',
            data: {
                url: 'https://google.com',
                id: data.usuario
            },
            actions: [
                {
                    action: 'thor-action',
                    title: 'Accion Thor',
                    icon: 'img/avatars/thor.jpg'
                },
                {
                    action: 'ironman-action',
                    title: 'Accion Ironman',
                    icon: 'img/avatars/ironman.jpg'
                }
            ]
        };

    e.waitUntil(self.registration.showNotification (title, options));
});

// Este evento se dispara cuando se cierra la notificacion
self.addEventListener('notificationclose', e => {
    console.log('Capturo el evento cierre notificacion', e);
});

// Este evento se dispara cuando se hace click en la notificacion
self.addEventListener('notificationclick', e => {
    console.log('Capturo el evento cierre notificacion', e);
    const notification = e.notification;
    const action = e.action;

    console.log('NotificationClick: ',{notification, action});

    notification.close();
});