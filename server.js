require('dotenv').config()
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const multer = require('multer')
const validation = require('./routes/validation')
const auth = require('./routes/auth')
const author = require('./routes/author')
const book = require('./routes/book')
const bookLoan = require('./routes/book_loan')


const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images');
  },
  filename: (req, file, cb) => {
    console.log(file);
    var filetype = '';
    if(file.mimetype === 'image/gif') {
      filetype = 'gif';
    }
    if(file.mimetype === 'image/png') {
      filetype = 'png';
    }
    if(file.mimetype === 'image/jpeg') {
      filetype = 'jpg';
    }
    cb(null, 'image-' + Date.now() + '.' + filetype);
  }
});

const upload = multer({storage: storage});

app.use(express.json({limit: '50mb'}))

app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var time = new Date();
  time.setMilliseconds(time.getMilliseconds()+ 5.5*60*60*1000);
  console.log('**** API HIT ****');
  console.log('Time:', time.toString());
  console.log(req.body);
  next();
});

app.post('/refresh_token', auth.refreshToken); //Renews AccessToken //Testing Done

//Signup and Login APi
app.post('/login', validation.login ,auth.login); //Login //Testing Done
app.post('/user_signup', validation.userSignup, auth.userSignup); //User SignUp //Testing Done
app.post('/admin_signup', validation.adminSignup, auth.adminSignup); //Admin SignUp //Testing Done
app.post('/upload_image', auth.authenticateToken, upload.single('file'),   auth.userImageUpload);//  Upload User Profile Image //Testiing Done



//Author API
app.post('/create_author', auth.authenticateToken, validation.createAuthor ,author.createAuthor); //Create Author //Testing Done
app.get('/view_author', auth.authenticateToken, validation.viewAuthor ,author.viewAuthor);  //View Author //Testing Done
app.post('/update_author', auth.authenticateToken, validation.updateAuthor ,author.updateAuthor); //Update Author //Testing Done
app.post('/delete_author', auth.authenticateToken, validation.deleteAuthor ,author.deleteAuthor); //Delete Author //Testing Done

//Book API
app.post('/create_book', auth.authenticateToken, validation.createBook ,book.createBook);
app.get('/view_book', auth.authenticateToken, validation.viewBooks ,book.viewBooks);
app.post('/update_book', auth.authenticateToken, validation.updateBook ,book.updateBook);
app.post('/delete_book', auth.authenticateToken, validation.deleteBook ,book.deleteBook);

//Book Loan API
app.post('/request_book_loan', auth.authenticateToken, validation.requestLoan ,bookLoan.requestLoan);
app.get('/show_all_book_loan', auth.authenticateToken , bookLoan.showAllBookLoan);
app.post('/update_book_loan_status', auth.authenticateToken, validation.updateBookLoanStatus ,bookLoan.updateBookLoanStatus);
app.get('/user_book_loan_status', auth.authenticateToken , bookLoan.showUserBookLoan);
app.get('/book_request_export', auth.authenticateToken , bookLoan.bookRequestExcelExport);


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
