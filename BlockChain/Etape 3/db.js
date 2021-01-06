#!/usr/bin/env node

const crypto = require('crypto');
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
    console.info(`get ${field}: ${db[field].value} ${db[field].timestamp} ${db[field].hash}`);
    callback(db[field]);
  });

  socket.on('set', function(field, value, callback, timestamp=null){
    // setTimeout(() => {
    //   // Le code ici sera exécuté après 10 secondes.
    // }, 10000);
    if (field in db) {
      console.info(`set error : Field ${field} already exists.`);
      if( timestamp < db[field].timestamp && timestamp != null ){ 
        db[field].timestamp = timestamp;
        console.log(`updated value of ${field} at ${db[field].timestamp}`)
      }
    } else {
      console.info(`set ${field} : ${value}`);
      db[field] = {
        value: value,
        timestamp: timestamp || (new Date()).valueOf(),
        // 2021-01-06T08:43:32.273Z
        hash: getHash(value.toString())
      };
      console.info(`saved ${field} : ${value} at ${db[field].timestamp} with hash ${db[field].hash}`);
      // callback(true);
    
      otherSockets.forEach( (socket) => {
        socket.emit('set', field, value, db[field].timestamp, db[field].hash, (ok) => {
          console.info(`set ${argv.key} : ${ok} at ${db[field].timestamp} with hash ${db[field].hash}`);
          socket.close();
        });
      })
    }
    // callback(false);
  });

  socket.on('keys', function(callback){
    console.info(`keys`);
    callback(Object.keys(db));
  });

  socket.on('keysAndTime', function(callback){
    console.info(`keys and time`);
    callback(extractHorodatage(db))
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
  
  socket.on('peers', function(callback){
    otherSockets.forEach(sock => {
      port = sock.io.uri.match(new RegExp(/(?<=:)[0-9]+/));
      address = sock.io.uri.match(new RegExp(/(?<=:\/\/)[a-z]+/));
      console.log(`port ${port} on ${address}`);
      callback(address, port)
    })
  })

  socket.on('hash', function(field, callback){
    console.info(`get hash of ${field}`);
    callback(db[field].hash);
  });


});


setInterval(() => {
  // Le code ici sera exécuté toutes les 10 secondes.
  // calls keys and time of peers
  console.info("syncing database...")
  otherSockets.forEach(sock => {
    sock.emit('keysAndTime', (keysAndTime) => {
      Object.keys(keysAndTime).forEach((key) => {
        if (db[key] == undefined){
          sock.emit(`get`, key , (value) => {
            db[key] = value;
          })
        } else {
          console.log(`comparing ${db[key].timestamp} ${keysAndTime[key].timestamp}`);
          if (db[key].timestamp > keysAndTime[key].timestamp){
            sock.emit(`hash`, key , (value) => {
                if (value != db[key].hash ){
                  //à remplacer par valeur de Hash partie d'après - Adele 2021
                  sock.emit('get', key, (res) =>{
                    db[key] = res;
                    console.log(`value updated after sync ${key} : ${res}`);
                  })
                }
            })
          }
        }
      })
    })
  })
  // {key : {timestamp : 133456576238 } }
}, 10000); 





const extractHorodatage = function(db) {
  return Object.keys(db).reduce(function(result, key) {
    result[key] = {
      timestamp: db[key].timestamp
    };
    return result;
  }, {});
};

// Retourne l'empreinte de data.
const getHash = function getHash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}