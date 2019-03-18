const express = require('express');
const app = express();
const http = require('http').Server(app);
const { db, models } = require('./db');
const { User } = models;
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');

db.loadDB();
//config
const { port } = require('./config');

app
	.use(cookieParser())
	.use(express.json())
	.use(session({ secret: 'iloveparlorparlorlovesme' }))
	.use(passport.initialize())
	.use(passport.session());

require('./middleware/passport')(passport, User);

//initialize routes
require('./routes')(app, passport);

// listen to port
http.listen(port, () => console.log(`Example app listening on port ${port}!`));
