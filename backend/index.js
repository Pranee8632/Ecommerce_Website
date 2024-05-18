// in this file we will be writing the backend codes
// firstly we will define the port, so that on this port our express server will be running

const port = 4000;
const express = require("express");
const app = express(); //now using this express we can create our app instance
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path") //using this path module we can get access to our backend directory in our express app
const cors =  require("cors");

app.use(express.json());
// with the help of the express.json what ever request we will get from the response that will be automatically passed throughh the json

app.use(cors()); //to connect frontend with the backend
// using this our reactjs project will connect to express app on 4000port

// we will initialize the database for that we need to create the mongodb atlas database, for that go to the web browser and search for the mongodb Atlas
// and create a database cluster and connect it to the express server

// Database Connection with MongoDB
mongoose.connect("")

//API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})


//Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})


//where to upload the images that will be sent by the client 
const upload = multer({storage:storage})

//Multer: Easily upload files with Node.js and Express
//Multer is a middleware package for Express.js that adds support for handling multipart/form-data, which is typically used for file uploads. It acts as a bridge between the client-side form submission and the server-side file storage. Multer provides an easy-to-use API to process file uploads, handle file size limits, define file storage locations, and more.

//(Multer is a Node.js middleware for handling multipart/form-data that makes the otherwise painstaking process of uploading files in Node.js much easier)

//Creating Upload Endpoint for images
app.use('/images',express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

//Schema for Creating Products in mondodb
const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        reuired:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    availabe:{
        type:Boolean,
        default:true,
    },
})

//addproduct endpoint
//Creating an API for adding the products
app.post('/addproduct',async(req,res)=>{
    //for generating the id automatically in the database we will create a logic for it!!

    let products =  await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    } 
    else{
        id=1;
    }
    //we will get the items in this array named products,so we will create a logic for it

    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save(); // to save in the database
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

//removeproduct endpoint
//Creating an API for deleting the products
app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name,
    })
})


//Allproducts endpoint
//Creating API for getting all products
app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//Schema creating for User Model
const Users = mongoose.model('Users',{
    name:{
        type:String, 
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

//Creating Endpoint for registering the user
app.post('/signup',async(req,res)=>{

    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"Existing user found with same Email address"})
    }
    let cart = {};
    for(let i=0;i<300;i++){
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    //To use the jwt authentication
    const data={
        user:{
            id:user.id
        }
    }
    const token = jwt.sign(data,'secret_ecom'); //using this secret_ecom => our token will not be readable
    res.json({success:true,token})

})


//Creating endpoint for  user login
app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token})
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email Id"})
    }
})

//Creating endpoint for newCollection data
app.get('/newcollections',async (req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8); //u will get recently added 8 products in the newcollection array
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

//creating endpoint for popular in Women section
app.get('/popularinwomen',async (req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women fetched");
    res.send(popular_in_women);
})


//creating middleware to fetch user
//using this middleware we can convert the auth-token into userid
    const fetchUser = async (req,res,next)=>{
        const token = req.header('auth-token');
        if(!token){
            res.status(401).send({errors:"Please authenticate using valid token"})
        }
        else{
            try {
                const data = jwt.verify(token,'secret_ecom');
                req.user= data.user;
                next();
            } catch (error) {
                res.status(401).send({errors:"please authenticate using a valid token"})
            }
        }
    }
    
//creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser, async (req,res)=>{
    console.log("Added",req.body,req.user);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

//creating endpoint to remove the product from cartdata
app.post('/removefromcart',fetchUser,async (req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    {
        userData.cartData[req.body.itemId] -=1;
    }
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

//creating endpoint to get cartData
app.post('/getcart',fetchUser,async (req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on Port "+port)
    }
    else{
        console.log("Error : "+error)
    }
})


// cd backend
// node .\index.js
