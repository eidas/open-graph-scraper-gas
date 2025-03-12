import { load } from 'cheerio';

/**
 * Google Apps Scriptの環境でHTTPリクエストを実行してHTMLを取得
 *
 * @param {object} options - オプション設定
 * @return {object} HTMLの本文とレスポンス情報
 */
export default function requestAndResultsFormatter(options) {
  let body;
  let response;
  
  try {
    // URL エンコーディングの確認
    // eslint-disable-next-line no-control-regex
    const isLatin1 = /^[\\u0000-\\u00ff]{0,}$/;
    let url = options.url ?? '';
    
    if (!isLatin1.test(url)) {
      url = encodeURI(url);
    }

    // Google Apps Scriptのfetch処理
    const fetchOptions = {
      muteHttpExceptions: true,
      followRedirects: true,
      ...options.fetchOptions,
      headers: { 
        Origin: url, 
        Accept: 'text/html', 
        ...(options.fetchOptions?.headers || {}) 
      }
    };
    
    // タイムアウト設定
    if (options.timeout) {
      fetchOptions.timeoutInSeconds = options.timeout;
    }

    // UrlFetchAppを使用してリクエスト実行
    try {
      response = UrlFetchApp.fetch(url, fetchOptions);
    } catch (fetchError) {
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    // レスポンスの処理
    const responseCode = response.getResponseCode();
    const contentType = response.getHeaders()['Content-Type'] || '';
    
    // レスポンスボディの取得
    body = response.getContentText();
    
    // コンテンツタイプの確認
    if (contentType && !contentType.toLowerCase().includes('text/')) {
      throw new Error('Page must return a header content-type with text/');
    }
    
    // HTTP エラーコードの処理
    if (responseCode >= 400) {
      switch (responseCode) {
        case 400: throw new Error('400 Bad Request');
        case 401: throw new Error('401 Unauthorized');
        case 403: throw new Error('403 Forbidden');
        case 404: throw new Error('404 Not Found');
        case 408: throw new Error('408 Request Timeout');
        case 410: throw new Error('410 Gone');
        case 500: throw new Error('500 Internal Server Error');
        case 502: throw new Error('502 Bad Gateway');
        case 503: throw new Error('503 Service Unavailable');
        case 504: throw new Error('504 Gateway Timeout');
        default: throw new Error('Server has returned a 400/500 error code');
      }
    }

    // ボディが空の場合のエラー
    if (body === undefined || body === '') {
      throw new Error('Page not found');
    }
    
    // レスポンスオブジェクトの標準化
    const standardResponse = {
      status: responseCode,
      headers: {
        get: (name) => {
          const headers = response.getHeaders();
          return headers[name] || headers[name.toLowerCase()];
        }
      }
    };
    
    return { body, response: standardResponse };
  } catch (error) {
    if (error.message === 'fetch failed') throw error.cause || error;
    throw error;
  }
}