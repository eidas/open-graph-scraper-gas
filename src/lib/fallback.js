import {
  findImageTypeFromUrl,
  isImageTypeValid,
  isUrlValid,
  defaultUrlValidatorSettings
} from './utils';

/**
 * 要素が存在するかをチェックする
 */
const doesElementExist = (selector, attribute, $) => (
  $(selector).attr(attribute) && ($(selector).attr(attribute)?.length ?? 0) > 0
);

/**
 * OpenGraphタグが見つからなかった場合のフォールバック処理
 * 
 * @param {object} ogObject - 現在のOGオブジェクト
 * @param {object} options - オプション
 * @param {object} $ - cheerioのロードされたDOM
 * @param {string} body - HTMLの本文
 * @return {object} フォールバック処理を行ったOGオブジェクト
 */
function fallback(ogObject, options, $, body) {
  // titleのフォールバック
  if (!ogObject.ogTitle) {
    if ($('title').text() && $('title').text().length > 0) {
      ogObject.ogTitle = $('title').first().text();
    } else if (doesElementExist('head > meta[name="title"]', 'content', $)) {
      ogObject.ogTitle = $('head > meta[name="title"]').attr('content');
    } else if ($('.post-title').text() && $('.post-title').text().length > 0) {
      ogObject.ogTitle = $('.post-title').text();
    } else if ($('.entry-title').text() && $('.entry-title').text().length > 0) {
      ogObject.ogTitle = $('.entry-title').text();
    } else if ($('h1[class*="title" i] a').text() && $('h1[class*="title" i] a').text().length > 0) {
      ogObject.ogTitle = $('h1[class*="title" i] a').text();
    } else if ($('h1[class*="title" i]').text() && $('h1[class*="title" i]').text().length > 0) {
      ogObject.ogTitle = $('h1[class*="title" i]').text();
    }
  }

  // descriptionのフォールバック
  if (!ogObject.ogDescription) {
    if (doesElementExist('head > meta[name="description"]', 'content', $)) {
      ogObject.ogDescription = $('head > meta[name="description"]').attr('content');
    } else if (doesElementExist('head > meta[itemprop="description"]', 'content', $)) {
      ogObject.ogDescription = $('head > meta[itemprop="description"]').attr('content');
    } else if ($('#description').text() && $('#description').text().length > 0) {
      ogObject.ogDescription = $('#description').text();
    }
  }

  // 画像のフォールバック
  if (!ogObject.ogImage) {
    ogObject.ogImage = [];
    $('img').map((index, imageElement) => {
      const source = $(imageElement).attr('src') ?? '';
      if (!source) return false;
      
      const type = findImageTypeFromUrl(source);
      if (!isUrlValid(source, (options.urlValidatorSettings ?? defaultUrlValidatorSettings)) || !isImageTypeValid(type)) {
        return false;
      }
      
      const fallbackImage = {
        url: source,
        type: type
      };
      
      if ($(imageElement).attr('width') && Number($(imageElement).attr('width'))) {
        fallbackImage.width = Number($(imageElement).attr('width'));
      }
      
      if ($(imageElement).attr('height') && Number($(imageElement).attr('height'))) {
        fallbackImage.height = Number($(imageElement).attr('height'));
      }
      
      ogObject.ogImage.push(fallbackImage);
      return false;
    });
    
    // 最初の10枚だけ取得し、無効なURLを削除
    ogObject.ogImage = ogObject.ogImage
      .filter((value) => value.url !== undefined && value.url !== '')
      .filter((value, index) => index < 10);
      
    if (ogObject.ogImage.length === 0) {
      delete ogObject.ogImage;
    }
  } else if (ogObject.ogImage) {
    // すでに画像がある場合は、画像の種類を設定
    ogObject.ogImage.map((image) => {
      if (image.url && !image.type) {
        const type = findImageTypeFromUrl(image.url);
        if (isImageTypeValid(type)) image.type = type;
      }
      return false;
    });
  }

  // 他のフォールバック処理は必要に応じて追加

  return ogObject;
}

export default fallback;