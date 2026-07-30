const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// Verify SMTP connection when server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error);
  } else {
    console.log("✅ Gmail SMTP Ready");
  }
});

const sendOTP = async (email, otp, firstName) => {
  await transporter.sendMail({
    from: `"CurricuCheck" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "CurricuCheck — Email Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #085830, #136537); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">CurricuCheck</h1>
        </div>

        <div style="background: #f5faf7; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #c8e6d4;">

          <p style="color:#085830;font-size:16px;">
            Hello, <strong>${firstName}</strong>!
          </p>

          <p style="color:#444;">
            Your email verification code is:
          </p>

          <div style="background:white;border:2px solid #136537;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;color:#136537;letter-spacing:8px;">
              ${otp}
            </span>
          </div>

          <p style="color:#444;font-size:13px;">
            This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
          </p>

          <p style="color:#888;font-size:12px;margin-top:20px;">
            If you did not request this code, simply ignore this email.
          </p>

        </div>
      </div>
    `,
  });
};

const sendAdvisingSummaryPDF = async (
  email,
  pdfBase64,
  studentName,
  targetSemester
) => {
  await transporter.sendMail({
    from: `"CurricuCheck" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `CurricuCheck — Your Advising Summary for ${targetSemester}`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

        <div style="background: linear-gradient(135deg, #085830, #136537); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color:white;margin:0;font-size:24px;">CurricuCheck</h1>
        </div>

        <div style="background:#f5faf7;padding:30px;border:1px solid #c8e6d4;border-radius:0 0 12px 12px;">

          <p style="color:#085830;font-size:16px;">
            Hello, <strong>${studentName}</strong>!
          </p>

          <p>
            Please find attached your CurricuCheck Advising Summary for
            <strong>${targetSemester}</strong>.
          </p>

          <p>
            Bring this document to your academic adviser during your advising schedule.
          </p>

          <div style="background:#eef7f2;border:1px solid #c8e6d4;border-radius:8px;padding:15px;margin:20px 0;">
            <strong>Reminder:</strong>
            CurricuCheck is a decision support tool and does not replace official academic advising.
          </div>

          <p style="font-size:12px;color:#888;">
            This email was sent automatically by CurricuCheck.
          </p>

        </div>

      </div>
    `,

    attachments: [
      {
        filename: `CurricuCheck_Advising_Summary_${targetSemester.replace(
          / /g,
          "_"
        )}.pdf`,
        content: pdfBase64,
        encoding: "base64",
      },
    ],
  });
};

module.exports = {
  sendOTP,
  sendAdvisingSummaryPDF,
};