import nodemailer from 'nodemailer';
import fs from 'fs';

LoadSettings();

var transporter: any;

function LoadSettings(): void {
    const emailSettings = JSON.parse(fs.readFileSync(`./email.json`,
        { encoding: 'utf8', flag: 'r' }));
    transporter = nodemailer.createTransport(emailSettings);
}

export function SendEmail(subject: string, text: string, from: string, to: string, replyTo: string, callback: (error, info) => void): string {

    if (!transporter) {
        return 'Mailer Transporter Does Not Exist';
    }

    const mailOptions = {
        from,
        to,
        subject,
        text,
        replyTo
    }
    transporter.sendMail(mailOptions, callback);
    return '';
}