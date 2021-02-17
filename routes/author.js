const connection = require('./connection');
const constants = require('../constants');

exports.createAuthor = (req, res) => {
    let authorName = req.body.author_name;
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        let insert_sql = `INSERT INTO authors
        (author_name)
        VALUES
        (?);`
        connection.query(insert_sql, [authorName], (err, result) => {
            if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
            else {
                return res.status(201).json({ "message": "Author Created Successfully" });
            }
        })
    }
}

exports.viewAuthor = (req, res) => {
    let authorId = req.query.author_id;
    let whereSql = `;`;
    if (authorId) {
        whereSql = `WHERE author_id = ${authorId};`;
    }
    let select_sql = `SELECT * FROM authors ${whereSql}`;
    connection.query(select_sql, [], (err, result) => {
        if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
        else {
            if (result.length == 0) {
                return res.status(404).json({ "message": "No Author(s) Found" });
            }
            else {
                return res.status(200).json({ "result": result });
            }
        }
    })
}

exports.updateAuthor = (req, res) => {
    let authorName = req.body.author_name;
    let authorId = req.body.author_id;
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        let update_sql = `UPDATE authors SET
        author_name = ?
        WHERE author_id = ?`
        connection.query(update_sql, [authorName, authorId], (err, result) => {
            if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
            else {
                if (result.affectedRows == 0) {
                    return res.status(400).json({ "message": "Bad Request" });
                }
                else {
                    return res.status(201).json({ "message": "Author Updated Successfully" });
                }
            }
        })
    }
}

exports.deleteAuthor = async (req, res) => {
    let authorId = req.body.author_id;
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        Promise.all([authorBookCheck(authorId), authorBookLoanCheck(authorId)]).then(() => {
            console.log("Promise All called");
            let delete_sql = `DELETE FROM author WHERE author_id = ${authorId};`
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
        });
    }
}

function authorBookCheck(author_id) {
    return new Promise((resolve, reject) => {
        let select_sql = `SELECT COUNT(*) as count FROM books WHERE author_id = ?`;
        connection.query(select_sql, [author_id], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                if (result[0].count == 1) {
                    resolve();
                }
                else if (result[0].count == 0) {
                    console.log("No Author Found");
                    reject({ "status": 400,"message": "BAD REQUEST" })
                }
                else {
                    console.log("Author Has Other Active Books");
                    reject({ "status": 409,"message": "Author Has Other Active Books" })
                }
            }
        })

    });
}

function authorBookLoanCheck(authorId) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM book_loans WHERE book_id IN (SELECT GROUP_CONCAT(book_id) FROM books WHERE author_id = ${authorId}) AND status IN (${constants.bookLoanStatus.REQUESTED}, ${constants.bookLoanStatus.APPROVED});`
        connection.query(sql, [], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);}
            else {
                if (result && result.length > 0) {
                    reject({ "status": 409, "message": "Author's book is on loan or has active loan request" });
                }
                else {
                    resolve();
                }
            }
        })
    });
}
