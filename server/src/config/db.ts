import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const isProd = process.env.NODE_ENV === "production";
        const uri = isProd ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV;

        if (!uri) {
            throw new Error(`MongoDB URI is missing for ${isProd ? "production" : "development"} environment`);
        }

        await mongoose.connect(uri);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
};

export default connectDB;