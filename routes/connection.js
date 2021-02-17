const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

  const connection = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE_NAME
  });
function connect(){
    connection.getConnection((err,connection)=>{
        if(err){
            throw err;
        }
        else{
            return console.log("database connected");
        }
    })
}
let query = function (sql, values, callback){
    connection.getConnection((err,connection)=>{
        if(err){
            throw err;
        }
        else{
            connection.query(sql,values,(err,result)=>{
                console.log(sql);
                // console.log(value || null);
                if(err){        
                    connection.release();
                    callback(err,null);                    
                }
                else{        
                    connection.release();
                    callback(null,result);
                    
                }
            }) 
        }
    })  
}
exports.query = query;  

connect();

  



  