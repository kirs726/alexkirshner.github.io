// Deploy from the existing Google Sheet's Apps Script editor.
// Required Script Property: TURNSTILE_SECRET. Optional: SHEET_NAME (default Sheet1).
function doPost(e) {
  var params = (e && e.parameter) || {};
  var wantsJson = params.format === 'json';
  var respond = function (ok, reason) { return wantsJson ? jsonResult(ok, reason) : signupPage(ok); };
  var email = String(params.email || '').trim().toLowerCase();
  if (params.website) return respond(false, 'honeypot');
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email)) return respond(false, 'invalid_email');
  // Reject formula-like leading characters before writing to a spreadsheet.
  if (/^[=+\-@]/.test(email)) return respond(false, 'invalid_email');
  var token = params['cf-turnstile-response'];
  if (!token || token.length > 2048) return respond(false, 'missing_token');
  var properties = PropertiesService.getScriptProperties();
  var secret = properties.getProperty('TURNSTILE_SECRET');
  if (!secret) return respond(false, 'missing_secret');
  try {
    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', payload: { secret: secret, response: token }, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return respond(false, 'verify_http_' + response.getResponseCode());
    var result = JSON.parse(response.getContentText());
    if (!result.success) return respond(false, 'verify_failed:' + ((result['error-codes'] || []).join(',') || 'unknown'));
    if (result.action !== 'newsletter') return respond(false, 'wrong_action');
    if (['alexkirshner.com', 'www.alexkirshner.com'].indexOf(result.hostname) === -1) return respond(false, 'wrong_hostname');
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return respond(false, 'lock_busy');
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(properties.getProperty('SHEET_NAME') || 'Sheet1');
      if (!sheet) return respond(false, 'sheet_not_found');
      // Preserve the existing Timestamp | Email | Bot flag layout. Old rows remain untouched.
      var lastRow = sheet.getLastRow();
      var exists = lastRow > 0 && sheet.getRange(1, 2, lastRow, 1).createTextFinder(email).matchEntireCell(true).matchCase(false).findNext();
      if (!exists) sheet.appendRow([new Date(), email, '']);
      return respond(true, exists ? 'already_subscribed' : 'saved');
    } finally { lock.releaseLock(); }
  } catch (error) {
    // Do not log addresses, tokens, or secrets.
    return respond(false, 'exception:' + String(error && error.message || error).slice(0, 120));
  }
}
function doGet() { return signupPage(false); }
// One-off maintenance: run from the editor. Moves bot-flagged rows and repeat addresses
// to a "Removed" tab instead of deleting them. Safe to run more than once.
function cleanupList() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(PropertiesService.getScriptProperties().getProperty('SHEET_NAME') || 'Sheet1');
  var removed = spreadsheet.getSheetByName('Removed') || spreadsheet.insertSheet('Removed');
  var seen = {}, keep = [], drop = [];
  sheet.getDataRange().getValues().forEach(function (row) {
    var email = String(row[1] || '').trim().toLowerCase();
    if (!email) { keep.push(row); return; }
    if (/honeypot|url field/i.test(String(row[2] || ''))) { drop.push(row.concat(['bot'])); return; }
    if (seen[email]) { drop.push(row.concat(['duplicate'])); return; }
    seen[email] = true;
    keep.push(row);
  });
  if (drop.length) removed.getRange(removed.getLastRow() + 1, 1, drop.length, drop[0].length).setValues(drop);
  sheet.clearContents();
  if (keep.length) sheet.getRange(1, 1, keep.length, keep[0].length).setValues(keep);
  Logger.log('Kept ' + keep.length + ' rows, moved ' + drop.length + ' to Removed.');
}
function jsonResult(ok, reason) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok, reason: reason })).setMimeType(ContentService.MimeType.JSON);
}
function signupPage(success) {
  var title = success ? 'Thanks for signing up.' : 'Your signup could not be completed.';
  var message = success ? 'You’re on the list for updates from Alex Kirshner.' : 'Please return to the site and try again, or email alex@splitzoneduo.com.';
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + title + '</title></head><body style="font:18px/1.6 system-ui;background:#faf9f5;color:#242b28;padding:8vw;max-width:650px"><h1>' + title + '</h1><p>' + message + '</p><a href="https://alexkirshner.com" target="_top">Back to Alex’s website →</a></body></html>');
}
