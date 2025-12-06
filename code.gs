/**
 * Automated Daily Check-in Script
 *
 * This script sends a daily email with a "YES" button.
 * If the button is clicked, it records the click.
 * If X days pass with no click, it sends an alert email with a PDF attachment.
 * After Y days of no clicks, the primary check-in email stops sending.
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

// NUMBER OF DAYS SETTINGS
// -----------------------
// How many days of silence before sending the alert to the secondary email?
const ALERT_THRESHOLD_DAYS = <ENTER DESIRED INTEGER VALUE>; 

// How many days of silence before stopping the daily check-in emails entirely?
const STOP_EMAILS_THRESHOLD_DAYS = <ENTER DESIRED INTEGER VALUE>;

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
 * Web App function: Runs when "YES" is clicked.
 */
function doGet(e) {
  try {
    const now = new Date().toISOString();
    scriptProperties.setProperty('lastClickDate', now);
    scriptProperties.setProperty('alertSent', 'false');

    Logger.log("--- 'YES' button clicked. Timestamp recorded: " + now);

    return HtmlService.createHtmlOutput(
      "<div style='font-family: Arial, sans-serif; padding: 30px; text-align: center;'>" +
      "<h1 style='color: #4CAF50;'>Thank You!</h1>" +
      "<p style='font-size: 1.2em;'>Your check-in for today has been recorded.</p>" +
      "<p>You can safely close this window.</p>" +
      "</div>"
    );
  } catch (error) {
    Logger.log("--- ERROR in doGet: " + error.message);
    return HtmlService.createHtmlOutput("<p>Error recording click.</p>");
  }
}

/**
 * Helper function to determine the "Reference Date".
 * Returns the Last Click Date. If no click exists, returns the Script Start Date.
 */
function getReferenceDate() {
  const lastClickDateStr = scriptProperties.getProperty('lastClickDate');
  const startDateStr = scriptProperties.getProperty('startDate');
  
  if (lastClickDateStr) {
    return new Date(lastClickDateStr);
  } else if (startDateStr) {
    return new Date(startDateStr);
  } else {
    return null; // Should only happen on the very first run
  }
}

/**
 * Sends the daily check-in email.
 * Stops sending if > STOP_EMAILS_THRESHOLD_DAYS since last interaction (or start date).
 */
function sendCheckInEmail() {
  Logger.log("--- Running sendCheckInEmail...");

  // 1. Initialize Start Date if it doesn't exist (First Run Logic)
  let startDateStr = scriptProperties.getProperty('startDate');
  if (!startDateStr) {
    Logger.log("--- First run detected. Setting 'startDate'.");
    scriptProperties.setProperty('startDate', new Date().toISOString());
  }

  // 2. Check Stop Rule
  const referenceDate = getReferenceDate();
  
  if (referenceDate) {
    const now = new Date();
    const stopThresholdInMillis = STOP_EMAILS_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    const timeDifference = now.getTime() - referenceDate.getTime();
    const daysDiff = (timeDifference / (1000 * 60 * 60 * 24)).toFixed(1);

    Logger.log(`--- Days since last activity: ${daysDiff}`);
    
    if (timeDifference > stopThresholdInMillis) {
      Logger.log(`--- ${STOP_EMAILS_THRESHOLD_DAYS}-day threshold EXCEEDED. Stopping email.`);
      return; // STOP HERE
    }
  }

  // 3. Send the Email
  const webAppUrl = ScriptApp.getService().getUrl();
  if (!webAppUrl) {
    Logger.log("--- ERROR: Deploy as Web App first.");
    return;
  }

  const buttonHtml =
    "<div style='padding: 20px; text-align: center;'>" +
    "<a href='" + webAppUrl + "' style='background-color: #4CAF50; color: white; padding: 15px 32px; text-decoration: none; border-radius: 8px;'>CLICK 'YES' TO CHECK IN</a>" +
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
    Logger.log("--- Primary check-in email sent.");
  } catch (error) {
    Logger.log("--- ERROR sending primary email: " + error.message);
  }
}

/**
 * Checks for lapse based on ALERT_THRESHOLD_DAYS.
 * Uses Start Date if no clicks have ever occurred.
 */
function checkSevenDayLapse() {
  Logger.log("--- Running lapse check...");
  const alertSent = scriptProperties.getProperty('alertSent');

  if (alertSent === 'true') {
    Logger.log("--- Alert already sent. No action taken.");
    return;
  }

  const referenceDate = getReferenceDate();
  
  if (!referenceDate) {
    Logger.log("--- No reference date found (Script too new?). No action.");
    return;
  }

  const now = new Date();
  const alertThresholdInMillis = ALERT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  const timeDifference = now.getTime() - referenceDate.getTime();
  const daysDiff = (timeDifference / (1000 * 60 * 60 * 24)).toFixed(1);
  
  Logger.log(`--- Days since last activity: ${daysDiff}`);

  if (timeDifference > alertThresholdInMillis) {
    Logger.log(`--- ${ALERT_THRESHOLD_DAYS}-day threshold EXCEEDED. Sending Alert.`);
    scriptProperties.setProperty('alertSent', 'true'); // Set flag FIRST
    sendAlertEmail();
  } else {
    Logger.log(`--- Within ${ALERT_THRESHOLD_DAYS}-day window. No alert sent.`);
  }
}

function sendAlertEmail() {
  try {
    const pdfFile = DriveApp.getFileById(PDF_FILE_ID);
    const pdfBlob = pdfFile.getBlob();

    MailApp.sendEmail({
      to: SECONDARY_EMAIL,
      subject: SECONDARY_SUBJECT,
      htmlBody: SECONDARY_BODY,
      attachments: [pdfBlob]
    });
    Logger.log("--- Alert sent to " + SECONDARY_EMAIL);
  } catch (error) {
    Logger.log("--- ERROR sending alert: " + error.message);
    try {
      MailApp.sendEmail({
        to: SECONDARY_EMAIL,
        subject: "SCRIPT ERROR: Failed to Send Alert",
        htmlBody: "Error: " + error.message
      });
    } catch(e) {}
  }
}
