//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const _ = require("lodash");

const app = express();

const moment = require("moment");
app.locals.moment = moment;

const date = require(__dirname + "/date.js");
const day = date.getDate();
const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";

// template engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.set("views", "./views");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/currentAffairs", require("./routes/news"));
app.use('/dictionary',require('./routes/dictionary'))


app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Creating Mongoose Connection
mongoose.connect("mongodb://localhost:27017/yourspace");
// mongoose.set("useCreateIndex", true);

// Mongoose Database Schemas
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  // password: {
  //   type: String,
  //   required: true,
  // },
  lists: [{
    type: Schema.Types.ObjectId,
    ref: "List"
  }],
  posts: [{
    type: Schema.Types.ObjectId,
    ref: "Post"
  }]
});

const ListSchema = {
 name : String,
};
const PostSchema = {
  title: String,
  content: String,
};

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const User = new mongoose.model("User", UserSchema);
const List = new mongoose.model("List", ListSchema);
const Post = new mongoose.model("Post", PostSchema);

// Setting up pasport strategy and serailization
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// passport.use(
//   function (accessToken, refreshToken, profile, cb) {
//     console.log(profile);
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// );

// List Creation Mongoose
const item1 = new List({ name: "Welcome to your Todolist!" });
const item2 = new List({ name: "Hit + button to add a new List." });
const item3 = new List({ name: "⬅️ Stikethrough    || Delete ➡️" });
const defaultItems = [item1, item2, item3];

// Custom List Schema
// const listSchema = {
//   name: String,
//   Lists: [itemsSchema],
// };

// const List = mongoose.model("List", listSchema);

// Get Route to Root
app.get("/", function (req, res) {
  res.render("locked");
});
app.get("/home", function (req, res) {
  res.render("home");
});

// Route to todo
app.get("/toDo", function (req, res) {
  if (req.isAuthenticated) {
    List.find({}, function (err, foundItems) {
      if (foundItems.length == 0) {
        //Lists Creation Mongoose
        List.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfuly saved Lists to the database");
          }
        });
        res.redirect("/home");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    });
  } else {
    res.redirect("/sigin");
  }

  // List.find({}, function (err, foundItems) {
  //   if (foundItems.length == 0) {
  //     //Lists Creation Mongoose
  //     List.insertMany(defaultItems, function (err) {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         console.log("Successfuly saved Lists to the database");
  //       }
  //     });
  //     res.redirect("/");
  //   } else {
  //     res.render("list", { listTitle: day, newListItems: foundItems });
  //   }
  // });
});

// app.get("/toDo/:customListName", function (req, res) {
//   const customListName = _.capitalize(req.params.customListName);
//   List.findOne({ name: customListName }, function (err, foundList) {
//     if (!err) {
//       if (!foundList) {
//         //Create new list on the database
//         const list = new List({
//           name: customListName,
//           Lists: defaultItems,
//         });
//         list.save();
//         res.redirect("/toDo/" + customListName);
//       } else {
//         res.render("list", {
//           listTitle: foundList.name,
//           newListItems: foundList.Lists,
//         });
//       }
//     }
//   });
// });

app.get("/notes", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("notes", { startingContent: homeStartingContent, posts: posts });
  });
});

app.get("/compose", function (req, res) {
  res.render("compose");
});

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findOne({ _id: requestedPostId }, function (err, post) {
    res.render("post", {
      title: post.title,
      content: post.content,
    });
  });
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
  });
  post.save(function (err) {
    if (!err) {
      res.redirect("/notes");
    }
  });
});

app.get("/signin", function (req, res) {
  res.render("signin");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.post("/signin", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.error(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/signup", function (req, res) {
  const newUser = new User({
    username: req.body.username
  });
  const password= req.body.password;
  

  console.log(req.body.username);
  console.log(req.body.password);
  
  User.register( newUser, password,

    // {username: req.body.username },
    // {password: req.body.password},
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    }
  );
});

app.post("/toDo", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  console.log(itemName, listName);
  const todoList = new List({
    name: itemName,
  });
  if (listName === day) {
    todoList.save();
    res.redirect("/toDo");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      console.log(foundList);
      console.log(err);
      if(err){
        console.log(err);
      }else{
        foundList.Lists.push(todoList);
      foundList.save();
      res.redirect("/toDo/" + listName);
    }
      
      
    });
  }
});

// Delete checked elements from DB
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    List.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfuly deleted checked List");
        res.redirect("/toDo");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { Lists: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          console.log(checkedItemId, listName, foundList);
          res.redirect("/toDo/" + listName);
        }
      }
    );
  }
});

app.listen(process.env.PORT || 4000, function () {
  console.log("Server is running on port 4000");
});
