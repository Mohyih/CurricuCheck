const axios = require("axios");

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

const headers = {
  "api-key": process.env.BREVO_API_KEY,
  "Content-Type": "application/json",
};

const sender = {
  email: process.env.SENDER_EMAIL,
  name: process.env.SENDER_NAME || "CurricuCheck",
};

const sendOTP = async (email, otp, firstName) => {
  try {
    await axios.post(
      BREVO_API,
      {
        sender,
        to: [{ email }],
        subject: "CurricuCheck - Email Verification Code",

        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #085830, #136537); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">CurricuCheck</h1>
              </p>
            </div>

            <div style="background: #f5faf7; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #c8e6d4;">

              <p style="color: #085830; font-size: 16px;">
                Hello, <strong>${firstName}</strong>!
              </p>

              <p style="color: #444; font-size: 14px;">
                Your email verification code is:
              </p>

              <div style="background: white; border: 2px solid #136537; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #136537; letter-spacing: 8px;">
                  ${otp}
                </span>
              </div>

              <p style="color: #444; font-size: 13px;">
                This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>

              <p style="color: #888; font-size: 12px; margin-top: 20px;">
                If you did not request this code, please ignore this email.
              </p>

            </div>
          </div>
        `,
      },
      { headers }
    );
  } catch (err) {
    console.error("Brevo OTP Error:");
    console.error(err.response?.data || err.message);
    throw err;
  }
};

const sendAdvisingSummaryPDF = async (
  email,
  pdfBase64,
  studentName,
  targetSemester
) => {
  try {
    await axios.post(
      BREVO_API,
      {
        sender,
        to: [{ email }],
        subject: `CurricuCheck - Your Advising Summary for ${targetSemester}`,

        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

            <div style="background: linear-gradient(135deg, #085830, #136537); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">CurricuCheck</h1>

              </p>
            </div>

            <div style="background: #f5faf7; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #c8e6d4;">

              <p style="color: #085830; font-size: 16px;">
                Hello, <strong>${studentName}</strong>!
              </p>

              <p style="color: #444; font-size: 14px;">
                Please find attached your CurricuCheck Advising Summary for
                <strong>${targetSemester}</strong>.
              </p>

              <p style="color: #444; font-size: 14px;">
                Bring this document to your academic adviser during your official advising appointment.
              </p>

              <div style="background: #eef7f2; border: 1px solid #c8e6d4; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #085830; font-size: 13px; margin: 0;">
                  <strong>Reminder:</strong> CurricuCheck is a decision support tool and does not replace official academic advising. Always verify your final subject lineup with your designated academic adviser.
                </p>
              </div>

              <p style="color: #888; font-size: 12px; margin-top: 20px;">
                This email was sent automatically by CurricuCheck.
              </p>

            </div>

          </div>
        `,

        attachment: [
          {
            name: `CurricuCheck_Advising_Summary_${targetSemester.replace(
              / /g,
              "_"
            )}.pdf`,
            content: pdfBase64,
          },
        ],
      },
      { headers }
    );
  } catch (err) {
    console.error("Brevo PDF Error:");
    console.error(err.response?.data || err.message);
    throw err;
  }
};

const sendPasswordReset = async (email, resetLink, firstName) => {
  try {
    await axios.post(
      BREVO_API,
      {
        sender,
        to: [{ email }],
        subject: "CurricuCheck - Password Reset Request",

        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

            <div style="background: linear-gradient(135deg, #085830, #136537); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">CurricuCheck</h1>
            </div>

            <div style="background: #f5faf7; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #c8e6d4;">

              <p style="color: #085830; font-size: 16px;">
                Hello, <strong>${firstName || 'Student'}</strong>!
              </p>

              <p style="color: #444; font-size: 14px;">
                We received a request to reset your CurricuCheck password.
                Click the button below to continue.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a
                  href="${resetLink}"
                  style="background: linear-gradient(135deg, #085830, #136537); color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 15px;"
                >
                  Reset My Password
                </a>
              </div>

              <p style="color: #444; font-size: 13px;">
                This link expires in <strong>30 minutes</strong>.
                If you did not request this, please ignore this email.
              </p>

              <p style="color: #888; font-size: 12px; margin-top: 20px;">
                If the button does not work, copy and paste this link:<br/>
                <a href="${resetLink}" style="color: #136537;">
                  ${resetLink}
                </a>
              </p>

            </div>
          </div>
        `,
      },
      { headers }
    );

    console.log(`Password reset email sent to: ${email}`);

  } catch (err) {
    console.error("Brevo Password Reset Error:");
    console.error(err.response?.data || err.message);
    throw err;
  }
};

module.exports = { sendOTP, sendAdvisingSummaryPDF, sendPasswordReset};