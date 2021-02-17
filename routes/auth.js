require('dotenv').config()
const connection = require('./connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const constants = require('../constants');



exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]    //Exatracting Token
    if (token == null) return res.status(400).json({ "message": "BAD REQUEST" })

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => { //Authenticating Token
        if (err) {
            console.log(err);
            return res.status(403).json({ "message": "Unauthorized" });
        }
        req.headers['role'] = user.role;    //Saving in request headers
        req.headers['user_id'] = user.user_id;  //Saving in request headers
        next()
    })
}

exports.login = (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let role = req.headers['role'];
    let sql = `SELECT * FROM users WHERE email = ?`     //Duplicate Email Check
    connection.query(sql, [email], async (err, user_result) => {
        if (err) {
            return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
        }
        else {
            if (user_result && user_result.length === 1) {      //User Found
                let user = {
                    "user_id": user_result[0].user_id,
                    "role": user_result[0].role
                }
                try {
                    console.log(user.role, role);
                    if ((await bcrypt.compare(password, user_result[0].password)) && user.role == role) {
                        const accessToken = generateAccessToken(user)
                        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)   //Updating RefreshToken
                        await updateRefreshToken(refreshToken, user.user_id);   //Updating RefreshToken to DB
                        res.status(200).json({ "accessToken": accessToken, "refreshToken": refreshToken })
                    } else {
                        return res.status(200).json({ "message": 'Incorrect Password' })
                    }
                } catch (err) {     //Catching Errors
                    console.log(err);
                    return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                }
            }
            else {
                return res.status(404).json({ "message": 'Your email is not registered. Please register' })     //User not Found
            }
        }
    })
}

function generateAccessToken(user) {        //Function to generate AccessToken
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
}

function updateRefreshToken(token, user_id) {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE users
        SET
        refresh_token = ?
        WHERE user_id = ?;`;
        connection.query(sql, [token, user_id], (err, update_results) => {
            if (err) {
                console.log("Database error");
                resolve();
            }
            else resolve();
        })
    });
}

exports.logout = (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
}

exports.refreshToken = (req, res) => {
    const refreshToken = req.body.token
    if (refreshToken == null) return res.status(401).json({ "message": "Unauthorized" });
    let sql = `SELECT * FROM users WHERE refresh_token = ?;`;
    connection.query(sql, [refreshToken], (err, user_result) => {
        if (err) return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
        else {
            if (user_result && user_result.length === 1) {
                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                    if (err) return res.res.status(403).json({ "message": "Unauthorized" });
                    const accessToken = generateAccessToken({ name: user.name })
                    res.json({ "accessToken": accessToken })
                })
            }
            else {
                return res.status(404).json({ "message": "Not Found" });

            }
        }
    });
}

const signup = (req, res) => {
    try {
        let sql = `SELECT * FROM users WHERE email = ?;`
        connection.query(sql, [req.body.email], async (err, result) => {
            if (err) {
                return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
            }
            else {
                if (result && result.length > 0) {
                    return res.status(400).json({ "message": "User Already exists" });
                }
                else {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10)
                    // const user = { name: req.body.name, password: hashedPassword }
                    // users.push(user)
                    let sql = `INSERT INTO users
                    (username,
                    email,
                    password,
                    role)
                    VALUES
                    (?,?,?,?);`
                    let params = [req.body.name, req.body.email, hashedPassword, req.body.role];
                    connection.query(sql, params, (err, update_results) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
                        }
                        else {
                            console.log(update_results);
                            return res.status(201).json({ "message": "User Created. Please Login" })
                        }
                    })
                }
            }
        })
    } catch {
        return res.status(500).json({ "message": "INTERNAL SERVER ERROR" });
    }
}

exports.userSignup = (req, res) => {
    req.body.role = constants.userRole.USER;
    signup(req, res);
}

exports.adminSignup = (req, res) => {
    req.body.role = constants.userRole.ADMIN;
    signup(req, res);
}

exports.userImageUpload = (req, res) => {
    if (req.headers['role'] != constants.userRole.USER) res.status(403).json({ "message": "Forbidden" });
    if (!req.file) res.status(400).json({ message: "Image file is required" });
    else {
        console.dir(req.headers);
        let fileUrl = 'http://localhsot:3000/images/' + req.file.filename;
        let user_id = req.headers['user_id'];
        let update_sql = "UPDATE users set profile_image_url = ? WHERE user_id = ?";
        connection.query(update_sql, [fileUrl, user_id], (err, result) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            else {
                return res.status(200).json({ message: "Profile Image Successfuly Added" });
            }
        })
    }
};



