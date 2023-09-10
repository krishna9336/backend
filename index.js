import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import  Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";
const app = express();


mongoose.connect("mongodb://127.0.0.1:27017/backend").then(()=>{
    console.log('connected to mongodb');
}).catch((e)=>{
    console.log(e);
})

const userSchema= new mongoose.Schema({
    name:String,
    email:String,
    password:String
});

const User=mongoose.model("user",userSchema)


//Using Middleaware
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
//Setting up view Engine
app.set("view engine","ejs")

const isAuthenticated =async (req,res,next)=>{
    const {token} =req.cookies;
    if(token){
        const decoded = Jwt.verify(token,"mynameiskrishna")
        
        req.user =await User.findById(decoded._id)
        next()
    }else{
        res.redirect("/login");
    }
}

app.post("/login",async (req,res)=>{
    const {email,password}=req.body;
let user = await User.findOne({email})
if(!user) return res.redirect("/register")

const isMatch=await bcrypt.compare(password,user.password);
if(!isMatch) return res.render("login",{email,message:"Incorrect Password"})

const token= Jwt.sign({_id:user._id},"mynameiskrishna")
console.log(token)
res.cookie("token",token,{
    httpOnly:true,expires:new Date(Date.now()+60*1000)
})
res.redirect("/")
})

app.get("/",isAuthenticated,(req,res)=>{
    console.log(req.user);
    res.render("logout",{name:req.user.name})    
})
 
app.get("/register",(req,res)=>{
    
    res.render("register")    
})

app.post("/register",async (req,res)=>{
    const {name,email,password }= req.body;

    let user=await User.findOne({email});
    if(user){
        return res.redirect("/login")

    }
    const hassedPassword= await bcrypt.hash(password,10)

    console.log(req.body);
     user =await User.create({
        name,
        email,
        password:hassedPassword,
    })

    const token= Jwt.sign({_id:user._id},"mynameiskrishna")
    console.log(token)
    res.cookie("token",token,{
        httpOnly:true,expires:new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})

app.get("/login",(req,res)=>{
    res.render("login")
})

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now()),
    })
    res.redirect("/")
})



app.listen(5000,()=>{
    console.log("Server is running");
})