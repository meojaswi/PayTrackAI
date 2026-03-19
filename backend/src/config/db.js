import mongoose from "mongoose";

export const connectToDatabase = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected ✅");
  } catch (error) {
    console.error("MongoDB connection error ❌", error);
    throw error;
  }
};
