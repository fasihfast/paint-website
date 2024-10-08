const express=require('express');
const app=express();
const db=require('./db');
const bodyParser=require('body-parser');
app.use(bodyParser.json());


const Port=process.env.Port || 3000;
app.listen(Port,()=>{
    console.log("Server is live now");
})