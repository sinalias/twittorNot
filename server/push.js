const fs = require('fs');

const urlsafeBase64 =require('urlsafe-base64');
const vapid=require('./vapid.json');
const webpush=require('web-push');

const suscripciones = require('./subs-db.json');

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
    suscripciones.forEach( (suscripcion,i) => {
        webpush.sendNotification(suscripcion, JSON.stringify(post));
    });
};