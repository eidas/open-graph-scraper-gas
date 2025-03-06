/**
 * open-graph-scraper-gasを使用するサンプルスクリプト
 */

/**
 * 指定したURLからOpenGraphメタデータを抽出する
 */
function getOpenGraphData(url) {
  try {
    const options = {
      url: url,
      timeout: 10, // タイムアウト（秒）
      fetchOptions: {
        muteHttpExceptions: true,
        followRedirects: true
      }
    };
    
    // open-graph-scraperを実行
    const result = runOpenGraphScraper(options);
    
    return result.result;
  } catch (error) {
    Logger.log('Error: ' + error.message);
    return {
      error: true,
      message: error.message
    };
  }
}

/**
 * SpreadsheetのURLリストからOGデータを取得してシートに書き込む
 */
function processUrlsFromSpreadsheet() {
  // アクティブなスプレッドシートを取得
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName('URLs');
  const outputSheet = ss.getSheetByName('OGData');
  
  if (!inputSheet || !outputSheet) {
    throw new Error('シート「URLs」と「OGData」が必要です');
  }
  
  // URLの一覧を取得
  const urls = inputSheet.getRange(2, 1, inputSheet.getLastRow() - 1, 1).getValues().flat().filter(url => url);
  
  // 出力シートの準備
  outputSheet.clear();
  outputSheet.appendRow(['URL', 'タイトル', '説明', '画像URL', 'サイト名', 'タイプ']);
  
  // 各URLを処理
  urls.forEach((url, index) => {
    // 進捗をログ出力
    Logger.log(`処理中 ${index + 1}/${urls.length}: ${url}`);
    
    try {
      const ogData = getOpenGraphData(url);
      
      // 結果をシートに追加
      outputSheet.appendRow([
        url,
        ogData.ogTitle || '',
        ogData.ogDescription || '',
        ogData.ogImage?.[0]?.url || '',
        ogData.ogSiteName || '',
        ogData.ogType || ''
      ]);
      
      // リクエスト間隔を空ける（サーバー負荷軽減のため）
      Utilities.sleep(1000);
    } catch (error) {
      outputSheet.appendRow([url, 'エラー', error.message, '', '', '']);
      Logger.log(`Error processing ${url}: ${error.message}`);
    }
  });
  
  Logger.log('完了！');
}

/**
 * Google Apps Scriptでシンプルに使えるラッパー関数
 */
function getOGData(url) {
  const data = getOpenGraphData(url);
  return {
    title: data.ogTitle || '',
    description: data.ogDescription || '',
    image: data.ogImage?.[0]?.url || '',
    siteName: data.ogSiteName || '',
    type: data.ogType || '',
    url: data.ogUrl || url
  };
}

/**
 * Webアプリケーションとして公開した場合のエンドポイント関数
 */
function doGet(e) {
  const url = e.parameter.url;
  
  if (!url) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'URL parameter is required'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    const data = getOGData(url);
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}