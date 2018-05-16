var bodyParser = require("body-parser"),
mongoose       = require("mongoose"),
express        = require("express"),
expressSanitizer = require("express-sanitizer"),
methodOverride = require("method-override"),
passport   = require("passport"),
LocalStrategy   = require("passport-local"),
User = require("./models/user"),
app            = express();



//App Config
mongoose.connect("mongodb://localhost/restful_blog_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));


// passport config fef
app.use(require("express-session")({
    secret: "anything", 
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//------------ currentUser global variable to all ejs-------------------
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.HwaiTime = HwaiTimeAPI;
    next();
});


//Mongoose Config
//title
//image
//body
//created
var blogSchema = new mongoose.Schema({
    title:String,
    image:String,
    body:String,
    created: {type: Date, default: Date.now}
})
var Blog = mongoose.model("Blog", blogSchema); //compile to mongoose model

//create a sample data for db
//Blog.create({
//    title:"fararri",
//    image:"https://farm9.staticflickr.com/8683/15972043632_5714d71a40.jpg",
//    body:"This is holiday after July 4th, people are enjoying their time with family.",
//});

app.get("/", function(req,res){
    res.redirect("/register");
});
//Index Route
//we don't need to say' index.ejs'   
app.get("/blogs", function(req,res){
//--------------------------get current user-------------------
//    console.log(req.user);
    Blog.find({},function(err,blogs){
        if(err) {
           console.log("ERROR!");
        } else {
           res.render("index",{blogsVar: blogs, currentUser:req.user});
        }
    });
});

//NEW Route
app.get("/blogs/new", function(req,res){
    res.render("new");
});

//POST 
app.post("/blogs", function(req,res){
    //sanitizer
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.create(req.body.blog,function(err,newBlogs){
        if(err) {
           res.render("new");
        } else {
           res.redirect("/blogs");
        }
    });
});

//SHOW Route
app.get("/blogs/:id", function(req,res){
    
    Blog.findById(req.params.id,function(err,foundBlog){
        if(err) {
           res.redirect("/blogs");
        } else {
            //show on show.ejs
           res.render("show", {blogVar: foundBlog});
        }
    });
});

//EDIT Route
app.get("/blogs/:id/edit", function(req,res){
           Blog.findById(req.params.id,function(err,foundBlog){
        if(err) {
           res.redirect("/blogs");
        } else {
            //show on Edit.ejs
           res.render("edit", {blogEditVar: foundBlog});
        }
    });
});

//UPDATE Route 
app.put("/blogs/:id", function(req,res){
    //sanitizer
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err,updatedBlog){
        if(err) {
           res.redirect("/blogs");
        } else {
            //show on show.ejs
           res.redirect("/blogs/"+ req.params.id);
        }
    });
});

//DELETE Route 
app.delete("/blogs/:id", function(req,res){
    Blog.findByIdAndRemove(req.params.id, function(err,updatedBlog){
        if(err) {
           res.redirect("/blogs");
        } else {
           res.redirect("/blogs");
        }
    });
});


//==================== 1. Register Route========

//register route
//get the request of /register, then render page content of register.ejs
app.get("/register", function(req,res){
    res.render("register");
});

//get data from form of page register, 
//then, send following message
app.post("/register", function(req,res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err) {
            console.log(err);
            return res.render('register');
        } 
        passport.authenticate("local")(req, res, function(){
            res.redirect("/blogs");
        });
    });
});

//------------------------2. login route------------------------
app.get("/login", function(req,res){
    res.render("login");
});

//middleware
//after '/login', immidiately run middleware for checking comparing login info from the form to the hash table from database. if it is matching then direct to 'secret.ejs', if not then direct to 'login.ejs' again
app.post("/login", passport.authenticate("local", {
    successRedirect:"/blogs",
    failureRedirect:"/login"
}) ,function(req,res){
    
});

//--------------------------logout route-------------------------
//
app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/login");
});

//--------------------------get current user-------------------
// console.log(req.user); -> this will show current user

//--------------------------API-------------------
var request = require('request');
var HwaiTimeAPI = "";
request('https://query.yahooapis.com/v1/public/yql?q=select%20astronomy.sunset%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22maui%2C%20hi%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys', function (error, response, body) {
  if(error) {
      console.log("error");
  }else{
      console.log("");
      if(response.statusCode == 200){
          var parseData = JSON.parse(body);
          console.log(parseData["query"]["results"]["channel"]["astronomy"]["sunset"]);
          HwaiTimeAPI = parseData["query"]["results"]["channel"]["astronomy"]["sunset"];
      }
  }
});




//let local port run as server
app.listen(4000, () => console.log('started our app  on port 4000!'));


//=========================== chat feature ================================
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
users = [];
msglist = [];

app.get("/chat", function(req, res){
    res.render("chat", {msgVar: msglist});
}); 

app.post("/chat", function(req, res){
        
        var msg = req.body.chatArea;
        msglist.push("[" + req.user.username + "]: " + msg);
        res.redirect("chat");
}); 


