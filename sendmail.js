const nodemailer = require('nodemailer');

async function sendEmail(recipient, subject, content) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'readingstudio101@gmail.com',
      pass: 'hmml dbjx ghln btuo'
    }
  });

  const mailOptions = {
    from: 'readingstudio101@gmail.com',
    to: recipient,
    subject: subject,
    text: content
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = sendEmail;
