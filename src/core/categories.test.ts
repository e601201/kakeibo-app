import { describe, expect, it } from "vitest";
import {
  type Category,
  addCategory,
  categoriesForInput,
  editCategory,
  initialCategories,
  moveCategory,
  sortCategories,
} from "./categories";

describe("初期の費目", () => {
  it("初めて使うときの費目が決まった順で入っている", () => {
    expect(initialCategories().map((c) => c.name)).toEqual([
      "家賃",
      "食費（食材）",
      "外食",
      "水道光熱費",
      "通信費",
      "日用品",
      "交通費",
      "保険",
      "医療費",
      "被服",
      "美容",
      "交際費",
      "趣味・娯楽",
      "妻へのお小遣い",
      "特別費",
      "貯蓄・投資",
    ]);
  });

  it("貯蓄・投資だけが振替の費目で、ほかは支出の費目", () => {
    const transfers = initialCategories().filter((c) => c.kind === "transfer");
    expect(transfers.map((c) => c.name)).toEqual(["貯蓄・投資"]);
  });
});

function category(overrides: Partial<Category> & Pick<Category, "id" | "name">): Category {
  return { kind: "expense", sortOrder: 0, memo: "", hidden: false, ...overrides };
}

const existing = [
  category({ id: "rent", name: "家賃", sortOrder: 0 }),
  category({ id: "food", name: "食費（食材）", sortOrder: 1 }),
  category({ id: "save", name: "貯蓄・投資", kind: "transfer", sortOrder: 2 }),
];

describe("費目の追加", () => {
  it("種類を選んで追加すると、いちばん下に表示中の費目として入る", () => {
    expect(addCategory({ name: "  ペット ", kind: "expense", memo: "" }, existing)).toEqual({
      ok: true,
      value: { name: "ペット", kind: "expense", sortOrder: 3, memo: "", hidden: false },
    });
  });

  it("振替の費目として追加できる", () => {
    const result = addCategory({ name: "NISA", kind: "transfer", memo: "毎月の積立" }, existing);
    expect(result).toMatchObject({ ok: true, value: { kind: "transfer", memo: "毎月の積立" } });
  });

  it("名前が空なら追加できない", () => {
    expect(addCategory({ name: "  ", kind: "expense", memo: "" }, existing)).toEqual({
      ok: false,
      errors: { name: "名前を入れてください" },
    });
  });

  it("同じ名前の費目はもう一つ作れない（非表示の費目とも重ならない）", () => {
    const withHidden = [...existing, category({ id: "old", name: "書籍", hidden: true })];
    expect(addCategory({ name: "書籍", kind: "expense", memo: "" }, withHidden)).toEqual({
      ok: false,
      errors: { name: "同じ名前の費目があります" },
    });
  });

  it("種類を選ばないと追加できない", () => {
    expect(addCategory({ name: "ペット", kind: "", memo: "" }, existing)).toEqual({
      ok: false,
      errors: { kind: "支出か振替を選んでください" },
    });
  });
});

describe("費目の名前変更とメモ", () => {
  it("名前とメモを変えられる", () => {
    expect(editCategory("food", { name: "食費", memo: "中食は食費（食材）に入れる" }, existing)).toEqual({
      ok: true,
      value: { name: "食費", memo: "中食は食費（食材）に入れる" },
    });
  });

  it("名前はそのままでメモだけ変えられる", () => {
    expect(editCategory("rent", { name: "家賃", memo: "管理費込み" }, existing)).toEqual({
      ok: true,
      value: { name: "家賃", memo: "管理費込み" },
    });
  });

  it("ほかの費目と同じ名前には変えられない", () => {
    expect(editCategory("food", { name: "家賃", memo: "" }, existing)).toEqual({
      ok: false,
      errors: { name: "同じ名前の費目があります" },
    });
  });

  it("名前を空にはできない", () => {
    expect(editCategory("food", { name: "", memo: "" }, existing)).toEqual({
      ok: false,
      errors: { name: "名前を入れてください" },
    });
  });
});

describe("費目の並べ替え", () => {
  it("費目を一つ上に動かすと、入れ替わる二つの表示順だけが変わる", () => {
    expect(moveCategory(existing, "food", "up")).toEqual([
      { id: "rent", sortOrder: 1 },
      { id: "food", sortOrder: 0 },
    ]);
  });

  it("費目を一つ下に動かせる", () => {
    expect(moveCategory(existing, "food", "down")).toEqual([
      { id: "food", sortOrder: 2 },
      { id: "save", sortOrder: 1 },
    ]);
  });

  it("いちばん上の費目は上に、いちばん下の費目は下に動かない", () => {
    expect(moveCategory(existing, "rent", "up")).toEqual([]);
    expect(moveCategory(existing, "save", "down")).toEqual([]);
  });

  it("表示順が飛んだり重なったりしていても、見えている順のとおりに動かす", () => {
    const messy = [
      category({ id: "a", name: "A", sortOrder: 5 }),
      category({ id: "b", name: "B", sortOrder: 5 }),
      category({ id: "c", name: "C", sortOrder: 9 }),
    ];
    expect(moveCategory(messy, "c", "up")).toEqual([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 2 },
      { id: "c", sortOrder: 1 },
    ]);
  });

  it("費目は表示順に並ぶ（非表示の費目もその場所に並ぶ）", () => {
    const shuffled = [
      category({ id: "c", name: "C", sortOrder: 2 }),
      category({ id: "a", name: "A", sortOrder: 0, hidden: true }),
      category({ id: "b", name: "B", sortOrder: 1 }),
    ];
    expect(sortCategories(shuffled).map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});

describe("入力画面の費目", () => {
  it("非表示の費目は出ず、表示順に並ぶ", () => {
    const categories = [
      category({ id: "c", name: "C", sortOrder: 2 }),
      category({ id: "a", name: "A", sortOrder: 0, hidden: true }),
      category({ id: "b", name: "B", sortOrder: 1 }),
    ];
    expect(categoriesForInput(categories).map((c) => c.id)).toEqual(["b", "c"]);
  });
});
