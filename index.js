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
const connection = mysql.createConnection({
    host: process.env.DB_USERNAME,
    user: process.env.DB_PASSWORD,
    database: process.env.DB_HOST,
    password: process.env.DB_DATABASE
});


app.get('/', (req, res) => res.send('Hello World'))
app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})
