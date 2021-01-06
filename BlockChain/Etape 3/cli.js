#!/usr/bin/env node

const argv = require('yargs') // Analyse des paramètres
  .command('get <key>', 'Récupère la valeur associé à la clé')
  .command('set <key> <value>', 'Place une association clé / valeur')
  .command('keys', 'Demande la liste des clés')
  .option('port', {
    alias: 'p',
    default: '3000',
    description: 'Port du server a contacter'
  })
  .demandCommand(1, 'Vous devez indiquer une commande')
  .help()
  .argv;

const url = `http://localhost:${argv.port}`;
const io = require('socket.io-client');

const socket = io(url, {
  path: '/byr',
});

socket.on('error', (error) => {
  console.error('Haaaaaaaaaaaaa !', error);
  socket.close();
});

socket.on('connect_error', (error) => {
  console.error('Hello ?', error);
  socket.close();
});

socket.on('connect_timeout', (timeout) => {
  console.error('Poueuffff !', error);
  socket.close();
});

socket.on('connect', () => {
  console.info('Connection établie');

  switch (argv._[0]) {
    case 'get':
      socket.emit('get', argv.key, (dick) => {
        console.info(`get ${argv.key} : ${dick.value} at ${dick.timestamp}`);
        socket.close();
      });
      break;
    case 'set':
      socket.emit('set', argv.key, argv.value, (ok) => {
        console.info(`set ${argv.key} : ${ok}`);
        socket.close();
      });
      break;
    case 'keys':
      socket.emit('keys', (keys) => {
        console.log(`keys : ${keys}`);
        socket.close();
      }) 
      break;
    case 'addPeer':
      socket.emit('addPeer',argv._[1],argv._[2] , (keys) => {
        console.log(`addPeer : ${keys}`);
        socket.close();
      })
      break;
    case 'peers':
      socket.emit('peers', (address, port) => {
        console.log(`address : ${address} port: ${port}`);
        socket.close();
      })
      break;
    case 'keysAndTime':
      socket.emit('keysAndTime', (keysAndTime) => {
        console.log("Keys and time : ", keysAndTime);
        socket.close();
      })
      break;
    default:
      console.error("Commande inconnue");
      socket.close();
      socket.io.uri
  }
});
