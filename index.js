const { MongoClient } = require("mongodb");
const express = require("express");
const url = "mongodb+srv://abhi:123Abhiram4567@wewrite.eosyzwy.mongodb.net/";
const client = new MongoClient(url);
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const app = express();



client.connect();
const db = client.db("WeWrite");

const secretKey = "wedontpullcreativepeoplepeopleprovecreativity";


app.use(express.json())



function verifyJWT(req,res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({message:'Unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token,secretKey);
        req.user = decoded;
        next();
    } catch (err){
        return res.status(403).json({message:'Invalid token'});
    }
}






// Send Writings to the database

app.post("/postWriting",verifyJWT, (req,res)=>{
    
    const col = db.collection("write");
    const currentDate = new Date();
    const writing = 
        {
            "writing":req.body.writing,
            "date" : currentDate.getDate() + "-" + currentDate.getMonth()+1 + "-" + currentDate.getFullYear(),
            "time":currentDate.getHours() + ":" + currentDate.getMinutes(),
        } 

    const filter = {userName:req.user.userName};
    const update = {$push :{writings:writing}};

    const p = col.updateOne(filter,update);
    p.then(()=>{
        res.status(200).send("Writing Succesful");
    })
    .catch((e)=>{
        res.status(400).send("error");
    })
});

// register the user.

app.post("/register",async (req,res)=>{
    const col = db.collection("users");
    const colWrite = db.collection("write");

    const user = {
        userName:req.body.userName,
        quote:req.body.quote,
        email:req.body.email,
        password:req.body.password,
        profileImg:""
    }
    const writingData = {
        userName : req.body.userName,
        writings:[],
    }

    const payload = {
        userName:req.body.userName,
        email:req.body.email,
    }

    const token = jwt.sign(payload,secretKey,{expiresIn:'1h'});


    
    const existingUser = await col.findOne({name:user.name});
    if(existingUser){
        res.send("User already exists.");
    } else{
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password,saltRounds);

        user.password = hashedPassword;

        colWrite.insertOne(writingData);

        await col.insertOne(user);

        res.send({
            message:"User Registration Successful",
            token:token,
        });
    }
});


// Login the user.

app.post("/login", async(req,res)=>{
    const col = db.collection("users");

    const payload = {
        userName:req.body.userName,
    }

    try{
        const check = await col.findOne({userName:req.body.userName});
        if(!check){
            res.send("User not registered");
        }

        const token = jwt.sign(payload,secretKey,{expiresIn:'1h'});

        const isPasswordMatch = await bcrypt.compare(req.body.password,check.password);
        if(isPasswordMatch){
            res.status(200).send({
                message:"User Login Successful",
                token: token,
            });
        }
    } catch{
        res.status(400).send("Password does not match");
    }
});



// Get all Posts
app.get("/allPosts",async(req,res)=>{
    const col = db.collection("write");
    const cursor = col.find({});
    const documents = await cursor.toArray();
    res.status(200).send(documents);
});


// Get Posts of a profile.
app.get("/profile",verifyJWT, async (req,res)=>{
    const col = db.collection("users");
    const writeCol = db.collection("write");

    const get = await col.findOne({userName:req.user.userName});
    
    const writings = await writeCol.findOne({userName:get.userName});
    if(writings){
        res.status(200).send({
            userInfo:get,
            writings : writings.writings,
        })
    }else{
        res.status(400).send("Can't Retrieve Writings");
    }
});


// Update profile
app.put("/updateProfile",verifyJWT,async (req,res)=>{
    const col = db.collection("users");
    const data = {
        userName:req.body.userName,
        profileImg:req.body.profileImg,
        quote:req.body.quote,
    }
    
    await col.update({userName:data.userName},{$set:{
        userName:data.userName,
        profileImg:data.profileImg,
        quote:data.quote,
    }});

    req.user.userName = req.body.userName;

    res.status(200).send("Update Succesful");
});



// Return a quote
app.get("/quote",async (req,res)=>{
    const col = db.collection("quotes");
    const document = await col.findOne({name:"quotes"})
    const quotesArray = document.quote;
    const rand = Math.floor(Math.random() * 18)
    res.status(200).send({
        "quote":quotesArray[rand]
    });
});


// Set Interests
app.post("/interests",verifyJWT,async(req,res)=>{
    const col = db.collection("users");
    const doc = await  col.updateOne({userName:req.user.userName},{
        $set:{
            interests:req.body.interests,
        }
    })
    res.status(400).send("Done");
});




app.listen(3000);



