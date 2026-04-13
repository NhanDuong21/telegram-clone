import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const sendOtpEmail = async (email: string, otp: string) => {
    const mailOptions = {
        from: `"Telegram Clone" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Mã xác thực OTP của bạn',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                <h2 style="color: #3390ec; text-align: center;">Xác thực tài khoản</h2>
                <p>Chào bạn,</p>
                <p>Mã OTP để hoàn tất đăng ký/đổi mật khẩu của bạn là:</p>
                <div style="background: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a2e;">${otp}</span>
                </div>
                <p style="color: #707579; font-size: 14px;">Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="text-align: center; font-size: 12px; color: #aaaaaa;">© ${new Date().getFullYear()} Telegram Clone by Nyan</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};
