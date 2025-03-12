import extractMetaTags from './extract';
import requestAndResultsFormatter from './request';
import {
  defaultUrlValidatorSettings,
  isCustomMetaTagsValid,
  isThisANonHTMLUrl,
  optionSetup,
  validateAndFormatURL,
} from './utils';

/**
 * リクエストのオプションを設定し、OpenGraphの結果を返す
 *
 * @param {object} ogsOptions - Open Graph Scraperのオプション
 * @return {object} Open Graph結果を含むオブジェクト
 */
export default  function setOptionsAndReturnOpenGraphResults(ogsOptions) {
  const { options } = optionSetup(ogsOptions);

  // URLとHTMLの両方が指定されている場合はエラー
  if (options.html && options.url) throw new Error('Must specify either `url` or `html`, not both');

  // カスタムメタタグの検証
  if (!isCustomMetaTagsValid(options.customMetaTags ?? [])) throw new Error('Invalid Custom Meta Tags');

  // HTMLが直接提供された場合
  if (options.html) {
    const ogObject = extractMetaTags(options.html, options);
    ogObject.success = true;
    return { ogObject, response: { body: options.html }, html: options.html };
  }

  // URLのフォーマットと検証
  const formattedUrl = validateAndFormatURL(options.url ?? '', (options.urlValidatorSettings ?? defaultUrlValidatorSettings));

  if (!formattedUrl.url) throw new Error('Invalid URL');

  options.url = formattedUrl.url;

  // HTML以外のページをスクレイピングしないように制限
  if (isThisANonHTMLUrl(options.url)) throw new Error('Must scrape an HTML page');

  // ブラックリストのチェック
  if (options?.blacklist?.some((blacklistedHostname) => options.url?.includes(blacklistedHostname))) {
    throw new Error('Host name has been black listed');
  }

  try {
    // リクエストを実行してHTMLを取得
    const { body, response } = requestAndResultsFormatter(options);
    
    // HTMLからメタタグを抽出
    const ogObject = extractMetaTags(body, options);

    // リクエストURLを保存
    ogObject.requestUrl = options.url;
    ogObject.success = true;

    return { ogObject, response, html: body };
  } catch (exception) {
    // エラーハンドリング
    if (exception && (exception.code === 'ENOTFOUND' || exception.code === 'EHOSTUNREACH' || exception.code === 'ENETUNREACH')) {
      throw new Error('Page not found');
    } else if (exception && (exception.name === 'AbortError')) {
      throw new Error('The operation was aborted due to timeout');
    }
    if (exception instanceof Error) throw exception;
    throw new Error('Page not found');
  }
}