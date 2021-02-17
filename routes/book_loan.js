const connection = require('./connection');
const constants = require('../constants');
const moment = require('moment');
const async = require('async');
const excel = require('node-excel-export');


exports.requestLoan = async (req, res) => {
    let startDate = req.body.start_date;
    let endDate = req.body.end_date;
    if (req.headers['role'] != constants.userRole.USER) res.status(403).json({ "message": "Forbidden" });
    else if (moment(startDate).isValid() && moment(endDate).isValid() && moment(startDate).isSameOrAfter(moment()) && moment(endDate).isAfter(startDate)) {
        let userId = req.headers['user_id'];
        let bookId = req.body.book_id;
        try {
            await bookAvailability(userId, bookId);
            let request_sql = `INSERT INTO book_loans
            (book_id,
            user_id,
            status,
            start_date,
            end_date)
            VALUES
            (?,?,?,?,?);`
            connection.query(request_sql, [bookId, userId, constants.bookLoanStatus.REQUESTED, startDate, endDate], (err, update_result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                }
                else {
                    if (update_result.affectedRows == 1) {
                        res.status(200).json({ "message": "Book Request Successful" });
                    }
                    else {
                        console.log("No update or more than 1 update occured");
                        return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                    }
                }
            })
        }
        catch (err) {
            if (err) {
                return res.status(err.status).json(err.message);
            }
        }
    }
    else {
        return res.status(400).json({ "message": "Invalid or Incorrect Date." })
    }
}

function bookAvailability(userId, booKId) {
    return new Promise((resolve, reject) => {
        let availability_sql = `SELECT b.*, u.*, bl.* FROM book_loans bl INNER JOIN books b USING (book_id)
        INNER JOIN users u USING (user_id) WHERE u.user_id = ${userId} AND b.book_id = ${booKId} AND bl.status IN (${constants.bookLoanStatus.REQUESTED},${constants.bookLoanStatus.APPROVED});`
        connection.query(availability_sql, [], (err, availability_result) => {
            if (err) reject({
                "status": 500,
                "message": "INTERNAL SERVER ERROR"
            });
            else {
                let response = {}
                if (availability_result && availability_result.length > 0) {
                    response = {
                        "status": 409,
                        "message": "BOOK IS NOT AVAILABLE FOR LOAN"
                    }
                    reject(response);
                }
                else {
                    resolve()
                }
            }
        })
    });
}

exports.showAllBookLoan = (req, res) => {
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        let select_sql = `SELECT bl.request_id,
        u.username,
        b.name,
        DATE_FORMAT(bl.request_date,  '%d/%m/%y %T') as request_date,
        DATE_FORMAT(bl.start_date,  '%d/%m/%y %T') as start_date,
        DATE_FORMAT(bl.end_date,  '%d/%m/%y %T') as end_date,
        (CASE WHEN bl.status = ? THEN 'REQUESTED' WHEN bl.status = ? THEN 'APPROVED' WHEN bl.status = ? THEN 'DENIED' WHEN bl.status = ? THEN 'RETURNED' ELSE 'UNKNOWN' END) as status FROM book_loans bl JOIN books b USING (book_id) JOIN users u USING (user_id) ORDER BY request_id DESC;`
        let params = [constants.bookLoanStatus.REQUESTED, constants.bookLoanStatus.APPROVED, constants.bookLoanStatus.DENIED, constants.bookLoanStatus.RETURNED];
        connection.query(select_sql, params, (err, result_sql) => {
            if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
            else {
                if (result_sql && result_sql.length > 0) {
                    return res.status(200).json({ "data": result_sql });
                }
                else {
                    return res.status(404).json({ "message": "No Request Found" })
                }
            }
        });
    }
}

exports.updateBookLoanStatus = (req, res) => {
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        let status = req.body.status;
        let requestId = req.body.request_id;
        let update_sql = `UPDATE book_loans
        SET
        status = ${status}
        WHERE request_id = ${requestId};`
        connection.query(update_sql, [], (err, update_result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
            }
            else {
                if (update_result.affectedRows == 1) {
                    res.status(200).json({ "message": "Book Request Status Updated" });
                }
                else {
                    console.log("No update or more than 1 update occured");
                    return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                }
            }
        })
    }
}

exports.showUserBookLoan = (req, res) => {
    if (req.headers['role'] != constants.userRole.USER) res.status(403).json({ "message": "Forbidden" });
    else {
        let userId = req.headers['user_id'];
        let select_sql = `SELECT bl.request_id,
        a.author_name,
        b.name,
        DATE_FORMAT(bl.request_date,  '%d/%m/%y %T') as request_date,
        DATE_FORMAT(bl.start_date,  '%d/%m/%y %T') as start_date,
        DATE_FORMAT(bl.end_date,  '%d/%m/%y %T') as end_date,
        (CASE WHEN bl.status = ? THEN 'REQUESTED' WHEN bl.status = ? THEN 'APPROVED' WHEN bl.status = ? THEN 'DENIED' WHEN bl.status = ? THEN 'RETURNED' ELSE 'UNKNOWN' END) as status FROM book_loans bl JOIN books b USING (book_id) JOIN authors a USING (author_id) JOIN users u USING (user_id) WHERE bl.user_id = ? ORDER BY request_id DESC;`
        let params = [constants.bookLoanStatus.REQUESTED, constants.bookLoanStatus.APPROVED, constants.bookLoanStatus.DENIED, constants.bookLoanStatus.RETURNED, userId];
        connection.query(select_sql, params, (err, result_sql) => {
            if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
            else {
                if (result_sql && result_sql.length > 0) {
                    return res.status(200).json({ "data": result_sql });
                }
                else {
                    return res.status(404).json({ "message": "No Request found" });
                }
            }
        });
    }
}

exports.bookRequestExcelExport = async (req, res) => {
    if (req.headers['role'] != constants.userRole.ADMIN) res.status(403).json({ "message": "Forbidden" });
    else {
        const styles = {
            headerDark: {
                fill: {
                    fgColor: {
                        rgb: 'FF000000'
                    }
                },
                font: {
                    color: {
                        rgb: 'FFFFFFFF'
                    },
                    sz: 14,
                    bold: true,
                    underline: true
                }
            },
            cellPink: {
                fill: {
                    fgColor: {
                        rgb: 'FFFFCCFF'
                    }
                }
            },
            cellGreen: {
                fill: {
                    fgColor: {
                        rgb: 'FF00FF00'
                    }
                }
            }
        };
        const specification = {
            request_id: {
                displayName: 'Request Id',
                headerStyle: styles.headerDark,
                width: 100
            },
            username: {
                displayName: 'User Name',
                headerStyle: styles.headerDark,
                width: 150
            },
            name: {
                displayName: 'Book Name',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellPink,
                width: 150
            },
            request_date: {
                displayName: 'Request Date',
                headerStyle: styles.headerDark,
                width: 220
            },
            start_date: {
                displayName: 'Start Date',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellPink,
                width: 220
            },
            end_date: {
                displayName: 'End Date',
                headerStyle: styles.headerDark,
                width: 220
            },
            status: {
                displayName: 'Status',
                headerStyle: styles.headerDark,
                cellStyle: styles.cellPink,
                width: 100
            }
        }
        let dataset = [];
        try {
            const bookLoanRequestData = await requestQuery();
            async.eachSeries(bookLoanRequestData, (element, callback) => {
                let temp_data = {
                    request_id: element.request_id,
                    // user_id: element.user_id,
                    username: element.username,
                    // book_id: element.book_id,
                    name: element.name,
                    request_date: moment(element.request_date).format('MMMM Do YYYY, h:mm:ss a'),
                    start_date: moment(element.start_date).format('MMMM Do YYYY, h:mm:ss a'),
                    end_date: moment(element.end_date).format('MMMM Do YYYY, h:mm:ss a'),
                    status: element.status
                }
                dataset.push(temp_data);
                async.setImmediate(callback);
            }, (err) => {
                if (err) {
                    console.log(err);
                    throw new Error("Async Error")
                }
                else {
                    console.log(dataset);
                    const report = excel.buildExport(
                        [
                            {
                                specification: specification, 
                                data: dataset
                            }
                        ]
                    );
                    res.attachment('book_report.xlsx');
                    res.status(200).json(report);
                }
            })
        }
        catch (err) {
            console.log(err);
            if (err.status && err.message) return res.status(err.status).json(err.message);
            else return res.sendStatus(500);
        }
    }
};

function requestQuery() {
    return new Promise((resolve, reject) => {
        let select_sql = `SELECT bl.request_id,
        u.user_id,
        u.username,
        b.book_id,
        b.name,
        bl.request_date,
        bl.start_date,
        bl.end_date,
        (CASE WHEN bl.status = ? THEN 'REQUESTED' WHEN bl.status = ? THEN 'APPROVED' WHEN bl.status = ? THEN 'DENIED' WHEN bl.status = ? THEN 'RETURNED' ELSE 'UNKNOWN' END) as status FROM book_loans bl JOIN books b USING (book_id) JOIN users u USING (user_id) ORDER BY request_id DESC`;
        let params = [constants.bookLoanStatus.REQUESTED, constants.bookLoanStatus.APPROVED, constants.bookLoanStatus.DENIED, constants.bookLoanStatus.RETURNED];
        connection.query(select_sql, params, (err, result) => {
            if (err) {
                console.log(err);
                reject({
                    "status": 500,
                    "message": "INTERNAL SERVER ERROR"
                });
            }
            else if (result.length == 0) {
                reject({
                    "status": 404,
                    "message": "No Data Found"
                });
            }
            else {
                resolve(result);
            }
        })
    });
}