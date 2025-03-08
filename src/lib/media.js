/**
 * メディアデータの処理を行う
 *
 * OpenGraphのメディア関連メタタグを構造化されたオブジェクトにフォーマット
 */

/**
 * メディアデータのセットアップ処理
 * 
 * @param {object} ogObject - メタタグから抽出された生データ
 * @return {object} メディアデータが整形されたオブジェクト
 */
function mediaSetup(ogObject) {
  // 整形されたオブジェクトを作成
  const formattedObject = { ...ogObject };
  
  // Twitter画像の処理
  if (formattedObject.twitterImageSrc && formattedObject.twitterImageSrc.length > 0) {
    formattedObject.twitterImage = formattedObject.twitterImageSrc.map((url, index) => {
      return {
        url: url,
        alt: formattedObject.twitterImageAlt?.[index] || null
      };
    });
    
    // 元のプロパティを削除
    delete formattedObject.twitterImageSrc;
    delete formattedObject.twitterImageAlt;
  }
  
  // OG画像の処理
  if (formattedObject.ogImageURL && formattedObject.ogImageURL.length > 0) {
    formattedObject.ogImage = formattedObject.ogImageURL.map((url, index) => {
      return {
        url: url,
        width: formattedObject.ogImageWidth?.[index] ? parseInt(formattedObject.ogImageWidth[index], 10) : null,
        height: formattedObject.ogImageHeight?.[index] ? parseInt(formattedObject.ogImageHeight[index], 10) : null,
        type: formattedObject.ogImageType?.[index] || null,
        alt: formattedObject.ogImageAlt?.[index] || null
      };
    });
    
    // 元のプロパティを削除
    delete formattedObject.ogImageURL;
    delete formattedObject.ogImageWidth;
    delete formattedObject.ogImageHeight;
    delete formattedObject.ogImageType;
    delete formattedObject.ogImageAlt;
  }
  
  return formattedObject;
}

export default mediaSetup;