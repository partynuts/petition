const spicedPg = require("spiced-pg");
const bcrypt = require('bcryptjs');
let db;

if (process.env.DATABASE_URL) {
  db = spicedPg(process.env.DATABASE_URL);
} else {
  db = spicedPg("postgres://postgres:postgres@localhost:5432/petition");
}



function hashPassword(pw) {
  console.log('hashing pw');
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
              console.log('trouble in here');
                return reject(err);
            }
            bcrypt.hash(pw, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
}

exports.hashPassword = hashPassword;


function setRegistration(first, last, email, pw) {
  return db
  .query(`INSERT INTO users (first, last, email, pw)
  VALUES ($1, $2, $3, $4)
  RETURNING id`, [first, last, email, pw])
}

exports.setRegistration = setRegistration;


function setLogin(mail) {

  return db
  .query(`SELECT users.first, users.last, email, pw, users.id, signature
    FROM users
    LEFT JOIN signatures
    ON signatures.user_id = users.id
    WHERE email = $1`, [mail]);

}

exports.setLogin = setLogin;


function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
            if (err) {
                reject(err);
            } else {
                resolve(doesMatch);
            }
        });
    });
}

exports.checkPassword = checkPassword;

function setData(signature, user_id) {
  return db.query(`INSERT INTO signatures (signature, user_id)
  VALUES ($1, $2) RETURNING id`,
  [signature, user_id])
}


exports.setData = setData;


function getSignatureById(signatureId) {
  return db
    .query(`SELECT signature
      FROM users
      LEFT JOIN signatures
      ON signatures.user_id = users.id
      WHERE users.id = $1`, [signatureId]);

}

exports.getSignatureById = getSignatureById;

function getNumberOfSupporters() {
  return db
  .query(`SELECT count(*) FROM signatures`)
}

exports.getNumberOfSupporters = getNumberOfSupporters;

function getSignersList() {
  return db
  .query(`SELECT u.first, u.last, up.age, up.city, up.url
    FROM signatures s
    LEFT JOIN users u
    ON u.id = s.user_id
    LEFT JOIN user_profiles up
    ON s.user_id = up.user_id
    ORDER BY u.last ASC`
  )
}

exports.getSignersList = getSignersList;


function moreInfo(age, city, url, user_id) {
  return db
  .query(`INSERT INTO user_profiles (age, city, url, user_id)
  VALUES ($1, $2, $3, $4)
  RETURNING id`,
  [age, city, url, user_id])
}

exports.moreInfo = moreInfo;


function getCity(chosenCity) {
  return db
  .query(`SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
    FROM signatures
    LEFT JOIN users
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON signatures.user_id = user_profiles.user_id
    WHERE LOWER(city) = LOWER($1)`, [chosenCity]
  )
}

exports.getCity = getCity;


function getUserData(user_id) {
  return db
  .query(`SELECT users.first, users.last, users.email, users.pw, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE users.id=$1`, [user_id]
  )
  .then(function(result) {
    return result.rows[0];
  })
}

exports.getUserData = getUserData;


function updateUserData(first, last, email, pw, id) {
  if (pw) {
    return db
     .query(
      `UPDATE users

       SET first=$1, last=$2, email=$3, pw=$4
       WHERE id=$5`, [first, last, email, pw, id])
  }
  return db
   .query(
    `UPDATE users

     SET first=$1, last=$2, email=$3
     WHERE id=$4`, [first, last, email, id])
}

exports.updateUserData = updateUserData;


function upsertUserInfo(age, city, url, user_id) {
  return db
  .query(`
    INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    do UPDATE SET age=$1, city=$2, url=$3`, [age, city, url, user_id]
  )
}

exports.upsertUserInfo = upsertUserInfo;


function deleteSignature(user_id) {
  return db
  .query(`DELETE
    FROM signatures
    WHERE user_id=$1`, [user_id])
}

exports.deleteSignature = deleteSignature;
