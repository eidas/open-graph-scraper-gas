import { decode } from 'iconv-lite';
import { load } from 'cheerio';
import chardet from 'chardet';

/**
 * checks if an element exists
 */
const doesElementExist = (selector, attribute, $) => (
  $(selector).attr(attribute) && ($(selector).attr(attribute)?.length ?? 0) > 0
);

/**
 * gets the charset of the html
 */
function getCharset(body, buffer, $) {
  if (doesElementExist('meta', 'charset', $)) {
    return $('meta').attr('charset');
  }
  if (doesElementExist('head > meta[name="charset"]', 'content', $)) {
    return $('head > meta[name="charset"]').attr('content');
  }
  if (doesElementExist('head > meta[http-equiv="content-type"]', 'content', $)) {
    const content = $('head > meta[http-equiv="content-type"]').attr('content') ?? '';
    const charsetRegEx = /charset=([^()<>@,;:"/\\]?.=\\s]*)/i;

    if (charsetRegEx.test(content)) {
      const charsetRegExExec = charsetRegEx.exec(content);
      if (charsetRegExExec?.[1]) return charsetRegExExec[1];
    }
  }
  if (body) {
    return chardet.detect(Buffer.from(buffer));
  }

  return 'utf-8';
}

/**
 * performs the fetch request and formats the body for ogs
 * Adapted for Google Apps Script using URLFetchApp
 *
 * @param {object} options - options for ogs
 * @return {object} formatted request body and response
 *
 */
export default async function requestAndResultsFormatter(options) {
  let body;
  let response;
  try {
    // eslint-disable-next-line no-control-regex
    const isLatin1 = /^[\\u0000-\\u00ff]{0,}$/;

    let url = options.url ?? '';
    if (!isLatin1.test(url)) url = encodeURI(url);

    // Google Apps Script用のFetch処理
    const fetchOptions = {
      muteHttpExceptions: true,
      followRedirects: true,
      ...options.fetchOptions,
      headers: { 
        Origin: url ?? '', 
        Accept: 'text/html', 
        ...(options.fetchOptions?.headers || {}) 
      }
    };
    
    // タイムアウト設定
    if (options.timeout) {
      fetchOptions.timeoutInSeconds = options.timeout;
    }

    // GASのURLFetchAppを使用
    try {
      response = UrlFetchApp.fetch(url, fetchOptions);
    } catch (fetchError) {
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    const responseCode = response.getResponseCode();
    const contentType = response.getHeaders()['Content-Type'] || '';
    const responseBody = response.getContentText();
    
    // レスポンスヘッダーとボディをJavaScript標準のフォーマットに変換
    const standardResponse = {
      status: responseCode,
      headers: {
        get: (name) => {
          const headers = response.getHeaders();
          return headers[name] || headers[name.toLowerCase()];
        }
      },
      body: responseBody
    };

    // バイナリデータの取得とエンコーディング処理
    const bodyArrayBuffer = response.getContent();
    const bodyText = Utilities.newBlob(bodyArrayBuffer).getDataAsString();
    const charset = getCharset(bodyText, bodyArrayBuffer, load(bodyText)) ?? 'utf-8';
    
    if (charset.toLowerCase() === 'utf-8') {
      body = bodyText;
    } else {
      body = decode(Buffer.from(bodyArrayBuffer), charset);
    }

    if (contentType && !contentType.toLowerCase().includes('text/')) {
      throw new Error('Page must return a header content-type with text/');
    }
    
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

    if (body === undefined || body === '') {
      throw new Error('Page not found');
    }
    
    return { body, response: standardResponse };
  } catch (error) {
    if (error instanceof Error && error.message === 'fetch failed') throw error.cause;
    throw error;
  }
}