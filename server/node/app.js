const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const createError = require('http-errors');

const morgan = require('morgan');
const { logger, morganLogger } = require('./config/logger');

const passport = require('passport');

const db = require('./models');
db.sequelize.sync();

const express = require('express');
const session = require('express-session');
const app = express();

const env = process.env.NODE_ENV;
const port = process.env.PORT;

const RESULT = require('./constant/result');
const token = require('./plugin/token');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
//app.use(helmet.noCache());
//app.use(helmet.hpkp());
app.use(cors({ origin: true, credentials: true }));
app.use(passport.initialize());
app.use(morgan({
    format: env === 'production' ? 'default' : 'dev',
    stream: morganLogger,
}));



app.use('/auth', require('./routes/auth'));
app.use('/user', token.verify, require('./routes/user'));
app.use('/board', token.verify, require('./routes/board'));
app.use('/download', token.verify, require('./routes/download'));



app.use( (req, res, next) => {
    next(createError(404));
});

app.use( (err, req, res, next) => {

    let message = null;

    if(typeof err === 'string'){
        message = err;
    }

    logger.error(message || err.stack);

    res.status(err.status || 500);
    req.app.get('env') === 'development' ? err : {};

    res.json({
        api: req.originalUrl,
        result: {
            boolean: RESULT.ERROR.boolean,
            code: RESULT.ERROR.code,
            message: message || err.message || RESULT.ERROR.message,
            object: res.resultObj || null,
        },
    });

});



app.listen( port, () => {
    console.log('server running at http://localhost:' + port);
});
