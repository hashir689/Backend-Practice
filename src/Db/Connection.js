import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

       console.log(`\n MongoDB connected ${connectionInstance.connection.host}`)
    //    app.on("error",(error)=>{
    //     console.log("Error",error)
    //    })

    
    } catch (error) {
        console.error("ERROR",error)
    }
}

export default connectDB;