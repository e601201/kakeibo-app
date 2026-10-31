# 画面を開かずに記録するAPI

Claude Code などから curl で、支出・振替と収入を記録するための道。決まりは画面と同じ家計簿コアで確かめる。
作りの理由は `docs/adr/0002-record-api-with-token.md`、準備は `docs/setup.md` の「8. APIを使えるようにする」。

どの道も `Authorization: Bearer <KAKEIBO_API_TOKEN>` を付けて呼ぶ。合っていなければ 401 を返す。
以下の例では、公開したURLとトークンを環境変数に入れておく。

```sh
export KAKEIBO_URL=https://<名前>.vercel.app
export KAKEIBO_API_TOKEN=<トークン>
```

## 選べる名前の一覧：`GET /api/options`

```sh
curl -s "$KAKEIBO_URL/api/options" -H "Authorization: Bearer $KAKEIBO_API_TOKEN"
```

```json
{
  "categories": [{ "name": "外食", "kind": "支出" }, { "name": "貯蓄・投資", "kind": "振替" }],
  "paymentMethods": ["現金", "クレジットカード（三井住友カード）"],
  "incomeKinds": ["給与", "妻からの入金"]
}
```

費目は非表示のものを除き、表示順に並ぶ。

## 支出・振替を記録する：`POST /api/expenses`

```sh
curl -s -X POST "$KAKEIBO_URL/api/expenses" \
  -H "Authorization: Bearer $KAKEIBO_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"外食","amount":1200,"description":"ランチ","paymentMethod":"現金"}'
```

| 欄 | 必須 | 中身 |
| --- | --- | --- |
| `category` | ○ | 費目の名前。支出か振替かは費目で決まる |
| `amount` | ○ | 円の整数（数でも文字でもよい）。マイナスは返金 |
| `date` | | `YYYY-MM-DD`。省くと日本時間の今日 |
| `description` | | 内容 |
| `paymentMethod` | | 一覧と同じ書き方。カード名のない支払方法（現金など）は名前だけでよい |
| `memo` | | メモ |

## 収入を記録する：`POST /api/incomes`

```sh
curl -s -X POST "$KAKEIBO_URL/api/incomes" \
  -H "Authorization: Bearer $KAKEIBO_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"kind":"給与","amount":250000}'
```

| 欄 | 必須 | 中身 |
| --- | --- | --- |
| `kind` | ○ | 収入の種類の名前（給与・妻からの入金） |
| `amount` | ○ | 1円以上の円の整数 |
| `date` | | `YYYY-MM-DD`。省くと日本時間の今日 |
| `memo` | | メモ |

## 返事

- 記録できたら 201 で `{"message":"2026-11-01 外食 1,200円を支出として記録しました"}` のように返す
- 間違いがあれば 400 で `{"errors":{"category":"費目「食費」が見つかりません"}}` のように欄ごとの理由を返し、何も記録しない
