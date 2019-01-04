const fs = require('fs');

const urlsafeBase64 =require('urlsafe-base64');
const vapid=require('./vapid.json');
const webpush=require('web-push');

let suscripciones = require('./subs-db.json');

webpush.setVapidDetails("mailto:sinalias@gmail.com",
                    vapid.publicKey,
                    vapid.privateKey);

module.exports.getKey = () => {
    return urlsafeBase64.decode(vapid.publicKey);
};

module.exports.addSubscription = (suscripcion) => {
    suscripciones.push(suscripcion);

    console.log('push.js addSubscription:', suscripciones);
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );
};

module.exports.sendPush = ( post) =>{

    const notificacionesEnviadas = [];

    suscripciones.forEach( (suscripcion,i) => {
        
        const pushProm = webpush.sendNotification(suscripcion, JSON.stringify(post))
            .then(console.log('Notificacion enviada'))
            .catch(err => {
                console.log('La notificación fallo');

                if(err.statusCode === 410){ // ya no existe
                    suscripciones[i].borrar = true;
                }
            });

        notificacionesEnviadas.push(pushProm);
    });

    Promise.all(notificacionesEnviadas).then(() => {
        suscripciones = suscripciones.filter(subs => !subs.borrar);

        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );
    });
};