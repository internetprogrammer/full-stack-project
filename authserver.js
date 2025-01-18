require('dotenv').config();

const express = require('express');
const app = express();

const bcrypt = require('bcrypt');

app.set('view-engine', 'ejs');
app.use(express.urlencoded({extended:false}))

const port = process.env.PORT || 4000;

const jwt = require('jsonwebtoken');
app.use(express.json());

const mongoose = require('mongoose');
const User = require('./models/User.js')

app.get('/login', (req, res) => {
    res.render('login.ejs');
  });
  app.get('/signup', (req, res) => {
    res.render('signup.ejs');
  });

app.post ('/login' , async(req,res) =>{
    const Username = req.body.email;
    const Password  = req.body.password;
    const user = await User.findOne({username:Username}); // not finding user with the same username because kill niggers
    console.log(Username, ' ',Password)
    try{
    if(await bcrypt.compare(Password,user.password)){
    const accessToken = GenerateAccessToken(user.username);
    const refreshToken = GenerateRefreshToken(user.username);
    try{
        await User.updateOne({
            username:user.username
        }, { refreshToken:refreshToken }, { upsert: true }); 
        if(user){
        //res.redirect(process.env.SERVER_ADDRESS + '/app')
        res.cookie("REFRESH_TOKEN",{refreshToken},{
            httpOnly:false,
            secure:false,
            path:'/',
            sameSite:true
        })
        res.location(process.env.SERVER_ADDRESS)
        res.header('authorization', 'Bearer ' + accessToken)
        res.redirect(process.env.SERVER_ADDRESS + '/app');
        }
    
    }catch(err){
            console.log(err);
            res.status(500).json({message: err.message});
    }
    
    //console.log(user.refreshToken);
    }
    else{
    res.sendStatus(401);
    }
    }
    catch(err){
        console.log(err);
    }
})
app.post('/signup', async(req,res)=>{ //add email verification
    const Username = req.body.email;
    const HashedPassword  = await bcrypt.hash(req.body.password, 10); 
    try{
        const user = await User.create({username:Username,password:HashedPassword});
        const accessToken = GenerateAccessToken(user.username);
        const refreshToken = GenerateRefreshToken(user.username);
        try{
        await User.updateOne({
            username:user.username
        }, { refreshToken:refreshToken }, { upsert: true });
        res.cookie("REFRESH_TOKEN",{refreshToken},{
            httpOnly:false,
            secure:false,
            path:'/',
            sameSite:true
        }).redirect(process.env.SERVER_ADDRESS + '/app')
        res.set('authorization', 'Bearer ' + accessToken); /*
        .*/
        }catch(err){
            console.log(err);
            res.status(500).json({message: err.message});
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
  })
app.post('/token' ,async (req,res) =>{
    const refreshToken = req.body.token;
    const sameRefreshTokenUser = await User.findOne({refreshToken:refreshToken})
    console.log(sameRefreshTokenUser.refreshToken,' ', refreshToken)
    console.log(sameRefreshTokenUser.refreshToken == refreshToken)
    if(refreshToken ==null)return res.sendStatus(401).json({message: error.message});
    if(sameRefreshTokenUser.refreshToken != refreshToken)return res.sendStatus(403).json({message: error.message});
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,user) =>{
        if(err)return res.sendStatus(403).json({message: error.message});
        const accessToken = GenerateAccessToken({name:user.username})
        //res.header('authorization', 'Bearer ' + accessToken).sendStatus(200);
        res.json({authorization: 'Bearer ' + accessToken})
    })
})
app.delete('/logout', async (req,res)=>{
    const {refreshToken} = req.body;
    try{
        await User.updateOne({
            refreshToken:refreshToken
        }, { refreshToken:null}, { upsert: true });
        res.status(200).cookie("REFRESH_TOKEN",null,{
            httpOnly:false,
            secure:false,
            path:'/',
            sameSite:true
        })
        }catch(err){
            console.log(error);
            res.status(500).json({message: error.message});
        }
    res.sendStatus(204);
})

function GenerateAccessToken(user){
    return jwt.sign({user},process.env.ACCESS_TOKEN_SECRET, {expiresIn:"1h"});
}
function GenerateRefreshToken(user){
    return jwt.sign({user}, process.env.REFRESH_TOKEN_SECRET)
}

app.listen(port);
console.log('Authentication Server started at http://localhost:' + port);
mongoose.connect("mongodb://localhost:27017/")
.then(() =>{
    console.log("Connected To Database");
})
.catch(()=>{
    console.log("Failed To Connect To Database");
})