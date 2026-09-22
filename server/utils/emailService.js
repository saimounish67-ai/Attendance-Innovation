import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

export const sendReportEmail = async (toEmails, subject, text, attachmentPath) => {
  try {
    if (!emailUser || !emailPass || emailUser.includes('your_email') || emailPass.includes('your_')) {
      console.warn('Email is disabled because EMAIL_USER / EMAIL_PASS are not configured.');
      return false;
    }

    const mailOptions = {
      from: emailUser,
      to: toEmails.join(', '),
      subject,
      text,
      attachments: attachmentPath ? [{ path: attachmentPath }] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message || error);
    return false;
  }
};
