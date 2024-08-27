# Robustive Boilerplate

# サーバの起動

```shell
% yarn serve
```

./packages/backend/.env.local が作られるので、以下の値を設定します。

```./packages/backend/.env.local
GOOGLE_OAUTH_20_CLIENT_ID=
GOOGLE_OAUTH_20_CLIENT_SECRET=
SESSION_SECRET=
```

`CLIENT_ID` および `GOOGLE_OAUTH_20_CLIENT_SECRET` は、Google Cloud の「APIとサービス」にて [OAuth同意画面](https://console.cloud.google.com/apis/credentials/consent?project=boilerplate-431913) および [認証情報](https://console.cloud.google.com/apis/credentials) を設定することで取得できます。

## package別の操作

この Boilerplate は yarn の workspaces を使って frontend と backend をモノレポとして管理できるようにしています。個別の package に対しての操作は以下のように行います。

```shell
% yarn workspace frontend run build
% yarn workspace frontend add vue-router

% yarn workspace backend run start
% yarn workspace backend add --dev @types/node
```

# 開発について

## paths設定

エディタ上のパス解決と、コンパイル時のパス解決は別なので注意。

### エディタ上のパス解決

VSCode は ルーディレクトリの `tsconfig.json` を参照している。ルーディレクトリの `tsconfig.json` は Solution Style で記述していて、`references` で読み込んだ `tsconfig.*.json` が `include` するファイルについて `paths` でエイリアスを設定できます。

### コンパイル時のパス解決

#### backend

`packages/backend/package.json` にて `tsc` が `packages/backend/tsconfig.json` を参照してコンパイルを行います。

```packages/backend/tsconfig.json
{
  "compilerOptions": {
    // "tsBuildInfoFile": "../../node_modules/.tmp/backend.tsbuildinfo",
    "module": "commonjs",
    "baseUrl": "../../",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@backend/*": ["src/implementation/backend/*"],
      "@shared/*": ["src/implementation/shared/*"]
    },
    ...
```

#### frontend

`vue-tsc` と `vite build` の両方に対応する必要があります。

`packages/frontend/package.json` にて `vue-tsc` が `packages/frontend/tsconfig.app.json` を参照してコンパイルを行います。

```packages/frontend/tsconfig.app.json
{
  "compilerOptions": {
    "composite": true /* for Solution Style */,
    "tsBuildInfoFile": "../../node_modules/.tmp/frontend.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "rootDir": "../../" /* VSCodeでのPROBLEMS（ts6059: 'rootDir' is expected to contain all source files.）対策 */,
    "baseUrl": "../../",
    "paths": {
      "@domain/*": ["src/domain/*"],
      "@frontend/*": ["src/implementation/frontend/*"],
      "@shared/*": ["src/implementation/shared/*"],
      "@presentation/*": ["src/presentation/*"],
    },
    ...
```

`vite build` は `vite.config.ts` を参照してエイリアスを解決します（これらの二重メンテをなくすために `vite-tsconfig-paths` といプラグインが作られているが、このBoilerplateではディレクトリ構造が特殊なので Rollup が上手くできなかった）。

```packages/frontend/vite.config.ts
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  root: "../../",
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    // @see: https://www.npmjs.com/package/vite-plugin-vuetify
    vuetify()
  ],
  resolve: {
    alias: {
      "@domain": "/src/domain",
      "@frontend": "/src/implementation/frontend",
      "@shared": "/src/implementation/shared",
      "@presentation": "/src/presentation",
    }
  },
  ...
```

## ユースケースの追加

1. src/domain/usecases 以下に、ドメイン毎のユースケースを追加し、シーン（Scenes）を Type で定義
2. `src/domain/usecases/index.ts` にて、requirements定数に 1 で定義した Scenes を追加
3. frontendの実装として、 src/implementation/frontend/stores 以下に、ドメイン毎のユースケースの振る舞い（Choreography）を実装

- behavior: ロバストネス図でいうコントローラによる処理
- mutation: ユースケースが振る舞った結果に基づいて状態を変える処理
- rewind: 予期せぬエラーによって状態をユースケース実行前に巻き戻す処理

4. backendの実装として、 src/implementation/backend 以下に、ドメイン毎のユースケースの振る舞い（Behavior のみ）を実装
5. actor毎にどのユースケースを実行可能かを src/domain/actors 以下の各アクター class の isAuthorizedToメソッドで定義
6. ユーザによるボタン押下のアクションに対して、dispatch関数を使ってユースケースを呼び出す

### ユースケースの呼び出し

```vue
const onClickSignIn = () => {
dispatch(R.authentication.signIn.basics.ユーザはサインインボタンを押下する()) }
```

### frontend から backend への処理の委譲

`handOverToBackend` 関数を使います。

```ts
  const behavior = (scenario: Scenario<HelloScenes>): Behavior<HelloScenes> => {
    return {
      [basics.フロントエンドはバックエンドにHelloを送る]: ({
        hello
      }: {
        hello: string
      }): Promise<Context<HelloScenes>> => {
        return handOverToBackend(
          scenario.basics.バックエンドはフロントエンドからHelloを受け取る({
            hello
          }),
          scenario
        )
      },
      ...
```

### backend での シナリオ実行

`src/implementation/backend/controllers/index.ts` にて ユースケース毎に、シナリオを一つ進めるのか、特定のシーンまで進めるのかを設定します。

```ts:一つ進める
export function createBackendService(app: Express) {
  const domainActionsMap: DomainActionsMap = {
    [R.keys.application]: {
      [R.application.keys.boot]: (
        usecase: Usecase<"application", "boot">,
        actor: Actor
      ): Promise<Context<BootScenes>> => {
        usecase.set(new ScenarioDelegate(createBackendBootBehavior))
        // 一つ進める
        return usecase.progress(actor)
      },
      ...
    },
```

```ts:特定のシーンまで進める
export function createBackendService(app: Express) {
  const domainActionsMap: DomainActionsMap = {
    [R.keys.application]: {
      ...,
      [R.application.keys.hello]: (
        usecase: Usecase<"application", "hello">,
        actor: Actor
      ): Promise<Context<HelloScenes>> => {
        usecase.set(new ScenarioDelegate(createBackendHelloBehavior))
        // 特定のシーンまで進める
        return stepThoughUntil<HelloScenes>(
          "goals",
          R.application.hello.keys.goals
            .フロントエンドはバックエンドから返事を受け取る,
          usecase,
          actor
        )
      }
    },
    ...
```
