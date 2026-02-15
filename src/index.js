
import { configDotenv } from "dotenv";
import mongoose from "mongoose";

import express from "express";
import connectDB from "./Db/Connection.js";

configDotenv();

const app = express();

connectDB();
   app.listen(process.env.PORT,()=>{
        console.log("Server is Running");
       })
