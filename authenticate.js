const bcrypt = require('bcrypt');
const config = require('./config/custom-environment-variables.json');
var mysql = require('mysql')
const jwt = require('jsonwebtoken');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bumi_test'
})

connection.connect()

exports.login = async (req, res)=>{
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
}

exports.register = async (req, res)=>{
  var username = req.body.username;
  var password = req.body.password;

  const salt = await bcrypt.genSalt(10);
  var passwordCrypt = await bcrypt.hash(password, salt);

  var query = "INSERT INTO users (username, password) VALUES ('"+username+"','"+ passwordCrypt+"')";
  connection.query(query, function (error, results, fields) {
    if (error) throw error
    res.json({ message: 'Registration successful' })
  })
}

exports.validate = async (req, res)=>{
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
}