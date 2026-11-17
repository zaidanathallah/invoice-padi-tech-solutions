/**
 * Helper function to convert numeric numbers into Indonesian words (Terbilang)
 * Example: 2200000 -> "Dua Juta Dua Ratus Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  if (isNaN(nominal)) return "";
  const absNominal = Math.abs(nominal);
  if (absNominal === 0) return "Nol Rupiah";

  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  function bilangaKeTeks(n: number): string {
    if (n < 12) return angka[n];
    if (n < 20) return bilangaKeTeks(n - 10) + " Belas";
    if (n < 100) return bilangaKeTeks(Math.floor(n / 10)) + " Puluh " + bilangaKeTeks(n % 10);
    if (n < 200) return "Seratus " + bilangaKeTeks(n - 100);
    if (n < 1000) return bilangaKeTeks(Math.floor(n / 100)) + " Ratus " + bilangaKeTeks(n % 100);
    if (n < 2000) return "Seribu " + bilangaKeTeks(n - 1000);
    if (n < 1000000) return bilangaKeTeks(Math.floor(n / 1000)) + " Ribu " + bilangaKeTeks(n % 1000);
    if (n < 1000000000) return bilangaKeTeks(Math.floor(n / 1000000)) + " Juta " + bilangaKeTeks(n % 1000000);
    if (n < 1000000000000) return bilangaKeTeks(Math.floor(n / 1000000000)) + " Milyar " + bilangaKeTeks(n % 1000000000);
    if (n < 1000000000000000) return bilangaKeTeks(Math.floor(n / 1000000000000)) + " Triliun " + bilangaKeTeks(n % 1000000000000);
    return "";
  }

  const hasil = bilangaKeTeks(Math.floor(absNominal)).replace(/\s+/g, " ").trim();
  const prefix = nominal < 0 ? "Minus " : "";
  return `${prefix}${hasil} Rupiah`;
}

export function formatRupiah(amount: number): string {
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return isNegative ? `-${formatted}` : formatted;
}
