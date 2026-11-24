# 🐉 Çakabey Zindanı — Öğretmenler ve Ejderha

▶️ **Oyna / Play:** https://nsumia.github.io/Cakabey-Dungeon/

Tarayıcıda çalışan, yukarıdan bakışlı (top-down), Türkçe bir hikâye oyunu. Yaklaşık **10–15 dakikada** biter.

Üç öğretmen — **Oğuzhan**, **Şeyda** ve **Aykutcan** — Çakabey Zindanı'na inip ejderha
**Buncaişinarasındahayatlaradokunma**'yı yenmeye çalışır. Yolda **Tibet** ve **Mert Ata** ile
savaşır, **Zeynep** ve **Ekin**'den yardım alırlar.

## Karakterler

| Tuş | Öğretmen | SPACE (Saldırı) | E (Özel) | Ne işe yarar |
|---|---|---|---|---|
| 1 | **Oğuzhan** (Rick and Morty hayranı) | Portal-lazer | Portal atlayışı | Uçurumları ve suyu geçer, mavi enerji bariyerlerini kırar |
| 2 | **Şeyda** (zürafa sever) | Pembe büyü | Zürafa çağır | Karanlık kristalleri kırar, zürafası yüksek şalterlere uzanır |
| 3 | **Aykutcan** (hep neşeli şifacı) | Neşe dalgası | Şifa Işığı | Herkesi iyileştirir, bayılanı kaldırır, lanetli kapıları açar, kasvet sisinden etkilenmez |

Bulmacalar ve boss kalkanları **karakter değiştirmeyi zorunlu kılar**.

## Kontroller

- **WASD / Ok tuşları** — yürü
- **SPACE / J** — saldırı
- **E / K** — özel yetenek
- **1 / 2 / 3** veya **Q / Tab** — öğretmen değiştir
- **ENTER / SPACE** — diyaloğu ilerlet
- **P / ESC** — duraklat · **M** — ses aç/kapa
- Telefonda ekranda dokunmatik butonlar çıkar.

## Bölümler

1. **Çakabey Okulu — Arka Bahçe** (öğretici, Zeynep)
2. **1. Kat: Evrak Koridorları** — boss: Tibet
3. **2. Kat: Kasvet Mağarası** — Ekin'i kurtar, boss: Mert Ata
4. **Ejderha İni** — Buncaişinarasındahayatlaradokunma

---

## 🚀 GitHub'a yükleme ve yayınlama (GitHub Pages)

Oyun tamamen statik (HTML + JS + PNG). Kurulum, derleme, paket yok.

1. GitHub'da yeni bir depo oluşturun (ör. `cakabey-zindani`). README eklemeyin, boş olsun.
2. Bu klasörde:
   ```bash
   git remote add origin https://github.com/nsumia/Cakabey-Dungeon.git
   git push -u origin main
   ```
   (Ya da GitHub sitesinde **Add file → Upload files** ile klasördeki tüm dosyaları sürükleyip bırakın.
   `.github` klasörünü de yüklediğinizden emin olun.)
3. Depoda **Settings → Pages → Build and deployment → Source: GitHub Actions** seçin.
4. Birkaç dakika içinde oyun şu adreste açılır:
   `https://nsumia.github.io/Cakabey-Dungeon/`

Her `main` dalına push'ta `.github/workflows/pages.yml` oyunu otomatik yeniden yayınlar.

> Alternatif: Settings → Pages'te **Deploy from a branch → main / (root)** seçmek de çalışır.

## Bilgisayarda çalıştırma

`index.html`'e çift tıklamak çoğu tarayıcıda çalışır. Sorun olursa klasörde basit bir sunucu açın:

```bash
python3 -m http.server 8000
```

ve `http://localhost:8000` adresine gidin.

## Dosyalar

```
index.html            oyun sayfası
game.js               tüm oyun kodu (harita, diyalog, savaş, bosslar)
assets/*.png          üç öğretmenin sprite sayfaları (5 kare: 1 duruş + 4 yürüyüş)
.github/workflows/    GitHub Pages otomatik yayın
```

Geliştirici ipucu: `index.html?bolum=2` gibi bir adresle oyunu doğrudan bir bölümden başlatabilirsiniz (0–3).
