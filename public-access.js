var mysql = require('mysql')

var connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB
})

connection.connect()

exports.allAlbum = function (req, res) {
  connection.query('SELECT * from photos', function (error, results, fields) {
    if (error) throw error
    res.send(results);
  })
}

exports.filter = function (req, res) {
  connection.query('SELECT * FROM `photos` WHERE `album_id` = ?', [req.params.album], 
    function (error, results, fields) {
      res.send(results);
  });
}

exports.search = function (req, res) {
  if(req.params.name){
    connection.query('SELECT * FROM `photos` WHERE `title` LIKE ?', ['%' +req.params.name + '%'], 
      function (error, results, fields) {
        if (error) throw error
        console.log(results);
        res.send(results);
    });    
  }else{
    res.send([]);
  }

}

exports.albumList = function(req, res){
  console.log('hi');
  connection.query('SELECT DISTINCT `album_id` FROM `photos` ORDER BY `album_id`', 
    function (error, results, fields) {
      res.send(results);
  });
}

exports.detail = function(req, res){
  connection.query('SELECT * FROM `photos` WHERE `id` = ?', [req.params.id], 
    function (error, results, fields) {
      res.send(results);
  });
}