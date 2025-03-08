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

// ファイルをコピーして変換（型情報を削除）
filesToConvert.forEach(file => {
  try {
    let content = fs.readFileSync(file.from, 'utf8');
    
    // 型情報を削除
    content = content.replace(/import type.*?from.*?;/g, '');
    content = content.replace(/import.*?type.*?}/g, 'import');
    content = content.replace(/: \w+(\[\])?/g, '');
    content = content.replace(/: {.*?}/g, '');
    content = content.replace(/<.*?>/g, '');
    
    // インターフェース定義を削除
    content = content.replace(/export interface.*?}/gs, '');
    content = content.replace(/interface.*?}/gs, '');
    content = content.replace(/export type.*?;/g, '');
    content = content.replace(/type.*?;/g, '');
    
    fs.writeFileSync(file.to, content);
  } catch (error) {
    console.error(`ファイル ${file.from} の変換に失敗しました:`, error);
  }
});

console.log('✓ ソースファイルの変換が完了しました');

// ビルド実行
console.log('ライブラリをビルド中...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ ビルドが完了しました');
} catch (error) {
  console.error('ビルドに失敗しました:', error);
  process.exit(1);
}

// 一時ディレクトリを削除
fs.rmSync('temp', { recursive: true, force: true });

console.log('完了! dist/openGraphScraperGAS.js が生成されました。');