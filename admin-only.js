var mysql = require('mysql')

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test_bumi'
})

connection.connect()


exports.move = async (req, res)=>{
  var photo_id = req.body.photo_id;  
  var new_album_id = req.body.new_album_id;

   connection.query('UPDATE photos SET album_id = ? WHERE id = ?', [new_album_id, photo_id], function (error, results, fields) {
    if (error) throw error
    
    connection.query('SELECT * FROM `photos` WHERE `id` = ?', [photo_id], 
      function (error, results, fields) {
        res.send(results[0]);
    });

  })
}

exports.delete = async (req, res)=>{
	var photo_id = req.body.photo_id;

   connection.query('DELETE FROM photos WHERE id = ?', [photo_id], function (error, results, fields) {
    if (error) throw error
    res.json({ message: 'Photo '+photo_id+' is deleted' })
  })
}

exports.deleteAlbum = async (req, res)=>{
  var album_id = req.body.album_id;

   connection.query('DELETE FROM photos WHERE album_id = ?', [album_id], function (error, results, fields) {
    if (error) throw error
    res.json({ message: 'Album '+album_id+' is deleted' })
  })
}

exports.rename = async (req, res)=>{
  var photo_id = req.body.photo_id;
  var new_title = req.body.new_title;

   connection.query('UPDATE photos SET title = ? WHERE id = ?', [new_title, photo_id], function (error, results, fields) {
    if (error) throw error
    
    connection.query('SELECT * FROM `photos` WHERE `id` = ?', [photo_id], 
      function (error, results, fields) {
        res.send(results[0]);
    });

  })
}

exports.create = async (req, res)=>{
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
}