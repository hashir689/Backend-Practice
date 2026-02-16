
import { configDotenv } from "dotenv";
import mongoose from "mongoose";


import connectDB from "./Db/Connection.js";
import { app } from "./app.js";

configDotenv();




connectDB().then(()=>{
   app.listen(process.env.PORT,()=>{
console.log("Server is Running");
   })
}).catch((err)=>{
console.log("connection failed" , err)
});