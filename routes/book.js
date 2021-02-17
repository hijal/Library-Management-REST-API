const connection = require('./connection');
const constants = require('../constants');
const author = require('./author');

exports.createBook = (req, res) => {
    let bookName = req.body.book_name;
    let authorId = req.body.author_id;
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        authorCheck(authorId).then(() => {
            let insert_sql = `INSERT INTO books
            (name, author_id)
            VALUES
            ("${bookName}" , ${authorId});`
            connection.query(insert_sql, [], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                }
                else {
                    return res.status(201).json({ "message": "Book Created Successfully" });
                }
            })
        }).catch((err) => {
            if (err.status = 400) {
                res.status(400).json(err.message);
            }
            else {
                res.sendStatus(500);
            }

        })
    }
}

exports.viewBooks = (req, res) => {
    let authorId = req.query.author_id;
    let whereSql = `;`;
    if (authorId) {
        whereSql = `WHERE author_id = ${authorId};`;
    }
    let select_sql = `SELECT * FROM books ${whereSql}`;
    connection.query(select_sql, [], (err, result) => {
        if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
        else {
            if (result.length == 0) {
                return res.status(404).json({ "message": "No Books(s) Found" });
            }
            else {
                return res.status(200).json({ "result": result });
            }
        }
    })
}

exports.updateBook = (req, res) => {
    let bookName = req.body.name;
    let bookId = req.body.book_id;
    let authorId = req.body.author_id;
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        authorCheck(authorId).then(() => {
            let update_sql = `UPDATE books SET
            name = "${bookName}" , author_id =  ${authorId} 
            WHERE book_id = ${bookId};`
            connection.query(update_sql, [], (err, result) => {
                if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                else {
                    if (result.affectedRows == 0) {
                        return res.status(400).json({ "message": "Bad Request" });
                    }
                    else {
                        return res.status(200).json({ "message": "Book Updated Successfully" });
                    }
                }
            })
        }).catch((err) => {
            if (err.status = 400) {
                res.status(400).json(err.message);
            }
            else {
                res.sendStatus(500);
            }
        })
    }
}

exports.deleteBook = async (req, res) => {
    let bookId = req.body.book_id;
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        bookLoanCheck(bookId).then(() => {
            console.log("Promise All called");
            let delete_sql = `DELETE FROM books WHERE book_id = ${bookId};`
            connection.query(delete_sql, [], (err, delete_result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                }
                else {
                    if (delete_result.affectedRows == 1) {
                        return res.status(200).json({ "message": "Book Deleted Successfully" });
                    }
                    else {
                        return res.status(201).json({ "message": "Book Updated Successfully" });
                    }
                }
            })
        }).catch((err) => {
            if (err) {
                if (err.status && err.message) {
                    return res.status(err.status).json(err.message);
                }
                else {
                    return res.sendStatus(500);
                }
            }
        })
    }
}

function bookLoanCheck(book_id) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM book_loans WHERE book_id = ${book_id} AND status IN (${constants.bookLoanStatus.REQUESTED}, ${constants.bookLoanStatus.APPROVED});`
        connection.query(sql, [], (err, result) => {
            if (err) reject(err);
            else {
                if (result && result.length > 0) {
                    reject({ "status": 409, "message": "Book is on loan or has active loan request" });
                }
                else {
                    resolve();
                }
            }
        })
    });
}

function authorCheck(authorId) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM authors WHERE author_id = ${authorId};`
        connection.query(sql, [], (err, result) => {
            if (err) reject(err);
            else {
                if (result && result.length > 0) {
                    resolve();
                }
                else {
                    reject({ "status": 409, "message": "Author does not exist" });
                }
            }
        })
    });
}