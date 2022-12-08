
const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config()

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/favicon.ico", function (req, res) {
  res.redirect("/");
});

// mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect(process.env.ATLAS_URL, {useNewUrlParser: true, useUnifiedTopology:true});


const itemsSchema = {
  name: {
    type: String,
    required: [true, 'Name is required!']
  }
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Check this to delete an item."
})

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items to DB");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems, route: req.url });
          }
  });

});


app.get("/:customListName", function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect('/'+customListName);

      } else {
        //Show an existing list
        res.render("list", {listTitle:foundList.name, newListItems:foundList.items, route:req.url});
      }
    }else{console.log(err);}
  })

});


app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save()
      res.redirect("/" + listName)
    });
  }

});



app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  if(listName === "Today"){

    Item.findByIdAndRemove(checkedItemId, function (err, foundItem) {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
        console.log("Succesfully deleted " + foundItem.name);
      }
    });

  }else{
    // List.findOneAndUpdate({name: listName},{$pull: {items:{_id: checkedItemId}}},function(err, foundList){
    //   if(!err){
    //     res.redirect('/' +listName);
    //   }
    // })
    List.findOne({name:listName}, function(err,foundList){
      foundList.items.remove(checkedItemId);
      foundList.save();
      res.redirect('/' +listName);
    })
    
  }

  
});


app.get("/about", function (req, res) {
  res.render("about");
});

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
