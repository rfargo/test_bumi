var mysql = require('mysql')

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test_bumi'
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