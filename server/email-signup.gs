// Deploy from the existing Google Sheet's Apps Script editor.
// Required Script Property: TURNSTILE_SECRET. Optional: SHEET_NAME (default Sheet1).
function doPost(e) {
  var params = (e && e.parameter) || {};
  var email = String(params.email || '').trim().toLowerCase();
  var fail = function () { return signupPage(false); };
  if (params.website || email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email)) return fail();
  // Reject formula-like leading characters before writing to a spreadsheet.
  if (/^[=+\-@]/.test(email)) return fail();
  var token = params['cf-turnstile-response'];
  var properties = PropertiesService.getScriptProperties();
  var secret = properties.getProperty('TURNSTILE_SECRET');
  if (!secret || !token || token.length > 2048) return fail();
  try {
    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', payload: { secret: secret, response: token }, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return fail();
    var result = JSON.parse(response.getContentText());
    if (!result.success || result.action !== 'newsletter' || ['alexkirshner.com', 'www.alexkirshner.com'].indexOf(result.hostname) === -1) return fail();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return fail();
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(properties.getProperty('SHEET_NAME') || 'Sheet1');
      if (!sheet) return fail();
      // Preserve the existing Timestamp | Email | Bot flag layout. Old rows remain untouched.
      var lastRow = sheet.getLastRow();
      var exists = lastRow > 0 && sheet.getRange(1, 2, lastRow, 1).createTextFinder(email).matchEntireCell(true).matchCase(false).findNext();
      if (!exists) sheet.appendRow([new Date(), email, '']);
      return signupPage(true);
    } finally { lock.releaseLock(); }
  } catch (error) {
    // Do not log addresses, tokens, or secrets.
    return fail();
  }
}
function doGet() { return signupPage(false); }
function signupPage(success) {
  var title = success ? 'Thanks for signing up.' : 'Your signup could not be completed.';
  var message = success ? 'You’re on the list for updates from Alex Kirshner.' : 'Please return to the site and try again, or email alex@splitzoneduo.com.';
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + title + '</title></head><body style="font:18px/1.6 system-ui;background:#faf9f5;color:#242b28;padding:8vw;max-width:650px"><h1>' + title + '</h1><p>' + message + '</p><a href="https://alexkirshner.com" target="_top">Back to Alex’s website →</a></body></html>');
}
