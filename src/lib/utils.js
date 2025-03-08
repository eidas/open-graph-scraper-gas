import isUrl from './isUrl';

/**
 * デフォルトのURL検証設定
 */
export const defaultUrlValidatorSettings = {
  allow_fragments: true,
  allow_protocol_relative_urls: false,
  allow_query_components: true,
  allow_trailing_dot: false,
  allow_underscores: false,
  protocols: ['http', 'https'],
  require_host: true,
  require_port: false,
  require_protocol: false,
  require_tld: true,
  require_valid_protocol: true,
  validate_length: true,
};

/**
 * URLが有効かどうかチェックする
 */
export function isUrlValid(url, urlValidatorSettings) {
  return typeof url === 'string' && url.length > 0 && isUrl(url, urlValidatorSettings);
}

/**
 * URLが 'http://' または 'https://' で始まるようにする
 */
const coerceUrl = (url) => (/^(f|ht)tps?:\\/\\//i.test(url) ? url : `http://${url}`);

/**
 * URLを検証してフォーマットする
 */
export function validateAndFormatURL(url, urlValidatorSettings) {
  return { url: isUrlValid(url, urlValidatorSettings) ? coerceUrl(url) : null };
}

/**
 * URLから画像タイプを抽出する
 */
export function findImageTypeFromUrl(url) {
  let type = url.split('.').pop() || '';
  [type] = type.split('?');
  return type;
}

/**
 * 画像タイプが有効かどうかをチェックする
 */
export function isImageTypeValid(type) {
  const validImageTypes = ['apng', 'bmp', 'gif', 'ico', 'cur', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'svg', 'tif', 'tiff', 'webp'];
  return validImageTypes.includes(type);
}

/**
 * URLがHTML以外のコンテンツを指しているかをチェックする
 */
export function isThisANonHTMLUrl(url) {
  const invalidImageTypes = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.3gp', '.avi', '.mov', '.mp4', '.m4v', '.m4a', '.mp3', '.mkv', '.ogv', '.ogm', '.ogg', '.oga', '.webm', '.wav', '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.webp', '.zip', '.rar', '.tar', '.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.txt', '.pdf'];
  const extension = findImageTypeFromUrl(url);
  return invalidImageTypes.some((type) => `.${extension}`.includes(type));
}

/**
 * オプションの設定を行う
 */
export function optionSetup(ogsOptions) {
  const options = {
    onlyGetOpenGraphInfo: false,
    ...ogsOptions,
  };

  return { options };
}

/**
 * カスタムメタタグが有効かどうかをチェックする
 */
export function isCustomMetaTagsValid(customMetaTags) {
  if (!Array.isArray(customMetaTags)) return false;

  let result = true;
  customMetaTags.forEach((customMetaTag) => {
    if (typeof customMetaTag === 'object') {
      if (!('fieldName' in customMetaTag) || typeof customMetaTag.fieldName !== 'string') result = false;
      if (!('multiple' in customMetaTag) || typeof customMetaTag.multiple !== 'boolean') result = false;
      if (!('property' in customMetaTag) || typeof customMetaTag.property !== 'string') result = false;
    } else {
      result = false;
    }
  });

  return result;
}

/**
 * スクリプトテキストのエスケープを解除する
 */
export function unescapeScriptText(scriptText) {
  return scriptText.replace(/\\\\x([0-9a-f]{2})/ig, (_, pair) => {
    const charCode = parseInt(pair, 16);
    if (charCode === 34) {
      return '\\"';
    }
    return String.fromCharCode(charCode);
  });
}