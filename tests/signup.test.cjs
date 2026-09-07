const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('server/email-signup.gs','utf8');
function run(overrides={}) {
  const rows=[];
  const context={
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>key==='TURNSTILE_SECRET'?'test-secret':null})},
    UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify(overrides.verification || {success:true,action:'newsletter',hostname:'alexkirshner.com'})})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
    SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>({getLastRow:()=>1,getRange:()=>({createTextFinder:()=>({matchEntireCell(){return this},matchCase(){return this},findNext:()=>overrides.duplicate||null})}),appendRow:row=>{if(overrides.storageError)throw Error('failure');rows.push(row)}})})},
    HtmlService:{createHtmlOutput:html=>html},
  };
  vm.createContext(context);vm.runInContext(source,context);
  const output=context.doPost({parameter:{email:'Reader@example.com','cf-turnstile-response':'test-token',...overrides.params}});
  return {rows,output};
}
test('valid signup saves normalized address before reporting success',()=>{const r=run();assert.equal(r.rows.length,1);assert.equal(r.rows[0][1],'reader@example.com');assert.match(r.output,/Thanks for signing up/)});
for(const [name,options] of Object.entries({missingToken:{params:{'cf-turnstile-response':''}},honeypot:{params:{website:'spam'}},invalidEmail:{params:{email:'bad'}},formula:{params:{email:'=reader@example.com'}},failedChallenge:{verification:{success:false}},wrongHost:{verification:{success:true,hostname:'attacker.com',action:'newsletter'}},wrongAction:{verification:{success:true,hostname:'alexkirshner.com',action:'login'}},storageFailure:{storageError:true}}))test(name+' rejects without writing or claiming success',()=>{const r=run(options);assert.equal(r.rows.length,0);assert.match(r.output,/could not be completed/)});
test('duplicate addresses do not create another row',()=>{const r=run({duplicate:true});assert.equal(r.rows.length,0);assert.match(r.output,/Thanks for signing up/)});
