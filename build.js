const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 必要なディレクトリを作成
const directories = ['src', 'src/lib', 'dist'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// tempディレクトリが存在する場合は削除
if (fs.existsSync('temp')) {
  try {
    console.log('既存のtempディレクトリを削除中...');
    fs.rmSync('temp', { recursive: true, force: true });
    console.log('✓ tempディレクトリの削除が完了しました');
  } catch (error) {
    console.error('tempディレクトリの削除に失敗しました:', error);
    process.exit(1);
  }
}

// オリジナルリポジトリのソースコードを取得
console.log('オリジナルのリポジトリをクローン中...');
try {
  execSync('git clone --depth 1 https://github.com/jshemas/openGraphScraper.git temp');
  console.log('✓ リポジトリのクローンが完了しました');
} catch (error) {
  console.error('リポジトリのクローンに失敗しました:', error);
  process.exit(1);
}

// 依存ライブラリインストール
console.log('依存ライブラリをインストール中...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✓ 依存ライブラリのインストールが完了しました');
} catch (error) {
  console.error('依存ライブラリのインストールに失敗しました:', error);
  process.exit(1);
}

// シンプルな方法で型情報を削除する関数
function removeTypeAnnotations(fileContent) {
  // クリーンなJSに変換するために行ごとに処理
  const lines = fileContent.split('\n');
  const cleanedLines = lines.map(line => {
    // 型インポートを削除
    if (line.includes('import type')) {
      return '';
    }
    
    // import { type ... } の形式を処理
    if (line.includes('import {') && line.includes('type')) {
      return line.replace(/import\s+\{\s*([^}]*)\}\s+from\s+['"][^'"]+['"];?/, (match, imports) => {
        const cleanedImports = imports.split(',')
          .map(i => i.trim())
          .filter(i => !i.includes('type'))
          .join(', ');
        
        if (cleanedImports.length === 0) {
          return '';
        }
        return `import { ${cleanedImports} } from './types';`;
      });
    }
    
    // タイプ定義を削除
    if (line.includes('export type') || line.includes('export interface') || 
        line.includes('type ') || line.includes('interface ')) {
      return '';
    }
    
    // 変数宣言の型注釈を削除
    line = line.replace(/(\w+)\s*:\s*[A-Za-z0-9<>\[\]|&]+\s*=/g, '$1 =');
    
    // 関数パラメータの型注釈を削除 (この部分が重要)
    line = line.replace(/(\(|\,\s*)([a-zA-Z0-9_]+)\s*:\s*[A-Za-z0-9<>\[\]|&]+/g, '$1$2');
    
    // 関数の戻り値型を削除
    line = line.replace(/\)\s*:\s*[A-Za-z0-9<>\[\]|&]+\s*{/g, ') {');
    
    // ジェネリック型パラメータを削除
    line = line.replace(/<[^<>]*>/g, '');
    
    return line;
  });
  
  return cleanedLines.join('\n');
}

// ファイルをTypeScriptからJavaScriptに変換
console.log('ソースファイルを変換中...');

// ソースファイル（TSをJSに変換）をコピー
const filesToConvert = [
  { from: 'temp/lib/extract.ts', to: 'src/lib/extract.js' },
  { from: 'temp/lib/fallback.ts', to: 'src/lib/fallback.js' },
  { from: 'temp/lib/fields.ts', to: 'src/lib/fields.js' },
  { from: 'temp/lib/isUrl.ts', to: 'src/lib/isUrl.js' },
  { from: 'temp/lib/media.ts', to: 'src/lib/media.js' },
  { from: 'temp/lib/openGraphScraper.ts', to: 'src/lib/openGraphScraper.js' },
  // request.tsは別途GAS用に修正済みのものを使用
  { from: 'temp/lib/utils.ts', to: 'src/lib/utils.js' },
];

// ファイルをコピーして変換
filesToConvert.forEach(file => {
  try {
    let content = fs.readFileSync(file.from, 'utf8');
    
    // 型注釈を削除
    content = removeTypeAnnotations(content);
    
    fs.writeFileSync(file.to, content);
    console.log(`- ${file.from} -> ${file.to}`);
  } catch (error) {
    console.error(`ファイル ${file.from} の変換に失敗しました:`, error);
    console.error(error.stack);
  }
});

console.log('✓ ソースファイルの変換が完了しました');

// 特別な修正が必要なファイルを手動で調整
console.log('特別な修正が必要なファイルを調整中...');

// 全てのファイルに対して特別な修正を適用
for (const file of filesToConvert) {
  if (fs.existsSync(file.to)) {
    let content = fs.readFileSync(file.to, 'utf8');
    
    // function宣言の型注釈を全て削除（特に問題になりやすい箇所）
    content = content.replace(/function\s+\w+\s*\(([^)]*)\)\s*:?\s*[A-Za-z0-9<>\[\]|&]+\s*{/g, function(match, params) {
      return `function ${match.split('function ')[1].split('(')[0]}(${params}) {`;
    });
    
    // 残りの型注釈を直接削除
    content = content.replace(/:\s*[A-Za-z0-9<>\[\]|&]+/g, '');
    
    // エラーになりやすい特定のパターンに対する修正
    if (file.to.includes('extract.js')) {
      content = content.replace(
        /export default function extractMetaTags\(body, options: OpenGraphScraperOptions\)/g, 
        'export default function extractMetaTags(body, options)'
      );
    }
    
    if (file.to.includes('utils.js')) {
      content = content.replace(
        /export function isUrlValid\(url, urlValidatorSettings: ValidatorSettings\)/g, 
        'export function isUrlValid(url, urlValidatorSettings)'
      );
      
      content = content.replace(
        /export function validateAndFormatURL\(url: string, urlValidatorSettings: ValidatorSettings\)/g, 
        'export function validateAndFormatURL(url, urlValidatorSettings)'
      );
    }
    
    if (file.to.includes('openGraphScraper.js')) {
      content = content.replace(
        /export default async function setOptionsAndReturnOpenGraphResults\(ogsOptions: OpenGraphScraperOptions\)/g, 
        'export default async function setOptionsAndReturnOpenGraphResults(ogsOptions)'
      );
    }
    
    fs.writeFileSync(file.to, content);
  }
}

// 特定のエラーで問題になるパターンを修正するスクリプトを準備
console.log('変換したファイルをチェックして修正中...');

// src/libのすべてのJSファイルを処理
const jsFiles = fs.readdirSync('src/lib')
  .filter(file => file.endsWith('.js'))
  .map(file => path.join('src/lib', file));

// 各ファイルの型注釈を徹底的に削除
jsFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // TypeScript固有の型関連構文を削除
    content = content.replace(/:\s*[A-Za-z0-9_]+(\[\])?/g, '');
    content = content.replace(/as\s+[A-Za-z0-9_]+(\[\])?/g, '');
    content = content.replace(/<[^<>]*>/g, '');
    
    // export = を export default に変換
    content = content.replace(/export\s*=\s*(\w+);/g, 'export default $1;');
    
    // その他の細かな型情報を削除
    content = content.replace(/(\w+)\s*:\s*[A-Za-z0-9<>\[\]|&]+(?=\s*[,)])/g, '$1');
    
    fs.writeFileSync(file, content);
    console.log(`- 修正: ${file}`);
  } catch (error) {
    console.error(`ファイル ${file} の修正に失敗しました:`, error);
  }
});

console.log('✓ 特別な修正が完了しました');

// ビルド実行
console.log('ライブラリをビルド中...');
try {
  // 詳細なエラー出力のためにstdioを'inherit'に設定
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ ビルドが完了しました');
} catch (error) {
  console.error('ビルドに失敗しました:');
  // スタックトレースを表示
  console.error(error);
  
  // エラーが多すぎる場合は、より過激な解決策としてJSの直接記述に切り替え
  console.log('\nエラーが続くため、最小限の実装でビルドを試みます...');
  createMinimalImplementation();
  
  // 再度ビルドを試みる
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✓ 最小実装でビルドが完了しました');
  } catch (buildError) {
    console.error('最小実装でもビルドに失敗しました:');
    console.error(buildError);
    process.exit(1);
  }
}

// 最小限の実装を作成する関数
function createMinimalImplementation() {
  // シンプルなextract.js
  const extractJs = `
import { load } from 'cheerio';
import fallback from './fallback';
import fields from './fields';
import mediaSetup from './media';

export default function extractMetaTags(body, options) {
  let ogObject = { success: true };
  const $ = load(body);
  const metaFields = fields;

  // find all of the open graph info in the meta tags
  $('meta').each((index, meta) => {
    if (!meta.attribs || (!meta.attribs.property && !meta.attribs.name)) return;
    const property = meta.attribs.property || meta.attribs.name;
    const content = meta.attribs.content || meta.attribs.value;
    metaFields.forEach((item) => {
      if (item && property.toLowerCase() === item.property.toLowerCase()) {
        if (!ogObject[item.fieldName]) {
          ogObject[item.fieldName] = content;
        }
      }
    });
  });

  // formats the multiple media values
  ogObject = mediaSetup(ogObject);

  // if onlyGetOpenGraphInfo isn't set, run the open graph fallbacks
  if (!options.onlyGetOpenGraphInfo) {
    ogObject = fallback(ogObject, options, $, body);
  }

  return ogObject;
}`;

  // シンプルなutils.js
  const utilsJs = `
import isUrl from './isUrl';

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

export function isUrlValid(url, urlValidatorSettings) {
  return typeof url === 'string' && url.length > 0 && isUrl(url, urlValidatorSettings);
}

const coerceUrl = (url) => (/^(f|ht)tps?:\/\//i.test(url) ? url : \`http://\${url}\`);

export function validateAndFormatURL(url, urlValidatorSettings) {
  return { url: isUrlValid(url, urlValidatorSettings) ? coerceUrl(url) : null };
}

export function findImageTypeFromUrl(url) {
  let type = url.split('.').pop() || '';
  [type] = type.split('?');
  return type;
}

export function isImageTypeValid(type) {
  const validImageTypes = ['apng', 'bmp', 'gif', 'ico', 'cur', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'svg', 'tif', 'tiff', 'webp'];
  return validImageTypes.includes(type);
}

export function isThisANonHTMLUrl(url) {
  const invalidImageTypes = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.3gp', '.avi', '.mov', '.mp4', '.m4v', '.m4a', '.mp3', '.mkv', '.ogv', '.ogm', '.ogg', '.oga', '.webm', '.wav', '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.webp', '.zip', '.rar', '.tar', '.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.txt', '.pdf'];
  const extension = findImageTypeFromUrl(url);
  return invalidImageTypes.some((type) => \`.\${extension}\`.includes(type));
}

export function removeNestedUndefinedValues(object) {
  Object.entries(object).forEach(([key, value]) => {
    if (value && typeof value === 'object') removeNestedUndefinedValues(value);
    else if (value === undefined) delete object[key];
  });
  return object;
}

export function optionSetup(ogsOptions) {
  const options = {
    onlyGetOpenGraphInfo: false,
    ...ogsOptions,
  };

  return { options };
}

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

export function unescapeScriptText(scriptText) {
  return scriptText.replace(/\\\\x([0-9a-f]{2})/ig, (_, pair) => {
    const charCode = parseInt(pair, 16);
    if (charCode === 34) {
      return '\\"';
    }
    return String.fromCharCode(charCode);
  });
}`;

  // シンプルなopenGraphScraper.js
  const openGraphScraperJs = `
import extractMetaTags from './extract';
import requestAndResultsFormatter from './request';
import {
  defaultUrlValidatorSettings,
  isCustomMetaTagsValid,
  isThisANonHTMLUrl,
  optionSetup,
  validateAndFormatURL,
} from './utils';

export default async function setOptionsAndReturnOpenGraphResults(ogsOptions) {
  const { options } = optionSetup(ogsOptions);

  if (options.html && options.url) throw new Error('Must specify either \`url\` or \`html\`, not both');

  if (!isCustomMetaTagsValid(options.customMetaTags || [])) throw new Error('Invalid Custom Meta Tags');

  if (options.html) {
    const ogObject = extractMetaTags(options.html, options);
    ogObject.success = true;
    return { ogObject, response: { body: options.html }, html: options.html };
  }

  const formattedUrl = validateAndFormatURL(options.url || '', (options.urlValidatorSettings || defaultUrlValidatorSettings));

  if (!formattedUrl.url) throw new Error('Invalid URL');

  options.url = formattedUrl.url;

  if (isThisANonHTMLUrl(options.url)) throw new Error('Must scrape an HTML page');

  if (options?.blacklist?.some((blacklistedHostname) => options.url?.includes(blacklistedHostname))) {
    throw new Error('Host name has been black listed');
  }

  try {
    const { body, response } = await requestAndResultsFormatter(options);
    const ogObject = extractMetaTags(body, options);

    ogObject.requestUrl = options.url;
    ogObject.success = true;

    return { ogObject, response, html: body };
  } catch (exception) {
    if (exception && (exception.code === 'ENOTFOUND' || exception.code === 'EHOSTUNREACH' || exception.code === 'ENETUNREACH')) {
      throw new Error('Page not found');
    } else if (exception && (exception.name === 'AbortError')) {
      throw new Error('The operation was aborted due to timeout');
    }
    if (exception instanceof Error) throw exception;
    throw new Error('Page not found');
  }
}`;

  // ファイルを保存
  fs.writeFileSync('src/lib/extract.js', extractJs);
  fs.writeFileSync('src/lib/utils.js', utilsJs);
  fs.writeFileSync('src/lib/openGraphScraper.js', openGraphScraperJs);
  
  console.log('最小実装ファイルを作成しました');
}

// ビルド結果を確認
if (fs.existsSync('dist/openGraphScraperGAS.js')) {
  console.log('✓ 生成されたファイルを確認しました: dist/openGraphScraperGAS.js');
  // ファイルサイズを表示
  const stats = fs.statSync('dist/openGraphScraperGAS.js');
  console.log(`  ファイルサイズ: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.error('エラー: ビルドが完了しましたが、出力ファイルが見つかりません。');
  process.exit(1);
}

// 一時ディレクトリを削除
fs.rmSync('temp', { recursive: true, force: true });

console.log('完了! dist/openGraphScraperGAS.js が生成されました。');