const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const moment = require('moment')
app.locals.moment = moment;

const date = require(__dirname + "/date.js");                                                                 
const day = date.getDate();

// template engine  
app.set("view engine", "ejs");
app.use(express.static("public"));
app.set('views','./views')


app.use(bodyParser.urlencoded({ extended: true }));

// Creating Mongoose Connection
mongoose.connect("mongodb://localhost:27017/todolistDB");

// Mongoose Database Schemas
const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

// Item Creation Mongoose
const item1 = new Item({ name: "Welcome to your Todolist!" });
const item2 = new Item({ name: "Hit + button to add a new item." });
const item3 = new Item({ name: "⬅️ Stikethrough    || Delete ➡️" });
const defaultItems = [item1, item2, item3];

// Custom List Schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

// Get Route to Root
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

// Rout to todo
app.get("/toDo", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length == 0) {
      //Items Creation Mongoose
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfuly saved items to the database");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.get("/sign",function (req, res){
  res.render("sign");
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  if (listName === day) {
    item.save();
    res.redirect("/toDo");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/toDo/" + listName);
    });
  }
});

app.get("/toDo/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create new list on the database
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/toDo/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// Delete checked elements from DB
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfuly deleted checked Item");
        res.redirect("/toDo");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          console.log(checkedItemId, listName, foundList);
          res.redirect("/toDo/" + listName);
        }
      }
    );
  }
});



app.get("/notes", function (req, res) {
  res.render("notes");
});

app.use('/currentAffairs',require('./routes/news'))


app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running on port 3000");
});
