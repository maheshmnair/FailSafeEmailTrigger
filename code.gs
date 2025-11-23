/**
 * Automated Daily Check-in Script
 *
 * This script sends a daily email with a "YES" button.
 * If the button is clicked, it records the click.
 * If 7 days pass with no click, it sends an alert email with a PDF attachment
 * to a secondary email address.
 */

// --- (1) CONFIGURE YOUR SCRIPT HERE ---

// The email address to send the daily "YES" button email to.
const PRIMARY_EMAIL = "<PRIMARY_EMAIL_ID>";

// The email address to send the 7-day alert to.
const SECONDARY_EMAIL = "<SECONDARY_EMAIL_ID>";

// The subject line for the daily "YES" button email.
const PRIMARY_SUBJECT = "Daily Check-in: Are you okay?";

// The subject line for the 7-day alert email.
const SECONDARY_SUBJECT = "ALERT: No response from Mahesh for last 7 days";

// The HTML body for the 7-day alert email.
// We use <p> tags for paragraphs, which create clean line breaks.
const SECONDARY_BODY = "<p>Hello, this is an automated alert. ‼️</p>" +
                       "<p>No response has been received from <YOUR_NAME>'s live check emails for 7 consecutive days. 😟</p>" +
                       "<p>Therefore, as a precaution, we are sending all of Mahesh's important documents to your inbox. 📂</p>" +
                       "<p>Please go through them thoroughly.</p>";


// --- PDF ATTACHMENT ---
// 1. Upload your PDF to Google Drive.
// 2. Right-click the PDF -> "Get link".
// 3. Change "Restricted" to "Anyone with the link".
// 4. Copy the File ID from the URL. (e.g., in the URL .../d/FILE_ID/edit)
const PDF_FILE_ID = "<FILE_ID>";

// --- (2) END OF CONFIGURATION ---
// Do not edit below this line unless you know what you are doing.

// --- SCRIPT INTERNALS ---

// Use script properties to store the last click date and alert status
const scriptProperties = PropertiesService.getScriptProperties();

/**
 * This is the Web App function. It runs when the "YES" button is clicked.
 * It records the click time and shows a confirmation message.
 * It also resets the 'alertSent' flag.
 */
function doGet(e) {
  try {
    const now = new Date().toISOString();
    scriptProperties.setProperty('lastClickDate', now);
    scriptProperties.setProperty('alertSent', 'false'); // Reset the alert flag

    Logger.log("--- 'YES' button clicked. Timestamp recorded: " + now);

    // Return a user-friendly confirmation message
    return HtmlService.createHtmlOutput(
      "<div style='font-family: Arial, sans-serif; padding: 30px; text-align: center;'>" +
      "<h1 style='color: #4CAF50;'>Thank You!</h1>" +
      "<p style='font-size: 1.2em;'>Your check-in for today has been recorded.</p>" +
      "<p>You can safely close this window.</p>" +
      "</div>"
    );
  } catch (error) {
    Logger.log("--- ERROR in doGet: " + error.message);
    return HtmlService.createHtmlOutput(
      "<div style='font-family: Arial, sans-serif; padding: 30px; text-align: center;'>" +
      "<h1 style='color: #D32F2F;'>Error</h1>" +
      "<p style='font-size: 1.2em;'>Sorry, there was an error recording your click.</p>" +
      "<p>Please try again. If the problem persists, check the script logs.</p>" +
      "</div>"
    );
  }
}

/**
 * Sends the daily check-in email with the "YES" button.
 * This function should be run on a daily time-based trigger.
 */
function sendCheckInEmail() {
  // Get the URL of the deployed web app
  const webAppUrl = ScriptApp.getService().getUrl();
  if (!webAppUrl) {
    Logger.log("--- ERROR: Script must be deployed as a Web App before running sendCheckInEmail.");
    return;
  }

  // HTML for the "YES" button
  const buttonHtml =
    "<div style='padding: 20px; text-align: center;'>" +
    "<a href='" + webAppUrl + "' " +
    "style='" +
    "background-color: #4CAF50; " +
    "color: white; " +
    "padding: 15px 32px; " +
    "text-align: center; " +
    "text-decoration: none; " +
    "display: inline-block; " +
    "font-size: 16px; " +
    "font-family: Arial, sans-serif; " +
    "font-weight: bold; " +
    "margin: 4px 2px; " +
    "cursor: pointer; " +
    "border: none; " +
    "border-radius: 8px;'" +
    ">" +
    "CLICK 'YES' TO CHECK IN" +
    "</a>" +
    "</div>";

  const emailBody =
    "<p style='font-family: Arial, sans-serif; font-size: 1.1em; text-align: center;'>" +
    "This is your automated daily check-in. Please confirm you are OK by clicking the button below." +
    "</p>" +
    buttonHtml +
    "<p style='font-family: Arial, sans-serif; font-size: 0.8em; text-align: center; color: #777;'>" +
    "This link is unique and logs your response." +
    "</p>";

  try {
    MailApp.sendEmail({
      to: PRIMARY_EMAIL,
      subject: PRIMARY_SUBJECT,
      htmlBody: emailBody
    });
    Logger.log("--- Primary check-in email sent to " + PRIMARY_EMAIL);
  } catch (error) {
    Logger.log("--- ERROR sending primary email: " + error.message);
  }
}

/**
 * Checks if 7 days have passed since the last click.
 * If so, sends the alert email.
 * This function should be run on a daily time-based trigger,
 * preferably an hour or two after sendCheckInEmail.
 */
function checkSevenDayLapse() {
  Logger.log("--- Running 7-day lapse check...");
  const lastClickDateStr = scriptProperties.getProperty('lastClickDate');
  const alertSent = scriptProperties.getProperty('alertSent');

  // If an alert has already been sent, do nothing until it's reset by a click.
  if (alertSent === 'true') {
    Logger.log("--- Alert already sent. No action taken.");
    return;
  }

  // If there's no click date ever, send alert immediately (or after 7 days, policy choice)
  // We'll be nice and wait 7 days from the first *email* instead.
  // For now, if no click, we just log and wait.
  if (!lastClickDateStr) {
    Logger.log("--- No click has ever been recorded. No action taken.");
    // We could also check when the script was FIRST run, but this is more complex.
    // This logic assumes 7 days *after the last click*.
    return;
  }

  const lastClickDate = new Date(lastClickDateStr);
  const now = new Date();
  const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
  const timeDifference = now.getTime() - lastClickDate.getTime();

  Logger.log("--- Last click: " + lastClickDate.toLocaleString());
  Logger.log("--- Time since last click (ms): " + timeDifference);
  Logger.log("--- 7 day threshold (ms): " + sevenDaysInMillis);

  if (timeDifference > sevenDaysInMillis) {
    Logger.log("--- 7-day threshold EXCEEDED. Sending alert.");
    sendAlertEmail();
    scriptProperties.setProperty('alertSent', 'true'); // Flag that we sent the alert
  } else {
    Logger.log("--- Within 7-day window. No alert sent.");
  }
}

/**
 * Sends the alert email with the PDF attachment.
 * This is called by checkSevenDayLapse.
 */
function sendAlertEmail() {
  try {
    const pdfFile = DriveApp.getFileById(PDF_FILE_ID);
    const pdfBlob = pdfFile.getBlob();

    MailApp.sendEmail({
      to: SECONDARY_EMAIL,
      subject: SECONDARY_SUBJECT,
      htmlBody: SECONDARY_BODY, // Use htmlBody for HTML content
      attachments: [pdfBlob]
    });
    Logger.log("--- Alert email with PDF successfully sent to " + SECONDARY_EMAIL);

  } catch (error) {
    Logger.log("--- ERROR sending alert email: " + error.message);
    // Send a fallback email WITHOUT attachment, explaining the error
    try {
      MailApp.sendEmail({
        to: SECONDARY_EMAIL,
        subject: "SCRIPT ERROR: Failed to Send Alert",
        htmlBody: "This is an automated error message.<br><br>" +
                  "The script tried to send the 7-day alert, but it FAILED.<br>" +
                  "The error was: " + error.message + "<br><br>" +
                  "This usually happens if the PDF File ID is incorrect or the script does not have permission to access the file in Google Drive."
      });
      Logger.log("--- Fallback error email sent to " + SECONDARY_EMAIL);
    } catch (e) {
      Logger.log("--- CRITICAL ERROR: Could not even send fallback email. " + e.message);
    }
  }
}
