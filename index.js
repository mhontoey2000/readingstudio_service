const express = require('express')
const app = express()
const cors = require('cors')
const helper = require('./upload');
const sendMail = require('./sendmail');
const multer = require('multer');
const bodyParser = require('body-parser')
const mysql = require('mysql2');
const dotenv = require("dotenv")
dotenv.config() // ถ้าจะใช้ ตัวแปรในไฟล์ .env ต้องเอา dotenv.config() อยู่เหนือ process.env เพราะจะเรียกใช้ได้
const PORT = process.env.PORT || 5000
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { json } = require('react-router-dom');
const router = require('express-promise-router')()

// ส่วนอันนี้อันเก่า
// const connection = mysql.createConnection({
//     host: process.env.DB_USERNAME,
//     user: process.env.DB_PASSWORD,
//     database: process.env.DB_HOST,
//     password: process.env.DB_DATABASE
// });

// ส่วนนี้หมีแก้
const connection = mysql.createConnection({
  host:  process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  database:  process.env.DB_DATABASE ,
  password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (!!err) {
        console.log(err);
    } else {
        console.log('Connected...');
    }
  
  });

process.env.ACCESS_TOKEN_SECRET = 'doraemon';
// dotenv.config()
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

app.get('/', (req, res) => {
  // res.send('Hello World')
  connection.connect((err) => {
    if (!!err) {
      res.send(err)
        console.log(err);
    } else {
      res.send('Database Connected Success')
        console.log('Connected...');
    }
  
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`)
})


router.get('/tbl',async (req,res,next) => {
    try {
        connect.query('SELECT * FROM book',(err,rows) => {
            if (err){
                res.send(err)
            }
            else{
                res.send(rows)
            }
        }) 
    }
    catch (e) {
        res.send(e)
    }
})


//หน้า exams

app.get('/api/exam/:id', function (req, res) {
  console.log('article_id'+req.params.id);
  const article_id = req.params.id;
  connection.query(`SELECT * FROM exams WHERE exams.article_id = ?;`,[article_id], function(err, results) {
    if (err) {
      // จัดการข้อผิดพลาดที่เกิดขึ้น
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    console.log(results);
  });
  const query = `SELECT exams.*, questions.*, options.*
  FROM exams
  LEFT JOIN questions ON exams.exam_id = questions.exam_id
  LEFT JOIN options ON questions.question_id = options.question_id
  WHERE exams.article_id = ?;`;

connection.query(query,[article_id], function(err, results) {
  if (err) {
    // จัดการข้อผิดพลาดที่เกิดขึ้น
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
  // console.log(results);
  const groupedData = {};

  // ลูปผ่านข้อมูลที่คุณได้รับ
  results.forEach((item) => {
    const {
      exam_id,
      question_id,
      question_text,
      question_image,
      question_imagedata,
      qusetopn_options,
    } = item;
    let base64Image = null;
    if(!groupedData[question_id]){
      if(question_imagedata){
         base64Image = `data:image/jpeg;base64,${Buffer.from(question_imagedata).toString('base64')}`;
      }
    }
    // ถ้ายังไม่มีข้อมูลสำหรับคำถามนี้ใน groupedData
    if (!groupedData[question_id]) {
      groupedData[question_id] = {
        exam_id,
        question_id,
        question_text,
        question_image,
        question_imagedata: base64Image,
        question_options: [],
      };
    }

    // เพิ่มตัวเลือกของคำถามนี้เข้าไปใน question_options
    let option = {
      option_id: item.option_id,
      option_text: item.option_text,
      is_correct: item.is_correct,
    };
   
    groupedData[question_id].question_options.push(option);
  });
 
  // แปลง Object ใน groupedData เป็น Array
  const result = Object.values(groupedData);
  // console.log(result.question_options[0]);
  console.log(result);
  res.json(result);
  result.forEach(r =>{
    console.log(r);
  })
  });
});

//close หน้า exam 




//แก้เพิ่มย้ายบรรทัด ให้เรียก เก็บรูปในดาต้า
// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../frontend/public/picture'); 
  },
  filename: (req, file, cb) => {
    const fileName =  'temp'+Date.now() + path.extname(file.originalname); 
    cb(null, fileName);
  },
});

const upload = multer({ storage:storage });

//หน้าหนังสือ
app.get('/api/book', function (req, res) {
 
  connection.query(
      'SELECT * FROM book',
      function(err, results) {
        const bookdata = results.map((book) => {
          const img = helper.convertBlobToBase64(book.book_imagedata);
          return {
            ...book,
            book_imagedata: img,
          };
        });
        // console.log(results);
        console.log(bookdata);
        res.json(bookdata);
        // res.json(results);
      }
    );
});

// New endpoint to increment book_view
app.post('/api/book/view/:bookId', (req, res) => {
  const bookId = req.params.bookId;

  connection.query(
    'UPDATE book SET book_view = book_view + 1 WHERE book_id = ?',
    [bookId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// New endpoint to increment article_view
app.post('/api/articles/view/:articleId', (req, res) => {
  const articleId = req.params.articleId;

  connection.query(
    'UPDATE article SET article_view = article_view + 1 WHERE article_id = ?',
    [articleId],
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.get('/api/book/:bookId', function (req, res) {
  const bookid = req.params.bookId;
  connection.query(
      'SELECT * FROM book WHERE book_id = ?',[bookid],
      function(err, results) {
        const bookdata = results.map((book) => {
          const img = helper.convertBlobToBase64(book.book_imagedata);
          return {
            ...book,
            book_imagedata: img,
          };
        });
        // console.log(results);
        console.log(bookdata);
        res.json(bookdata);
        // res.json(results);
      }
    );
});

app.delete('/api/deletebook/:bookId', function (req, res) {
  const bookid = req.params.bookId;
  console.log('removed book : '+ bookid);

  connection.query(
      'DELETE FROM book WHERE book_id = ?',[bookid],
      function(err, results) {
        if (err) {
          console.error('Error removed book:', err);
          res.status(500).json({ error: 'Error removed book' });
      } else {
          console.log('removed book successfully');
          res.status(200).json({ message: 'removed book successfully' });
      }
      }
    );
});

app.post('/api/updatebook', upload.single('book_image'), async (req, res) => {
  const { book_id, book_name, book_detail } = req.body;
  console.log("Received image file:", req.file);
  let updateValues = [];
  let updateQuery = "UPDATE book SET book_name=?, book_detail=?, status_book='published' ";

  updateValues.push(book_name, book_detail);

  if (req.file) {
    const imageFile = req.file;
    const imageByte = await helper.readFileAsync(imageFile.path);
    const img = helper.generateUniqueFileName('picture');
    const imagepath = img.pathimage;

    await helper.writeFileAsync(img.fileName, imageByte);

    updateQuery += ", book_image=?, book_imagedata=?";
    updateValues.push(imagepath, imageByte);
  }

  updateQuery += " WHERE book_id=?";
  updateValues.push(book_id);

  connection.query(updateQuery, updateValues, (err, result) => {
      if (err) {
          console.error('Error update book:', err);
          res.status(500).json({ error: 'Error update book' });
      } else {
          console.log('Book update successfully');
          res.status(200).json({ message: 'Book update successfully' });
      }
  });
});

app.post('/api/updateLeveltext', (req, res) => {
  const { articleId, newLevel } = req.body;

  connection.beginTransaction(function (err) {
    if (err) {
      console.error('Error beginning transaction:', err);
      res.status(500).json({ error: 'Failed to begin transaction' });
      return;
    }

    connection.query(
      `UPDATE article SET article_level = ?, status_article = ? WHERE article_id = ?`,
      [newLevel, "published", articleId],
      function (err, results) {
        if (err) {
          connection.rollback(function () {
            console.error('Error updating article level and status_article:', err);
            res.status(500).json({ error: 'Failed to update article level and status_article' });
          });
        } else {
          console.log('Article level and status_article updated successfully');

          connection.query(
            'UPDATE book SET status_book = ? WHERE book_id = (SELECT book_id FROM article WHERE article_id = ?)',
            [ "published", articleId],
            function (err, results) {
              if (err) {
                connection.rollback(function () {
                  console.error('Error updating status_book in book table:', err);
                  res.status(500).json({ error: 'Failed to update status_book in book table' });
                });
              } else {
                console.log('status_book updated successfully');

                connection.commit(function (err) {
                  if (err) {
                    connection.rollback(function () {
                      console.error('Error committing transaction:', err);
                      res.status(500).json({ error: 'Failed to commit transaction' });
                    });
                  } else {
                    res.json({ message: 'Article level, status_book, and status_article updated successfully' });
                  }
                });
              }
            }
          );
        }
      }
    );
  });
});


  app.post('/api/addbook',upload.single('book_image'),async (req, res) => {
    const { book_name, book_detail, book_creator } = req.body;
    const fs = require('fs');
    const imageFile = req.file ? req.file : null;
    let imagepath = null;
    let imageByte = null;   

    if(imageFile)
    {
      imageByte = await helper.readFileAsync(imageFile.path);
      console.log(imageFile,imageFile.path ,imageByte);
      let img = helper.generateUniqueFileName('picture');
      imagepath = img.pathimage;
      await helper.writeFileAsync(img.fileName ,imageByte);
      fs.unlinkSync(imageFile.path);
    }
    connection.query("SELECT book_id FROM book ORDER BY book_id DESC LIMIT 1", (err, results) => {
      if (err) {
          console.error('Error fetching last book_id:', err);
          res.status(500).json({ error: 'Error fetching last book_id' });
          return;
      }
  
      let lastNumber = 0;
      if (results.length > 0) {
          const lastBookId = results[0].book_id;
          lastNumber = parseInt(lastBookId.replace('book', ''), 10); 
      }
  
      const newNumber = lastNumber + 1;
      const book_id = `book${String(newNumber).padStart(3, '0')}`;

      connection.query("INSERT INTO book (book_id, book_name, book_detail, book_image, book_imagedata, book_creator, status_book) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      [book_id, book_name, book_detail,imagepath,imageByte,book_creator,"creating"], 
      (err, result) => {
          if (err) {
              console.error('Error adding book:', err);
              res.status(500).json({ error: 'Error adding book' });
          } else {
              console.log('Book added successfully');
              res.status(200).json({ message: 'Book added successfully' });
          }
      });
    });
  });


  app.get('/api/article', function (req, res) {
 
    connection.query(
        'SELECT * FROM article',
        function(err, results) {
          const articledata = results.map((article) => {
            const img = helper.convertBlobToBase64(article.article_imagedata);
            return {
              ...article,
              article_imagedata: img,
            };
          });
          // console.log(articledata);
          res.json(articledata);
          // res.json(results);
        }
      );
  });
  app.post('/api/getarticle', function (req, res) {
    const article_id = req.body.articleid;

    console.log(article_id);
 
    connection.query(
      `SELECT * FROM article WHERE article_id = ?;`,
      [article_id],
        function(err, results) {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to retrieve article' });
            return;
          }

          if (results.length === 0) {
            res.status(404).json({ error: 'Article not found' });
            return;
          }

          const article = results[0];
          const img = helper.convertBlobToBase64(article.article_imagedata);
          const articledata = {
            ...article,
            article_imagedata: img,
          };
          res.json(articledata);
        }
      );
  });

  app.get('/api/typebook/:id', function (req, res) {
    const article_id = req.parems.id;
  
    connection.query(
      `SELECT aricle_level FROM article WHERE article_id = ?;`,
      [article_id],
      function (err, results) {
        if (err) {
          console.error(err);
          res.status(500).send('Error retrieving article data');
        } else {
          
          const article_level = results[0].article_level;
          res.json(article_level);
        }
      }
    );
  });
  
  app.delete('/api/deletearticle/:articleId', function (req, res) {
    const articleId = req.params.articleId;
    console.log('removed article : '+ articleId);
  
    connection.query(
        'DELETE FROM article WHERE article_id = ?',[articleId],
        function(err, results) {
          if (err) {s
            console.error('Error removed article:', err);
            res.status(500).json({ error: 'Error removed article' });
        } else {
            console.log('removed article successfully');
            res.status(200).json({ message: 'removed article successfully' });
        }
        }
      );
  });
  app.get('/api/article/:id', function (req, res) {
    const book_id = req.params.id;
  
    connection.query(
      `SELECT * FROM article WHERE book_id = ?;`,
      [book_id],
      function(err, results) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
  
        const articlesWithImages = results.map((article) => {
          const img = helper.convertBlobToBase64(article.article_imagedata);
          return {
            ...article,
            article_imagedata: img,
          };
        });
        console.log(articlesWithImages);
        res.json(articlesWithImages);
      }
    );
  });

  app.get('/api/getarticleban/:id', function (req, res) {
     const book_id = req.params.id;
  
    connection.query(
      `SELECT * FROM article WHERE book_id = ?;`,
      [book_id],
      function(err, results) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
  
        const articlesWithImages = results.map((article) => {
          const img = helper.convertBlobToBase64(article.article_imagedata);
          return {
            ...article,
            article_imagedata: img,
          };
        });
        console.log(articlesWithImages);
        res.json(articlesWithImages);
      }
    );
  });
  
  app.get('/api/articledetail/:id', function (req, res) {
    const userId = req.query.user_id; 
    const article_id = req.params.id;

    connection.query(
      `SELECT * FROM article WHERE article_id = ?;`,
      [article_id],
      function(err, results) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        const articlesWithImages = results.map((article) => {
          const img = helper.convertBlobToBase64(article.article_imagedata);
          return {
            ...article,
            article_imagedata: img,
          };
        });
        res.json(articlesWithImages);
      }
    );
  });

app.post('/api/articledetail/:id/record-history', (req, res) => {
  const userId = req.body.user_id;
  const article_id = req.params.id;
  const book_id = req.body.book_id;

  if (!userId || !article_id || !book_id) {
    console.error("Invalid user ID, article ID, or book ID");
    res.status(400).json({ error: 'Invalid user ID, article ID, or book ID' });
    return;
  }
  connection.query(
    `SELECT * FROM history WHERE user_id = ? AND article_id = ? AND book_id = ?;`,
    [userId, article_id, book_id],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      // Check if a history record already exists
      // if (results.length > 0) {
      //   // History record already exists, do not insert a new one
      //   res.json({ success: true, message: 'History record already exists' });
      // } else {
        // Insert a new history record
        connection.query(
          `INSERT INTO history (user_id, article_id, book_id, watched_at) VALUES (?, ?, ?, NOW());`,
          [userId, article_id, book_id],
          function (err) {
            if (err) {
              console.error(err);
              res.status(500).json({ error: 'Error recording reading history' });
            } else {
              res.json({ success: true });
            }
          }
        );
      //}
    }
  );
});

 app.get('/api/exam', function (req, res) {
   connection.query(
       `SELECT * FROM exam`,
       function(err, results) {
         console.log(res.json(results));
       }
     );
 });

 


 app.get('/api/user', function (req, res) {
  connection.query(
      `SELECT * FROM user ORDER BY user_id DESC`,
      function(err, results) {
        const user =  results.map((item)=>{
            const img = helper.convertBlobToBase64(item.user_idcard);
            return{
              ...item,
              user_idcard: img,
            };
        });
        console.log(res.json(user));
      }
    );
});
app.post('/api/updateuser/:id',async function (req, res) {
  const userId = req.params.id;
  const { status, email } = req.body;

  
  console.log(status);
  console.log(email);
  if(status === 'rejected'||status ==='approved')
  {
  await sendMail(email,'การลงทะเบียนเข้าใช้งานเป็นผู้สร้างสำหรับ Reading Studio',status ==='approved' ?
  'บัญชีของคุณได้รับการอนุมัติให้เข้าใช้งานเป็นผู้สร้างแล้ว สามารถเข้าสู่ระบบเพื่อใช้งาน' : 'บัญชีของคุณไม่ได้รับการอนุมัติให้เข้าใช้งานเป็นผู้สร้าง กรุณาลงทะเบียนใหม่อีกครั้ง');
  }
  connection.query(
    'UPDATE user SET approval_status = ? WHERE user_id = ?',
    [status, userId],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update user' });
      } else {
        res.json({ message: 'User updated successfully' });
      }
    }
  );
});

// Maintain a set to keep track of users for whom emails have been sent
const notifiedUsers = new Set();

const checkInactiveUsersAndSendEmails = async () => {
  console.log('Checking for inactive users...');
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const query = 'SELECT user_id, user_email FROM user WHERE last_login <= ?';
  connection.query(query, [ninetyDaysAgo], async (error, results) => {
    if (error) {
      console.error('Error querying database:', error);
      setTimeout(checkInactiveUsersAndSendEmails, 24 * 60 * 60 * 1000);
      return;
    }
    console.log('Found inactive users:', results.length);
    for (const row of results) {
      const userId = row.user_id;
      const email = row.user_email;
      
      // Check if the user has already been notified
      if (notifiedUsers.has(userId)) {
        console.log(`User ${userId} already notified. Skipping...`);
        continue;
      }
      
      const subject = 'แจ้งเตือนการเข้าใช้งาน Reading Studio';
      const content = 'เนื่องบัญชีของคุณไม่ได้ทำการเข้าใช้งานเป็นเวลามากกว่า 90 วัน ระบบจะทำการลบบัญชีของท่าน หากประสงค์ที่จะใช้งานระบบต่อกรุณาล็อกอินเข้าระบบเพื่อใช้งาน';
      
      // Send the email
      await sendMail(email, subject, content);
      
      // Add the user to the set of notified users
      notifiedUsers.add(userId);
    }
    
    setTimeout(checkInactiveUsersAndSendEmails, 24 * 60 * 60 * 1000);
  });
};

//checkInactiveUsersAndSendEmails();//the starter of checkInactiveUsersAndSendEmails

const intervalId = setInterval(() => {
  console.log('Scheduling the function to run again...');
  checkInactiveUsersAndSendEmails();
}, 24 * 60 * 60 * 1000);

console.log('Interval ID:', intervalId);


// deleting a user by user_id
app.delete('/api/user/:id', function (req, res) {
  const userId = req.params.id;

  connection.query(
    'DELETE FROM user WHERE user_id = ?',
    [userId],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete user' });
      } else {
        res.json({ message: 'User deleted successfully' });
      }
    }
  );
});


app.get('/api/book/search', async (req, res) => {
  const query = req.query.query;

  try {

    const [rows] = await connection.execute(`SELECT * FROM book WHERE CONVERT(book_detail USING utf8) COLLATE utf8_general_ci LIKE '%${query}%'`);
    console.log(rows)
    
    res.send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  connection.query(
    `SELECT * FROM user WHERE user_email = '${email}'`,
    async (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error" });
      } else if (results.length === 0) {
        res.status(401).send({ message: "อีเมล์หรือรหัสผ่านผิด กรุณาตรวจสอบ" });
      } else {
        if(results.length > 0){
          const user = results[0];
          const passwordMatch = await bcrypt.compare(password, user.user_password);

          if (passwordMatch) {
            if(true)
            {
              const accessToken = generateAccessToken({ user_id: user.user_id });
              res.status(200).send({ accessToken: accessToken, email: req.body.email,user_id: user.user_id });
            }else {
              res.status(401).send({ message: "อีเมลยังไม่ได้รับการอนุมัติ" });
            }
          } else {
            res.status(401).send({ message: "อีเมล์หรือรหัสผ่านผิด กรุณาตรวจสอบ" });
          }
        }

      }
    }
  );
});

app.post('/api/register',upload.single('idcard'),async (req, res) => {
  const { name, surname, email, password, usertype } = req.body;
  const saltRounds = 10;
  const imageFile = req.file ? req.file : null;
  let imagepath = null;
  let imageByte = null;
  let approval = 'pending'; 
  if(usertype === 'learner')
    approval = 'approved'
  if(imageFile)
  {
    imageByte = await helper.readFileAsync(imageFile.path);
    console.log(imageFile,imageFile.path ,imageByte);
    let img = helper.generateUniqueFileName('picture');
    imagepath = img.pathimage;
    await helper.writeFileAsync(img.fileName ,imageByte);
    fs.unlinkSync(imageFile.path);
  }
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error hashing password');
      return; 
    }
    connection.query(
        "SELECT COUNT(*) AS count FROM user WHERE user_email = ?",
        [email],
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error checking email');
                return; 
            }

            if (result[0].count > 0) {
                
                res.status(400).send('This email is already in use');
            } else {
                connection.query(
                    "INSERT INTO user (user_name, user_surname, user_email, user_password, user_type, user_idcard , approval_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [name, surname, email, hashedPassword, usertype,imageByte,approval],
                    (err, result) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send('Error inserting user data');
                        } else {
                            res.send('User data inserted successfully');
                        }
                    }
                );
            }
        }
    );
});
});


app.get('/api/token_check', async (req, res) => {
  const accessToken = req.headers.authorization;

  if (!accessToken) {
    res.status(401).send("Unauthorized");
    return;
  }
  try {
    const isValidToken = await decodedToken(accessToken);

    if (isValidToken) {
      res.status(200).send("OK");
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




app.get('/api/userdata', (req, res) => {
  const email = req.query.user_email;
  connection.query("SELECT * FROM user WHERE user_email = ?", [email], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving user data');
    } else {
      res.send(result);
    }
  });
});

app.get('/api/watchedhistory', (req, res) => {
  const user_id = req.query.user_id;

  connection.query(
    `SELECT a.article_id, a.article_name, b.book_name, h.watched_at, a.article_imagedata
    FROM history h
    JOIN article a ON h.article_id = a.article_id
    JOIN book b ON h.book_id = b.book_id
    WHERE h.user_id = ?
    ORDER BY h.watched_at DESC`,
    [user_id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error retrieving reading history' });
      } else {
        const articlesWithImages = result.map((article) => {
          // Convert blob to base64
          const img = helper.convertBlobToBase64(article.article_imagedata);
          return {
            ...article,
            article_imagedata: img,
          };
        });
        res.json(articlesWithImages);
      }
    }
  );
});
app.get('/api/examhistory', (req, res) => {
  const user_id = req.query.user_id;
  console.log(user_id);
 
  connection.query(
    `SELECT a.article_id, a.article_name, b.book_name, h.submittedAnswers, h.watched_at, a.article_imagedata
    FROM examhistory h
    JOIN article a ON h.article_id = a.article_id
    JOIN book b ON h.book_id = b.book_id
    WHERE h.user_id = ?
    ORDER BY h.watched_at DESC`,
    [user_id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Error retrieving reading examhistory' });
      } else {
       console.log(result);
        const articlesWithImages = result.map((article) => {
          // Convert blob to base64
          const img = helper.convertBlobToBase64(article.article_imagedata);
          return {
            ...article,
            article_imagedata: img,
          };
        });

        res.json(articlesWithImages);
      }
    }
  );
});


app.put('/api/userdata', (req, res) => {
  const name = req.body.user_name;
  const surname = req.body.user_surname;
  const email = req.body.user_email;
  connection.query("UPDATE user SET user_name = ?, user_surname = ? WHERE user_email = ?", [name, surname, email], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error updating user data');
    } else {
      console.log(result);
      res.send('User data updated successfully');
    }
  });
});

app.get('/api/allbookcreator', function (req, res) {
  const email = req.query.user_email;

  connection.query(
    `SELECT * FROM book WHERE book.book_creator = ?`,
    [email],
      function(err, results) {
        const bookdata = results.map((book) => {
          const img = helper.convertBlobToBase64(book.book_imagedata);
          return {
            ...book,
            book_imagedata: img,
          };
        });
        // console.log(results);
        console.log(bookdata);
        res.json(bookdata);
        // res.json(results);
      }
    );
  
});

app.get('/api/allbookadmin', function (req, res) {
  const email = req.query.user_email;

  connection.query(
    `SELECT * FROM book`,
    [email],
      function(err, results) {
        const bookdata = results.map((book) => {
          const img = helper.convertBlobToBase64(book.book_imagedata);
          return {
            ...book,
            book_imagedata: img,
          };
        });
        // console.log(results);
        console.log(bookdata);
        res.json(bookdata);
        // res.json(results);
      }
    );
  
});

app.get('/api/allbookarticlecreator', function (req, res) {
  const email = req.query.user_email;

  connection.query(
    `SELECT book.book_id, book.book_name, book.book_detail, book.book_image,book.book_imagedata, book.book_creator, book.status_book,
            GROUP_CONCAT(article.article_name) AS article_name
    FROM book
    LEFT JOIN article ON book.book_id = article.book_id
    WHERE book.book_creator = ? 
    GROUP BY book.book_id, book.book_name, book.book_detail, book.book_image,book.book_imagedata, book.book_creator, book.status_book`,
    [email],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      const uniqueBooks = {}; // Store unique books by book_id
  
      results.forEach((row) => {
        const book_id = row.book_id;
        // If the book is not in the uniqueBooks object, add it
        const img = helper.convertBlobToBase64(row.book_imagedata);
        if (!uniqueBooks[book_id]) {
          uniqueBooks[book_id] = {
            book_id: book_id,
            book_name: row.book_name,
            book_detail: row.book_detail,
            book_image: row.book_image,
            book_imagedata: img,
            book_creator: row.book_creator,
            status_book: row.status_book,
            article_name: [],
          };
        }
        // Add the article_name to the book's article_name array
        if (row.article_name) {
          uniqueBooks[book_id].article_name.push(row.article_name);
        }
      });
  
      const bookdata = Object.values(uniqueBooks);
      console.log(bookdata)
      res.json(bookdata);
    }
  );
  
});

app.delete('/api/deleteallbookcreator/:bookId', function (req, res) {
  const bookId = req.params.bookId;

  connection.query(
      'DELETE FROM book WHERE book_id = ?',
      [bookId],
      function (err, results) {
          if (err) {
              console.error(err);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
          }

          res.json({ message: 'Book deleted successfully' });
      }
  );
});

app.get('/api/forapprove', function (req, res) {

  connection.query(
    `SELECT b.book_id, b.book_name, b.status_book, b.book_creator, b.book_view,
      GROUP_CONCAT(a.article_name) AS article_names,
      b.book_imagedata
      FROM book b
      JOIN article a ON b.book_id = a.book_id
      WHERE b.status_book IN ('published', 'deny')
      GROUP BY b.book_id, b.book_name, b.status_book, b.book_imagedata, b.book_view;`,
    function(err, results) {
      const bookdata = results.map((book) => {
        const img = helper.convertBlobToBase64(book.book_imagedata);
        return {
          ...book,
          book_imagedata: img,
        };
      });
      // console.log(results);
      console.log(bookdata);
      res.json(bookdata);
    }
  );
  
  
});

app.get('/api/notification', function (req, res) {
  const email = req.query.user_email;

  connection.query(
    `SELECT f.request_id, b.book_name, a.article_id, a.article_name, a.article_imagedata, f.status, f.request_comment, f.created_at
    FROM book b
    INNER JOIN article a ON b.book_id = a.book_id
    INNER JOIN forrequest f ON b.book_id = f.book_id AND a.article_id = f.article_id
    WHERE b.book_creator = ?
    ORDER BY f.created_at DESC`,[email],
    function(err, results) {
      if (!results || results.length === 0) {
        // handle the case where there are no results
        res.json([]);
        return;
      }
      const articledata = results.map((article) => {
        const img = helper.convertBlobToBase64(article.article_imagedata);
        return {
          ...article,
          article_imagedata: img,
        };
      });
      // console.log(articledata);
      res.json(articledata);
      // res.json(results);
    }
  );
  
});

app.post('/api/updateStatusBook/:bookId', (req, res) => {
  const bookId = req.params.bookId;
  const { status_book } = req.body;

  connection.query(
    'UPDATE book SET status_book = ? WHERE book_id = ?',
    [status_book, bookId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(200).json({ message: 'Book status updated successfully' });
    }
  );
});

app.post("/api/updateStatus", (req, res) => {
  const { bookId, bookCreator, newStatus, unpublishReason } = req.body;
  console.log("bookId : " + bookId);
  console.log("newStatus : " + newStatus);
  console.log("unpublishReason : " + unpublishReason);


  const bookQuery = "UPDATE book SET status_book = ? WHERE book_id = ?";
connection.query(bookQuery, [newStatus, bookId], (bookErr) => {
  if (bookErr) {
    console.error("Error updating book status: " + bookErr);
    res.status(500).json({ error: "Failed to update book status" });
    return;
  }
  console.log("bookId : " + bookId);
  console.log("newStatus : " + newStatus);

  // Check if newStatus is "published" or "deny" and there's an unpublishReason
  if (newStatus === "published" || newStatus === "deny") {
    // Check if there are matching rows in the article table
    const checkArticleQuery = "SELECT article_id FROM article WHERE book_id = ?";
    connection.query(checkArticleQuery, [bookId], (checkArticleErr, results) => {
      if (checkArticleErr) {
        console.error("Error checking for matching articles: " + checkArticleErr);
        res.status(500).json({ error: "Failed to check for matching articles" });
        return;
      }

      if (results.length > 0) {
        // If matching articles found, insert into forrequest
        const forRequestQuery = "INSERT INTO forrequest (book_id, article_id, request_comment, status) VALUES (?, ?, ?, ?)";
        connection.query(forRequestQuery, [bookId, results[0].article_id, unpublishReason, newStatus], (forRequestErr) => {
          if (forRequestErr) {
            console.error("Error creating forrequest record: " + forRequestErr);
            res.status(500).json({ error: "Failed to create forrequest record" });
            return;
          }

          res.json({ message: "Status updated successfully" });
        });
      } else {
        // Handle the case where there are no matching articles
        // You can choose to insert a default value or take other actions
        res.json({ message: "No matching articles found" });
      }
    });
  } else {
    // If no unpublishReason or other newStatus, just update the book status
    res.json({ message: "Status updated successfully" });
  }
});
});

app.get('/api/allbookarticleadmin', function (req, res) {

  connection.query(
    `SELECT book.book_id, book.book_name, book.book_detail, book.book_image,book.book_imagedata, book.book_creator, book.status_book,
            GROUP_CONCAT(article.article_name) AS article_name
    FROM book
    LEFT JOIN article ON book.book_id = article.book_id
    GROUP BY book.book_id, book.book_name, book.book_detail, book.book_image,book.book_imagedata, book.book_creator, book.status_book`,
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      const uniqueBooks = {}; // Store unique books by book_id
  
      results.forEach((row) => {
        const book_id = row.book_id;
        const img = helper.convertBlobToBase64(row.book_imagedata);
        if (!uniqueBooks[book_id]) {
          uniqueBooks[book_id] = {
            book_id: book_id,
            book_name: row.book_name,
            book_detail: row.book_detail,
            book_image: row.book_image,
            book_imagedata: img,
            book_creator: row.book_creator,
            status_book: row.status_book,
            article_name: [],
          };
        }
        // Add the article_name to the book's article_name array
        if (row.article_name) {
          uniqueBooks[book_id].article_name.push(row.article_name);
        }
      });
  
      const bookdata = Object.values(uniqueBooks);
      console.log(bookdata)
      res.json(bookdata);
    }
  );
  
});

app.get('/api/allexamcreator', function (req, res) {
  const email = req.query.user_email;

  connection.query(
    `SELECT b.book_id, b.book_name, a.article_name, a.article_images,
    GROUP_CONCAT(DISTINCT e.exam_id)
        FROM book b
        LEFT JOIN article a ON a.book_id = b.book_id
      LEFT JOIN exams e ON e.book_id = b.book_id AND e.article_id = a.article_id
        LEFT JOIN questions q ON q.exam_id = e.exam_id
      WHERE b.book_creator = ? AND e.exam_id IS NOT NULL
      GROUP BY a.article_id
        HAVING COUNT(DISTINCT a.article_id) = 1;`,
    [email],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      const uniqueArticle = {}; // Store unique books by book_id
      let exam_count = 1;
      results.forEach((row) => {
        const article_name = row.article_name;
        // If the book is not in the uniqueBooks object, add it
        if (!uniqueArticle[article_name]) {
          exam_count++;
          uniqueArticle[article_name] = {
            book_id: row.book_id,
            book_name: row.book_name,
            book_creator: row.book_creator,
            exam_count: exam_count,
            article_name: article_name,
            article_imagedata: row.article_images
          };
        }
        // Add the article_name to the book's article_name array
        if (row.article_name) {
          exam_count = 1;
        }
      });
  
      const examdata = Object.values(uniqueArticle);
      console.log(examdata)
      res.json(examdata);
    }
  );
  
});

app.get('/api/allexamadmin', function (req, res) {

  connection.query(
    `SELECT b.book_id, b.book_name, a.article_name, a.article_images,
    GROUP_CONCAT(DISTINCT e.exam_id)
        FROM book b
        LEFT JOIN article a ON a.book_id = b.book_id
      LEFT JOIN exams e ON e.book_id = b.book_id AND e.article_id = a.article_id
        LEFT JOIN questions q ON q.exam_id = e.exam_id
      WHERE e.exam_id IS NOT NULL
      GROUP BY a.article_id
        HAVING COUNT(DISTINCT a.article_id) = 1;`,
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      const uniqueArticle = {}; // Store unique books by book_id
      let exam_count = 1;
      results.forEach((row) => {
        const article_name = row.article_name;
        // If the book is not in the uniqueBooks object, add it
        if (!uniqueArticle[article_name]) {
          exam_count++;
          uniqueArticle[article_name] = {
            book_id: row.book_id,
            book_name: row.book_name,
            exam_count: exam_count,
            article_name: article_name,
            article_imagedata: row.article_images
          };
        }
        // Add the article_name to the book's article_name array
        if (row.article_name) {
          exam_count = 1;
        }
      });
  
      const examdata = Object.values(uniqueArticle);
      console.log(examdata)
      res.json(examdata);
    }
  );
  
});

// app.post('/api/report', (req, res) => {
//   const { bookid, articleid, remail, rdetail } = req.body;

//   const insertReportQuery = `
//     INSERT INTO reports (book_id, article_id, reporter, report_detail,	report_status)
//     VALUES (?, ?, ?, ?,?)
//   `;

//   connection.query(insertReportQuery, [bookid, articleid, remail, rdetail,	'pending'], (err, result) => {
//     if (err) {
//       console.error(err);
//       res.status(500).json({ error: 'Error inserting report data' });
//     } else {
//       const reportId = result.insertId;
      
//       res.json({ message: 'Report data inserted successfully', report_id: reportId });
//     }
//   });
// });

app.post('/api/report', (req, res) => {
  const { bookid, articleid, remail, rdetail } = req.body;

  // Check if the reporter has already reported for this article
  const checkReportQuery = `
    SELECT * FROM reports
    WHERE article_id = ? AND reporter = ? AND report_status = 'pending'
  `;

  connection.query(checkReportQuery, [articleid, remail], (checkErr, checkResult) => {
    if (checkErr) {
      console.error(checkErr);
      res.status(500).json({ error: 'Error checking existing report' });
    } else {
      // If the reporter has already reported for this article, send a response
      if (checkResult.length > 0) {
        res.status(400).json({ error: 'Reporter has already reported for this article' });
      } else {
        // If not, proceed to insert the new report
        const insertReportQuery = `
          INSERT INTO reports (book_id, article_id, reporter, report_detail, report_status)
          VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(insertReportQuery, [bookid, articleid, remail, rdetail, 'pending'], (insertErr, result) => {
          if (insertErr) {
            console.error(insertErr);
            res.status(500).json({ error: 'Error inserting report data' });
          } else {
            const reportId = result.insertId;
            res.json({ message: 'Report data inserted successfully', report_id: reportId });
          }
        });
      }
    }
  });
});


app.post('/api/updatereport', (req, res) => {
  const report_id = req.body.report_id;
  const report_status = req.body.report_status;

  console.log(report_id);
  console.log(report_status);
  console.log(report_id);
  console.log(report_status);
  console.log(report_id);
  console.log(report_status);
  console.log(report_id);
  console.log(report_status);
  console.log(report_id);
  console.log(report_status);
  console.log(report_id);
  console.log(report_status);
  let updateQuery = `UPDATE reports SET report_status=? WHERE report_id=?`;

  connection.query(updateQuery, [report_status, report_id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updated report data' });
    } else {
      const reportId = result.insertId;
      res.json({ message: 'Report data updated successfully', report_id: reportId });
    }
  });
});

app.post('/api/del_report/:id', (req, res) => {
  const report_id = req.params.id;
  connection.query(
    `DELETE FROM reports WHERE report_id = ?;`,
    [report_id],
    function(err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      } else {
        res.status(200).json({ message: 'Report deleted successfully' });
      }
    }
  );
});

app.post('/api/vocabs', async (req, res) => {
  const { articleid, Vname, Vdetail } = req.body;

  const insertReportQuery = `
    INSERT INTO vocabs (article_id, vocabs_name, vocabs_detail)
    VALUES (?, ?, ?)
  `;

  connection.query(insertReportQuery, [articleid, Vname, Vdetail], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error inserting vocabs data' });
    } else {
      const vocabsId = result.insertId;
      
      res.json({ message: 'Report data inserted successfully', vocabs_id: vocabsId });
    }
  });
});

app.get('/api/vocabs/:id', function (req, res) {
  const article_id = req.params.id;
 
   connection.query(
       `SELECT * FROM vocabs WHERE article_id = ?;`,
       [article_id],
       function(err, results) {
         res.json(results);
       }
     );
 });

 // deleting vocabs
app.delete('/api/vocabs/:id', function (req, res) {
  const vocabId = req.params.id;

  connection.query(
    'DELETE FROM vocabs WHERE vocabs_id = ?',
    [vocabId],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete vocab' });
      } else {
        res.json({ message: 'Vocab deleted successfully' });
      }
    }
  );
});
app.delete('/api/report/:id', function (req, res) {
  const reportId = req.params.id;

  connection.query(
    'DELETE FROM reports WHERE report_id = ?',
    [reportId],
    function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete reports' });
      } else {
        res.json({ message: 'report deleted successfully' });
      }
    }
  );
});

app.get('/api/report', function (req, res) {
  connection.query(`SELECT * FROM reports`, function (err, results) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Failed to Find Report' });
    } else {
      const reportdata = results.map((report) => {
        return new Promise((resolve, reject) => {
          const entry = {
            ...report,
            report_articlename: "ไม่มีข้อมูล",
            book_id: "ไม่มีข้อมูล",
          };

          connection.query(`SELECT * FROM article WHERE article_id = ?;`, [report.article_id], (err, article) => {
            if (!err) {
              entry.report_articlename = article[0] ? article[0].article_name : "ไม่มีข้อมูล";
            }
            connection.query(`SELECT * FROM book WHERE book_id = ?;`, [report.book_id], (err, book) => {
              if (!err) {
                entry.book_id = book[0] ? book[0].book_name : "ไม่มีข้อมูล";
                entry.bookid =report.book_id;
              }
              resolve(entry);
            });
          });
        });
      });

      Promise.all(reportdata).then((completedData) => {
        res.json(completedData);
      });
    }
  });
});

// app.get('/api/reportnotification', function (req, res) {
//   connection.query(`SELECT * FROM reports`, function (err, results) {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ message: 'Failed to Find Report' });
//     } else {
//       const reportdata = results.map((report) => {
//         return new Promise((resolve, reject) => {
//           const entry = {
//             ...report,
//             report_articlename: "ไม่มีข้อมูล",
//             book_id: "ไม่มีข้อมูล",
//             reporter: "ไม่มีข้อมูล",
//           };

//           connection.query(`SELECT * FROM article WHERE article_id = ?;`, [report.article_id], (err, article) => {
//             if (!err) {
//               entry.report_articlename = article[0] ? article[0].article_name : "ไม่มีข้อมูล";
//             }
//             connection.query(`SELECT * FROM book WHERE book_id = ?;`, [report.book_id], (err, book) => {
//               if (!err) {
//                 entry.book_id = book[0] ? book[0].book_name : "ไม่มีข้อมูล";
//                 entry.bookid = report.book_id;
//                 entry.reporter = report.reporter;  // เพิ่ม line นี้
//               }
//               resolve(entry);
//             });
//           });
//         });
//       });

//       Promise.all(reportdata).then((completedData) => {
//         const bookIdReporters = completedData.reduce((acc, report) => {
//           if (!acc[report.bookid]) {
//             acc[report.bookid] = new Set();
//           }
//           acc[report.bookid].add(report.reporter);
//           return acc;
//         }, {});
      
//         const validBookIds = Object.keys(bookIdReporters).filter(bookid => bookIdReporters[bookid].size >= 3);
      
//         const filteredData = completedData.filter((report) => {
//           return validBookIds.includes(report.bookid) && bookIdReporters[report.bookid].has(report.reporter);
//         });
      
//         res.json(filteredData);
//       });
//     }
//   });
// });

app.get('/api/reportnotification', function (req, res) {
  connection.query(`SELECT * FROM reports`, function (err, results) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Failed to Find Report' });
    } else {
      const reportdata = results.map((report) => {
        return new Promise((resolve, reject) => {
          const entry = {
            ...report,
            report_articlename: "ไม่มีข้อมูล",
            book_id: "ไม่มีข้อมูล",
            reporter: "ไม่มีข้อมูล",
          };

          connection.query(`SELECT * FROM article WHERE article_id = ?;`, [report.article_id], (err, article) => {
            if (!err) {
              entry.report_articlename = article[0] ? article[0].article_name : "ไม่มีข้อมูล";
            }
            connection.query(`SELECT * FROM book WHERE book_id = ?;`, [report.book_id], (err, book) => {
              if (!err) {
                entry.book_id = book[0] ? book[0].book_name : "ไม่มีข้อมูล";
                entry.bookid = report.book_id;
                entry.reporter = report.reporter;
              }
              resolve(entry);
            });
          });
        });
      });

      Promise.all(reportdata).then((completedData) => {
        res.json(completedData);
      });
    }
  });
});


app.get('/api/notificationCount', function (req, res) {
  connection.query(`SELECT COUNT(*) as count FROM reports WHERE report_status = 'pending'`, function (err, results) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Failed to fetch notification count' });
    } else {
      res.json({ count: results[0].count });
    }
  });
});

app.get('/api/userCount', function (req, res) {
  connection.query(`SELECT COUNT(*) as count FROM user WHERE approval_status = 'pending'`, function (err, results) {
    if (err) {
      console.log(err);
      res.status(500).json({ message: 'Failed to fetch notification count' });
    } else {
      res.json({ count: results[0].count });
    }
  });
});



const fs = require('fs');
const path = require('path');
const { error } = require('console');

app.post('/api/add-data',upload.single('questionsImage'),async (req, res) => {
  const { exam_id, book_id, article_id, total_questions, questionstext } = req.body;
  const options = JSON.parse(req.body.questionsoptions);questionstext
  const correctOption = req.body.questionscorrectOption;
  const imageFile = req.file ? req.file : null; 
  let imagepath = null;
  let imageByte = null;
  if(imageFile)
  {
    imageByte = await helper.readFileAsync(imageFile.path);
    console.log(imageFile,imageFile.path ,imageByte);
    let img = helper.generateUniqueFileName('picture');
    imagepath = img.pathimage;
    await helper.writeFileAsync(img.fileName ,imageByte);
  }
  if(exam_id !== '-1')
  {
    const insertQuestionQuery = `INSERT INTO questions (exam_id, question_text,question_image,question_imagedata) VALUES (?, ?, ?, ?)`;
    connection.query( insertQuestionQuery, [exam_id, questionstext,imagepath,imageByte], (err, questionResult) => {
      if (err) {
        console.error('Error inserting question data: ' + err.message);
        res.status(500).send('Error creating exam INSERT Question');
      } 
      else {
        const questionId = questionResult.insertId;
        const insertOptionQuery = `INSERT INTO options (question_id, option_text,is_correct) VALUES (?, ? , ?)`;
        options.forEach((option, index) => {
          let correct = 0;
          if( correctOption.toString() === index.toString())
            correct = 1;
          connection.query(insertOptionQuery, [questionId, option,correct]);
            });
          }
        }
      );
      res.status(200).send(`${exam_id}`);
      
    }
  else{
    const insertExamQuery = `INSERT INTO exams (book_id, article_id, total_questions) VALUES (?, ?, ?)`;
    connection.query(insertExamQuery, [book_id, article_id, total_questions], (err, result) => {
      if (err) {
        console.error('Error inserting exam data: ' + err.message);
        res.status(500).send('Error creating exam Insert Id');
      }
      else {
        const examId = result.insertId;
        const insertQuestionQuery = `INSERT INTO questions (exam_id, question_text,question_image,question_imagedata) VALUES (?, ?, ?, ?)`;
          connection.query( insertQuestionQuery, [examId, questionstext,imagepath,imageByte], (err, questionResult) => {
            if (err) {
              console.error('Error inserting question data: ' + err.message);
              res.status(500).send('Error creating exam INSERT Question');
            } 
            else {
              const questionId = questionResult.insertId;
              const insertOptionQuery = `INSERT INTO options (question_id, option_text,is_correct) VALUES (?, ? , ?)`;
              options.forEach((option, index) => {
                let correct = 0;
                if( correctOption.toString() === index.toString())
                  correct = 1;
                connection.query(insertOptionQuery, [questionId, option,correct]);
              });
            }
          }
        );
        res.status(200).send(`${examId}`);
    }
    });
  }
});

app.post('/api/editexam',upload.single('questionsImage'),async (req, res) => {

  const question_id = req.body.question_id;
  const book_id = req.body.book_id;
  const article_id = req.body.article_id;
  const total_questions = req.body.total_questions;
  const questionstext = req.body.questionstext;
  const options = JSON.parse(req.body.questionsoptions);questionstext
  const correctOption = req.body.questionscorrectOption;
  const imageFile = req.file ? req.file : null; // ไฟล์รูปภาพ
  console.log("question_id : "+question_id);
  console.log("book_id : "+book_id);
  console.log("article_id : "+article_id);
  console.log("total_questions : "+total_questions);
  console.log("questionstext : "+questionstext);
  console.log("options : "+options);
  console.log("correctOption : "+correctOption);
  console.log("questionsImage : "+ imageFile);
  let imagepath = null;
  let imageByte = null;
  if(imageFile)
  {
    imageByte = await helper.readFileAsync(imageFile.path);
    console.log(imageFile,imageFile.path ,imageByte);
    let img = helper.generateUniqueFileName('picture');
    imagepath = img.pathimage;
    await helper.writeFileAsync(img.fileName ,imageByte);
    console.log(imageByte);
  }

  const updateQuestionQuery = `UPDATE questions SET question_text = ?, question_image = ?, question_imagedata = ? WHERE question_id = ?`;
  const dataupdateQuestionQuery = [questionstext, imagepath, imageByte, question_id];
  const updateOtherDataQuery = `UPDATE questions SET question_text = ? WHERE question_id = ?`;
  const dataupdateOtherDataQuery =  [questionstext,  question_id];
  
  const query =  imageFile ? updateQuestionQuery : updateOtherDataQuery;
  const dataquery =  imageFile ? dataupdateQuestionQuery : dataupdateOtherDataQuery;

  connection.query(query,dataquery, (err, questionResult) => {
    if (err) {
      console.error('Error updating question data: ' + err.message);
      res.status(500).send('Error updating question data');
    } else {
      // ลบตัวเลือกที่มีข้อมูลเดิม
      const deleteOptionsQuery = `DELETE FROM options WHERE question_id = ?`;
      connection.query(deleteOptionsQuery, [question_id], (err, deleteResult) => {
        if (err) {
          console.error('Error deleting old options: ' + err.message);
          res.status(500).send('Error updating options data');
        } else {
          const insertOptionQuery = `INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)`;
          options.forEach((option, index) => {
            let correct = 0;
            if (correctOption.toString() === index.toString()) correct = 1;
            connection.query(insertOptionQuery, [question_id, option, correct]);
          });
          // ทำอะไรกับข้อมูลอื่น ๆ ของคำถาม
          res.status(200).send('Data updated successfully');
        }
      });
    }
  });
});
app.delete('/api/deleteeditexam/:id', function (req, res) {
  const questionId = req.params.id;

  // แบ่ง query ของ exam_id และ count ให้อยู่ในลำดับที่ถูกต้อง
  connection.query(`SELECT * FROM questions WHERE question_id = ?`, [questionId], function(err, results) {
    if (err) {
      console.error('Error querying database:', err);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลในเซิร์ฟเวอร์' });
      return;
    }

    const examid = results[0].exam_id;

    connection.query(`SELECT * FROM questions WHERE exam_id = ?`, [examid], function(err, results) {
      if (err) {
        console.error('Error querying database:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลในเซิร์ฟเวอร์' });
        return;
      }

      const count = results.length;

      // ลบคำถาม
      connection.query('DELETE FROM questions WHERE question_id = ?', [questionId], function (err, results) {
        if (err) {
          console.error(err);
          res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลในเซิร์ฟเวอร์' });
          return;
        }

        if (count === 1) {
          // ถ้า count เท่ากับ 1, แสดงว่าไม่มีคำถามที่เหลือในการสอบ
          connection.query(`DELETE FROM exams WHERE exam_id = ?`, [examid], function(err, results) {
            if (err) {
              console.error(err);
              res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลในเซิร์ฟเวอร์' });
            } else {
              res.status(200).json({ message: 'ลบข้อมูลในเซิร์ฟเวอร์เรียบร้อย' });
            }
          });
        } else {
          res.status(200).json({ message: 'ลบข้อมูลในเซิร์ฟเวอร์เรียบร้อย' });
        }
      });
    });
  });
});


app.post('/api/addarticle', upload.fields([{ name: 'image', maxCount: 1 },  { name: 'sound', maxCount: 1 }]),async (req, res) => {
  const book_id = req.body.book_id;
  const chapter = req.body.chapter;
  const level = req.body.level;
  const description = req.body.description;
  const imageFile = req.files['image'] ?  req.files['image'][0] : null; 
  const soundFile = req.files['sound'] ?  req.files['sound'][0] : null; 
  let imagepath = null;
  let soundpath = null;
  let imageByte = null;
  let soundByte = null;
  
  if(imageFile)
  {
    imageByte = await helper.readFileAsync(imageFile.path);
    console.log(imageFile,imageFile.path ,imageByte);
    let img = helper.generateUniqueFileName('picture');
    imagepath = img.pathimage;
    await helper.writeFileAsync(img.fileName ,imageByte);
    fs.unlinkSync(imageFile.path);
  }
  if(soundFile)
  {
    soundByte = await helper.readFileAsync(soundFile.path);
    console.log(soundFile,soundFile.path, soundByte);
    let sod = helper.generateUniqueFileName('sound');
    soundpath = sod.pathimage;
    await helper.writeFileAsync(sod.fileName,soundByte);
    fs.unlinkSync(soundFile.path);
  }
  connection.query("SELECT article_id FROM article ORDER BY article_id DESC LIMIT 1", (err, results) => {
    if (err) {
        console.error('Error fetching last article_id:', err);
        res.status(500).json({ error: 'Error fetching last article_id' });
        return;
    }
    let lastNumber = 0;
    if (results.length > 0) {
        const lastBookId = results[0].article_id;
        if(lastBookId.toString().startsWith('XOL'))
          lastNumber = parseInt(lastBookId.replace('XOL', ''), 10); 
    }
    const newNumber = lastNumber + 1;
    const newarticleid = `XOL${String(newNumber).padStart(3, '0')}`;

    const insertOptionQuery = `INSERT INTO article 
    (article_id ,book_id, article_name ,article_level ,article_detail  ,article_images ,article_sounds,article_imagedata ,article_sounddata) VALUES (?,?,?,?,?,?,?,?,?)`;
    connection.query(insertOptionQuery, [newarticleid,book_id, chapter,level, description , imagepath , soundpath,imageByte,soundByte], (err, results) => {
      if (err) {
        console.error('Error inserting exam data: ' + err.message);
        res.status(500).send('Error creating exam Insert Id');
      }else{
        connection.query("UPDATE book SET status_book = ? WHERE book_id = ?", ["published", book_id], (err, updateResult) => {
          if (err) {
            console.error('Error updating status_book:', err);
            res.status(500).json({ error: 'Error updating status_book' });
          } else {
            res.status(200).send('Article added and status_book updated');
          }
        });
      }
    });
  });
  
});

app.post('/api/updatearticle', upload.fields([{ name: 'image', maxCount: 1 },  { name: 'sound', maxCount: 1 }]),async (req, res) => {
  const articleId = req.body.articleId;
  const chapter = req.body.chapter;
  const level = req.body.level;
  const description = req.body.description;
  const imageFile = req.files['image'] ?  req.files['image'][0] : null; // ข้อมูลรูปภาพในรูปแบบ Buffer
  const soundFile = req.files['sound'] ?  req.files['sound'][0] : null; // ข้อมูลเสียงในรูปแบบ Buffer

  console.log(articleId,chapter, level, description, imageFile, soundFile);
  
  let imagepath = null;
  let soundpath = null;

  let imageByte = null;
  let soundByte = null;
  connection.query("SELECT * FROM article WHERE article_id = ?", [articleId], async (err, results) => {
    if (err) {
        console.error('Error fetching article data:', err);
        res.status(500).json({ error: 'Error fetching article data' });
        return;
    }
    console.log('find article id ' + articleId);

    if (results.length > 0) {
        let updateValues = [chapter, description];
        let updateQuery = `UPDATE article SET article_name=?,article_detail=?`;

        if (imageFile) {
            imageByte = await helper.readFileAsync(imageFile.path);
            const img = helper.generateUniqueFileName('picture');
            imagepath = img.pathimage;
            await helper.writeFileAsync(img.fileName, imageByte);
            fs.unlinkSync(imageFile.path);

            updateQuery += ",article_images=? ,article_imagedata=?";
            updateValues.push(imagepath,imageByte);
        }

        if (soundFile) {
            soundByte = await helper.readFileAsync(soundFile.path);
            const sod = helper.generateUniqueFileName('sound');
            soundpath = sod.pathimage;
            await helper.writeFileAsync(sod.fileName, soundByte);
            fs.unlinkSync(soundFile.path);

            updateQuery += ",article_sounds=?,article_sounddata=?";
            updateValues.push(soundpath,soundByte);
        }
        updateQuery += " WHERE article_id=?"
        updateValues.push(articleId);

        connection.query(updateQuery, updateValues, async (err, updateResult) => {
            if (err) {
                console.error('Error updating article data:', err);
                res.status(500).json({ error: 'Error updating article data' });
                return;
            }

            res.status(200).send('Article updated successfully');
        });
    } else {
        res.status(404).json({ error: 'Article not found' });
    }
});

  
});

app.post('/api/updatebookstatus', (req, res) => {
  const bookId = req.body.bookId;
  console.log(bookId)

  const updateBookQuery = `
    UPDATE book
    SET status_book = 'published'
    WHERE book_id = ?
  `;

  connection.query(updateBookQuery, [bookId], (err, result) => {
    if (err) {
      console.error('Error updating book status:', err);
      res.status(500).json({ error: 'Error updating book status' });
    } else {
      console.log("ถููกอัพไป",bookId)
      res.status(200).send('Book status updated to "published" successfully');
    }
  });
});

// app.post('/api/examhistory', (req, res) => {
//   const {  option_id, question_id, user_id, watchedexam_at} = req.body;
//   console.log(option_id);
//   console.log(question_id);
//   console.log(user_id);
//   console.log(watchedexam_at);

//   connection.query("INSERT INTO examhistory (option_id, question_id, user_id, watchedexam_at) VALUES (?, ?, ?, ?)", 
//    [option_id, question_id, user_id, watchedexam_at],
//   (err, result) => {
//     if (err) {
//         console.error('Error adding book:', err);
//         res.status(500).json({ error: 'Error adding book' });
//     } else {
//         console.log('Book added successfully');
//         res.status(200).json({ message: 'Book added successfully' });
//     }
//     });
//   });

app.post('/api/examhistory', upload.none(), (req, res) => {
  // ดึงข้อมูลจาก FormData
  const submittedAnswers = req.body.submittedAnswers;
  const articleid = req.body.articleid;
  const bookid = req.body.bookid;
  const userId = req.body.userId;

  console.log('Submitted Answers:', submittedAnswers);
  console.log('Article ID:', articleid);
  console.log('User ID:', userId);
  console.log('bookid ID:', bookid);
  connection.query("INSERT INTO examhistory (submittedAnswers, article_id, user_id, book_id) VALUES (?, ?, ?, ?)", 
    [submittedAnswers, articleid, userId, bookid],
    (err, result) => {
      if (err) {
        console.error('Error adding book:', err);
        res.status(500).json({ error: 'Error adding book' });
      } else {
        console.log('Book added successfully');
        res.status(200).json({ message: 'Book added successfully' });
      }
    });
});

