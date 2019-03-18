const express = require('express');
const app = express();
const http = require('http').Server(app);
const { db } = require('./db');
db.loadDB();
//config
const { port } = require('./config');

//initialize routes
require('./routes')(app);

// listen to port
http.listen(port, () => console.log(`Example app listening on port ${port}!`));
