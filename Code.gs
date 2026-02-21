/** * GALAXIA v34 - 14學群變色星星穩定版 */
const IMAGE_FOLDER_ID = '1MAfW7NY2LefvGnWqlmysqh7tttJz6fUz'; 
const STAFF_SECRET = "enlightendream"; 

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('GALAXIA')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 自動修正電話格式
function formatPhone(num) {
  let s = num.toString().trim().replace(/\D/g, '');
  if (s.length === 9 && s.startsWith('9')) s = "0" + s;
  return s;
}

function checkLogin(val, mode) {
  const data = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("成員名單").getDataRange().getValues();
  let input = val.toString().trim().toUpperCase();
  if (!isNaN(input)) input = formatPhone(input);

  for (let i = 1; i < data.length; i++) {
    let dbID = data[i][0].toString().toUpperCase().trim();
    let dbPIN = data[i][1].toString().toUpperCase().trim();
    let dbName = data[i][2];
    let dbRole = data[i][3];
    let dbPhone = formatPhone(data[i][4]);

    if (mode === 'parent' && input === dbPIN) return { success: true, id: dbID, name: dbName, role: 'parent' };
    if (mode !== 'parent' && (input === dbPhone || input === dbID) && dbRole === mode) {
      return { success: true, id: dbID, name: dbName, role: mode };
    }
  }
  return { success: false, msg: "驗證失敗，查無資料" };
}

function registerUser(obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("成員名單") || ss.insertSheet("成員名單");
  let inputPhone = formatPhone(obj.phone);
  
  let fID, fPIN;
  if (obj.role === "staff") {
    if (obj.secret !== STAFF_SECRET) return { success: false, msg: "金鑰錯誤" };
    fID = "SF" + inputPhone.substring(inputPhone.length-4); fPIN = "MASTER";
  } else {
    fID = `${obj.year.substring(2,4)}${obj.campType==='夏令營'?'S':'W'}${obj.batchNum}${obj.groupNum.toString().padStart(2,'0')}${sheet.getLastRow().toString().padStart(2,'0')}`;
    fPIN = Array.from({length:6}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join('');
  }
  sheet.appendRow([fID, fPIN, obj.name, obj.role, "'" + inputPhone, obj.year, obj.campType, "學員", obj.batchNum, obj.groupNum]);
  return { success: true, id: fID, pin: fPIN };
}

// 核心：取得星星顏色狀態
function getStarStatus(uid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("任務紀錄");
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const statusMap = {};
  data.filter(r => r[1].toString() === uid.toString()).forEach(r => {
    statusMap[r[3]] = r[9]; // 抓取最新的溫度
  });
  return statusMap;
}

function uploadTask(obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("任務紀錄") || ss.insertSheet("任務紀錄");
  sheet.appendRow([new Date(), obj.id, obj.name, obj.field, obj.date, obj.o, obj.r, obj.i, obj.d, obj.temp, obj.imgUrl]);
  return { success: true };
}

function uploadFile(base64Data, fileName) {
  const folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
  const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
  const file = folder.createFile(Utilities.newBlob(bytes, "image/jpeg", fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}
