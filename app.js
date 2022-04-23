//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js"); -----temporary removal

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// Arrays used to collect user input
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//Use Mongoose for collecting user input
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});
mongoose.connect("mongodb+srv://"+process.env.MONGO_ID+":"+process.env.MONGO_PSW+"@todocluster.xqqgv.mongodb.net/todolistDB?retryWrites=true&w=majority");


const itemsSchema = {
  name: String,
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist. To make a Custom List, add a unique list name to the end of this URL. To return to a custom list please remember your new URL."
});
const item2 = new Item ({
  name: "Enter your list item below and click the + button to add a new item."
});
const item3 = new Item ({
  name: "<--- Click the - button to remove an item. These directions will only appear if there are three or less items in the list."
});

const defaultItems = [item1, item2, item3];

//****code to create new todolists using mongoose
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

//initial render root website code
app.get("/", function(req, res) {
//Mongoose database find and use
  Item.find({}, function(err,foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Documents inserted successfully.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});
// const day = date.getDate(); ------Temporary removal

  // res.render("list", {listTitle: "Today", newListItems: items});----moved


app.post("/", function(req, res){
//***new Mongoose + DB code */
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const addItem = new Item ({
    name: itemName
  });
// search to see if the item being added is the for root list
  if (listName === "Today"){
    addItem.save();
    res.redirect("/");
  } else { //if item is for another list check and push to that list
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(addItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

//-----------old code before Mongoose and Database
  // const item = req.body.newItem;
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

//*********new Mongoose item delete code */
app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    //mongoose findOneAndUpdate and mongodb $pull function {$pull {field:{_id:value}}}
      List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemId}}},function(err,foundList){
        if (!err){
          res.redirect("/" + listName);
        }
      });
  }
  
});

//make a new todolist from entere webaddress
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
//check to see if list exists already
  List.findOne({name:customListName}, function(err,foundList){
    if (!err){
      if (!foundList){
        //create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list.
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
      }
    }
  });

  
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

//heroku listen port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
// app.listen(port);

//local server
app.listen(port, function() {
  console.log("Server started on port 3000");
});
