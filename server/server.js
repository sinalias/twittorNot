const express = require('express');

const path = require('path');

const app = express();
// Añadimos la libreria body-parser
const bodyParser = require('body-parser');


const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true })); // suppport urlencode


app.use(function(req,res,next){
    res.header("Acces-Control-Allow-Origin","*");
    res.header("Acces-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Directorio Público
app.use(express.static(publicPath));

// Rutas 
const routes = require('./routes');
app.use('/api', routes );



app.listen(port, (err) => {

    if (err) throw new Error(err);

    console.log(`Servidor corriendo en puerto ${ port }`);

});