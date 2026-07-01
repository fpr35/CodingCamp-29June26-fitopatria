# Requirements Document

## Introduction

To-Do List Life Dashboard adalah aplikasi web single-page berbasis Vanilla HTML, CSS, dan JavaScript yang berfungsi sebagai dashboard produktivitas harian. Aplikasi ini menggabungkan empat fitur inti: Greeting dinamis, Focus Timer (Pomodoro), To-Do List dengan CRUD lengkap, dan Quick Links. Ditambah tiga tantangan: nama pengguna yang bisa dikustomisasi, drag & drop reorder tasks, dan notifikasi/alarm saat timer selesai. Semua data disimpan menggunakan Browser Local Storage API tanpa framework atau library eksternal.

## Glossary

- **Dashboard**: Antarmuka utama single-page yang menampilkan semua widget secara bersamaan
- **Greeting_Widget**: Komponen yang menampilkan waktu, tanggal, dan sapaan berdasarkan waktu hari
- **Focus_Timer**: Komponen timer berbasis Pomodoro dengan durasi 25 menit
- **Todo_List**: Komponen pengelolaan tugas dengan operasi CRUD
- **Quick_Links**: Komponen untuk menyimpan dan mengelola koleksi tautan web
- **Task**: Satu item tugas dalam Todo_List dengan properti teks, status, dan urutan
- **Link_Item**: Satu item tautan dalam Quick_Links dengan properti nama dan URL
- **LocalStorage**: Browser Local Storage API sebagai satu-satunya mekanisme persistensi data
- **User_Name**: Nama pengguna yang dikustomisasi dan disimpan di LocalStorage
- **Notification**: Pemberitahuan browser (Web Notifications API) atau sinyal audio yang diputar saat timer selesai
- **Drag_Handle**: Elemen antarmuka yang memungkinkan pengguna menyeret task untuk mengatur ulang urutan

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** Sebagai pengguna, saya ingin melihat waktu, tanggal, dan sapaan yang relevan saat membuka dashboard, sehingga saya merasa disambut dan tahu konteks waktu saat ini.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL menampilkan waktu saat ini dalam format HH:MM (24-jam) yang diperbarui tepat pada pergantian menit menggunakan `setInterval` dengan interval 60 detik.
2. THE Greeting_Widget SHALL menampilkan tanggal saat ini dalam format lengkap (nama hari, tanggal, nama bulan, tahun) menggunakan `Date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })`.
3. WHEN jam saat ini berada di antara 00:00 dan 11:59 (inklusif), THE Greeting_Widget SHALL menampilkan sapaan "Selamat Pagi".
4. WHEN jam saat ini berada di antara 12:00 dan 14:59 (inklusif), THE Greeting_Widget SHALL menampilkan sapaan "Selamat Siang".
5. WHEN jam saat ini berada di antara 15:00 dan 17:59 (inklusif), THE Greeting_Widget SHALL menampilkan sapaan "Selamat Sore".
6. WHEN jam saat ini berada di antara 18:00 dan 23:59 (inklusif), THE Greeting_Widget SHALL menampilkan sapaan "Selamat Malam".
7. WHEN User_Name tersimpan di LocalStorage dengan nilai yang tidak kosong, THE Greeting_Widget SHALL menampilkan sapaan dalam format "[Sapaan], [User_Name]!" (contoh: "Selamat Pagi, Fito!").
8. WHEN User_Name tidak tersimpan di LocalStorage atau bernilai string kosong, THE Greeting_Widget SHALL menampilkan sapaan tanpa nama dan tanda koma (contoh: "Selamat Pagi").

---

### Requirement 2: Kustomisasi Nama Pengguna

**User Story:** Sebagai pengguna, saya ingin mengatur nama saya sendiri di dashboard, sehingga greeting terasa personal dan relevan.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan elemen input teks dengan tombol simpan untuk pengguna memasukkan atau mengubah User_Name, yang dapat diakses tanpa perlu memuat ulang halaman.
2. WHEN pengguna menyimpan User_Name yang valid (tidak kosong dan tidak melebihi 50 karakter), THE Dashboard SHALL menyimpan User_Name yang sudah di-trim ke LocalStorage menggunakan kunci `userName`.
3. WHEN pengguna menyimpan User_Name, THE Greeting_Widget SHALL memperbarui tampilan sapaan secara langsung di bawah 100ms tanpa memuat ulang halaman.
4. WHEN pengguna mengosongkan input User_Name dan menyimpan nilai kosong atau hanya whitespace, THE Dashboard SHALL menghapus kunci `userName` dari LocalStorage dan THE Greeting_Widget SHALL menampilkan sapaan tanpa nama.
5. IF User_Name yang dimasukkan melebihi 50 karakter, THEN THE Dashboard SHALL menolak penyimpanan dan menampilkan pesan kesalahan "Nama tidak boleh melebihi 50 karakter" di dekat elemen input.
6. WHEN User_Name berhasil disimpan, THE Dashboard SHALL memberikan konfirmasi visual (misalnya pesan sukses singkat atau perubahan tampilan input) bahwa nama telah tersimpan.

---

### Requirement 3: Focus Timer (Pomodoro)

**User Story:** Sebagai pengguna, saya ingin menggunakan timer 25 menit bergaya Pomodoro di dashboard, sehingga saya dapat bekerja dalam sesi fokus yang terstruktur.

#### Acceptance Criteria

1. THE Focus_Timer SHALL menampilkan hitungan mundur dalam format MM:SS dimulai dari 25:00 saat halaman pertama kali dimuat atau setelah reset.
2. WHEN pengguna menekan tombol "Mulai" dan timer dalam kondisi berhenti atau dijeda, THE Focus_Timer SHALL memulai atau melanjutkan hitungan mundur menggunakan `setInterval` dengan interval 1000ms.
3. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL memperbarui tampilan MM:SS setiap detik tanpa penyimpangan lebih dari 100ms per tick.
4. WHEN pengguna menekan tombol "Jeda" saat timer berjalan, THE Focus_Timer SHALL menghentikan `setInterval`, mempertahankan waktu tersisa, dan mengubah status tombol sehingga tombol "Mulai" dapat ditekan kembali.
5. WHEN pengguna menekan tombol "Reset", THE Focus_Timer SHALL menghentikan `setInterval`, mengatur ulang tampilan ke 25:00, dan mengubah status tombol ke kondisi awal (tombol "Mulai" aktif, tombol "Jeda" nonaktif).
6. WHEN hitungan mundur mencapai 00:00, THE Focus_Timer SHALL menghentikan `setInterval` secara otomatis dan memicu sinyal selesai.
7. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL menonaktifkan tombol "Mulai" (atribut `disabled`) dan mengaktifkan tombol "Jeda".
8. WHEN Focus_Timer dalam kondisi dijeda, THE Focus_Timer SHALL mengaktifkan tombol "Mulai" dan menonaktifkan tombol "Jeda".

---

### Requirement 4: Notifikasi/Alarm Saat Timer Selesai

**User Story:** Sebagai pengguna, saya ingin mendapatkan notifikasi atau alarm ketika sesi fokus berakhir, sehingga saya tidak perlu terus-menerus memantau layar.

#### Acceptance Criteria

1. WHEN hitungan mundur Focus_Timer mencapai 00:00, THE Focus_Timer SHALL memutar sinyal audio dengan durasi minimal 3 detik sebagai tanda sesi selesai.
2. WHEN hitungan mundur Focus_Timer mencapai 00:00 dan izin notifikasi browser telah diberikan (`Notification.permission === 'granted'`), THE Focus_Timer SHALL menampilkan Notification browser dengan judul "Sesi Fokus Selesai!" dan pesan "Waktunya istirahat sejenak." yang otomatis tertutup setelah 5 detik.
3. WHEN pengguna memulai sesi Focus_Timer untuk pertama kali dan izin notifikasi belum pernah diberikan atau ditolak (`Notification.permission === 'default'`), THE Dashboard SHALL menampilkan permintaan izin notifikasi browser kepada pengguna.
4. IF pengguna menolak izin notifikasi browser (`Notification.permission === 'denied'`), THEN THE Focus_Timer SHALL tetap memutar sinyal audio sebagai alternatif tanpa menampilkan Notification browser.
5. IF perangkat tidak mendukung Web Notifications API (`typeof Notification === 'undefined'`), THEN THE Focus_Timer SHALL memutar sinyal audio sebagai satu-satunya tanda sesi selesai.
6. IF sinyal audio gagal diputar karena error browser (misalnya kebijakan autoplay), THEN THE Focus_Timer SHALL menampilkan pesan visual di dashboard yang menyatakan "Sesi selesai! Silakan ambil istirahat." sebagai fallback.

---

### Requirement 5: To-Do List — Tambah dan Tampil Tugas

**User Story:** Sebagai pengguna, saya ingin menambahkan dan melihat daftar tugas saya, sehingga saya dapat melacak hal-hal yang perlu diselesaikan.

#### Acceptance Criteria

1. THE Todo_List SHALL menyediakan input teks dengan atribut `maxlength="200"` dan tombol tambah untuk menambahkan Task baru.
2. WHEN pengguna menekan tombol tambah atau menekan Enter di input teks dengan teks yang valid, THE Todo_List SHALL menambahkan Task baru dengan status `completed: false` ke daftar dan mengosongkan input teks.
3. WHEN Task baru ditambahkan, THE Todo_List SHALL menyimpan seluruh daftar Task ke LocalStorage menggunakan kunci `tasks` dalam format JSON.
4. WHEN halaman dimuat dan LocalStorage mengandung kunci `tasks` dengan data JSON yang valid, THE Todo_List SHALL mem-parse dan menampilkan semua Task tersimpan.
5. WHEN halaman dimuat dan LocalStorage tidak mengandung kunci `tasks` atau data tidak valid, THE Todo_List SHALL menampilkan daftar kosong tanpa error.
6. IF pengguna mencoba menambahkan Task dengan input teks kosong atau hanya whitespace, THEN THE Todo_List SHALL menolak penambahan, tidak mengubah daftar, dan menampilkan pesan kesalahan "Tugas tidak boleh kosong".
7. IF pengguna mencoba menambahkan Task dengan teks yang melebihi 200 karakter, THEN THE Todo_List SHALL menolak penambahan dan menampilkan pesan kesalahan "Tugas tidak boleh melebihi 200 karakter".
8. WHEN LocalStorage mengandung data `tasks` yang tidak dapat di-parse sebagai JSON valid, THE Todo_List SHALL mengabaikan data tersebut dan menampilkan daftar kosong tanpa melempar error ke console.

---

### Requirement 6: To-Do List — Selesaikan dan Hapus Tugas

**User Story:** Sebagai pengguna, saya ingin menandai tugas sebagai selesai dan menghapus tugas yang tidak diperlukan, sehingga daftar saya tetap akurat dan rapi.

#### Acceptance Criteria

1. THE Todo_List SHALL menampilkan sebuah `<input type="checkbox">` pada setiap Task untuk menandai status penyelesaian.
2. WHEN pengguna mencentang checkbox pada Task yang berstatus `completed: false`, THE Todo_List SHALL memperbarui status Task menjadi `completed: true`, menampilkan teks Task dengan gaya teks dicoret dan opacity yang dikurangi, dan menyimpan perubahan ke LocalStorage.
3. WHEN pengguna menghilangkan centang checkbox pada Task yang berstatus `completed: true`, THE Todo_List SHALL mengembalikan status Task menjadi `completed: false`, menghapus gaya teks dicoret dan opacity, dan menyimpan perubahan ke LocalStorage.
4. THE Todo_List SHALL menampilkan tombol hapus pada setiap Task.
5. WHEN pengguna menekan tombol hapus pada sebuah Task, THE Todo_List SHALL menghapus Task tersebut dari daftar dan dari LocalStorage tanpa konfirmasi tambahan.
6. IF operasi penyimpanan perubahan status ke LocalStorage gagal, THEN THE Todo_List SHALL mengembalikan status checkbox ke nilai sebelumnya dan menampilkan pesan kesalahan singkat kepada pengguna.

---

### Requirement 7: To-Do List — Edit Tugas

**User Story:** Sebagai pengguna, saya ingin mengedit teks tugas yang sudah ada, sehingga saya dapat memperbaiki atau memperbarui tugas tanpa harus menghapus dan membuat ulang.

#### Acceptance Criteria

1. THE Todo_List SHALL menampilkan tombol "Edit" pada setiap Task.
2. WHEN pengguna menekan tombol "Edit" pada sebuah Task, THE Todo_List SHALL mengganti tampilan teks Task dengan input teks yang berisi teks Task saat ini dan membatasi input maksimum 200 karakter.
3. WHILE sebuah Task sedang dalam mode edit, THE Todo_List SHALL memastikan hanya satu Task yang dapat berada dalam mode edit pada waktu yang sama; Task lain yang sebelumnya dalam mode edit SHALL dikembalikan ke tampilan normal tanpa menyimpan perubahan.
4. WHEN pengguna menyimpan perubahan pada Task (menekan Enter atau tombol simpan), THE Todo_List SHALL memperbarui teks Task dengan nilai baru yang telah di-trim dan menyimpan perubahan ke LocalStorage.
5. WHEN pengguna membatalkan edit (menekan Escape atau tombol batal), THE Todo_List SHALL mengembalikan Task ke tampilan semula dengan teks asli tanpa mengubah data di LocalStorage.
6. IF pengguna mencoba menyimpan Task dengan teks kosong atau hanya whitespace, THEN THE Todo_List SHALL menolak penyimpanan, mempertahankan teks Task sebelumnya, dan menampilkan pesan kesalahan "Tugas tidak boleh kosong".

---

### Requirement 8: To-Do List — Drag & Drop Reorder Tasks

**User Story:** Sebagai pengguna, saya ingin mengatur ulang urutan tugas dengan cara menyeret dan melepasnya, sehingga saya dapat memprioritaskan tugas secara visual dan intuitif.

#### Acceptance Criteria

1. THE Todo_List SHALL menampilkan Drag_Handle (ikon atau area khusus) pada setiap Task yang tidak sedang dalam mode edit.
2. WHEN pengguna menyeret sebuah Task menggunakan Drag_Handle dan melepasnya di posisi baru yang berbeda dari posisi asal, THE Todo_List SHALL memperbarui urutan Task sesuai posisi baru tersebut.
3. WHEN urutan Task berubah akibat drag & drop, THE Todo_List SHALL menyimpan urutan baru ke LocalStorage sebagai array Task yang telah diurutkan ulang dalam format JSON.
4. IF operasi penyimpanan urutan baru ke LocalStorage gagal, THEN THE Todo_List SHALL mengembalikan urutan visual ke urutan sebelum drag & drop dan menampilkan pesan kesalahan singkat kepada pengguna.
5. WHEN halaman dimuat dan LocalStorage mengandung data `tasks` yang valid, THE Todo_List SHALL menampilkan Task dalam urutan yang tersimpan di LocalStorage.
6. WHEN halaman dimuat dan LocalStorage tidak mengandung data urutan yang valid, THE Todo_List SHALL menampilkan Task dalam urutan penambahan (Task terlama di atas).
7. WHILE pengguna menyeret sebuah Task, THE Todo_List SHALL menampilkan placeholder transparan di posisi asal Task dan mengubah tampilan Task yang diseret (misalnya opacity dikurangi) untuk menunjukkan posisi pelepasan yang valid.

---

### Requirement 9: Quick Links — Tambah dan Tampil Link

**User Story:** Sebagai pengguna, saya ingin menyimpan tautan web yang sering saya gunakan di dashboard, sehingga saya dapat mengaksesnya dengan cepat tanpa perlu mengingat atau mencari URL.

#### Acceptance Criteria

1. THE Quick_Links SHALL menyediakan form dengan input teks nama (maksimum 50 karakter) dan input teks URL (maksimum 500 karakter) untuk menambahkan Link_Item baru.
2. WHEN pengguna mengisi form dengan nilai valid dan menekan tombol tambah, THE Quick_Links SHALL menambahkan Link_Item baru ke koleksi dan mengosongkan kedua field input.
3. WHEN Link_Item baru ditambahkan, THE Quick_Links SHALL menyimpan seluruh koleksi Link_Item ke LocalStorage menggunakan kunci `quickLinks` dalam format JSON.
4. WHEN halaman dimuat dan LocalStorage mengandung kunci `quickLinks` dengan data JSON yang valid, THE Quick_Links SHALL menampilkan semua Link_Item tersimpan.
5. THE Quick_Links SHALL menampilkan setiap Link_Item sebagai elemen `<a>` yang dapat diklik dengan atribut `target="_blank"` dan `rel="noopener noreferrer"`.
6. IF pengguna mencoba menambahkan Link_Item dengan nama kosong, THEN THE Quick_Links SHALL menolak penambahan dan menampilkan pesan kesalahan "Nama link tidak boleh kosong" di bawah field nama.
7. IF pengguna mencoba menambahkan Link_Item dengan URL kosong, THEN THE Quick_Links SHALL menolak penambahan dan menampilkan pesan kesalahan "URL tidak boleh kosong" di bawah field URL.
8. IF pengguna memasukkan URL yang tidak diawali dengan "http://" atau "https://", THEN THE Quick_Links SHALL menolak penambahan dan menampilkan pesan kesalahan "URL harus diawali dengan http:// atau https://".

---

### Requirement 10: Quick Links — Hapus Link

**User Story:** Sebagai pengguna, saya ingin menghapus tautan yang sudah tidak saya butuhkan, sehingga koleksi Quick Links tetap relevan dan tidak berantakan.

#### Acceptance Criteria

1. WHILE koleksi Quick_Links mengandung setidaknya satu Link_Item, THE Quick_Links SHALL menampilkan tombol hapus pada setiap Link_Item.
2. WHEN pengguna menekan tombol hapus pada sebuah Link_Item, THE Quick_Links SHALL menghapus Link_Item tersebut dari tampilan dan memperbarui LocalStorage dengan koleksi yang telah diperbarui.
3. IF operasi penghapusan dari LocalStorage gagal, THEN THE Quick_Links SHALL mengembalikan Link_Item ke tampilan semula dan menampilkan pesan kesalahan "Gagal menghapus link. Silakan coba lagi."
4. WHEN semua Link_Item telah dihapus sehingga koleksi menjadi kosong, THE Quick_Links SHALL menampilkan pesan "Belum ada link yang disimpan. Tambahkan link pertama Anda!".

---

### Requirement 11: Persistensi Data dengan LocalStorage

**User Story:** Sebagai pengguna, saya ingin data saya tetap tersimpan setelah menutup atau memuat ulang browser, sehingga saya tidak kehilangan tugas, link, dan pengaturan saya.

#### Acceptance Criteria

1. THE Dashboard SHALL menggunakan LocalStorage sebagai satu-satunya mekanisme penyimpanan data.
2. WHEN halaman dimuat ulang, THE Dashboard SHALL memulihkan semua Task, Link_Item, User_Name, dan pengaturan dari LocalStorage.
3. THE Dashboard SHALL menyimpan perubahan data ke LocalStorage segera setelah setiap operasi penambahan, penghapusan, pembaruan, atau perubahan urutan.
4. IF LocalStorage tidak dapat diakses (misalnya dalam mode private/incognito dengan storage diblokir), THEN THE Dashboard SHALL menampilkan pesan peringatan bahwa data tidak dapat disimpan secara permanen.

---

### Requirement 12: Arsitektur Teknis

**User Story:** Sebagai developer, saya ingin proyek dibangun dengan struktur file yang jelas dan teknologi yang ditentukan, sehingga kode mudah dipelihara dan sesuai standar proyek.

#### Acceptance Criteria

1. THE Dashboard SHALL diimplementasikan hanya menggunakan Vanilla HTML, CSS, dan JavaScript tanpa framework atau library JavaScript eksternal.
2. THE Dashboard SHALL menggunakan tepat satu file CSS yang ditempatkan di direktori `/css/`.
3. THE Dashboard SHALL menggunakan tepat satu file JavaScript yang ditempatkan di direktori `/js/`.
4. THE Dashboard SHALL terdiri dari satu halaman HTML utama (single-page application) tanpa navigasi antar halaman.
5. WHEN aplikasi dijalankan di browser modern (Chrome, Firefox, Edge, Safari versi terbaru), THE Dashboard SHALL berfungsi dengan benar tanpa error di console.
