// Port nguyên si từ logilab-client/lib/categories.ts (slugifyBrand) để 2 bên
// luôn ra cùng 1 slug cho cùng 1 tên hãng — không được lệch dù chỉ 1 ký tự,
// vì slug này dùng để khớp ngược lại tên hãng thật khi lọc theo brand.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
