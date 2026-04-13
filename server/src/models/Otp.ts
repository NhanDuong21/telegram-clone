import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
    email: string;
    otp: string;
    token?: string; // Verification token for registration/reset
    createdAt: Date;
}

const OtpSchema: Schema = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    token: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 300 } // Expires in 5 minutes
});

export default mongoose.model<IOtp>('Otp', OtpSchema);
