const express = require('express');
const app = express();
const http = require('http').Server(app);
const { db } = require('./db');
const passport = require('passport');
const { passportMiddleware } = require('./middleware');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const { port } = require('./config');

const { uploadFunctions } = require('./methods');
const { checkOrCreateFolder } = uploadFunctions;

// initalize sequelize with session store
(async () => {
	await db.loadDB();

	//create uploads folder if it wasn't there
	checkOrCreateFolder('./uploads');
	checkOrCreateFolder('./uploads/profile');
	checkOrCreateFolder('./uploads/projects');

	app
		.use(cookieParser())
		.use(express.json())
		.use(
			session({
				secret: 'iloveparlorandparlorlovesme',
				store: db.myStore,
				resave: false,
				proxy: true
			})
		)
		.use(passport.initialize())
		.use(passport.session())
		.use('/uploads', express.static(__dirname + '/uploads'))
		.use('/uploads', express.static(__dirname + '/statics'));

	//sync sessions with db
	db.myStore.sync();

	passportMiddleware(passport);

	//initialize routes
	require('./routes')(app, passport);

	// listen to port
	http.listen(port, () => console.log(`Example app listening on port ${port}!`));
})();
