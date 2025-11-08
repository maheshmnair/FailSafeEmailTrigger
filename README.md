# FailSafeEmailTrigger

A lightweight **dead man’s switch** built using **Google Apps Script**. It sends you a daily check-in email, and if you don’t confirm for a set number of days, it sends a **one-time alert email** (optionally with a PDF) to a backup contact.

## What it does

- Sends a **daily “Are you okay?”** email with a YES link  
- Resets the counter when you click the link  
- If you don’t respond for 7 consecutive days, sends an alert email to your emergency contact.
- The alert email can contain details to be conveyed to your emergency contact post your demise.
- All settings stored in **Script Properties**

## Setup (Quick)

1. Create a new Google Apps Script project and add the files from this repo.  
2. Set your **Script Properties**:
   - `PRIMARY_EMAIL`
   - `SECONDARY_EMAIL`
   - Optional: `PDF_DRIVE_FILE_ID`, logging options  
3. Deploy as a **Web App** (Execute as: Me, Access: Anyone with the link).  
4. Create a **daily time-based trigger** for the check-in function.

## How it works

- A daily trigger sends the check-in email.  
- Clicking YES hits the Web App and resets the counter.  
- If the counter reaches the limit, the script sends a one-time alert.  

## Optional

- Log activity to a Google Sheet  
- Attach a PDF from Drive  
- Customize email subjects, body text, and timing  
