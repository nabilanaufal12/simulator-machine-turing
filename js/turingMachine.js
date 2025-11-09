/**
 * Ini adalah kelas generik Mesin Turing.
 * Ia menerima 7-tuple (aturan) dan input, lalu menjalankannya.
 * * VERSI 2.1: Perbaikan bug Rewind (Infinite Loop)
 */
export class TuringMachine {
    constructor(rules) {
        // --- Mengatur 7-tuple dari file 'rules' ---
        this.states = new Set(rules.states);
        this.alphabet = new Set(rules.alphabet);
        this.tapeAlphabet = new Set(rules.tapeAlphabet);
        this.transitions = rules.transitions;
        this.startState = rules.startState;
        this.acceptState = rules.acceptState;
        this.rejectState = rules.rejectState;
        this.blankSymbol = rules.blankSymbol || '_';
        
        // --- Inisialisasi state mesin ---
        this.tape = [];
        this.head = 0;
        this.currentState = '';
        this.trace = [];
        this.stepCount = 0;
    }

    /**
     * BARU: Menyiapkan mesin untuk dijalankan, tanpa menjalankannya.
     * @param {string} inputString - String yang akan divalidasi.
     */
    initialize(inputString) {
        // --- PERUBAHAN DI SINI ---
        this.head = 1; // 1. Mulai head di index 1 (setelah BLANK awal)
        // -------------------------

        this.currentState = this.startState;
        this.trace = [];
        this.stepCount = 0;

        let inputTape = [];
        if (inputString.length === 0) {
            inputTape = [this.blankSymbol];
        } else {
            inputTape = [...inputString];
        }

        // --- PERUBAHAN DI SINI ---
        // 2. Tambahkan BLANK di awal tape
        this.tape = [this.blankSymbol, ...inputTape];
        // -------------------------

        for (let i = 0; i < 100; i++) {
            this.tape.push(this.blankSymbol);
        }

        this.logTrace('Inisialisasi');
    }

    /**
     * BARU: Memeriksa apakah mesin berada di state akhir.
     * @returns {boolean}
     */
    isHaltingState() {
        return this.currentState === this.acceptState || this.currentState === this.rejectState;
    }

    /**
     * BARU: Mengembalikan seluruh jejak eksekusi sebagai string.
     * @returns {string}
     */
    getTrace() {
        return this.trace.join('\n');
    }

    /**
     * Menjalankan SATU langkah komputasi Mesin Turing.
     */
    step() {
        // Jangan lakukan apa-apa jika sudah di state akhir
        if (this.isHaltingState()) {
            return;
        }

        // Batasi langkah untuk menghindari infinite loop
        this.stepCount++;
        if (this.stepCount > 1000) {
            this.currentState = this.rejectState;
            this.logTrace('Error: Simulasi melebihi 1000 langkah (Infinite Loop?). Ditolak.');
            return;
        }

        // 1. Baca simbol di bawah head
        const currentSymbol = this.tape[this.head];

        // 2. Cari aturan transisi (δ)
        const rule = this.transitions[this.currentState]?.[currentSymbol];

        // 3. Jika TIDAK ADA aturan
        if (!rule) {
            this.currentState = this.rejectState;
            this.logTrace(`Transisi tidak ditemukan untuk (${this.currentState}, ${currentSymbol}), pindah ke REJECT`);
            return;
        }

        // 4. Jika ADA aturan, [newState, writeSymbol, moveDirection]
        const [newState, writeSymbol, moveDirection] = rule;
        
        // Catat transisi SEBELUM diubah
        this.logTrace(`δ(${this.currentState}, ${currentSymbol}) → (${newState}, ${writeSymbol}, ${moveDirection})`);

        // 5. Terapkan aturan:
        this.tape[this.head] = writeSymbol;
        
        if (moveDirection === 'R') {
            this.head++;
        } else if (moveDirection === 'L') {
            this.head--;
        }
        
        // --- PERUBAHAN DI SINI ---
        // Kode pengaman ini masih bagus, tapi sekarang logika rewind akan
        // secara alami berhenti di index 0 (BLANK) sebelum ini terjadi.
        if (this.head < 0) {
            this.head = 0;
        }
        // -------------------------

        this.currentState = newState;
    }

    /**
     * Helper untuk mencatat jejak eksekusi.
     * @param {string} note - Catatan untuk langkah ini.
     */
    logTrace(note) {
        let tapeStr = '';
        // Tampilkan 5 sel ke kiri dan 20 ke kanan dari head
        const start = Math.max(0, this.head - 5);
        const end = Math.min(this.tape.length, this.head + 20);

        for (let i = start; i < end; i++) {
            if (i === this.head) {
                tapeStr += `[${this.tape[i]}]`;
            } else {
                tapeStr += ` ${this.tape[i]} `;
            }
        }
        
        if (start > 0) tapeStr = `... ` + tapeStr;
        if (end < this.tape.length) tapeStr += ` ...`;

        this.trace.push(`State: ${this.currentState.padEnd(10)} | ${note}`);
        this.trace.push(`Tape : ${tapeStr}\n`);
    }

    /**
     * Helper untuk mendapatkan snapshot pita & head saat ini (untuk UI).
     */
    getTapeSnapshot() {
        return {
            tape: [...this.tape],
            head: this.head
        };
    }

    /**
     * Fungsi 'run' instan (tidak digunakan oleh UI animasi, 
     * tapi bagus untuk pengujian)
     */
    run(inputString) {
        this.initialize(inputString);

        while (!this.isHaltingState()) {
            this.step();
        }

        const result = (this.currentState === this.acceptState);
        this.trace.push(`\nStatus Akhir: ${this.currentState}`);
        this.trace.push(`Hasil: ${result ? 'DITERIMA' : 'DITOLAK'}`);

        return {
            accepted: result,
            trace: this.getTrace()
        };
    }
}