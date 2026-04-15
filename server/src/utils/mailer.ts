import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false, 
    requireTLS: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,   
    socketTimeout: 10000,     
    debug: true,             
    logger: true             
});

export const sendOtpEmail = async (email: string, otp: string) => {
    try {
        console.log(`[Mailer] Attempting to send OTP to: ${email}`);
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

        const result = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Email sent successfully to: ${email}. MessageId: ${result.messageId}`);
        return result;
    } catch (error) {
        console.error('SMTP Error details:', error);
        throw error; 
    }
};
