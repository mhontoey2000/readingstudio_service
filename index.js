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


app.get('/', (req, res) => res.send('Hello World'))
app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})
