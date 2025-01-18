require('dotenv').config();

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view-engine', 'ejs');
app.use(express.urlencoded({extended:false}))

const jwt = require('jsonwebtoken');
app.use(express.json());

const mongoose = require('mongoose');
const User = require('./models/User.js')

const path = require('path');

//--------------------- Send website to user ---------------------
const port = process.env.PORT || 80;
app.use(express.static(__dirname + "/src/public"));
app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.listen(port);
console.log('Server started at http://localhost:' + port);
//----------------------------------------------------------------

//--------------------- auth and account system template ---------------------------
mongoose.connect("mongodb://localhost:27017/")
.then(() =>{
    console.log("Connected To Database");
})
.catch(()=>{
    console.log("Failed To Connect To Database");
})
app.get ('/app' ,AuthenticateToken,(req,res) =>{ // the auth server and everything leading to this has been for the sole reason of creating this path
  res.sendFile(path.join(__dirname, './src/app.html'));
})


async function AuthenticateToken (req,res,next){
  const authHeader = req.headers['authorization'];
  //console.log('hoho:', req.headers['authorization']);
  //console.log(req.headers);
  if(req.headers['authorization'] == null){
    const refreshToken = req.cookies.REFRESH_TOKEN
    const fetchRes = await fetch(process.env.AUTH_SERVER_ADDRESS + '/token',{
      method:'POST',
      headers: {
        'Content-Type': 'application/json' // Set the content type to JSON
      },
      body: JSON.stringify(refreshToken).replace("refreshToken",'token')
      
    })
    const jsonData = await fetchRes.json();
    const token = jsonData.authorization && jsonData.authorization.split(' ')[1];
    console.log(token)
    jwt.verify(token.authorization,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
      if(err) return res.sendStatus(403);
      req.user = user
      });
    if(token.authorization == null) return res.sendStatus(401);
    jwt.verify(token.authorization,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
    if(err) return res.sendStatus(403);
    req.user = user
    next()
    });
  //res.setHeader('authorization',response.json().accesstoken)
    //console.log(req.headers);
  }
  else{
  const token = authHeader && authHeader.split(' ')[1];
  if(token == null) return res.sendStatus(401);
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
    if(err) return res.sendStatus(403);
    req.user = user
    next()
  });
  }

}



