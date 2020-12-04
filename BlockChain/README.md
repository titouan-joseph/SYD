# Étape 1

On a fait comme il faut la fonction quit get toutes les keys

```javascript
socket.on('keys', function(callback){
    console.info(`keys`);
    callback(Object.keys(db));
  });
```

# Étape 2

Quand on lance plusieurs serveur: au début ça a pas marché car toutes les bases de données essayaient de se connecter
Quand on a changé les ports ça a fonctionné.

On a fait un script bash pour lancer les 3 serveurs en même temps

# Étape 3

# Étape 4









