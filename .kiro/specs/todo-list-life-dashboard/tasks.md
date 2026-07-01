# Implementation Plan: To-Do List Life Dashboard

## Overview

Implementasi dashboard produktivitas harian single-page berbasis Vanilla HTML, CSS, dan JavaScript murni. Tidak ada framework atau library eksternal — hanya tiga file inti (`index.html`, `css/style.css`, `js/app.js`). Urutan implementasi mengikuti alur dependency: struktur file → modul storage → widget greeting + nama → focus timer + notifikasi → todo list → quick links → pengujian.

---

## Tasks

- [x] 1. Setup Struktur File dan Kerangka HTML
  - Buat file `index.html` dengan struktur HTML5 lengkap (doctype, meta charset, meta viewport, judul halaman)
  - Buat file `css/style.css` (kosong, siap diisi)
  - Buat file `js/app.js` (kosong, siap diisi)
  - Hubungkan `<link rel="stylesheet" href="css/style.css">` dan `<script src="js/app.js" defer></script>` di `index.html`
  - Buat placeholder elemen HTML untuk semua widget: `#greeting-time`, `#greeting-date`, `#greeting-text`, `#username-input`, `#username-save-btn`, `#username-error`, `#username-success`, `#timer-display`, `#timer-start-btn`, `#timer-pause-btn`, `#timer-reset-btn`, `#todo-input`, `#todo-add-btn`, `#todo-list`, `#todo-error`, `#link-name-input`, `#link-url-input`, `#link-add-btn`, `#link-name-error`, `#link-url-error`, `#quick-links-list`, `#quick-links-empty`
  - _Requirements: 12.1, 12.2, 12.3, 12.4_


- [x] 2. Implementasi StorageManager
  - [x] 2.1 Tulis modul `StorageManager` di dalam `js/app.js`
    - Implementasikan fungsi `StorageManager.isAvailable()` — uji apakah `localStorage` dapat diakses dengan mencoba `setItem` dummy; tangkap `SecurityError` dan kembalikan `false`
    - Implementasikan `StorageManager.get(key)` — baca dari localStorage, tangkap semua exception, kembalikan `null` jika gagal
    - Implementasikan `StorageManager.set(key, value)` — serialisasi nilai dengan `JSON.stringify`, simpan, tangkap exception (QuotaExceededError), kembalikan `boolean`
    - Implementasikan `StorageManager.remove(key)` — hapus kunci dari localStorage, kembalikan `boolean`
    - Tambahkan pengecekan `isAvailable()` di awal `DOMContentLoaded`; jika `false`, tampilkan banner peringatan "Data tidak dapat disimpan secara permanen"
    - _Requirements: 11.1, 11.4_

  - [ ]* 2.2 Tulis unit test untuk StorageManager
    - Mock `localStorage` dengan `vi.stubGlobal` atau `Object.defineProperty`
    - Uji `isAvailable()` mengembalikan `false` saat `SecurityError` dilempar
    - Uji `set()` mengembalikan `false` saat `QuotaExceededError` dilempar
    - Uji `get()` mengembalikan `null` saat kunci tidak ada
    - _Requirements: 11.1, 11.4_


- [x] 3. Implementasi Greeting Widget
  - [x] 3.1 Tulis modul `GreetingModule` di dalam `js/app.js`
    - Implementasikan `GreetingModule.getGreeting(hour)` — kembalikan string sapaan berdasarkan rentang jam: [0–11] → "Selamat Pagi", [12–14] → "Selamat Siang", [15–17] → "Selamat Sore", [18–23] → "Selamat Malam"
    - Implementasikan `GreetingModule.render()` — ambil `Date` terkini, update `#greeting-time` (format HH:MM 24-jam), update `#greeting-date` dengan `Date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })`, update `#greeting-text` dengan sapaan + nama (jika `userName` tersimpan)
    - Implementasikan `GreetingModule.init()` — panggil `render()` sekali, lalu jalankan `setInterval(render, 60000)` yang dijadwalkan tepat pada pergantian menit
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 3.2 Tulis property test untuk GreetingModule — Property 1
    - **Property 1: Partisi Sapaan Lengkap, Tidak Tumpang Tindih, dan Tidak Memiliki Celah**
    - Generator: `fc.integer({min: 0, max: 23})`
    - Verifikasi: `getGreeting(h)` mengembalikan tepat satu dari empat string valid; nilai yang dikembalikan konsisten dengan rentang jam yang ditetapkan; tidak pernah `null` atau `undefined`
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [ ]* 3.3 Tulis property test untuk GreetingModule — Property 2
    - **Property 2: Format Tampilan Greeting dengan Nama Pengguna**
    - Generator: `fc.string({minLength: 1, maxLength: 50})` difilter agar tidak pure-whitespace
    - Verifikasi: teks sapaan yang dirender mengandung format `"[Sapaan], [nama]!"`
    - **Validates: Requirements 1.7, 2.2**


- [x] 4. Implementasi Kustomisasi Nama Pengguna
  - [x] 4.1 Tulis modul `UserNameModule` di dalam `js/app.js`
    - Implementasikan `UserNameModule.init()` — load `userName` dari `StorageManager.get('userName')`, isi `#username-input` dengan nilai yang ada, pasang event listener pada `#username-save-btn` (click) dan `#username-input` (keydown Enter)
    - Implementasikan `UserNameModule.save()` — ambil nilai input, trim; jika kosong panggil `clear()`; jika panjang > 50 tampilkan `#username-error` "Nama tidak boleh melebihi 50 karakter" dan batalkan; jika valid panggil `StorageManager.set('userName', trimmedName)`, tampilkan `#username-success`, dan panggil `GreetingModule.render()`
    - Implementasikan `UserNameModule.clear()` — panggil `StorageManager.remove('userName')`, kosongkan `#username-input`, panggil `GreetingModule.render()`
    - Pastikan update greeting terjadi dalam < 100ms setelah simpan
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 Tulis property test untuk UserNameModule — Property 3
    - **Property 3: Validasi Panjang Nama Pengguna — Tolak Jika Melebihi Batas**
    - Generator: `fc.string({minLength: 51, maxLength: 200})`
    - Verifikasi: `localStorage.getItem('userName')` tidak berubah dari nilai sebelum percobaan penyimpanan
    - **Validates: Requirements 2.5**

  - [ ]* 4.3 Tulis property test untuk UserNameModule — Property 4
    - **Property 4: Input Whitespace Sebagai Nama Pengguna Menghapus Kunci userName**
    - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n'), {minLength: 1})`
    - Verifikasi: `localStorage.getItem('userName')` bernilai `null` setelah operasi simpan
    - **Validates: Requirements 2.4**

- [x] 5. Checkpoint — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada pengguna jika ada pertanyaan.


- [x] 6. Implementasi Focus Timer (Pomodoro)
  - [x] 6.1 Tulis modul `TimerModule` di dalam `js/app.js`
    - Definisikan state internal: `{ totalSeconds: 1500, remaining: 1500, intervalId: null, isRunning: false }`
    - Implementasikan `TimerModule.format(seconds)` — kembalikan string `MM:SS` (contoh: `1500 → "25:00"`, `0 → "00:00"`)
    - Implementasikan `TimerModule.init()` — render `25:00` ke `#timer-display`, pasang event listener pada tombol `#timer-start-btn`, `#timer-pause-btn`, `#timer-reset-btn`, nonaktifkan `#timer-pause-btn`
    - Implementasikan `TimerModule.start()` — jalankan `setInterval(tick, 1000)`, aktifkan `#timer-pause-btn` dengan atribut `disabled` pada `#timer-start-btn`
    - Implementasikan `TimerModule.pause()` — `clearInterval`, simpan `remaining`, kembalikan state tombol (aktifkan `#timer-start-btn`, nonaktifkan `#timer-pause-btn`)
    - Implementasikan `TimerModule.reset()` — `clearInterval`, set `remaining = 1500`, update DOM ke "25:00", kembalikan semua tombol ke kondisi awal
    - Implementasikan `TimerModule.tick()` — kurangi `remaining` satu detik, update `#timer-display`; jika `remaining === 0` panggil `clearInterval` dan `NotificationModule.notify()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 6.2 Tulis property test untuk TimerModule — Property 16
    - **Property 16: Format Timer Selalu Menghasilkan String MM:SS yang Valid**
    - Generator: `fc.integer({min: 0, max: 1500})`
    - Verifikasi: output cocok dengan pola regex `/^\d{2}:\d{2}$/`; komponen menit ∈ ["00"–"25"], komponen detik ∈ ["00"–"59"]
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 6.3 Tulis unit test untuk TimerModule
    - Uji `start()` → interval terdaftar dan tombol berubah state
    - Uji `pause()` → interval berhenti, `remaining` dipertahankan
    - Uji `reset()` → `remaining = 1500`, display menampilkan "25:00"
    - Uji `format()` di batas nilai: `format(0)` → `"00:00"`, `format(1500)` → `"25:00"`, `format(90)` → `"01:30"`
    - _Requirements: 3.1, 3.4, 3.5_


- [x] 7. Implementasi Notifikasi dan Alarm
  - [x] 7.1 Tulis modul `NotificationModule` di dalam `js/app.js`
    - Implementasikan `NotificationModule.init()` — periksa dukungan `Notification` API (`typeof Notification !== 'undefined'`) dan `AudioContext`; simpan flag dukungan
    - Implementasikan `NotificationModule.requestPermission()` — panggil `Notification.requestPermission()` dan kembalikan Promise; dipanggil oleh `TimerModule.start()` saat pertama kali timer dimulai dan `permission === 'default'`
    - Implementasikan `NotificationModule.playAudio()` — buat `AudioContext`, buat `OscillatorNode` dengan frekuensi sinyal alarm (misalnya 800Hz), putar minimal 3 detik; tangkap `DOMException` (kebijakan autoplay) dan panggil `showVisualFallback()`
    - Implementasikan `NotificationModule.showNotification()` — jika `permission === 'granted'`, buat `new Notification('Sesi Fokus Selesai!', { body: 'Waktunya istirahat sejenak.' })`, tutup otomatis setelah 5000ms
    - Implementasikan `NotificationModule.showVisualFallback()` — tampilkan pesan "Sesi selesai! Silakan ambil istirahat." di elemen DOM (buat elemen fallback di HTML jika perlu)
    - Implementasikan `NotificationModule.notify()` — selalu panggil `playAudio()`, kemudian `showNotification()` jika didukung
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 7.2 Tulis unit test untuk NotificationModule
    - Mock `Notification` API dan `AudioContext`
    - Uji: jika `permission === 'granted'` → `showNotification()` dipanggil
    - Uji: jika `permission === 'denied'` → hanya `playAudio()`, `showNotification()` tidak dipanggil
    - Uji: jika `Notification` tidak ada (`typeof Notification === 'undefined'`) → hanya `playAudio()`
    - Uji: jika `playAudio()` melempar `DOMException` → `showVisualFallback()` dipanggil
    - _Requirements: 4.2, 4.4, 4.5, 4.6_

- [x] 8. Checkpoint — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada pengguna jika ada pertanyaan.


- [x] 9. Implementasi To-Do List — CRUD
  - [x] 9.1 Tulis fungsi helper dan data model `Task` di `js/app.js`
    - Implementasikan `generateId(prefix)` — kembalikan string unik: `` `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` ``
    - Definisikan struktur `Task`: `{ id: string, text: string, completed: boolean, order: number }`
    - _Requirements: 5.3, 12.1_

  - [x] 9.2 Tulis modul `TodoModule` — storage dan render
    - Implementasikan `TodoModule.loadFromStorage()` — baca `StorageManager.get('tasks')`; jika `null` atau tidak valid kembalikan `[]`; tangkap JSON parse error dengan `try/catch`, kembalikan `[]` tanpa melempar error ke console
    - Implementasikan `TodoModule.saveToStorage(tasks)` — panggil `StorageManager.set('tasks', tasks)`, kembalikan `boolean`
    - Implementasikan `TodoModule.renderAll(tasks)` — kosongkan `#todo-list`, buat dan append elemen `<li>` untuk setiap task dengan `renderItem(task)`
    - Implementasikan `TodoModule.renderItem(task)` — buat elemen `<li>` yang mengandung: `<input type="checkbox">`, teks task, tombol Edit, tombol Hapus, Drag_Handle; terapkan gaya coret dan opacity jika `completed === true`
    - _Requirements: 5.4, 5.5, 5.8, 6.1, 6.4, 8.5, 8.6_

  - [x] 9.3 Tulis modul `TodoModule` — operasi tambah, hapus, toggle
    - Implementasikan `TodoModule.init()` — panggil `loadFromStorage()`, panggil `renderAll()`, pasang event listener pada `#todo-add-btn` (click) dan `#todo-input` (keydown Enter)
    - Implementasikan `TodoModule.addTask(text)` — trim input; jika kosong tampilkan `#todo-error` "Tugas tidak boleh kosong" dan batalkan; jika panjang > 200 tampilkan error "Tugas tidak boleh melebihi 200 karakter"; jika valid buat task baru (`completed: false`, `order: tasks.length`), tambahkan ke array, simpan, render, kosongkan input
    - Implementasikan `TodoModule.toggleTask(id)` — temukan task, simpan status sebelumnya, toggle `completed`, coba simpan; jika `saveToStorage` gagal rollback status dan tampilkan pesan error
    - Implementasikan `TodoModule.deleteTask(id)` — hapus task dari array, simpan, render ulang
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 6.1, 6.2, 6.3, 6.5, 6.6_

  - [ ]* 9.4 Tulis property test untuk TodoModule — Property 5
    - **Property 5: Penambahan Task Valid Menambah Panjang Array Tepat Satu**
    - Generator: `fc.array(taskArb)` dikombinasikan dengan `fc.string({minLength:1, maxLength:200})` difilter agar tidak pure-whitespace
    - Verifikasi: panjang array +1; task baru ada dengan `text === input.trim()` dan `completed === false`
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 9.5 Tulis property test untuk TodoModule — Property 6
    - **Property 6: Input Kosong atau Whitespace Sebagai Task Ditolak**
    - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` (termasuk string kosong `""`)
    - Verifikasi: panjang array task tidak berubah setelah pemanggilan `addTask`
    - **Validates: Requirements 5.6**

  - [ ]* 9.6 Tulis property test untuk TodoModule — Property 7
    - **Property 7: Round-Trip Serialisasi Task ke LocalStorage**
    - Generator: `fc.array(taskArb)`
    - Verifikasi: `JSON.parse(JSON.stringify(tasks))` menghasilkan array ekuivalen struktural — semua properti `id`, `text`, `completed`, `order` terjaga
    - **Validates: Requirements 5.3, 5.4, 11.3**

  - [ ]* 9.7 Tulis property test untuk TodoModule — Property 8
    - **Property 8: Toggle Status Task adalah Operasi Involusi**
    - Generator: `fc.record({ id: fc.string(), text: fc.string({minLength:1}), completed: fc.boolean(), order: fc.nat() })`
    - Verifikasi: memanggil `toggleTask(id)` dua kali berurutan mengembalikan `completed` ke nilai semula
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 9.8 Tulis property test untuk TodoModule — Property 9
    - **Property 9: Penghapusan Task Mengurangi Panjang Array Tepat Satu**
    - Generator: `fc.array(taskArb, {minLength: 1})` + pilih indeks acak dari array
    - Verifikasi: panjang array -1; task dengan `id` yang dihapus tidak ada di array hasil
    - **Validates: Requirements 6.5**


- [x] 10. Implementasi To-Do List — Edit Tugas
  - [x] 10.1 Tulis fungsi edit task di `TodoModule`
    - Implementasikan `TodoModule.startEdit(id)` — jika ada task lain dalam mode edit, panggil `cancelEdit` terlebih dahulu; ganti elemen teks task dengan `<input type="text">` yang berisi teks saat ini dan `maxlength="200"`; tampilkan tombol Simpan dan Batal, sembunyikan Drag_Handle
    - Implementasikan `TodoModule.saveEdit(id, newText)` — trim `newText`; jika kosong tampilkan error "Tugas tidak boleh kosong"; jika valid update `task.text`, simpan ke storage, render ulang
    - Implementasikan `TodoModule.cancelEdit(id)` — kembalikan tampilan task ke teks asli tanpa menyimpan, render ulang
    - Pasang event listener: Enter → `saveEdit`, Escape → `cancelEdit`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 10.2 Tulis property test untuk TodoModule — Property 10
    - **Property 10: Edit Lalu Batal Tidak Mengubah State Task**
    - Generator: `fc.record(taskArb)` + `fc.string()` sebagai teks edit
    - Verifikasi: setelah urutan `startEdit(id)` → `cancelEdit(id)`, properti `text` task identik dengan sebelum edit dan nilai localStorage `tasks` tidak berubah
    - **Validates: Requirements 7.5**

  - [ ]* 10.3 Tulis unit test untuk operasi edit
    - Uji `saveEdit` dengan teks valid → task.text diperbarui di storage
    - Uji `saveEdit` dengan teks kosong → ditolak, teks asli dipertahankan
    - Uji bahwa hanya satu task yang bisa dalam mode edit pada satu waktu
    - _Requirements: 7.3, 7.4, 7.6_


- [x] 11. Implementasi To-Do List — Drag & Drop Reorder
  - [x] 11.1 Tulis fungsi drag & drop di `TodoModule`
    - Implementasikan `TodoModule.initDragDrop()` — tambahkan `draggable="true"` pada setiap `<li>` task; sembunyikan Drag_Handle saat task dalam mode edit
    - Implementasikan `TodoModule.onDragStart(event)` — simpan `dataset.id` task yang diseret ke variabel state; kurangi opacity task yang diseret
    - Implementasikan `TodoModule.onDragOver(event)` — panggil `event.preventDefault()`; tampilkan placeholder transparan di posisi asal task
    - Implementasikan `TodoModule.onDrop(event)` — tentukan task target, reorganisasi array (pindahkan elemen dari indeks asal ke indeks target), update properti `order`, simpan ke storage via `saveToStorage`; jika simpan gagal rollback urutan visual dan tampilkan error
    - Implementasikan `TodoModule.onDragEnd(event)` — bersihkan semua kelas visual drag (opacity, placeholder)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 11.2 Tulis property test untuk TodoModule — Property 11
    - **Property 11: Drag & Drop Mempertahankan Himpunan Task (Invariant Konten)**
    - Generator: `fc.array(taskArb, {minLength: 2})` + dua indeks berbeda yang valid
    - Verifikasi: himpunan `id` setelah reorder identik dengan sebelum — tidak ada task hilang, tidak ada duplikasi, tidak ada task baru
    - **Validates: Requirements 8.2, 8.3**

- [x] 12. Checkpoint — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada pengguna jika ada pertanyaan.


- [x] 13. Implementasi Quick Links — Tambah, Tampil, dan Hapus
  - [x] 13.1 Tulis fungsi helper dan data model `LinkItem` di `js/app.js`
    - Definisikan struktur `LinkItem`: `{ id: string, name: string, url: string }`
    - Pastikan `generateId('link')` tersedia untuk pembuatan ID unik
    - _Requirements: 9.3, 12.1_

  - [x] 13.2 Tulis modul `QuickLinksModule` — storage dan render
    - Implementasikan `QuickLinksModule.loadFromStorage()` — baca `StorageManager.get('quickLinks')`; kembalikan `[]` jika `null` atau tidak valid, tangkap error parsing JSON
    - Implementasikan `QuickLinksModule.saveToStorage(links)` — panggil `StorageManager.set('quickLinks', links)`, kembalikan `boolean`
    - Implementasikan `QuickLinksModule.renderAll(links)` — kosongkan `#quick-links-list`; jika array kosong tampilkan `#quick-links-empty` "Belum ada link yang disimpan. Tambahkan link pertama Anda!"; untuk setiap item panggil `renderItem(link)` dan append ke list
    - Implementasikan `QuickLinksModule.renderItem(link)` — buat elemen yang mengandung `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.name}</a>` dan tombol hapus
    - _Requirements: 9.4, 9.5, 10.4_

  - [x] 13.3 Tulis modul `QuickLinksModule` — operasi tambah dan hapus
    - Implementasikan `QuickLinksModule.validateUrl(url)` — kembalikan `true` hanya jika url diawali `"http://"` atau `"https://"`
    - Implementasikan `QuickLinksModule.init()` — `loadFromStorage()`, `renderAll()`, pasang event listener pada `#link-add-btn`
    - Implementasikan `QuickLinksModule.addLink(name, url)` — validasi: nama kosong → error "Nama link tidak boleh kosong" di `#link-name-error`; URL kosong → error "URL tidak boleh kosong" di `#link-url-error`; URL tidak valid → error "URL harus diawali dengan http:// atau https://" di `#link-url-error`; jika valid buat LinkItem baru, simpan, render, kosongkan input
    - Implementasikan `QuickLinksModule.deleteLink(id)` — simpan snapshot links sebelum hapus; hapus dari array; coba `saveToStorage`; jika gagal kembalikan snapshot ke tampilan dan tampilkan error "Gagal menghapus link. Silakan coba lagi."
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3_

  - [ ]* 13.4 Tulis property test untuk QuickLinksModule — Property 12
    - **Property 12: Validasi URL Quick Links — Tolak Jika Tidak Diawali http/https**
    - Generator: `fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://'))`
    - Verifikasi: `validateUrl(url)` mengembalikan `false`; memanggil `addLink()` dengan URL tersebut tidak mengubah panjang array quickLinks
    - **Validates: Requirements 9.8**

  - [ ]* 13.5 Tulis property test untuk QuickLinksModule — Property 13
    - **Property 13: Setiap Link Item Dirender sebagai Elemen `<a>` yang Aman**
    - Generator: `fc.array(linkArb, {minLength: 1})`
    - Verifikasi: setelah `renderAll()`, setiap elemen `<a>` di DOM memiliki `target="_blank"` dan `rel="noopener noreferrer"`, serta `href` yang sesuai dengan `url` LinkItem-nya
    - **Validates: Requirements 9.5**

  - [ ]* 13.6 Tulis property test untuk QuickLinksModule — Property 14
    - **Property 14: Round-Trip Serialisasi Quick Links ke LocalStorage**
    - Generator: `fc.array(linkArb)`
    - Verifikasi: `JSON.parse(JSON.stringify(links))` menghasilkan array ekuivalen struktural — semua properti `id`, `name`, `url` terjaga
    - **Validates: Requirements 9.3, 9.4, 11.3**

  - [ ]* 13.7 Tulis property test untuk QuickLinksModule — Property 15
    - **Property 15: Penghapusan Quick Link Mengurangi Panjang Array Tepat Satu**
    - Generator: `fc.array(linkArb, {minLength: 1})` + pilih indeks acak yang valid
    - Verifikasi: panjang array -1; link dengan `id` yang dihapus tidak ada di array hasil
    - **Validates: Requirements 10.2**


- [x] 14. Styling CSS dan Polish UI
  - [x] 14.1 Tulis layout dan styling dasar di `css/style.css`
    - Buat CSS reset dan box-sizing global
    - Buat layout dashboard grid/flexbox untuk menampilkan semua widget secara bersamaan di satu halaman
    - Styling untuk Greeting Widget: tipografi waktu besar, tanggal, dan sapaan
    - Styling untuk UserName form: input teks dan tombol simpan inline
    - _Requirements: 12.2, 12.4_

  - [x] 14.2 Tulis styling untuk Focus Timer, Todo List, dan Quick Links
    - Styling tombol timer: Mulai (hijau), Jeda (oranye), Reset (abu-abu); state `disabled` diberi opacity
    - Styling todo list: item dengan checkbox, drag handle (≡ ikon), tombol edit dan hapus; gaya coret dan opacity dikurangi untuk task `completed`; tampilan placeholder drag & drop transparan
    - Styling quick links: tampilan kartu atau grid link dengan ikon hapus; pesan kosong dibedakan secara visual
    - Styling pesan error dan sukses: merah untuk error, hijau untuk sukses, muncul dekat elemen terkait
    - Styling visual fallback notifikasi timer
    - _Requirements: 6.1, 6.2, 8.7, 10.4, 12.2_

- [x] 15. Wiring — Inisialisasi Seluruh Modul
  - [x] 15.1 Hubungkan semua modul di event `DOMContentLoaded` dalam `js/app.js`
    - Tulis blok `document.addEventListener('DOMContentLoaded', () => { ... })` sebagai entry point
    - Panggil `StorageManager.init()` (atau cek `isAvailable()`) — tampilkan banner peringatan jika tidak tersedia
    - Panggil `GreetingModule.init()`
    - Panggil `UserNameModule.init()`
    - Panggil `TimerModule.init()`
    - Panggil `NotificationModule.init()`
    - Panggil `TodoModule.init()`
    - Panggil `QuickLinksModule.init()`
    - Pastikan tidak ada error di console pada browser modern (Chrome, Firefox, Edge, Safari terbaru)
    - _Requirements: 11.2, 12.5_

- [x] 16. Checkpoint Akhir — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada pengguna jika ada pertanyaan.


---

## Notes

- Task bertanda `*` adalah opsional dan dapat dilewati untuk implementasi MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Property tests menggunakan [fast-check](https://fast-check.dev/) dengan minimal 100 iterasi per properti
- Unit tests menggunakan [Vitest](https://vitest.dev/) dengan jsdom environment
- `localStorage` di-mock menggunakan `vi.stubGlobal` — tidak mengakses storage nyata di tes
- Web Audio API dan Notification API di-mock karena tidak tersedia di jsdom
- Checkpoint memastikan validasi inkremental sebelum lanjut ke modul berikutnya
- Semua modul ditulis dalam satu `js/app.js` menggunakan block scope atau IIFE — tidak ada polusi namespace global

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "9.1", "13.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 6, "tasks": ["7.2", "9.2"] },
    { "id": 7, "tasks": ["9.3"] },
    { "id": 8, "tasks": ["9.4", "9.5", "9.6", "9.7", "9.8", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 10, "tasks": ["11.2", "13.2"] },
    { "id": 11, "tasks": ["13.3"] },
    { "id": 12, "tasks": ["13.4", "13.5", "13.6", "13.7", "14.1"] },
    { "id": 13, "tasks": ["14.2"] },
    { "id": 14, "tasks": ["15.1"] }
  ]
}
```
