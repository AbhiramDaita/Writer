const { MongoClient } = require("mongodb");
const express = require("express");
const url = "mongodb+srv://abhi:123Abhiram4567@wewrite.eosyzwy.mongodb.net/";
const client = new MongoClient(url);
const bcrypt = require("bcrypt");

const app = express();
client.connect();
const db = client.db("WeWrite");


app.use(express.json())

// Send Writings to the database

app.post("/postWriting",(req,res)=>{
    
    const col = db.collection("write");
    const currentDate = new Date();
    
    const writing = 
        {
            "userName":req.body.userName,
            "writing":req.body.writing,
            "date" : currentDate.getDate() + "-" + currentDate.getMonth()+1 + "-" + currentDate.getFullYear(),
            "time":currentDate.getHours() + ":" + currentDate.getMinutes(),
        } 

    const p = col.insertOne(writing);
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
    const user = {
        name:req.body.userName,
        quote:req.body.quote,
        email:req.body.email,
        password:req.body.password,
    }
    
    const existingUser = await col.findOne({name:user.name});
    if(existingUser){
        res.send("User already exists.");
    } else{
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password,saltRounds);

        user.password = hashedPassword;

        await col.insertOne(user);

        res.send("User Registered Succesful");
    }
});


// Login the user.

app.post("/login", async(req,res)=>{
    const col = db.collection("users");
    try{
        const check = await col.findOne({name:req.body.uesrname});
        if(!check){
            res.send("User not registered");
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password,check.password);
        if(isPasswordMatch){
            res.status(200).send("User Login Succesful");
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




app.listen(3000);



