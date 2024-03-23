const express = require('express')
const app = express()
const PORT = process.env.PORT || 8080
const cors = require('cors')
const helper = require('./upload');
const sendMail = require('./sendmail');
const multer = require('multer');
const bodyParser = require('body-parser')
const mysql = require('mysql2');
const dotenv = require("dotenv")
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { json } = require('react-router-dom');
const router = require('express-promise-router')()
// const connection = mysql.createConnection({
//     host: process.env.DB_USERNAME,
//     user: process.env.DB_PASSWORD,
//     database: process.env.DB_HOST,
//     password: process.env.DB_DATABASE
// });
process.env.ACCESS_TOKEN_SECRET = 'doraemon';
dotenv.config()

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 60 * 24 * 30 });
  }
  function decodedToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          // Token is invalid or has expired
          resolve(false);
        } else {
          // Token is valid;
          resolve(true);
        }
      });
    });
  }
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
app.use(express.json({limit: '1000mb'}));
app.use(express.urlencoded({extended: true ,limit: '1000mb'}));
app.use(bodyParser.raw({ type: 'image/*', limit: '160MB' }));

app.get('/', (req, res) => res.send('Hello World'))
app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})
