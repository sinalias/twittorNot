// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push');



const mensajes = [
  {
    _id: 'XXX',
    usuario: 'spiderman',
    mensaje: 'Hola mundo'
  }
];


// Get mensajes
router.get('/', function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json (mensajes);
});

// devolvemos la llave publica
router.get('/key', function (req, res) {
  //res.json ('key publico');
  
  const key = push.getKey();

  res.send(key);
});

// Post mensajes
router.post('/', function (req, res) {
  const mensaje = {
    mensaje: req.body.mensaje,
    usuario: req.body.usuario
  }

  mensajes.push(mensaje);

  res.json ({ok:true, 
             mensaje: mensaje
            });

  console.log('mensaje:',mensaje);
});

//Almacenar la suscripción
router.post('/subscribe', function (req, res) {
  const suscripcion = req.body;

  console.log(suscripcion);

  push.addSubscription(suscripcion);

  res.json ('subscribe');

});

//Enviar una notificaion push 
// a las personas que queramos
//Esto es algo que se controla del lado del server
// no debe formar parte del apitre
router.post('/push', function (req, res) {
  
  const notificacion = {
    titulo: req.body.titulo,
    cuerpo: req.body.cuerpo,
    usuario: req.body.usuario
  };

  push.sendPush(notificacion);
  res.json (notificacion);

});



module.exports = router;