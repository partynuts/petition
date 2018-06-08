var spicedPg = require("spiced-pg");

var db = spicedPg("postgres://spicedling:password@localhost:5432/cities");

function getCities() {
  db
    .query("SELECT city, population FROM cities")
    .then(function(result) {
      console.log(result.rows);
    })
    .catch(function(err) {
      console.log(err);
    });
}

getCities();

exports.getCities = getCities;

function getCity(name, country) {
  return db
    .query("SELECT * FROM cities WHERE city = $1 AND country = $2", [
      //damit das HTML nicht geändert werden kann, werden nicht einfach die Argumente
      // der Funktion concatenated, sondern mit $1 etc und dem Argument als Array eingefügt
      // und von pg korrekt übersetzt bzw eingefügt
      name,
      country
    ])
    .then(function(result) {
      console.log(result.rows);
    })
    .catch(function(err) {
      console.log(err);
    });
}

getCity();

exports.signPetition(first, last, sig) {
  db.query('INSERT INTO signatures', [first, last, sig])
}
