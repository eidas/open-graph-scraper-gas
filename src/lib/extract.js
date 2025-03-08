import { load } from 'cheerio';
import fallback from './fallback';
import fields from './fields';
import mediaSetup from './media';
import { unescapeScriptText } from './utils';

/**
 * HTMLからメタタグの情報を抽出する
 * 
 * @param {string} body - fetchリクエストのボディ（HTML）
 * @param {object} options - オプション設定
 * @return {object} OpenGraphの結果を含むオブジェクト
 */
export default function extractMetaTags(body, options) {
  let ogObject = { success: true };
  const $ = load(body);
  const metaFields = fields;

  // メタタグからオープングラフ情報を探す
  $('meta').each((index, meta) => {
    if (!meta.attribs || (!meta.attribs.property && !meta.attribs.name)) return;
    
    const property = meta.attribs.property || meta.attribs.name;
    const content = meta.attribs.content || meta.attribs.value;
    
    metaFields.forEach((item) => {
      if (item && property.toLowerCase() === item.property.toLowerCase()) {
        // 複数値のフィールドかを確認
        if (item.multiple) {
          if (!ogObject[item.fieldName]) {
            ogObject[item.fieldName] = [content];
          } else {
            ogObject[item.fieldName].push(content);
          }
        } else {
          ogObject[item.fieldName] = content;
        }
      }
    });

    // カスタムメタタグの処理
    if (options.customMetaTags) {
      options.customMetaTags.forEach((item) => {
        if (!ogObject.customMetaTags) ogObject.customMetaTags = {};
        
        if (item && property.toLowerCase() === item.property.toLowerCase()) {
          if (!item.multiple) {
            ogObject.customMetaTags[item.fieldName] = content;
          } else if (!ogObject.customMetaTags[item.fieldName]) {
            ogObject.customMetaTags[item.fieldName] = [content];
          } else if (Array.isArray(ogObject.customMetaTags[item.fieldName])) {
            ogObject.customMetaTags[item.fieldName].push(content);
          }
        }
      });
      
      // カスタムメタタグが空の場合は削除
      if (ogObject.customMetaTags && Object.keys(ogObject.customMetaTags).length === 0) {
        delete ogObject.customMetaTags;
      }
    }
  });

  // 複数のメディア値をフォーマット
  ogObject = mediaSetup(ogObject);

  // onlyGetOpenGraphInfoが設定されていない場合、フォールバック処理を実行
  if (!options.onlyGetOpenGraphInfo || Array.isArray(options.onlyGetOpenGraphInfo)) {
    ogObject = fallback(ogObject, options, $, body);

    // JSON-LDの処理
    $('script').each((index, script) => {
      if (script.attribs.type && script.attribs.type === 'application/ld+json') {
        if (!ogObject.jsonLD) ogObject.jsonLD = [];
        
        let scriptText = $(script).text().trim();
        if (scriptText) {
          // 改行を削除
          scriptText = scriptText.replace(/(\\r\\n|\\n|\\r)/gm, '');
          // エスケープを解除
          scriptText = unescapeScriptText(scriptText);
          
          try {
            ogObject.jsonLD.push(JSON.parse(scriptText));
          } catch (error) {
            if (options.jsonLDOptions?.logOnJSONParseError) {
              console.error('Error parsing JSON-LD script tag:', error);
            }
            if (options.jsonLDOptions?.throwOnJSONParseError) {
              throw error;
            }
          }
        }
      }
    });
  }

  return ogObject;
}