#!/usr/bin/env node

// ajout du port en parametre
const argv = require('yargs')
.option('port', {
  alias: 'p',
  default: '3000',
  description: 'Port du server a contacter',
  type: 'int'
})
.help()
.argv; // Analyse des paramètres

const PORT = argv._[0] || 3000; // Utilisation du port en paramètre ou par defaut 3000
const Server = require('socket.io');
const client = require('socket.io-client');

//const ports = [3000];
//const others = ports.filter((p) => {return p !== PORT});


const io = new Server(PORT, { // Création du serveur
  path: '/byr',
  serveClient: false,
});

const otherSockets = [];
// others.forEach((othersPort) => {
//   otherSockets.push(client(`http://localhost:${othersPort}`, {
//     path: '/byr',
//   }));
// })


console.info(`Serveur lancé sur le port ${PORT}.`);

const db = Object.create(null); // Création de la DB

io.on('connect', (socket) => { // Pour chaque nouvlle connexion
  console.info('Nouvelle connexion');

  socket.on('get', function(field, callback){
    console.info(`get ${field}: ${db[field]}`);
    callback(db[field]);
  });

  socket.on('set', function(field, value, callback){
    if (field in db) {
      console.info(`set error : Field ${field} exists.`);
      callback(false);
    } else {
      console.info(`set ${field} : ${value}`);
      db[field] = value;

      otherSockets.forEach( (socket) => {
        socket.emit('set', field, value, (ok) => {
          console.info(`set ${argv.key} : ${ok}`);
          socket.close();
        });
      })
    }
  });

  socket.on('keys', function(callback){
    console.info(`keys`);
    callback(Object.keys(db));
  });

  socket.on('addPeer', function(serverAddr, port, callback){
    console.info(`Adding peer ${serverAddr}:${port}`)

    socket = client(`http://${serverAddr}:${port}`, {
      path: '/byr',
      })

    otherSockets.push(socket);

    Object.keys(db).forEach(key => {
      socket.emit('set', key, db[key])
    })
  })
  
  socket.on('peers', function(){
    otherSockets.forEach(sock => {
      port = sock.io.uri.match(new RegExp(/:[0-9]+/));
      address = sock.io.uri.match(new RegExp(/az/));
    })
  })

});
