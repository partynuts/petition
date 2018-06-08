const express = require("express");
const app = express();
const URL = require("url-parse");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const hb = require("express-handlebars");
const { setData } = require("./db");
const { getSignatureById } = require("./db");
const { getSignersList } = require("./db");
const { getNumberOfSupporters } = require("./db");
const { setRegistration } = require("./db");
const { setLogin } = require("./db");
const { checkPassword } = require("./db");
const { alreadySigned } = require("./db");
const { moreInfo } = require("./db");
const { getCity } = require("./db");
const { hashPassword } = require("./db");
const { upsertUserInfo } = require("./db");
const { updateUserData } = require("./db");
const { getUserData } = require("./db");
const { deleteSignature } = require("./db");
console.log(getUserData, setLogin);
const fs = require("fs");
const csurf = require("csurf");

const cookieSession = require("cookie-session");

//JSON.stringify({ signatureId: 1 }) + mySecret but we do not have to do the hashing ourselves. there is a middleware that does that:
//cookieSession!

let error = {
  message: "",
  fields: ""
};

app.engine("handlebars", hb());
app.set("view engine", "handlebars"); //diese beiden Zeilen bleiben immer gleich für wenn man Handlebars benutzt
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

app.use(express.static(__dirname + "/public"));

app.use(
  cookieSession({
    secret: `Man's not hot`,
    maxAge: 1000 * 60 * 60 * 24 * 14 //expiration of the session (like on banking pages)
  })
);

app.use(function(req, res, next) {
  console.log(req.session.user);
  next();
});

app.use(function(req, res, next) {
  if (!req.session.user && req.url != "/registration" && req.url != "/login") {
    res.redirect("/registration");
  } else {
    next();
  }
});

// app.use((req, res, next) => {
//   // get user from cookie, database, etc.
// let user = req.session.user.id;
// // res.render("/")
//   next();
// });

app.use(csurf());

app.use(function(req, res, next) {
  res.setHeader("X-Frame-Options", "DENY");
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.get("/", function(req, res, next) {
  if (req.session.user) {
    return res.redirect("/petition");
  } //theoretisch wäre hier ein else, aber höherer Aufwand für compiler, deshalb kann man weglassen
  res.redirect("/registration");
});

app.get("/registration", function(req, res) {
  if (req.session.user) {
    return res.redirect("/petition");
  }
  res.render("registration", {
    title: "Colorful World",
    layout: "main"
    // logged: req.session.user.id
  });
});

app.post("/registration", function(req, res) {
  console.log("TEST reg");
  let first = req.body.first; //req. body.name => der name ist der name, den das feld im html hat.
  let last = req.body.last;
  let email = req.body.email;
  req.session.email = email;
  let pw = req.body.pw;
  console.log(req.body.email);
  if (first && last && email && pw) {
    hashPassword(pw).then(function(results) {
      console.log(results);
      setRegistration(first, last, email, results)
        .then(function(result) {
          console.log(result);
          // req.session.signatureId = result.rows[0].id;
          req.session.user = {
            id: result.rows[0].id,
            first: req.body.first,
            last: req.body.last
          };
          res.redirect("/profile");
        })
        .catch(e => {
          console.log(e);
          res.render("registration", {
            error: {
              errmessage:
                "Your email-address is already taken. Please try again."
            },
            title: "Colorful World",
            layout: "main"
            // logged: req.session.user.id
          });
        });
    });
  } else {
    console.log("error with registration!!");
    let errorMessage =
      "Oops, you missed something. Please fill out all fields. Following fields are missing: ";
    let errorFields = [];
    if (!first) {
      errorFields.push("first");
      errorMessage += "<br/> *First name ";
    }
    if (!last) {
      errorFields.push("last");
      errorMessage += "<br/> *Last name ";
    }
    if (!email) {
      errorFields.push("email");
      errorMessage += "<br/> *E-Mail ";
    }
    if (!pw) {
      errorFields.push("pw");
      errorMessage += "<br/> *Password ";
    }
    error = {
      errmessage: errorMessage,
      fields: errorFields
    };
    res.render("registration", {
      error: error,
      title: "Colorful World",
      layout: "main"
      // logged: req.session.user.id
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Colorful World",
    layout: "main"
    // logged: req.session.user.id
  });
});

app.post("/login", (req, res) => {
  console.log("login post is firing");
  let pw = req.body.password;
  let email = req.body.email;

  if (email && pw) {
    setLogin(email).then(function(result) {
      let user = result.rows[0];
      if (!user) {
        let errorMessage = "This account does not exist. Please try again.";
        let errorFields = [];
        error = {
          errmessage: errorMessage,
          fields: errorFields
        };
        // console.log(req.session.user.id);
        return res.render("login", {
          error: error,
          title: "Colorful World",
          layout: "main"
          // logged: req.session.user.id
        });
      }
      checkPassword(pw, result.rows[0].pw)
        .then(function(doesMatch) {
          console.log(doesMatch);
          if (doesMatch) {
            req.session.user = {
              id: result.rows[0].id,
              first: result.rows[0].first,
              last: result.rows[0].last,
              alreadySigned: !!result.rows[0].signature
            };
            console.log("matching pw and signature");
            res.redirect("/thanks");
          } else if (doesMatch) {
            req.session.user = {
              id: result.rows[0].id,
              first: result.rows[0].first,
              last: result.rows[0].last,
              alreadySigned: !result.rows[0].signature
            };
            console.log("matching pw but no signature");
            res.redirect("/petition");
          } else {
            let errorMessage =
              "Email and password do not match. Please try again.";
            let errorFields = [];
            error = {
              errmessage: errorMessage,
              fields: errorFields
            };
            // console.log(req.session.user.id);
            res.render("login", {
              error: error,
              title: "Colorful World",
              layout: "main"
              // logged: req.session.user.id
            });
          }
        })
        .catch(e => {
          console.log(e);
        });
    });
  } else {
    console.log("missed field in login");
    let errorMessage =
      "Oops, you missed something. Please fill out all fields. Following fields are missing: ";
    let errorFields = [];
    if (!email) {
      errorFields.push("email");
      errorMessage += "<br/> *E-Mail ";
    }
    if (!pw) {
      errorFields.push("pw");
      errorMessage += "<br/> *Password ";
    }
    error = {
      errmessage: errorMessage,
      fields: errorFields
    };
    res.render("login", {
      error: error,
      title: "Colorful World",
      layout: "main"
      // logged: req.session.user.id
    });
  }
});

app.get("/profile", function(req, res) {
  if (!req.session.user) {
    return res.redirect("/registration");
  } //theoretisch wäre hier ein else, aber höherer Aufwand für compiler, deshalb kann man weglassen
  res.render("profile", {
    title: "Colorful World",
    layout: "main",
    logged: req.session.user.id
  });
});

app.post("/profile", function(req, res) {
  let age = req.body.age;
  let city = req.body.city;
  let url = req.body.url;
  let user_id = req.session.user.id;
  if (age || city || url) {
    if (url == "") {
      url = null;
    } else if (url.includes("https://")) {
      url = req.body.url;
    } else {
      url = "http://" + req.body.url;
    }
    moreInfo(+age, city, url, user_id).then(function(result) {
      console.log("profile data: ", age, city, url, user_id);
      res.redirect("/petition");
    });
  } else {
    res.redirect("/petition");
  }
});

app.get("/petition", (req, res) => {
  if (req.session.user.alreadySigned) {
    return res.redirect("/thanks");
  }
  if (req.session.user) {
    console.log(req.session);

    return res.render("petition", {
      title: "Colorful World",
      first: req.session.user.first,
      last: req.session.user.last,
      layout: "main",
      logged: req.session.user.id
    });
  }
});

app.get("/thanks", function(req, res) {
  console.log(req.session);
  if (!req.session.user.alreadySigned) {
    console.log("thx alreadysigned not truthy");
    return res.redirect("/petition");
  }
  getSignatureById(req.session.user.id)
    .then(function(result) {
      console.log("already signed in thx truthy");
      // let imgData = result.rows[0].signature;
      let imgData = result.rows[0].signature;
      // console.log(imgData);
      res.render("thanks", {
        title: "Colorful World",
        imageData: imgData,
        layout: "main",
        logged: req.session.user.id
      });
    })
    .catch(e => {
      console.log(e);
    });
  // db.setDataById(req.session.signatureId).then(function(result) {
});
// })

app.post("/delete", function(req, res) {
  console.log("signature delete firing");
  const user_id = req.session.user.id;
  deleteSignature(user_id)
    .then(function() {
      req.session.user.alreadySigned = null;
      console.log("success");
      res.redirect("/petition");
    })
    .catch(e => {
      console.log(e);
    });
});

app.get("/list", function(req, res) {
  console.log("list fn is firing");

  if (!req.session.user.alreadySigned) {
    return res.redirect("/petition");
  }
  getNumberOfSupporters()
    .then(function(num) {
      let numOfSup = num.rows[0].count;
      console.log(numOfSup);
      getSignersList().then(function(result) {
        console.log("getting signers list is firing");
        let signersList = [];
        // for(let i = 0; i < numOfSup; i++) {
        let i = 0;
        console.log(result.rows);
        while (i < numOfSup) {
          let user = {};
          user.first = result.rows[i].first;
          user.last = result.rows[i].last;
          user.age = result.rows[i].age;
          user.city = result.rows[i].city;
          user.url = result.rows[i].url;
          signersList.push(user);
          i++;
        }
        res.render("list", {
          title: "Colorful world",
          signersList: signersList,
          layout: "main",
          logged: req.session.user.id
        });
      });
    })
    .catch(e => {
      console.log(e);
    });
});

//
app.get("/list/:city", function(req, res) {
  console.log("I am in city list route");
  let city = req.params.city;
  console.log("the chosen city:", req.params.city);

  getCity(city)
    .then(function(result) {
      console.log("getting signers list per city is firing");
      console.log("The Result is", result);
      let signersList = [];
      for (let i = 0; i < result.rows.length; i++) {
        console.log("result rows", result.rows[i]);
        let user = {};
        user.first = result.rows[i].first;
        user.last = result.rows[i].last;
        user.age = result.rows[i].age;
        user.url = result.rows[i].url;
        signersList.push(user);
      }
      res.render("list", {
        title: "Colorful world",
        signersList: result.rows,
        layout: "main",
        logged: req.session.user.id
      });
    })
    .catch(e => {
      console.log(e);
    });
});
//

app.post("/petition", function(req, res) {
  console.log("TEST");
  let first = req.body.first;
  let last = req.body.last;
  let signature = req.body.signature;
  let user_id = req.session.user.id;
  console.log(req.session.user.id);
  if (first && last && signature) {
    setData(signature, user_id)
      .then(function(result) {
        req.session.user.alreadySigned = result.rows[0].id;
        console.log(result.rows[0]);
        res.redirect("/thanks");
      })
      .catch(e => {
        console.log(e);
      });
  } else {
    console.log("error!!");
    let errorMessage =
      "Oops, you missed something. Please fill out all fields. Following fields are missing: ";
    let errorFields = [];
    if (!first) {
        let empty = true;
      errorFields.push("first");
      errorMessage += "<br/> *First name ";
    }

    if (!last) {
      errorFields.push("last");
      errorMessage += "<br/> *Last name ";
      let empty = true;

    }

    if (!signature) {
      errorFields.push("signature");
      errorMessage += "<br/> *Signature ";
    }
    error = {
      errmessage: errorMessage,
      fields: errorFields
    };
    res.render("petition", {
      error: error,
      title: "Colorful World",
      layout: "main",
      logged: req.session.user.id
    });
  }
});

app.get("/updateprofile", (req, res) => {
  console.log("Update firing");
  console.log(res.locals);
  if (!req.session.user) {
    return res.redirect("/registration");
  }
  if (req.session.user) {
    getUserData(req.session.user.id)
      .then(function(result) {
        console.log("user is logged in and updating");
        // console.log('result rows', result.rows[0]);
        let userInfo = {
          //theoretisch könnte man hier auch einfach die userInfo als Param in die Funktion geben und nur das ausgeben, anstatt das userInfo Objekt zu erstellen
          first: result.first,
          last: result.last,
          email: result.email,
          age: result.age,
          city: result.city,
          url: result.url
        };
        // console.log(req.session);
        return res.render("updateprofile", {
          title: "Colorful World",
          userInfo: userInfo,
          layout: "main",
          logged: req.session.user.id
        });
      })
      .catch(e => {
        console.log(e);
      });
  }
});

app.post("/updateprofile", function(req, res) {
  console.log("in update route");

  console.log(req.body.email);
  if (req.body.pw) {
    hashPassword(req.body.pw)
      .then(function(pw) {
        console.log(
          req.body.first,
          req.body.last,
          req.body.email,
          pw,
          req.body.url,
          req.session.user.id
        );
        updateUserData(
          req.body.first,
          req.body.last,
          req.body.email,
          pw,
          req.session.user.id
        )
          .then(function(result) {
            req.session.user.first = req.body.first;
            req.session.user.last = req.body.last;
            req.session.user.email = req.body.email;
          })
          .then(function(result) {
            if (req.body.url == "") {
              req.body.url = null;
            } else if (req.body.url.includes("http://") || req.body.url.includes("https://")) {
              req.body.url = req.body.url;
            } else {
              req.body.url = "http://" + req.body.url;
            }
            upsertUserInfo(
              +req.body.age,
              req.body.city,
              req.body.url,
              req.session.user.id
            )
              .then(result => {
                console.log(
                  req.body.first,
                  req.body.last,
                  req.body.email,
                  pw,
                  req.body.pw,
                  req.session.user.id
                );
                res.redirect("/edited");
              })
              .catch(e => {
                console.log(e);
              });
          })
          .catch(e => {
            console.log(e);
          });
      })
      .catch(e => {
        console.log(e);
      });
  } else {
    console.log(" not changing pw");
    console.log(
      req.body.first,
      req.body.last,
      req.body.email,
      req.session.user.id,
      req.body.url
    );

    updateUserData(
      req.body.first,
      req.body.last,
      req.body.email,
      null,
      req.session.user.id
    )
      .then(function(result) {
        req.session.user.first = req.body.first;
        req.session.user.last = req.body.last;
        req.session.user.email = req.body.email;
      })
      .then(function(result) {
        if (req.body.url == "") {
          req.body.url = null;
        } else if (req.body.url.includes("http://") || req.body.url.includes("https://")) {
          req.body.url = req.body.url;
        } else {
          req.body.url = "http://" + req.body.url;
        }
        upsertUserInfo(
          +req.body.age,
          req.body.city,
          req.body.url,
          req.session.user.id
        )
          .then(result => {
            console.log(
              "new profile: ",
              req.body.age,
              req.body.city,
              req.body.url,
              req.session.user.id
            );
            res.redirect("/edited");
          })
          .catch(e => {
            console.log(e);
          });
      })
      .catch(e => {
        console.log(e);
      });
  }
});

app.get("/edited", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/registration");
  }
  if (req.session.user) {
    getUserData(req.session.user.id)
      .then(function(result) {
        console.log("user is logged in and updating");
        // console.log('result rows', result.rows[0]);
        let userInfo = {
          //theoretisch könnte man hier auch einfach die userInfo als Param in die Funktion geben und nur das ausgeben, anstatt das userInfo Objekt zu erstellen
          first: result.first,
          last: result.last,
          email: result.email,
          age: result.age,
          city: result.city,
          url: result.url
        };
        // console.log(req.session);
        return res.render("edited", {
          title: "Colorful World",
          userInfo: userInfo,
          layout: "main",
          logged: req.session.user.id
        });
      })
      .catch(e => {
        console.log(e);
      });
  }
});

app.get("/logout", (req, res) => {
  req.session.user = null;
  res.redirect("/petition");
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`colorful worldlistening!!!!!!!!!`);
});
