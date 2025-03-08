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

// 改善したTypeScript変換処理
function transpileTypeScript(content) {
  // 型のインポートを削除 (import type ...)
  content = content.replace(/import\s+type\s+.*?from\s+['"].*?['"];?\s*/g, '');
  
  // import { type ... } の形式を処理
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]([^'"]+)['"];?/g, (match, imports, source) => {
    // 型情報を含むインポートを修正
    if (imports.includes('type')) {
      // 型と通常のインポートを分けて処理
      const cleanedImports = imports.split(',')
        .map(i => i.trim())
        .filter(i => !i.includes('type'))
        .join(', ');
      
      if (cleanedImports.length === 0) {
        return ''; // 純粋に型だけのインポートは削除
      }
      return `import { ${cleanedImports} } from '${source}';`;
    }
    return match; // 型情報がなければそのまま
  });
  
  // 変数宣言の型注釈を削除 (let x: Type = ...)
  content = content.replace(/(\b(?:let|const|var)\s+\w+)\s*:\s*\w+(?:\[\])?\s*=/g, '$1 =');
  
  // 関数の型注釈を削除 (function(x: Type, y: Type): ReturnType {)
  content = content.replace(/(\((?:[^()]*?))\s*:\s*\w+(?:\[\])?(?=\s*[,)])/g, '$1');
  content = content.replace(/(\))\s*:\s*\w+(?:\[\])?\s*{/g, '$1 {');
  
  // アロー関数の型注釈を削除 ((x: Type) => ...)
  content = content.replace(/(\([^()]*?):\s*\w+(?:\[\])?\s*(=>)/g, '$1$2');
  
  // オブジェクト型注釈を削除 (const x: { prop: Type } = ...)
  content = content.replace(/:\s*{[^{}]*}/g, '');
  
  // ジェネリック型パラメータを削除 (<Type>)
  content = content.replace(/<[^<>]*>/g, '');
  
  // インターフェースとタイプエイリアスの定義を削除
  content = content.replace(/export\s+interface\s+\w+\s*{[\s\S]*?}\s*/g, '');
  content = content.replace(/interface\s+\w+\s*{[\s\S]*?}\s*/g, '');
  content = content.replace(/export\s+type\s+.*?;\s*/g, '');
  content = content.replace(/type\s+.*?;\s*/g, '');
  
  // 残りのTypeScript固有構文の削除
  content = content.replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*\s*=/g, ' ='); // Union Types
  content = content.replace(/as\s+\w+(\[\])?/g, ''); // Type Assertions
  
  // デフォルトエクスポートの問題修正
  content = content.replace(/export\s*=\s*(\w+);/g, 'export default $1;');
  
  return content;
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
    
    // より強力な型情報削除処理を使用
    content = transpileTypeScript(content);
    
    // 変換結果をデバッグ用に出力（問題が続く場合のために）
    fs.writeFileSync(`${file.to}.debug`, content);
    
    fs.writeFileSync(file.to, content);
    console.log(`- ${file.from} -> ${file.to}`);
  } catch (error) {
    console.error(`ファイル ${file.from} の変換に失敗しました:`, error);
  }
});

console.log('✓ ソースファイルの変換が完了しました');

// 変換されたファイルが存在するか確認
filesToConvert.forEach(file => {
  if (!fs.existsSync(file.to)) {
    console.error(`警告: ${file.to} が存在しません。`);
  } else {
    console.log(`確認: ${file.to} は正常に生成されました。`);
  }
});

// 手動修正用の処理を追加
console.log('TypeScript残留型情報を手動で修正中...');

// extract.jsの修正 (ogObject: OgObjectInternal = { ... })の問題を修正
if (fs.existsSync('src/lib/extract.js')) {
  let content = fs.readFileSync('src/lib/extract.js', 'utf8');
  content = content.replace(/let ogObject: OgObjectInternal = { success: true };/g, 'let ogObject = { success: true };');
  fs.writeFileSync('src/lib/extract.js', content);
}

// utils.jsの修正 (import type { ... }の問題を修正)
if (fs.existsSync('src/lib/utils.js')) {
  let content = fs.readFileSync('src/lib/utils.js', 'utf8');
  content = content.replace(/import type {[\s\S]*?};/g, '');
  fs.writeFileSync('src/lib/utils.js', content);
}

console.log('✓ 手動修正が完了しました');

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
  process.exit(1);
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