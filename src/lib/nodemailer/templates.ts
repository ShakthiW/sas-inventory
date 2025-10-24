export const WELCOME_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>Welcome to Standord Inventory</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #141414 !important;
                border: 1px solid #30333A !important;
            }
            .dark-bg {
                background-color: #050505 !important;
            }
            .dark-text {
                color: #ffffff !important;
            }
            .dark-text-secondary {
                color: #9ca3af !important;
            }
            .dark-text-muted {
                color: #6b7280 !important;
            }
            .dark-border {
                border-color: #30333A !important;
            }
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
            }
            .mobile-padding {
                padding: 24px !important;
            }
            .mobile-header-padding {
                padding: 24px 24px 12px 24px !important;
            }
            .mobile-text {
                font-size: 14px !important;
                line-height: 1.5 !important;
            }
            .mobile-title {
                font-size: 24px !important;
                line-height: 1.3 !important;
            }
            .mobile-button {
                width: 100% !important;
                text-align: center !important;
            }
            .mobile-button a {
                width: calc(100% - 64px) !important;
                display: block !important;
                text-align: center !important;
            }
            .mobile-outer-padding {
                padding: 20px 10px !important;
            }
            .dashboard-preview {
                padding: 0 15px 30px 15px !important;
            }
        }
        @media only screen and (max-width: 480px) {
            .mobile-title {
                font-size: 22px !important;
            }
            .mobile-padding {
                padding: 15px !important;
            }
            .mobile-header-padding {
                padding: 15px 15px 8px 15px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #050505;">
        <tr>
            <td align="center" class="mobile-outer-padding" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width: 600px; background-color: #141414; border-radius: 8px; border: 1px solid #30333A;">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td align="left" class="mobile-header-padding" style="padding: 40px 40px 20px 40px;">
                            <img src="https://ik.imagekit.io/a6fkjou7d/dark-logo.png?updatedAt=1756378431634" alt="Standord Inventory Logo" width="150" style="max-width: 100%; height: auto;">
                        </td>
                    </tr>
                    
                    <!-- Dashboard Preview Image -->
                    <tr>
                        <td align="center" class="dashboard-preview" style="padding: 40px 40px 0px 40px;">
                            <img src="https://ik.imagekit.io/a6fkjou7d/dashboard-preview.png?updatedAt=1756378548102" alt="Standord Inventory Dashboard Preview" width="100%" style="max-width: 520px; width: 100%; height: auto; border-radius: 12px; border: 1px solid #30333A;">
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="mobile-padding" style="padding: 40px 40px 40px 40px;">
                            
                            <!-- Welcome Heading -->
                            <h1 class="mobile-title dark-text" style="margin: 0 0 30px 0; font-size: 24px; font-weight: 600; color: #FDD458; line-height: 1.2;">
                                Welcome aboard {{name}}
                            </h1>
                            
                            <!-- Intro Text -->
                            {{intro}}  
                            
                            <!-- Feature List Label -->
                            <p class="mobile-text dark-text-secondary" style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #CCDADC; font-weight: 600;">
                                Here's what you can do right now:
                            </p>
                            
                            <!-- Feature List -->
                            <ul class="mobile-text dark-text-secondary" style="margin: 0 0 30px 0; padding-left: 20px; font-size: 16px; line-height: 1.6; color: #CCDADC;">
                                <li style="margin-bottom: 12px;">Add <strong>products</strong>, <strong>brands</strong>, and <strong>categories</strong> to get your catalog ready</li>
                                <li style="margin-bottom: 12px;">Set up <strong>units of measurement</strong> and <strong>suppliers</strong> for smooth purchasing</li>
                                <li style="margin-bottom: 12px;">Start tracking stock with <strong>batches</strong>, <strong>low‑stock alerts</strong>, and <strong>QR/barcode labels</strong></li>
                            </ul>
                            
                            <!-- Additional Text -->
                            <p class="mobile-text dark-text-secondary" style="margin: 0 0 40px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">
                                We'll keep you informed with timely updates, insights, and alerts — so you can focus on making the right calls.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 40px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="https://stock-market-dev.vercel.app/inventory" style="display: block; width: 100%; background: linear-gradient(135deg, #FDD458 0%, #E8BA40 100%); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; line-height: 1; text-align: center; box-sizing: border-box;">
                                            Open Inventory
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Footer Text -->
                            <p class="mobile-text dark-text-muted" style="margin: 40px 0 0 0; font-size: 14px; line-height: 1.5; color: #CCDADC !important; text-align: center;">
                               Standord Inventory HQ, 200 Market Street, San Francisco, CA 94105<br>
                                <a href="#" style="color: #CCDADC !important; text-decoration: underline;">Unsubscribe</a> | 
                                <a href="https://stock-market-dev.vercel.app/" style="color: #CCDADC !important; text-decoration: underline;">Visit Standord Inventory</a><br>
                                © 2025 Standord Inventory
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

export const DAILY_INVENTORY_SUMMARY_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>Daily Inventory Summary</title>
    <style type="text/css">
        @media (prefers-color-scheme: dark) {
            .email-container { background-color: #141414 !important; border: 1px solid #30333A !important; }
            .dark-text { color: #ffffff !important; }
            .dark-text-secondary { color: #9ca3af !important; }
        }
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: 0 !important; }
            .mobile-padding { padding: 24px !important; }
            .mobile-title { font-size: 22px !important; line-height: 1.3 !important; }
        }
    </style>
    </head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #050505;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width: 600px; background-color: #141414; border-radius: 8px; border: 1px solid #30333A;">
                    <tr>
                        <td align="left" style="padding: 32px 32px 16px 32px;">
                            <img src="https://ik.imagekit.io/a6fkjou7d/dark-logo.png?updatedAt=1756378431634" alt="Standord Inventory Logo" width="150" style="max-width: 100%; height: auto;">
                        </td>
                    </tr>
                    <tr>
                        <td class="mobile-padding" style="padding: 16px 32px 32px 32px;">
                            <h1 class="mobile-title dark-text" style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #FDD458; line-height: 1.2;">Daily inventory summary</h1>
                            {{summary}}
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 0 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="https://stock-market-dev.vercel.app/inventory" style="display: block; width: 100%; background: linear-gradient(135deg, #FDD458 0%, #E8BA40 100%); color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500; line-height: 1; text-align: center; box-sizing: border-box;">Open Inventory</a>
                                    </td>
                                </tr>
                            </table>
                            <p class="mobile-text dark-text-secondary" style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #CCDADC;">This is an automated summary based on your last 24 hours of stock activity and recent trends.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

export const ADDED_USER_CREDENTIALS_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>User Account Created</title>
    <style type="text/css">
        @media (prefers-color-scheme: dark) {
            .email-container { background-color: #141414 !important; border: 1px solid #30333A !important; }
            .dark-text { color: #ffffff !important; }
            .dark-text-secondary { color: #9ca3af !important; }
        }
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: 0 !important; }
            .mobile-padding { padding: 24px !important; }
            .mobile-title { font-size: 22px !important; line-height: 1.3 !important; }
        }
    </style>
    </head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #050505;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width: 600px; background-color: #141414; border-radius: 8px; border: 1px solid #30333A;">
                    <tr>
                        <td align="left" style="padding: 32px 32px 16px 32px;">
                            <img src="https://ik.imagekit.io/a6fkjou7d/dark-logo.png?updatedAt=1756378431634" alt="Standord Inventory Logo" width="150" style="max-width: 100%; height: auto;">
                        </td>
                    </tr>
                    <tr>
                        <td class="mobile-padding" style="padding: 16px 32px 32px 32px;">
                            <h1 class="mobile-title dark-text" style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #FDD458; line-height: 1.2;">Your account is ready</h1>
                            <p class="dark-text" style="margin: 0 0 12px 0; font-size: 16px; line-height: 1.6; color: #ffffff;">Hi {{name}},</p>
                            <p class="dark-text-secondary" style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">A new account has been created for you on <strong>Standord Inventory</strong>. Use the credentials below to sign in.</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 16px 0; background-color: #0B0B0B; border: 1px solid #30333A; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p class="dark-text" style="margin: 0 0 8px 0; font-size: 14px; color: #9CA3AF;">Email</p>
                                        <p class="dark-text" style="margin: 0; font-size: 16px; color: #ffffff; word-break: break-all;">{{email}}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px; border-top: 1px solid #30333A;">
                                        <p class="dark-text" style="margin: 0 0 8px 0; font-size: 14px; color: #9CA3AF;">Temporary password</p>
                                        <p class="dark-text" style="margin: 0; font-size: 16px; color: #ffffff;">{{password}}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px; border-top: 1px solid #30333A;">
                                        <p class="dark-text" style="margin: 0 0 8px 0; font-size: 14px; color: #9CA3AF;">Role</p>
                                        <p class="dark-text" style="margin: 0; font-size: 16px; color: #ffffff; text-transform: capitalize;">{{role}}</p>
                                    </td>
                                </tr>
                            </table>

                            <p class="dark-text-secondary" style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #CCDADC;">For security, you'll be asked to change your password after signing in.</p>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="https://stock-market-dev.vercel.app/sign-in" style="display: block; width: 100%; background: linear-gradient(135deg, #FDD458 0%, #E8BA40 100%); color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500; line-height: 1; text-align: center; box-sizing: border-box;">Sign in</a>
                                    </td>
                                </tr>
                            </table>

                            <p class="dark-text-secondary" style="margin: 0; font-size: 12px; line-height: 1.6; color: #9CA3AF;">If you didn't expect this email, you can ignore it.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
