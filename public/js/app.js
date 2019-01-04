var url = window.location.href;
var swLocation = '/twittor/sw.js';
var swReg;

if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }

    // registramos el service worker despues de que cargue la página para evitar 
    // retardos al cargar la primera vez
    window.addEventListener('load',()=> {
        navigator.serviceWorker.register( swLocation ).then(sw => {
            swReg=sw;

            swReg.pushManager.getSubscription().then(verificaSuscripcion);
        });
    });
}

// Referencias de jQuery

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

var NotActBtn   = $('.btn-noti-activadas');
var NotDeActBtn = $('.btn-noti-desactivadas');

// El usuario, contiene el ID del héroe seleccionado
var usuario;


// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});

// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    crearMensajeHTML( mensaje, usuario );

    // aqui tenemos que añadir el codigo para enviar el mensaje al backend
    console.log('llama a sendMensaje');
    sendMensaje(mensaje,usuario);

});


// enviamos los mensajes
function sendMensaje(mensaje,usuario){
    
    const mensajeEnvio = {
        "mensaje": mensaje,
        "usuario": usuario
    };
    
    fetch('api',{
        method:'POST', 
        body: JSON.stringify(mensajeEnvio), 
        headers: {'Content-Type':'application/json'}
      }).then(resp => resp.json())
      .then(res => console.log('app.js', res))
      .catch(error => console.log('app.js error:', error));
}

// obtenemos los mensajes
function getMensajes(){
    fetch('api').then(resp => resp.json())
      .then( posts => {
          console.log(posts);
          posts.forEach(post => crearMensajeHTML(post.mensaje, post.usuario));
    });
}

getMensajes();

const db = new PouchDB('mensajesHeroes');

function enviarMensajesSinConexion(){
    const posteos = [];
    console.log('enviarMensajesSinConexion: llego aqui');
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

// detectar cambios de conexion
function isOnline(){
    // Tenemos conexion
    if(navigator.onLine){
        console.log('tenemos conexion');
        mdtoast('Online',{
                interaction: true,
                interactionTimeout: 1000,
                actionText: 'ok'
            });
        
        try{ 
            if(SyncManager) 
                console.log('isOnline: existe sync');
        }catch(Error){
            enviarMensajesSinConexion();
            console.log('isOnline: No existe sync');
        }
    }
    // No tenemos conexion
    else{
        console.log('No tenemos conexion');
        mdtoast('Offline',{
            interaction: true,
            actionText: 'ok'
        });
    }
}

function hayConexion(){
    if(navigator.onLine)
        return true;
    else
        return false;
}

window.addEventListener('online',isOnline);
window.addEventListener('offline',isOnline);

isOnline();

//Notificaciones

function verificaSuscripcion(activadas){
    
    console.log('verificaSuscripcion activadas: ' , activadas);
    
    if(activadas){
        NotDeActBtn.addClass('oculto');
        NotActBtn.removeClass('oculto');
    }
    else{
        NotDeActBtn.removeClass('oculto');
        NotActBtn.addClass('oculto');
    }
}

function solicitarNotificacion(){
    if(!window.Notification){
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if(Notification.permission==="granted"){
        //new Notification("Hola Mundo - permiso concedido");
    }
    else{
        if(Notification.permission!=="denied" || Notification.permission==="default"){
            Notification.requestPermission(function (permission){
                if(permission==="granted")
                new Notification("Hola Mundo - tras aceptar");
            });
        }
    }

}

solicitarNotificacion();

//getKey
function getPublicKey(){

    return fetch('/api/key')
            .then(res => res.arrayBuffer())
                .then(key => new Uint8Array(key));

}

//getPublicKey().then(console.log);
NotDeActBtn.on('click', () => {
    if(!swReg) return console.log('No hay sw');

    getPublicKey().then(key => {
        swReg.pushManager.subscribe({
            userVisibleOnly:true,
            applicationServerKey: key
        }).then(res => res.toJSON())
        .then(suscripcion => {
            console.log(suscripcion);

            fetch('api/subscribe',{
                method:'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify ( suscripcion)
            })
            .then(verificaSuscripcion)
            .catch(cancelarSubscripcion); 
            //verificaSuscripcion(suscripcion);
        });
    });
});

function cancelarSubscripcion(){
    swReg.pushManager.getSubscription().then( subs =>{
        subs.unsubscribe().then( () => verificaSuscripcion(false));
    });
}

NotActBtn.on('click',() => {
    cancelarSubscripcion();
});