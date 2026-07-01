/* ==========================================================================
   To-Do List Life Dashboard — Main JavaScript
   File: js/app.js
   Requirements: 12.3 — tepat satu file JS di direktori /js/
   ==========================================================================

   Arsitektur modul (diimplementasi bertahap sesuai task):

   1. StorageManager      — Wrapper LocalStorage (get/set/remove) + error handling
                            (Task 2)
   2. GreetingModule      — Tampilkan waktu HH:MM, tanggal locale id-ID, sapaan
                            (Task 3)
   3. UserNameModule      — Kustomisasi dan persistensi nama pengguna
                            (Task 4)
   4. TimerModule         — Focus Timer Pomodoro 25 menit: Mulai/Jeda/Reset
                            (Task 6)
   5. ThemeModule         — Light / Dark mode toggle + persistensi localStorage
                            (Task 7)
   6. TodoModule          — CRUD task + Drag & Drop reorder + LocalStorage
                            (Task 9, 10, 11)
   7. QuickLinksModule    — CRUD quick links + validasi URL + LocalStorage
                            (Task 13)

   Entry point:
   - Semua modul diinisialisasi pada event DOMContentLoaded (Task 15)
   ========================================================================== */

/* ==========================================================================
   Helper Functions — digunakan oleh semua modul
   Requirements: 12.1
   ========================================================================== */

/**
 * Menghasilkan ID unik berdasarkan prefix, timestamp, dan string acak.
 * @param {string} prefix - Awalan untuk ID (misal: "task", "link")
 * @returns {string} ID unik dalam format `${prefix}-${Date.now()}-${random}`
 */
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ==========================================================================
   Data Models — JSDoc typedef
   Requirements: 5.3, 12.1
   ========================================================================== */

/**
 * @typedef {Object} Task
 * @property {string}  id        - ID unik task
 * @property {string}  text      - Teks deskripsi tugas (1–200 karakter)
 * @property {boolean} completed - Status penyelesaian
 * @property {number}  order     - Urutan tampilan (0-indexed)
 */

// ==========================================================================
// GreetingModule — Menampilkan waktu HH:MM, tanggal locale id-ID, dan sapaan
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
// ==========================================================================

const GreetingModule = {
  /**
   * Mengembalikan slug periode waktu berdasarkan jam (0–23).
   * Dipakai untuk mengatur atribut data-period pada <html> (Period Orb styling).
   * @param {number} hour
   * @returns {'pagi'|'siang'|'sore'|'malam'}
   */
  getPeriodSlug(hour) {
    if (hour >= 0 && hour <= 11) return 'pagi';
    if (hour >= 12 && hour <= 14) return 'siang';
    if (hour >= 15 && hour <= 17) return 'sore';
    return 'malam';
  },

  /**
   * Mengembalikan string sapaan berdasarkan jam (0–23).
   * @param {number} hour - Jam saat ini (integer, 0–23)
   * @returns {string} Salah satu dari: "Selamat Pagi", "Selamat Siang",
   *                   "Selamat Sore", "Selamat Malam"
   */
  getGreeting(hour) {
    if (hour >= 0 && hour <= 11) return 'Selamat Pagi';
    if (hour >= 12 && hour <= 14) return 'Selamat Siang';
    if (hour >= 15 && hour <= 17) return 'Selamat Sore';
    return 'Selamat Malam'; // 18–23
  },

  /**
   * Membaca waktu terkini, lalu memperbarui elemen-elemen DOM berikut:
   *   - #greeting-time  → format HH:MM (24-jam, zero-padded)
   *   - #greeting-date  → tanggal locale id-ID format panjang
   *   - #greeting-text  → sapaan ± nama pengguna dari localStorage
   */
  render() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Set period orb via data-period attribute on <html>
    document.documentElement.setAttribute('data-period', this.getPeriodSlug(hour));

    // Format waktu HH:MM dengan zero-padding
    const timeStr =
      String(hour).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');

    // Format tanggal locale id-ID
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Bangun teks sapaan
    const greeting = this.getGreeting(hour);
    const rawName = localStorage.getItem('userName');
    const userName = rawName ? rawName.trim() : '';
    const greetingText = userName
      ? `${greeting}, ${userName}!`
      : greeting;

    // Update DOM — elemen bisa belum ada (toleran saat pengujian unit)
    const elTime = document.getElementById('greeting-time');
    const elDate = document.getElementById('greeting-date');
    const elText = document.getElementById('greeting-text');

    if (elTime) elTime.textContent = timeStr;
    if (elDate) elDate.textContent = dateStr;
    if (elText) elText.textContent = greetingText;
  },

  /**
   * Inisialisasi modul: render sekali langsung, kemudian set interval
   * 60 detik untuk memperbarui tampilan setiap menit.
   */
  init() {
    this.render();
    setInterval(() => this.render(), 60 * 1000);
  },
};

/* ==========================================================================
   Data Models (lanjutan) — LinkItem typedef
   Requirements: 9.3, 12.1
   ========================================================================== */

/**
 * @typedef {Object} LinkItem
 * @property {string} id   - ID unik link
 * @property {string} name - Label tampilan link (1–50 karakter)
 * @property {string} url  - URL target (harus diawali http:// atau https://)
 */

/* ==========================================================================
   StorageManager — Wrapper LocalStorage dengan error handling
   Requirements: 11.1, 11.4
   ========================================================================== */

const StorageManager = {
  /**
   * Memeriksa apakah localStorage tersedia dan dapat digunakan.
   * Dilakukan dengan mencoba menulis dan menghapus nilai uji coba.
   * @returns {boolean} `true` jika localStorage dapat diakses, `false` jika tidak
   */
  isAvailable() {
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Membaca dan mem-parse nilai JSON dari localStorage berdasarkan key.
   * @param {string} key - Kunci localStorage yang akan dibaca
   * @returns {any|null} Nilai yang telah di-parse, atau `null` jika key tidak
   *                     ditemukan atau terjadi error parsing
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  /**
   * Menyimpan nilai ke localStorage dengan serialisasi JSON.
   * @param {string} key   - Kunci localStorage yang akan ditulisi
   * @param {any}    value - Nilai yang akan disimpan (akan di-JSON.stringify)
   * @returns {boolean} `true` jika berhasil, `false` jika gagal
   *                    (misal: QuotaExceededError, SecurityError)
   */
  set(key, value) {
    try {
      const str = JSON.stringify(value);
      localStorage.setItem(key, str);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Menghapus kunci dari localStorage.
   * @param {string} key - Kunci localStorage yang akan dihapus
   * @returns {boolean} `true` jika berhasil, `false` jika gagal
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },
};

/* ==========================================================================
   UserNameModule — Kustomisasi dan persistensi nama pengguna
   Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   ========================================================================== */

const UserNameModule = {
  /**
   * Inisialisasi modul: load nama dari localStorage, isi input jika ada,
   * dan pasang event listener pada tombol simpan dan input (Enter).
   */
  init() {
    const savedName = StorageManager.get('userName');
    const input = document.getElementById('username-input');

    // Isi input dengan nilai yang tersimpan (jika ada)
    if (input && savedName) {
      input.value = savedName;
    }

    // Event listener: tombol "Simpan"
    const saveBtn = document.getElementById('username-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.save());
    }

    // Event listener: tekan Enter di dalam input
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.save();
        }
      });
    }
  },

  /**
   * Validasi dan simpan nama pengguna.
   * - Kosong/whitespace → hapus kunci userName (panggil clear())
   * - Lebih dari 50 karakter → tampilkan error, batalkan
   * - Valid → simpan ke localStorage, tampilkan sukses, update greeting
   */
  save() {
    const input = document.getElementById('username-input');
    const errorEl = document.getElementById('username-error');
    const successEl = document.getElementById('username-success');

    if (!input) return;

    const trimmedName = input.value.trim();

    // Kosong atau hanya whitespace → hapus kunci
    if (trimmedName === '') {
      this.clear();
      return;
    }

    // Melebihi 50 karakter → tampilkan error, batalkan
    if (trimmedName.length > 50) {
      if (errorEl) {
        errorEl.textContent = 'Nama tidak boleh melebihi 50 karakter';
        errorEl.removeAttribute('hidden');
      }
      if (successEl) {
        successEl.setAttribute('hidden', '');
      }
      return;
    }

    // Valid → simpan, sembunyikan error, tampilkan sukses
    StorageManager.set('userName', trimmedName);

    if (errorEl) {
      errorEl.setAttribute('hidden', '');
    }
    if (successEl) {
      successEl.removeAttribute('hidden');
    }

    // Update tampilan sapaan
    GreetingModule.render();

    // Sembunyikan pesan sukses setelah 3 detik
    setTimeout(() => {
      if (successEl) {
        successEl.setAttribute('hidden', '');
      }
    }, 3000);
  },

  /**
   * Hapus nama pengguna: bersihkan localStorage, kosongkan input,
   * sembunyikan pesan error dan sukses, update greeting.
   */
  clear() {
    StorageManager.remove('userName');

    const input = document.getElementById('username-input');
    const errorEl = document.getElementById('username-error');
    const successEl = document.getElementById('username-success');

    if (input) {
      input.value = '';
    }
    if (errorEl) {
      errorEl.setAttribute('hidden', '');
    }
    if (successEl) {
      successEl.setAttribute('hidden', '');
    }

    GreetingModule.render();
  },
};

/* ==========================================================================
   TimerModule — Focus Timer Pomodoro 25 menit: Mulai / Jeda / Reset
   Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
   ========================================================================== */

/**
 * State internal timer — disimpan sebagai objek terpisah agar mudah diakses
 * oleh semua method dalam TimerModule tanpa bergantung pada `this`.
 *
 * @property {number}      totalSeconds - Durasi awal timer (1500 = 25 menit)
 * @property {number}      remaining    - Sisa detik yang belum habis
 * @property {number|null} intervalId   - ID interval dari setInterval, atau null
 * @property {boolean}     isRunning    - Apakah timer sedang aktif berjalan
 */
const timerState = {
  totalSeconds: 1500, // 25 × 60
  remaining: 1500,
  intervalId: null,
  isRunning: false,
};

const TimerModule = {
  /**
   * Memformat jumlah detik menjadi string "MM:SS" dengan zero-padding.
   *
   * Contoh:
   *   format(1500) → "25:00"
   *   format(0)    → "00:00"
   *   format(90)   → "01:30"
   *
   * @param {number} seconds - Jumlah detik (integer ≥ 0)
   * @returns {string} String waktu dalam format "MM:SS"
   */
  format(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  },

  /**
   * Memperbarui elemen #timer-display dengan waktu tersisa saat ini.
   * Requirements: 3.1, 3.3
   */
  updateDisplay() {
    const el = document.getElementById('timer-display');
    if (el) {
      el.textContent = this.format(timerState.remaining);
    }
  },

  /**
   * Mengatur status aktif/nonaktif tombol Mulai dan Jeda sesuai state timer.
   *
   * Jika running = true  → disable #timer-start-btn, enable #timer-pause-btn
   * Jika running = false → enable  #timer-start-btn, disable #timer-pause-btn
   *
   * Requirements: 3.7, 3.8
   *
   * @param {boolean} running - `true` jika timer sedang berjalan
   */
  setButtonState(running) {
    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');

    if (startBtn) {
      startBtn.disabled = running;
    }
    if (pauseBtn) {
      pauseBtn.disabled = !running;
    }
  },

  /**
   * Satu "tick" timer — dipanggil setiap 1000ms oleh setInterval.
   *
   * Alur:
   *   1. Kurangi sisa waktu satu detik
   *   2. Perbarui tampilan
   *   3. Jika waktu habis (remaining === 0):
   *      - Hentikan interval
   *      - Set isRunning = false
   *      - Kembalikan tombol ke kondisi awal
   *
   * Requirements: 3.3, 3.6
   */
  tick() {
    timerState.remaining -= 1;
    this.updateDisplay();

    if (timerState.remaining === 0) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
      timerState.isRunning = false;
      this.setButtonState(false);

      // NotificationModule dihapus — tidak ada notifikasi
    }
  },

  /**
   * Memulai atau melanjutkan hitungan mundur.
   *
   * - Jika timer sudah berjalan (isRunning = true), langsung return (idempoten)
   * - Buat interval baru setiap 1000ms yang memanggil this.tick()
   * - Set isRunning = true dan perbarui status tombol
   * - Jika Notification API tersedia dan permission masih 'default',
   *   minta izin notifikasi (Requirements: 4.3)
   *
   * Requirements: 3.2, 3.7, 4.3
   */
  start() {
    if (timerState.isRunning) return;

    timerState.intervalId = setInterval(() => this.tick(), 1000);
    timerState.isRunning = true;
    this.setButtonState(true);
  },

  /**
   * Menjeda timer tanpa mereset waktu tersisa.
   *
   * - Hentikan interval yang aktif
   * - Set isRunning = false
   * - Kembalikan tombol ke kondisi jeda (Mulai aktif, Jeda nonaktif)
   *
   * Requirements: 3.4, 3.8
   */
  pause() {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
    timerState.isRunning = false;
    this.setButtonState(false);
  },

  /**
   * Mereset timer ke kondisi awal (25:00).
   *
   * - Hentikan interval yang aktif
   * - Set isRunning = false
   * - Kembalikan remaining ke totalSeconds (1500)
   * - Perbarui tampilan ke "25:00"
   * - Kembalikan tombol ke kondisi awal
   *
   * Requirements: 3.5
   */
  reset() {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
    timerState.isRunning = false;
    timerState.remaining = timerState.totalSeconds;
    this.updateDisplay();
    this.setButtonState(false);
  },

  /**
   * Inisialisasi modul timer.
   *
   * - Tampilkan waktu awal "25:00" di #timer-display
   * - Pasang event listener pada ketiga tombol kontrol
   *
   * Requirements: 3.1
   */
  init() {
    // Tampilkan 25:00 sejak halaman pertama dimuat
    this.updateDisplay();

    // Tombol Mulai — mulai atau lanjutkan hitungan mundur
    const startBtn = document.getElementById('timer-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }

    // Tombol Jeda — jeda hitungan mundur
    const pauseBtn = document.getElementById('timer-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause());
    }

    // Tombol Reset — kembalikan ke 25:00
    const resetBtn = document.getElementById('timer-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  },
};

/* ==========================================================================
   ThemeModule — Light / Dark mode toggle + persistensi localStorage
   ========================================================================== */

const ThemeModule = {
  /**
   * Kunci localStorage untuk menyimpan preferensi tema.
   * @type {string}
   */
  STORAGE_KEY: 'theme',

  /**
   * Terapkan tema ke dokumen dengan mengatur atribut data-theme pada <html>.
   * @param {'dark'|'light'} theme
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      btn.setAttribute('aria-label',
        theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'
      );
    }
  },

  /**
   * Toggle antara dark dan light, simpan ke localStorage.
   */
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    StorageManager.set(this.STORAGE_KEY, next);
    this.applyTheme(next);
  },

  /**
   * Inisialisasi: baca preferensi tersimpan (atau deteksi preferensi OS),
   * terapkan tema, dan pasang event listener pada tombol toggle.
   */
  init() {
    const saved = StorageManager.get(this.STORAGE_KEY);
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    this.applyTheme(theme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  },
};

/* ==========================================================================
   TodoModule — State Internal, Storage, dan Render
   Requirements: 5.4, 5.5, 5.8, 6.1, 6.4, 8.5, 8.6
   ========================================================================== */

/**
 * State internal TodoModule.
 * Disimpan sebagai objek terpisah agar dapat diakses oleh semua method
 * TodoModule maupun fungsi drag & drop tanpa bergantung pada closure.
 *
 * @property {Task[]}       tasks      - Array task yang sedang aktif ditampilkan
 * @property {string|null}  editingId  - ID task yang sedang dalam mode edit,
 *                                       atau null jika tidak ada
 * @property {string|null}  dragSrcId  - ID task yang sedang diseret saat
 *                                       operasi drag & drop, atau null
 */
const todoState = {
  tasks: [],       // array Task aktif
  editingId: null, // ID task yang sedang diedit
  dragSrcId: null, // ID task yang sedang diseret
};

const TodoModule = {
  /**
   * Membaca dan mem-parse data task dari localStorage.
   *
   * Aturan:
   *   - Jika StorageManager.get('tasks') mengembalikan null → return []
   *   - Jika hasil bukan array → return []
   *   - Jika array valid → return array tersebut
   *   - Semua error ditangkap oleh try/catch → return []
   *
   * @returns {Task[]} Array task tersimpan, atau array kosong jika tidak ada
   *                   atau terjadi error.
   *
   * Requirements: 5.4, 5.5, 5.8
   */
  loadFromStorage() {
    try {
      const data = StorageManager.get('tasks');
      if (data === null) return [];
      if (!Array.isArray(data)) return [];
      return data;
    } catch (e) {
      return [];
    }
  },

  /**
   * Menyimpan array task ke localStorage melalui StorageManager.
   *
   * @param {Task[]} tasks - Array task yang akan disimpan
   * @returns {boolean} `true` jika berhasil, `false` jika gagal
   *
   * Requirements: 5.3, 11.3
   */
  saveToStorage(tasks) {
    return StorageManager.set('tasks', tasks);
  },

  /**
   * Merender satu item task sebagai elemen `<li>` yang lengkap beserta
   * semua sub-elemen dan event listener-nya.
   *
   * Struktur HTML yang dihasilkan:
   * ```
   * <li draggable="true" data-id="{task.id}">
   *   <span class="drag-handle" title="Seret untuk mengatur urutan">☰</span>
   *   <input type="checkbox" class="task-checkbox" [checked]>
   *   <span class="task-text [completed]">{task.text}</span>
   *   <div class="task-actions">
   *     <button class="btn-edit" data-id="{task.id}">Edit</button>
   *     <button class="btn-delete" data-id="{task.id}">Hapus</button>
   *   </div>
   * </li>
   * ```
   *
   * Catatan keamanan: teks task diisi via `textContent` (bukan innerHTML)
   * untuk mencegah XSS injection dari konten yang dimasukkan pengguna.
   *
   * @param {Task} task - Objek task yang akan dirender
   * @returns {HTMLLIElement} Elemen `<li>` siap pakai
   *
   * Requirements: 6.1, 6.4, 8.5
   */
  renderItem(task) {
    // Buat elemen <li> utama
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.draggable = true;

    // 1. Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.title = 'Seret untuk mengatur urutan';
    dragHandle.textContent = '☰';

    // 2. Checkbox status selesai
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    if (task.completed) {
      checkbox.checked = true;
    }

    // 3. Teks task — gunakan textContent untuk keamanan (anti-XSS)
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text' + (task.completed ? ' completed' : '');
    textSpan.textContent = task.text;

    // 4. Kontainer aksi (Edit & Hapus)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.dataset.id = task.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.dataset.id = task.id;
    deleteBtn.textContent = 'Hapus';

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // Rakit semua elemen ke dalam <li>
    li.appendChild(dragHandle);
    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actionsDiv);

    // Event Listeners
    // Checkbox: toggle status selesai
    checkbox.addEventListener('change', () => {
      TodoModule.toggleTask(task.id);
    });

    // Tombol Hapus
    deleteBtn.addEventListener('click', () => {
      TodoModule.deleteTask(task.id);
    });

    // Tombol Edit
    editBtn.addEventListener('click', () => {
      TodoModule.startEdit(task.id);
    });

    return li;
  },

  /**
   * Merender seluruh daftar task ke dalam elemen `#todo-list`.
   *
   * Alur:
   *   1. Ambil elemen `#todo-list`
   *   2. Kosongkan isinya
   *   3. Loop setiap task — panggil renderItem(task), append ke list
   *   4. Setelah semua task dirender, panggil this.initDragDrop()
   *
   * @param {Task[]} tasks - Array task yang akan dirender
   *
   * Requirements: 5.4, 8.6
   */
  renderAll(tasks) {
    const list = document.getElementById('todo-list');
    if (!list) return;

    // Kosongkan daftar sebelum render ulang
    list.innerHTML = '';

    // Render setiap task dan tambahkan ke list
    tasks.forEach((task) => {
      const li = this.renderItem(task);
      list.appendChild(li);
    });

    // Inisialisasi drag & drop setelah render selesai
    this.initDragDrop();
  },

  /**
   * Inisialisasi drag & drop pada semua item task dalam #todo-list.
   *
   * Untuk setiap elemen <li data-id>:
   *   - Jika task sedang dalam mode edit, nonaktifkan draggable dan
   *     sembunyikan drag handle
   *   - Jika tidak, aktifkan draggable dan pasang event listener
   *     dragstart, dragover, drop, dragend
   *
   * Requirements: 8.1, 8.2, 8.3
   */
  initDragDrop() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    const items = list.querySelectorAll('li[data-id]');
    items.forEach((li) => {
      // Nonaktifkan draggable jika task sedang dalam mode edit
      if (todoState.editingId === li.dataset.id) {
        li.draggable = false;
        const handle = li.querySelector('.drag-handle');
        if (handle) handle.setAttribute('hidden', '');
        return;
      }

      li.draggable = true;
      li.addEventListener('dragstart', (e) => this.onDragStart(e));
      li.addEventListener('dragover', (e) => this.onDragOver(e));
      li.addEventListener('drop', (e) => this.onDrop(e));
      li.addEventListener('dragend', (e) => this.onDragEnd(e));
    });
  },

  /**
   * Handler untuk event `dragstart` — dipanggil saat pengguna mulai
   * menyeret sebuah task.
   *
   * - Simpan ID task sumber ke todoState.dragSrcId
   * - Kurangi opacity task yang diseret menjadi 0.4
   * - Set effectAllowed dan transfer data ID task
   *
   * @param {DragEvent} event - Event dragstart dari browser
   *
   * Requirements: 8.7
   */
  onDragStart(event) {
    const li = event.currentTarget;
    todoState.dragSrcId = li.dataset.id;
    // Kurangi opacity task yang diseret
    li.style.opacity = '0.4';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', li.dataset.id);
  },

  /**
   * Handler untuk event `dragover` — dipanggil saat task yang diseret
   * melewati task lain.
   *
   * - Cegah perilaku default (agar drop diizinkan)
   * - Set dropEffect ke 'move'
   * - Tambahkan class `drag-over` sebagai indikator visual posisi drop
   *
   * @param {DragEvent} event - Event dragover dari browser
   *
   * Requirements: 8.7
   */
  onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    // Tambahkan class visual pada target drop
    const li = event.currentTarget;
    li.classList.add('drag-over');
  },

  /**
   * Handler untuk event `drop` — dipanggil saat task dilepas di atas
   * task target.
   *
   * Alur:
   *   1. Cegah perilaku default browser
   *   2. Jika sumber sama dengan target, hapus class dan return
   *   3. Cari indeks sumber dan target di todoState.tasks
   *   4. Simpan snapshot untuk rollback
   *   5. Pindahkan elemen di array (splice + splice)
   *   6. Perbarui properti order setiap task
   *   7. Coba simpan ke storage — jika gagal, rollback dan tampilkan error
   *   8. Render ulang daftar
   *
   * @param {DragEvent} event - Event drop dari browser
   *
   * Requirements: 8.2, 8.3, 8.4
   */
  onDrop(event) {
    event.preventDefault();
    const targetLi = event.currentTarget;
    const targetId = targetLi.dataset.id;
    const srcId = todoState.dragSrcId;

    // Tidak perlu reorder jika drop di posisi yang sama
    if (srcId === targetId) {
      targetLi.classList.remove('drag-over');
      return;
    }

    // Reorganisasi array
    const srcIdx = todoState.tasks.findIndex((t) => t.id === srcId);
    const tgtIdx = todoState.tasks.findIndex((t) => t.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;

    // Simpan snapshot untuk rollback
    const snapshot = [...todoState.tasks];

    // Pindahkan elemen
    const [removed] = todoState.tasks.splice(srcIdx, 1);
    todoState.tasks.splice(tgtIdx, 0, removed);

    // Update properti order
    todoState.tasks.forEach((t, i) => { t.order = i; });

    // Coba simpan ke storage
    const ok = this.saveToStorage(todoState.tasks);
    if (!ok) {
      // Rollback jika gagal
      todoState.tasks = snapshot;
      const errorEl = document.getElementById('todo-error');
      if (errorEl) {
        errorEl.textContent = 'Gagal menyimpan urutan tugas';
        errorEl.removeAttribute('hidden');
        setTimeout(() => errorEl.setAttribute('hidden', ''), 3000);
      }
    }

    this.renderAll(todoState.tasks);
  },

  /**
   * Handler untuk event `dragend` — dipanggil setelah operasi drag selesai
   * (baik berhasil maupun dibatalkan).
   *
   * - Kembalikan opacity semua task ke normal
   * - Hapus class `drag-over` dari semua task
   * - Reset todoState.dragSrcId ke null
   *
   * @param {DragEvent} event - Event dragend dari browser
   *
   * Requirements: 8.7
   */
  onDragEnd(event) {
    // Bersihkan semua visual drag (opacity dan class drag-over)
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.querySelectorAll('li[data-id]').forEach((li) => {
      li.style.opacity = '';
      li.classList.remove('drag-over');
    });
    todoState.dragSrcId = null;
  },

  /**
   * Inisialisasi TodoModule: muat task dari storage, render semua task,
   * dan pasang event listener pada tombol tambah dan input teks.
   *
   * Requirements: 5.1, 5.2, 5.4, 5.5
   */
  init() {
    // Muat task dari storage dan render
    todoState.tasks = this.loadFromStorage();
    this.renderAll(todoState.tasks);

    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('todo-add-btn');

    // Event listener: tombol "Tambah"
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.addTask(input ? input.value : '');
      });
    }

    // Event listener: tekan Enter di dalam input
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.addTask(input.value);
        }
      });
    }
  },

  /**
   * Menambahkan task baru ke daftar setelah validasi input.
   *
   * Validasi:
   *   - Kosong / hanya whitespace → tampilkan error "Tugas tidak boleh kosong"
   *   - Lebih dari 200 karakter → tampilkan error "Tugas tidak boleh melebihi 200 karakter"
   *   - Valid → tambahkan task, simpan, render ulang, kosongkan input
   *
   * @param {string} text - Nilai dari elemen input tugas
   *
   * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
   */
  addTask(text) {
    const trimmedText = (text || '').trim();
    const errorEl = document.getElementById('todo-error');
    const input = document.getElementById('todo-input');

    // Validasi: kosong atau hanya whitespace
    if (trimmedText === '') {
      if (errorEl) {
        errorEl.textContent = 'Tugas tidak boleh kosong';
        errorEl.removeAttribute('hidden');
      }
      return;
    }

    // Validasi: melebihi 200 karakter
    if (trimmedText.length > 200) {
      if (errorEl) {
        errorEl.textContent = 'Tugas tidak boleh melebihi 200 karakter';
        errorEl.removeAttribute('hidden');
      }
      return;
    }

    // Input valid — sembunyikan pesan error
    if (errorEl) {
      errorEl.setAttribute('hidden', '');
    }

    // Buat task baru dan tambahkan ke state
    const newTask = {
      id: generateId('task'),
      text: trimmedText,
      completed: false,
      order: todoState.tasks.length,
    };
    todoState.tasks.push(newTask);

    // Simpan ke storage dan render ulang
    this.saveToStorage(todoState.tasks);
    this.renderAll(todoState.tasks);

    // Kosongkan input
    if (input) {
      input.value = '';
    }
  },

  /**
   * Mengubah status selesai (toggle) pada task dengan ID tertentu.
   *
   * Alur:
   *   1. Cari task berdasarkan ID
   *   2. Simpan status sebelumnya untuk rollback jika diperlukan
   *   3. Toggle status completed
   *   4. Coba simpan ke storage — jika gagal, rollback dan tampilkan error
   *   5. Render ulang daftar
   *
   * @param {string} id - ID task yang akan di-toggle
   *
   * Requirements: 6.1, 6.2, 6.3, 6.6
   */
  toggleTask(id) {
    const task = todoState.tasks.find((t) => t.id === id);
    if (!task) return;

    // Simpan status sebelumnya untuk keperluan rollback
    const prevCompleted = task.completed;

    // Toggle status
    task.completed = !task.completed;

    // Coba simpan ke storage
    const ok = this.saveToStorage(todoState.tasks);

    // Jika gagal, rollback in-memory dan tampilkan error singkat
    if (!ok) {
      task.completed = prevCompleted;

      const errorEl = document.getElementById('todo-error');
      if (errorEl) {
        errorEl.textContent = 'Gagal menyimpan perubahan';
        errorEl.removeAttribute('hidden');

        // Sembunyikan pesan error setelah 3 detik
        setTimeout(() => {
          errorEl.setAttribute('hidden', '');
        }, 3000);
      }
    }

    // Render ulang daftar (dengan state yang sudah di-rollback jika gagal)
    this.renderAll(todoState.tasks);
  },

  /**
   * Menghapus task dengan ID tertentu dari daftar dan storage.
   *
   * @param {string} id - ID task yang akan dihapus
   *
   * Requirements: 6.4, 6.5
   */
  deleteTask(id) {
    todoState.tasks = todoState.tasks.filter((t) => t.id !== id);
    this.saveToStorage(todoState.tasks);
    this.renderAll(todoState.tasks);
  },

  /**
   * Mengaktifkan mode edit pada task dengan ID tertentu.
   *
   * Alur:
   *   1. Jika ada task lain yang sedang diedit, tutup dulu tanpa simpan
   *   2. Set todoState.editingId = id
   *   3. Temukan <li> task di #todo-list
   *   4. Sembunyikan .task-text dan .drag-handle
   *   5. Buat input edit, tombol simpan, dan tombol batal, lalu sisipkan ke <li>
   *   6. Fokus pada input dan pilih semua teks
   *   7. Pasang event listener (Enter/Escape pada input, klik pada tombol)
   *
   * @param {string} id - ID task yang akan diedit
   *
   * Requirements: 7.1, 7.2, 7.3
   */
  startEdit(id) {
    // Jika ada task lain yang sedang diedit, tutup dulu tanpa simpan
    if (todoState.editingId !== null && todoState.editingId !== id) {
      this.cancelEdit(todoState.editingId);
    }

    todoState.editingId = id;

    // Cari task di state
    const task = todoState.tasks.find((t) => t.id === id);
    if (!task) return;

    // Cari elemen <li> di DOM
    const list = document.getElementById('todo-list');
    if (!list) return;
    const li = list.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    // Sembunyikan teks asli dan drag handle
    const textSpan = li.querySelector('.task-text');
    const dragHandle = li.querySelector('.drag-handle');
    if (textSpan) textSpan.setAttribute('hidden', '');
    if (dragHandle) dragHandle.setAttribute('hidden', '');

    // Buat input edit
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'task-edit-input';
    inputEl.maxLength = 200;
    inputEl.value = task.text;

    // Buat tombol simpan
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save-edit';
    saveBtn.textContent = 'Simpan';

    // Buat tombol batal
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel-edit';
    cancelBtn.textContent = 'Batal';

    // Sisipkan elemen edit ke dalam <li> (setelah drag handle)
    if (dragHandle) {
      dragHandle.insertAdjacentElement('afterend', cancelBtn);
      dragHandle.insertAdjacentElement('afterend', saveBtn);
      dragHandle.insertAdjacentElement('afterend', inputEl);
    } else {
      li.insertBefore(cancelBtn, li.firstChild);
      li.insertBefore(saveBtn, li.firstChild);
      li.insertBefore(inputEl, li.firstChild);
    }

    // Fokus dan pilih semua teks
    inputEl.focus();
    inputEl.select();

    // Event listener: Enter → simpan, Escape → batal
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        TodoModule.saveEdit(id, inputEl.value);
      } else if (e.key === 'Escape') {
        TodoModule.cancelEdit(id);
      }
    });

    // Event listener: tombol simpan
    saveBtn.addEventListener('click', () => {
      TodoModule.saveEdit(id, inputEl.value);
    });

    // Event listener: tombol batal
    cancelBtn.addEventListener('click', () => {
      TodoModule.cancelEdit(id);
    });
  },

  /**
   * Menyimpan perubahan teks pada task yang sedang diedit.
   *
   * Alur:
   *   1. Trim newText
   *   2. Jika kosong → tampilkan error "Tugas tidak boleh kosong", return
   *   3. Jika valid → update task.text, simpan ke storage, re-render
   *
   * @param {string} id      - ID task yang akan disimpan
   * @param {string} newText - Teks baru dari input edit
   *
   * Requirements: 7.4, 7.6
   */
  saveEdit(id, newText) {
    const trimmedText = (newText || '').trim();
    const errorEl = document.getElementById('todo-error');

    // Validasi: kosong atau hanya whitespace
    if (trimmedText === '') {
      if (errorEl) {
        errorEl.textContent = 'Tugas tidak boleh kosong';
        errorEl.removeAttribute('hidden');
      }
      return;
    }

    // Input valid — sembunyikan pesan error
    if (errorEl) {
      errorEl.setAttribute('hidden', '');
    }

    // Update teks task di state
    const task = todoState.tasks.find((t) => t.id === id);
    if (task) {
      task.text = trimmedText;
    }

    // Simpan ke storage dan reset editingId
    this.saveToStorage(todoState.tasks);
    todoState.editingId = null;

    // Re-render sepenuhnya
    this.renderAll(todoState.tasks);
  },

  /**
   * Membatalkan mode edit pada task dan mengembalikan tampilan aslinya.
   *
   * @param {string} id - ID task yang dibatalkan editnya
   *
   * Requirements: 7.5
   */
  cancelEdit(id) {
    todoState.editingId = null;

    // Re-render sepenuhnya untuk mengembalikan tampilan asli
    this.renderAll(todoState.tasks);
  },
};

/* ========================================================================== 
   QuickLinksModule — CRUD quick links + validasi URL + LocalStorage
   Requirements: 9.1–9.8, 10.1–10.4
   ========================================================================== */

const quickLinksState = {
  links: [],  // array LinkItem aktif
};

const QuickLinksModule = {
  loadFromStorage() {
    try {
      const data = StorageManager.get('quickLinks');
      if (data === null) return [];
      if (!Array.isArray(data)) return [];
      return data;
    } catch (e) {
      return [];
    }
  },

  saveToStorage(links) {
    return StorageManager.set('quickLinks', links);
  },

  renderItem(link) {
    const li = document.createElement('li');
    li.className = 'quick-link-item';
    li.dataset.id = link.id;

    // Link <a> dengan target="_blank" dan rel="noopener noreferrer"
    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;  // textContent untuk keamanan XSS
    a.className = 'quick-link-anchor';

    // Tombol hapus
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-link';
    deleteBtn.dataset.id = link.id;
    deleteBtn.textContent = 'Hapus';
    deleteBtn.addEventListener('click', () => {
      QuickLinksModule.deleteLink(link.id);
    });

    li.appendChild(a);
    li.appendChild(deleteBtn);
    return li;
  },

  renderAll(links) {
    const list = document.getElementById('quick-links-list');
    const emptyMsg = document.getElementById('quick-links-empty');
    if (!list) return;

    list.innerHTML = '';

    if (links.length === 0) {
      if (emptyMsg) emptyMsg.removeAttribute('hidden');
    } else {
      if (emptyMsg) emptyMsg.setAttribute('hidden', '');
      links.forEach((link) => {
        const li = this.renderItem(link);
        list.appendChild(li);
      });
    }
  },

  validateUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://');
  },

  init() {
    quickLinksState.links = this.loadFromStorage();
    this.renderAll(quickLinksState.links);

    const addBtn = document.getElementById('link-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('link-name-input');
        const urlInput = document.getElementById('link-url-input');
        this.addLink(
          nameInput ? nameInput.value : '',
          urlInput ? urlInput.value : ''
        );
      });
    }
  },

  addLink(name, url) {
    const trimmedName = (name || '').trim();
    const trimmedUrl = (url || '').trim();
    const nameErrorEl = document.getElementById('link-name-error');
    const urlErrorEl = document.getElementById('link-url-error');

    // Reset semua pesan error
    if (nameErrorEl) nameErrorEl.setAttribute('hidden', '');
    if (urlErrorEl) urlErrorEl.setAttribute('hidden', '');

    let hasError = false;

    // Validasi nama
    if (trimmedName === '') {
      if (nameErrorEl) {
        nameErrorEl.textContent = 'Nama link tidak boleh kosong';
        nameErrorEl.removeAttribute('hidden');
      }
      hasError = true;
    }

    // Validasi URL
    if (trimmedUrl === '') {
      if (urlErrorEl) {
        urlErrorEl.textContent = 'URL tidak boleh kosong';
        urlErrorEl.removeAttribute('hidden');
      }
      hasError = true;
    } else if (!this.validateUrl(trimmedUrl)) {
      if (urlErrorEl) {
        urlErrorEl.textContent = 'URL harus diawali dengan http:// atau https://';
        urlErrorEl.removeAttribute('hidden');
      }
      hasError = true;
    }

    if (hasError) return;

    // Buat LinkItem baru
    const newLink = {
      id: generateId('link'),
      name: trimmedName,
      url: trimmedUrl,
    };
    quickLinksState.links.push(newLink);
    this.saveToStorage(quickLinksState.links);
    this.renderAll(quickLinksState.links);

    // Kosongkan input
    const nameInput = document.getElementById('link-name-input');
    const urlInput = document.getElementById('link-url-input');
    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
  },

  deleteLink(id) {
    const snapshot = [...quickLinksState.links];
    quickLinksState.links = quickLinksState.links.filter((l) => l.id !== id);

    const ok = this.saveToStorage(quickLinksState.links);
    if (!ok) {
      quickLinksState.links = snapshot;
      const urlErrorEl = document.getElementById('link-url-error');
      if (urlErrorEl) {
        urlErrorEl.textContent = 'Gagal menghapus link. Silakan coba lagi.';
        urlErrorEl.removeAttribute('hidden');
        setTimeout(() => urlErrorEl.setAttribute('hidden', ''), 3000);
      }
    }

    this.renderAll(quickLinksState.links);
  },
};

/* ==========================================================================
   Entry Point — Inisialisasi semua modul saat DOM siap
   Requirements: 12.5 (Task 15)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Periksa ketersediaan LocalStorage dan tampilkan peringatan jika tidak ada
  if (!StorageManager.isAvailable()) {
    const warningEl = document.getElementById('storage-warning');
    if (warningEl) warningEl.removeAttribute('hidden');
  }

  GreetingModule.init();
  UserNameModule.init();
  TimerModule.init();
  ThemeModule.init();
  TodoModule.init();
  QuickLinksModule.init();
});
