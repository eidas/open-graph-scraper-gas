# open-graph-scraper-gas

Google Apps Script版の Open Graph Scraper。このライブラリは、[openGraphScraper](https://github.com/jshemas/openGraphScraper)のGoogle Apps Script向けforkです。

## 概要

このライブラリは、URLからOpenGraphとTwitter Cardのメタデータを抽出するためのツールです。ウェブサイトのメタデータを簡単に取得し、構造化されたデータとして利用することができます。

## 特徴

- Google Apps Script環境で動作
- OpenGraphタグの抽出
- TwitterCardタグの抽出
- JSON-LDの抽出
- カスタムメタタグの抽出サポート
- フォールバックメカニズム（OGタグがない場合）

## インストール方法

1. `openGraphScraperGAS.js`をGoogle Apps Scriptプロジェクトにコピーペースト、または
2. Google Apps Scriptのライブラリとして追加（ライブラリID: `{YOUR_LIBRARY_ID}`）

## 使用方法

```javascript
/**
 * URLからOGデータを取得する例
 */
function example() {
  // オプションを設定
  const options = {
    url: 'https://example.com',
    timeout: 5  // タイムアウト（秒）
  };
  
  // OGデータを取得
  try {
    // ライブラリとして追加した場合
    const result = OpenGraphScraperGas.runOpenGraphScraper(options);
    
    // または、コードをコピーペーストした場合
    // const result = runOpenGraphScraper(options);
    
    Logger.log(JSON.stringify(result, null, 2));
  } catch (error) {
    Logger.log('Error: ' + error.message);
  }
}
```

## オプション

| オプション | 型 | 説明 |
|------------|-----|-------------|
| url | string | スクレイピングするウェブサイトのURL（必須） |
| html | string | 直接HTMLを解析する場合（urlと排他的） |
| timeout | number | リクエストのタイムアウト（秒）、デフォルト: 10 |
| onlyGetOpenGraphInfo | boolean or string[] | trueの場合、OGタグのみを取得（フォールバックなし） |
| customMetaTags | object[] | カスタムメタタグを指定 |
| blacklist | string[] | スクレイピングしないドメインのリスト |
| fetchOptions | object | URLFetchAppに渡すオプション |

## カスタムメタタグの使用例

```javascript
const options = {
  url: 'https://example.com',
  customMetaTags: [
    {
      multiple: false,
      property: 'custom:tag',
      fieldName: 'customTag'
    }
  ]
};
```

## ビルド方法

ソースコードから自分でビルドする場合：

```bash
# 依存関係をインストール
npm install

# ビルド実行
npm run build
```

## クレジット

このプロジェクトは[Josh Shemas](https://github.com/jshemas)氏の[openGraphScraper](https://github.com/jshemas/openGraphScraper)を元にしています。オリジナルライブラリをGoogle Apps Script環境で動作するように改変しています。

## 制限事項

- Google Apps Scriptの実行時間制限（現在6分）があります
- URLFetchAppの制限に従います（1日あたりのリクエスト数制限など）
- メモリ使用量に制限があります

## ライセンス

MITライセンス（オリジナルのopen-graph-scraperと同じ）

## 貢献

バグや機能リクエストは、GitHubのIssueに報告してください。Pull Requestも歓迎します。