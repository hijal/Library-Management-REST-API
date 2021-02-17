function define(obj, name, value) {
    Object.defineProperty(obj, name, {
        value: value,
        enumerable: true,
        writable: false,
        configurable: true
    });
}

exports.userRole = {};
define(exports.userRole, "ADMIN", 1);
define(exports.userRole, "USER", 2);

exports.bookLoanStatus = {};
define(exports.bookLoanStatus, "REQUESTED", 0);
define(exports.bookLoanStatus, "APPROVED", 1);
define(exports.bookLoanStatus, "DENIED", 2);
define(exports.bookLoanStatus, "RETURNED", 3);