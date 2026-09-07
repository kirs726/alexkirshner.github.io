const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('server/email-signup.gs','utf8');
function run(overrides={}) {
  const rows=[];
  const context={
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='TURNSTILE_SECRET'?(overrides.noSecret?null:'test-secret'):null})},
    UrlFetchApp:{fetch:()=>({getResponseCode:()=>overrides.verifyStatus||200,getContentText:()=>JSON.stringify(overrides.verification || {success:true,action:'newsletter',hostname:'alexkirshner.com'})})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>overrides.noSheet?null:({getLastRow:()=>1,getRange:()=>({createTextFinder:()=>({matchEntireCell(){return this},matchCase(){return this},findNext:()=>overrides.duplicate||null})}),appendRow:row=>{if(overrides.storageError)throw Error('failure');rows.push(row)}})})},
    HtmlService:{createHtmlOutput:html=>html},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this}})},
  };
  vm.createContext(context);vm.runInContext(source,context);
  const params={email:'Reader@example.com','cf-turnstile-response':'test-token',...(overrides.json?{format:'json'}:{}),...overrides.params};
  const output=context.doPost({parameter:params});
  return {rows,output:overrides.json?JSON.parse(output.text):output};
}
const rejections={missingToken:{params:{'cf-turnstile-response':''}},honeypot:{params:{website:'spam'}},invalidEmail:{params:{email:'bad'}},formula:{params:{email:'=reader@example.com'}},failedChallenge:{verification:{success:false,'error-codes':['invalid-input-response']}},wrongHost:{verification:{success:true,hostname:'attacker.com',action:'newsletter'}},wrongAction:{verification:{success:true,hostname:'alexkirshner.com',action:'login'}},storageFailure:{storageError:true},missingSecret:{noSecret:true},missingSheet:{noSheet:true},verifyHttpError:{verifyStatus:500}};
const reasons={missingToken:'missing_token',honeypot:'honeypot',invalidEmail:'invalid_email',formula:'invalid_email',failedChallenge:'verify_failed:invalid-input-response',wrongHost:'wrong_hostname',wrongAction:'wrong_action',storageFailure:'exception:failure',missingSecret:'missing_secret',missingSheet:'sheet_not_found',verifyHttpError:'verify_http_500'};

test('valid signup saves normalized address before reporting success (HTML)',()=>{const r=run();assert.equal(r.rows.length,1);assert.equal(r.rows[0][1],'reader@example.com');assert.match(r.output,/Thanks for signing up/)});
test('valid signup returns JSON ok with saved reason',()=>{const r=run({json:true});assert.equal(r.rows.length,1);assert.deepEqual(r.output,{ok:true,reason:'saved'})});
for(const [name,options] of Object.entries(rejections)){
  test(name+' rejects without writing or claiming success (HTML)',()=>{const r=run(options);assert.equal(r.rows.length,0);assert.match(r.output,/could not be completed/)});
  test(name+' returns JSON failure with reason '+reasons[name],()=>{const r=run({...options,json:true});assert.equal(r.rows.length,0);assert.equal(r.output.ok,false);assert.equal(r.output.reason,reasons[name])});
}
test('duplicate addresses do not create another row (HTML)',()=>{const r=run({duplicate:true});assert.equal(r.rows.length,0);assert.match(r.output,/Thanks for signing up/)});
test('duplicate addresses report already_subscribed in JSON',()=>{const r=run({duplicate:true,json:true});assert.equal(r.rows.length,0);assert.deepEqual(r.output,{ok:true,reason:'already_subscribed'})});

test('cleanupList moves bot-flagged and repeat addresses to Removed and keeps the rest',()=>{
  const d=new Date();
  const rows=[[d,'alex@splitzoneduo.com',''],[d,'reader@example.com',''],[d,'bot@example.com','url field filled'],[d,'Alex@splitzoneduo.com',''],[d,'spam@example.com','honeypot filled, url field filled'],[d,'slow@example.com','submitted in -6.5s']];
  let kept,removedRows,cleared=false;
  const removedSheet={getLastRow:()=>0,getRange:()=>({setValues:v=>{removedRows=v}})};
  const mainSheet={getDataRange:()=>({getValues:()=>rows}),clearContents:()=>{cleared=true},getRange:()=>({setValues:v=>{kept=v}})};
  const context={
    PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})},
    SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:name=>name==='Removed'?null:mainSheet,insertSheet:()=>removedSheet})},
    Logger:{log:()=>{}},
  };
  vm.createContext(context);vm.runInContext(source,context);
  context.cleanupList();
  assert.equal(cleared,true);
  assert.deepEqual([...kept].map(r=>r[1]),['alex@splitzoneduo.com','reader@example.com','slow@example.com']);
  assert.deepEqual([...removedRows].map(r=>[r[1],r[3]]),[['bot@example.com','bot'],['Alex@splitzoneduo.com','duplicate'],['spam@example.com','bot']]);
});
