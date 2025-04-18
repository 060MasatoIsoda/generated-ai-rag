# RAG 検索アプリケーション

このプロジェクトは、Retrieval-Augmented Generation (RAG) を使用したシンプルな検索アプリケーションのフロントエンドです。

## 機能

- キーワード検索
- 検索結果の表示（関連度付き）
- レスポンシブデザイン
- RESTful API との連携

## 技術スタック

- React 19
- TypeScript
- Axios（API通信用）
- Vite（ビルドツール）

## 始め方

### 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd rag-frontend

# 依存関係をインストール
npm install
```

### 環境設定

`.env`ファイルをプロジェクトのルートディレクトリに作成し、以下の環境変数を設定します：

```
VITE_API_BASE_URL=http://localhost:8000
```

バックエンドサーバーの実際のURLに合わせて変更してください。

### 開発サーバーの起動

```bash
npm run dev
```

これにより、開発サーバーが起動し、通常は`http://localhost:5173`でアプリケーションにアクセスできます。

### ビルド

```bash
npm run build
```

ビルドされたアプリケーションは`dist`ディレクトリに出力されます。

## APIインターフェース

アプリケーションは以下のAPIエンドポイントと通信します：

- `GET /api/search?q=<query>` - 検索クエリを実行し、結果を返します

### 期待されるレスポンス形式

```json
{
  "results": [
    {
      "id": "doc123",
      "title": "ドキュメントタイトル",
      "content": "検索結果の内容...",
      "score": 0.95,
      "url": "https://example.com/doc123"
    },
    // 他の結果...
  ],
  "total": 42,
  "query": "検索クエリ"
}
```

## カスタマイズ

- APIエンドポイントの変更: `src/services/api.ts`を編集
- UIのスタイル変更: `src/App.css`を編集
- 新しいコンポーネントの追加: `src/components/`ディレクトリに追加

## ライセンス

[MIT](LICENSE)

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
