// Generate secure verification token using browser crypto
export const generateVerificationToken = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// HTML Email Template matching Frontend Design System
const getHtmlTemplate = (title, content, buttonText, buttonUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }
        .wrapper { width: 100%; background-color: #f1f5f9; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .header { background: #1e2b3e; padding: 40px 20px; text-align: center; border-bottom: 4px solid #1B6EF3; }
        .logo { font-size: 24px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 3px; margin: 0; }
        .logo span { color: #1B6EF3; }
        .content { padding: 48px 40px; }
        .title { color: #1e2b3e; font-size: 24px; font-weight: 800; margin-bottom: 24px; text-align: center; }
        .message-box { font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.8; text-align: left; }
        .button-wrapper { text-align: center; margin: 40px 0; }
        .button { display: inline-block; padding: 18px 36px; background-color: #1B6EF3; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; text-align: center; box-shadow: 0 10px 15px -3px rgba(27, 110, 243, 0.3); }
        .signature { margin-top: 48px; padding-top: 32px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #64748b; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">BULLETIN<span>BOARD</span></div>
            </div>
            <div class="content">
                <h1 class="title">${title}</h1>
                <div class="message-box">
                    ${content.replace(/\n/g, '<br>')}
                </div>
                ${buttonText && buttonUrl ? `
                    <div class="button-wrapper">
                        <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>
                ` : ''}
                <div class="signature">
                    Best regards,<br>
                    <strong>The Bulletin Board Team</strong>
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Bulletin Board. Professional Workspaces.<br>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

// Reusable function to send emails through external PHP API
const sendExternalEmail = async (toEmail, subject, message) => {
    try {
        const response = await fetch(
            "https://connecta.uk/send_email2.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: toEmail,
                    subject,
                    message,
                    html: true,
                    type: 'html'
                }),
            }
        );

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse email service response as JSON:", e);
            console.error("Response status:", response.status);
            console.error("Response text:", responseText);
            return false;
        }

        if (
            result.status === "success" ||
            (result.message && result.message.includes("sent successfully"))
        ) {
            console.log("Email sent successfully:", result.message);
            return true;
        } else {
            console.error("Failed to send email:", result.message);
            return false;
        }
    } catch (err) {
        console.error(`Network error occurred while sending email to ${toEmail} using URL: https://gitaalliedtech.com/highnheavy/highNheavy_email.php`, err);
        return false;
    }
};

// ------------------------------------------------------------
// SEND WORKSPACE INVITE EMAIL
// ------------------------------------------------------------
export const sendWorkspaceInviteEmail = async (toEmail, inviterName, workspaceName) => {
    const inviteUrl = `${window.location.origin}/signup`;

    const title = "You've been invited to join a Workspace!";
    const content = `${inviterName || 'A colleague'} has invited you to join the **${workspaceName}** workspace on Bulletin Board.
    
    Click the button below to accept the invitation and start collaborating with your team.`;

    const html = getHtmlTemplate(title, content, "Accept Invitation", inviteUrl);

    return await sendExternalEmail(
        toEmail,
        `Invitation to join ${workspaceName} - Bulletin Board`,
        html
    );
};

// ------------------------------------------------------------
// SEND B2B INVITE EMAIL
// ------------------------------------------------------------
export const sendB2BInviteEmail = async (toEmail, inviterName, workspaceName) => {
    const inviteUrl = `${window.location.origin}/login`;

    const title = "B2B Partnership Invitation";
    const content = `${inviterName || 'A partner'} has invited you to a B2B Space in the **${workspaceName}** workspace on Bulletin Board.
    
    To accept this invitation:
    1. Click the button below to log in or create an account.
    2. Once logged in, go to the Workspace page.
    3. You will see a banner at the top of your screen with your pending invites. Click "Accept" there to connect your accounts.`;

    const html = getHtmlTemplate(title, content, "Log in to Accept Invite", inviteUrl);

    return await sendExternalEmail(
        toEmail,
        `B2B Invitation from ${workspaceName} - Bulletin Board`,
        html
    );
};

// ------------------------------------------------------------
// SEND VERIFICATION EMAIL
// ------------------------------------------------------------
export const sendVerificationEmail = async (toEmail, verificationToken) => {
    const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;

    const title = "Verify Your Email Address";
    const content = `Welcome to Bulletin Board! We're excited to have you on board.
    
    To ensure the security of your account and start using our platform, please verify your email address by clicking the button below.`;

    const html = getHtmlTemplate(title, content, "Verify Email Address", verificationUrl);

    return await sendExternalEmail(
        toEmail,
        "Verify Your Email - Bulletin Board",
        html
    );
};

// ------------------------------------------------------------
// SEND PASSWORD RESET EMAIL
// ------------------------------------------------------------
export const sendPasswordResetEmail = async (toEmail, resetToken) => {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;

    const title = "Reset Your Password";
    const content = `You recently requested to reset your password for your Bulletin Board account. 
    
    Click the button below to choose a new password. This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.`;

    const html = getHtmlTemplate(title, content, "Reset Password", resetUrl);

    return await sendExternalEmail(
        toEmail,
        "Reset Your Password - Bulletin Board",
        html
    );
};

// ------------------------------------------------------------
// SEND NOTIFICATION EMAIL
// ------------------------------------------------------------
export const sendNotificationEmail = async (toEmail, title, message) => {
    const dashboardUrl = `${window.location.origin}/login`;

    const html = getHtmlTemplate(title, message, "View Dashboard", dashboardUrl);

    return await sendExternalEmail(
        toEmail,
        `New Notification: ${title}`,
        html
    );
};

// ------------------------------------------------------------
// SEND OTP EMAIL
// ------------------------------------------------------------
export const sendOTPEmail = async (toEmail, otp) => {
    const title = "Your Login Verification Code";
    const content = `You are attempting to log in to your Bulletin Board account.
    
    Please use the following verification code to complete your login. This code will expire in 5 minutes.`;

    // Custom formatted content for OTP
    const otpContent = `
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: 800; color: #1e2b3e; letter-spacing: 5px; padding: 15px; background: #f8fafc; border: 2px dashed #1B6EF3; border-radius: 12px; display: inline-block;">
                ${otp}
            </div>
        </div>
        ${content}
    `;

    const html = getHtmlTemplate(title, otpContent, "", "");

    return await sendExternalEmail(
        toEmail,
        "Login Verification Code - Bulletin Board",
        html
    );
};

