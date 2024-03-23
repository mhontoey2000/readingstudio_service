const express = require('express')
const app = express()
const PORT = process.env.PORT || 8080
const cors = require('cors')
const helper = require('./upload');
// const nodemailer = require('nodemailer');
// const sendMail = require('./sendmail');

app.get('/', (req, res) => res.send('Hello World'))
app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})
