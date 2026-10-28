/** ホーム画面に追加したときのアイコン（ImageResponse で PNG にする）。 */
export function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#059669",
        color: "#ffffff",
        fontSize: size * 0.6,
        fontWeight: 700,
      }}
    >
      ¥
    </div>
  );
}
