import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const ruselt = await mongoose.connect(process.env.DB_URI);
    console.log(ruselt.models);
    console.log("DB connected ✅");
  } catch (error) {
    console.log("Fail to connect on DB ❌", error);
  }
};

export default connectDB;
