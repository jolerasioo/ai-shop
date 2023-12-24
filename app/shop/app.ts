import createError from 'http-errors'
import express, { Application, Request, Response } from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import path from 'path'
//var cookieParser = require('cookie-parser');
//var logger = require('morgan');

//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');
import chatRouter from './routes/chat.js'



import { MongoClient, ObjectId } from 'mongodb'

const murl : string = process.env.AISHOP_MONGO_CONNECTION_STR || "mongodb://localhost:27017/azshop?replicaSet=rs0"
const client = new MongoClient(murl);

const imageBaseUrl = process.env.AISHOP_STORAGE_ACCOUNT ? `https://${process.env.AISHOP_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AISHOP_IMAGE_CONTAINER}` : `https://127.0.0.1:10000/devstoreaccount1/${process.env.AISHOP_IMAGE_CONTAINER}`

 
export const getDb = async () => {
    // Connect MongoDB
  await client.connect();
  return client.db();
}


var app = express();

// view engine setup
app.set('views', './views');
app.set('view engine', 'ejs');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static('./public'));
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


app.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

app.get('/help', function(req, res, next) {
  res.render('help', { full: false });
});

app.get('/explore', async (req, res, next) => {

  const db = await getDb();
  const categories = await db.collection('products').find({ type:  "Category"}).toArray()

  res.render('products', { categories, imageBaseUrl });
})

app.get('/explore/:category', async (req, res, next) => {
  const { category } = req.params;

  try {
    const db = await getDb();
    const categories = await db.collection('products').find({ type:  "Product", category_id: new ObjectId(category)}).toArray()

    res.render('products', { categories, imageBaseUrl });
  } catch (error: any) {
    res.status(500).send(error);
  }
})

app.get('/add/:productid', async (req, res, next) => {
  const { productid } = req.params;

  try {
    const db = await getDb();
    const product = await db.collection('products').findOne({ _id: new ObjectId(productid)})

    res.render('textresponse', { question: "", answer: `${product?.heading} added to your cart` });

  } catch (error: any) {
    res.status(500).send(error);
  }
})


app.use('/api/chat', chatRouter)
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// catch all error handler
app.use((err: { message: any; status: any }, req: { app: { get: (arg0: string) => string } }, res: { locals: { message: any; error: any }; status: (arg0: any) => void; render: (arg0: string) => void }, next: any) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val : string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;
  console.debug('Listening on ' + bind);
}

