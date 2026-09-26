function doPost(e) {
  const name = Utilities.formatDate(new Date(), 'GMT+1', 'yyyyMMdd-HHmmss') + '.jpg';
  const subFolderName = Utilities.formatDate(new Date(), 'GMT+1', 'yyyyMMdd');
  const folderName = e.parameters.folder || 'ESP32-CAM';
  
  const data = Utilities.base64Decode(e.postData.contents);
  
  // FIXED: Use standard 'image/jpeg' instead of 'image/jpg'
  const blob = Utilities.newBlob(data, 'image/jpeg', name);

  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  let subFolder;
  const subFolders = folder.getFoldersByName(subFolderName);
  if (subFolders.hasNext()) {
    subFolder = subFolders.next();
  } else {
    subFolder = folder.createFolder(subFolderName);
  }
  
  const file = subFolder.createFile(blob);
  Logger.log(`📁 Saved to Drive: ${folderName}/${subFolderName}/${name}`);
  
  // --- Forward to Next.js Dashboard via Cloudflare Tunnel ---
  try {
    const webhookUrl = "https://dir-close-testimony-pulled.trycloudflare.com/api/webhook";
    
    const payload = JSON.stringify({
      image: e.postData.contents
    });
    
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log(`🌐 Webhook response: ${responseCode}`);
    Logger.log(`🌐 Webhook body: ${responseBody}`);
    
    if (responseCode !== 200) {
      Logger.log(`⚠️ Webhook returned ${responseCode}: ${responseBody}`);
    }
    
  } catch(error) {
    Logger.log('❌ Webhook error: ' + error);
  }
  
  return ContentService.createTextOutput('Done');
}
