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

// 基本的な正規表現による型情報の削除だけでなく、簡易的なJavaScriptトランスパイル処理
function transpileTypeScript(content) {
  // 型のインポートを削除
  content = content.replace(/import\s+type\s+.*?from\s+['"].*?['"];?/g, '');
  content = content.replace(/import\s+{(.*?)}\s+from\s+['"].*?['"]/g, (match, imports) => {
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
      return `import { ${cleanedImports} } from ${match.split('from')[1].trim()}`;
    }
    return match; // 型情報がなければそのまま
  });

  // 関数の型注釈を削除
  content = content.replace(/: \w+(\[\])?(?=\s*[,)])/g, '');
  content = content.replace(/: \w+(\[\])?\s*=>/g, '=>');
  
  // オブジェクト型注釈を削除
  content = content.replace(/: {[^}]*}/g, '');
  
  // ジェネリック型パラメータを削除
  content = content.replace(/<.*?>/g, '');

  // インターフェースとタイプエイリアスの定義を削除
  content = content.replace(/export\s+interface\s+\w+\s*{[\s\S]*?}/g, '');
  content = content.replace(/interface\s+\w+\s*{[\s\S]*?}/g, '');
  content = content.replace(/export\s+type\s+.*?;/g, '');
  content = content.replace(/type\s+.*?;/g, '');

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
} else {
  console.error('エラー: ビルドが完了しましたが、出力ファイルが見つかりません。');
  process.exit(1);
}

// 一時ディレクトリを削除
fs.rmSync('temp', { recursive: true, force: true });

console.log('完了! dist/openGraphScraperGAS.js が生成されました。');