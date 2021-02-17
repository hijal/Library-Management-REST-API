const ajv = require('ajv').default;
const betterAjvErrors = require('better-ajv-errors');
const async = require('async');


function validator(schema, req) {
    return new Promise((resolve, reject) => {
        try {
            const ajValidator = new ajv({ allErrors: true, async: true, jsonPointers: true, strictTypes: false });
            const validate = ajValidator.compile(schema);
            const result = validate(req.body);
            if (!result) {
                const output = betterAjvErrors(schema, req.body, validate.errors, { 'format': 'js' });
                // console.log(typeof output);
                // console.log(Array.isArray(output));
                // console.log(output);
                let errors = [];
                async.each(output, (element, callback) => {
                    errors.push(element.error);
                    callback()
                }, () => {
                    // console.log(errors);
                    reject({
                        status: 400,
                        code: "BAD REQUEST",
                        error: errors
                    })
                })
            }
            else {
                console.log("Successfully Validated");
                resolve();
            }
        }
        catch (err) {
            console.log("THIS IS THE ERROR : --->  " + err);
            reject({
                status: 500,
                code: "INTERNAL_SERVER_ERROR",
                error: "Something went wrong. Please try again."
            });
        }
    });
}

exports.login = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "email": {
                "type": "string"
            },
            "password": {
                "type": "string"
            }
        },
        "required": [
            "email",
            "password"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.userSignup = (req, res, next) => {
    const schema = {
        "type": "object",
        "properties": {
            "email": {
                "type": "string"
            },
            "name": {
                "type": "string"
            },
            "password": {
                "type": "string"
            },
            "role": {
                "type": "integer",
                "enum": [2]
            }
        },
        "required": [
            "email",
            "name",
            "password",
            "role"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.adminSignup = (req, res, next) => {
    const schema = {
        "type": "object",
        "properties": {
            "email": {
                "type": "string"
            },
            "name": {
                "type": "string"
            },
            "password": {
                "type": "string"
            },
            "role": {
                "type": "integer",
                "enum": [1]
            }
        },
        "required": [
            "email",
            "name",
            "password",
            "role"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.createAuthor = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "author_name": {
                "type": "string"
            }
        },
        "required": [
            "author_name"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.viewAuthor = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "author_id": {
                "type": "string"
            }
        },
        "required": []
    }
    req.body = req.query;
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.updateAuthor = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "author_name": {
                "type": "string"
            },
            "author_id": {
                "type": "integer"
            }
        },
        "required": [
            "author_name",
            "author_id"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.deleteAuthor = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "author_id": {
                "type": "integer"
            }
        },
        "required": [
            "author_id"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.createBook = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "book_name": {
                "type": "string"
            },
            "author_id": {
                "type": "integer"
            }
        },
        "required": [
            "book_name",
            "author_id"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.viewBooks = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "author_id": {
                "type": "string"
            }
        },
        "required": []
    }
    req.body = req.query;
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.updateBook = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "author_id": {
                "type": "integer"
            },
            "book_id": {
                "type": "integer"
            },
            "name": {
                "type": "string"
            }
        },
        "required": ["book_id", "name", "author_id"]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.deleteBook = (req, res, next) => {
    const schema = {

        "type": "object",
        "properties": {
            "book_id": {
                "type": "integer"
            }
        },
        "required": [
            "book_id"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.requestLoan = (req, res, next) => {
    const schema = {
        "type": "object",
        "properties": {
            "book_id": {
                "type": "integer"
            },
            "start_date": {
                "type": "string"
            },
            "end_date": {
                "type": "string"
            },
        },
        "required": [
            "book_id",
            "start_date",
            "end_date"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}

exports.updateBookLoanStatus = (req, res, next) => {
    const schema = {
        "type": "object",
        "properties": {
            "request_id": {
                "type": "integer"
            },
            "status": {
                "type": "integer",
                "enum": [1,2]

            }
        },
        "required": [
            "request_id",
            "status"
        ]
    }
    validator(schema, req).then(() => next()).catch((err) => {
        console.log(err);
        res.status(err.status).json(err);
    })
}



