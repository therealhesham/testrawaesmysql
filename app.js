// Import express module
const express = require('express');
const mysql = require(`mysql2`)
// Initialize an express application
const app = express();



const connection = mysql.createConnection({
    host: 'sg1-ts105.a2hosting.com',
    user: 'rawaes_newrawaes',
    database: 'rawaes_rawaes2',
    password:"newrawaes"
  });

  connection.query(
    'SELECT * FROM `orders` ',
    function(err, results, fields) {
      console.log(results); // results contains rows returned by server
      console.log(fields); // fields contains extra meta data about results, if available
    }
  );
// Define a simple route to handle GET requests to the home page
app.get('/', (req, res) => {

const com =    connection.query(
        'SELECT * FROM `orders` ',
        function(err, results, fields) {
            res.send(results);

         }
      );
    

});

// Define another route to handle a different endpoint
app.get('/about', (req, res) => {
  res.send('This is an About page');
});

// Set the server to listen on a specific port (e.g., 3000)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
