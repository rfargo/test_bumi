const express = require('express')
const app = express()
const port = 3000

const bcrypt = require('bcrypt');
const config = require('./config/custom-environment-variables.json');
var mysql = require('mysql')
var photo = require('./photo');
var public = require('./public-access');
var bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');

const cors = require('cors');

// Add a list of allowed origins.
// If you have more origins you would like to add, you can add them to the array below.
const allowedOrigins = ['http://localhost:8080'];

const options = cors.CorsOptions = {
  origin : allowedOrigins,
};

// Then pass these options to cors
app.use(cors(options));



app.use(bodyParser.json())

//app.use(bodyParser.urlencoded({ extended: false }))

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bumi_test'
})

connection.connect()

if (!config.PrivateKey) {
    console.error('FATAL ERROR: PrivateKey is not defined.');
    process.exit(1);
}

//register and login

//only used to keep registered data on db
app.post('/register', async(req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  const salt = await bcrypt.genSalt(10);
  var passwordCrypt = await bcrypt.hash(password, salt);

  var query = "INSERT INTO users (username, password) VALUES ('"+username+"','"+ passwordCrypt+"')";
  connection.query(query, function (error, results, fields) {
    if (error) throw error
    res.json({ message: 'Registration successful' })
  })
})


app.post('/login', bodyParser.urlencoded({ extended: false }), async(req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  
  user = connection.query('SELECT * FROM `users` WHERE `username` = ?', [username], 
    function (error, results, fields) {
      if (error) throw error

      if (results.length !== 1) return res.status(400).send('Incorrect email or password.');
        else validation(results);
  });

  const validation = async (results) => {
    var user = results;
    const validPassword = await bcrypt.compare(password, user[0].password);

    if (!validPassword) {
        return res.status(400).send('Incorrect email or password.');
    }else{
      const token = jwt.sign({ _id: user[0]._id }, config.PrivateKey, { expiresIn: '1800s' });
      res.header('x-auth-token', token).status(200).json({
        'message': 'You are in, '+user[0].username,
        'token': token,
        'name' : user[0].username
      });
    }

  }

})


//public 
app.get('/all-album', public.allAlbum);
app.get('/filter-by-album/:album', public.filter);
app.get('/search-by-name/:name', public.search);
app.get('/search-by-name/', function(req, res){res.send([]);});
app.get('/album-list', public.albumList);
app.get('/photo-detail/:id', public.detail);;


//admin only
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



app.post('/delete', authenticateToken, async(req, res) => {
  var photo_id = req.body.photo_id;

   connection.query('DELETE FROM photos WHERE id = ?', [photo_id], function (error, results, fields) {
    if (error) throw error
    res.json({ message: 'Photo '+photo_id+' is deleted' })
  })

})

app.post('/delete-album', authenticateToken, async(req, res) => {
  var album_id = req.body.album_id;

   connection.query('DELETE FROM photos WHERE album_id = ?', [album_id], function (error, results, fields) {
    if (error) throw error
    res.json({ message: 'Album '+album_id+' is deleted' })
  })

})

app.post('/rename', authenticateToken, async(req, res) => {
  
  var photo_id = req.body.photo_id;
  var new_title = req.body.new_title;

   connection.query('UPDATE photos SET title = ? WHERE id = ?', [new_title, photo_id], function (error, results, fields) {
    if (error) throw error
    
    connection.query('SELECT * FROM `photos` WHERE `id` = ?', [photo_id], 
      function (error, results, fields) {
        res.send(results[0]);
    });

  })

})

app.post('/create', authenticateToken, async(req, res) => {

  var album_id = req.body.album_id;
  var title = req.body.title;
  var url = req.body.url;
  var thumbnail_url = req.body.thumbnail_url;
  var new_album = req.body.new_album;

  function newAlbum(){
    connection.query('SELECT MAX(album_id) AS maxAlbum FROM `photos`', 
      function (error, results, fields) {
        number = results[0].maxAlbum+1;
        createAlbum(number);
    });
  }

  const create = () => {
      var query = "INSERT INTO `photos` (album_id, title, url, thumbnail_url) VALUES ('"+album_id+"','"+ title+"','"+url+"','"+ thumbnail_url+"')";
      connection.query(query, function (error, results, fields) {
        if (error) throw error
        connection.query('SELECT * FROM `photos` WHERE `id` = ?', [results.insertId], 
          function (error, results, fields) {
            res.send(results[0]);
        });
      }) 
  }

  if(new_album)newAlbum();
  else create(album_id, title, url, thumbnail_url);

  const createAlbum = (number) => {
    album_id = number;
    create(album_id, title, url, thumbnail_url);
  }

})

app.post('/move', authenticateToken, async(req, res) => {

  var photo_id = req.body.photo_id;  
  var new_album_id = req.body.new_album_id;

   connection.query('UPDATE photos SET album_id = ? WHERE id = ?', [new_album_id, photo_id], function (error, results, fields) {
    if (error) throw error
    
    connection.query('SELECT * FROM `photos` WHERE `id` = ?', [photo_id], 
      function (error, results, fields) {
        res.send(results[0]);
    });

  })

})

app.post('/validate', async(req, res, next) => {
  //const bearerHeader = req.headers['authorization'];
  var token = req.body.token;
  try{
    var validate = jwt.verify(token,config.PrivateKey);
    res.json({
      'message':validate,
      'code':'VAL'
    }) 
  }catch(err){
    res.json({
      'error':err,
      'code':'ERR'
    })
  }
})



app.use('/photo', photo.index);

app.get('/hello', function (req, res) {
  res.send('hello')
})

app.get('/', (req, res) => {
  res.send('About')
})


app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})