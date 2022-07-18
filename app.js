const express = require('express')
const app = express()
const port = 3000

require('dotenv').config();

const config = require('./config/custom-environment-variables.json');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

var public = require('./public-access');
var admin = require('./admin-only');
var auth = require('./authenticate');

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = ['http://localhost:8080'];

const options = cors.CorsOptions = {
  origin : allowedOrigins,
};

app.use(cors(options));
app.use(bodyParser.json())

if (!config.PrivateKey) {
    console.error('FATAL ERROR: PrivateKey is not defined.');
    process.exit(1);
}

// a middleware
function authenticateToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];

  const validate = async (token) => {
      jwt.verify(token, config.PrivateKey, function(err, decoded) {
        if (err) return res.sendStatus(401);
        else{
          next();
          return decoded;
        }
      });
  }

  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    token = bearerToken;
    validate(token);
  } else {
    // Forbidden
    res.sendStatus(403);
  }
}

// authentication
//register only to only used to keep registered data on db
app.post('/register', auth.register);
app.post('/login', bodyParser.urlencoded({ extended: false }), auth.login);
app.post('/validate', auth.validate);

//public 
app.get('/all-album', public.allAlbum);
app.get('/filter-by-album/:album', public.filter);
app.get('/search-by-name/:name', public.search);
app.get('/search-by-name/', function(req, res){res.send([]);});
app.get('/album-list', public.albumList);
app.get('/photo-detail/:id', public.detail);

//admin only
app.post('/move', authenticateToken, admin.move);
app.post('/delete', authenticateToken, admin.delete);
app.post('/delete-album', authenticateToken, admin.deleteAlbum);
app.post('/rename', authenticateToken, admin.rename);
app.post('/create', authenticateToken, admin.create);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})