// 記録の id は uuid。それ以外の URL はデータベースに問い合わせずに「見つからない」にする
export function isRecordId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
