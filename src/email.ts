import nodemailer from 'nodemailer';
import { Survey } from '../app/src/app/shared/model/survey.model';
import { GetEnvBool, GetEnvInt, GetEnvString } from './env';

LoadSettings();

var transporter: any;

function LoadSettings(): void {
    transporter = nodemailer.createTransport({
        host: GetEnvString('EMAIL_HOST', ''),
        port: GetEnvInt('EMAIL_PORT', 465),
        secure: GetEnvBool('EMAIL_SECURE', false),
        auth: {
            user: GetEnvString('EMAIL_AUTH_USER', ''),
            pass: GetEnvString('EMAIL_AUTH_PASS', '')
        }
    });
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

export function SendSurveyEmail(req: any, id: string, key: string, survey?: Survey): void {
    if (!survey) {
        return;
    }

    if (!survey.email) {
        return;
    }

    var fullUrl = req.protocol + '://' + req.get('host') + '/manage/' + id + '/' + key;

    const subject = `Survey Of The Month - ${survey.name.replace(/[^\x00-\x7F]/g, '')}`;
    let text = `Thank you for creating a survey with Survey Of The Month!\n\nHere is your survey link to ${survey.name}.\n${fullUrl}\n\nAnyone with this link can edit and delete the survey so keep it safe!`;

    const r = SendEmail(subject, text, 'andrew@polklabs.com', survey.email, 'andrew@polklabs.com', () => { });
}