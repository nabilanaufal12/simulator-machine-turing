// --- 1. Impor "Otak" dan "Aturan" ---
import { TuringMachine } from './turingMachine.js';
import { passwordRules } from './passwordRules.js';

// --- 2. Dapatkan Referensi ke Elemen HTML ---
const form = document.getElementById('validator-form');
const input = document.getElementById('password-input');
const runButton = document.getElementById('run-button');
const resetButton = document.getElementById('reset-button');
const tapeContainer = document.getElementById('tape-container');
const traceOutput = document.getElementById('trace-output');
const resultDisplay = document.getElementById('result-display');
const currentStateDisplay = document.getElementById('current-state');

// --- 3. Variabel Global untuk Simulasi ---
let tm; // Instance Mesin Turing
let simulationInterval; // Timer untuk loop animasi
const SIMULATION_SPEED_MS = 150; // Kecepatan (ms) antar langkah

// --- 4. Tambahkan Event Listeners ---
form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSimulation();
});
resetButton.addEventListener('click', resetUI);

/**
 * Fungsi utama untuk MEMULAI simulasi
 */
function runSimulation() {
    const inputString = input.value;

    // Bersihkan UI dan loop lama
    resetUI();
    
    // 1. Buat dan inisialisasi Mesin Turing
    tm = new TuringMachine(passwordRules);
    tm.initialize(inputString);

    // 2. Nonaktifkan tombol
    runButton.disabled = true;
    input.disabled = true;

    // 3. Tampilkan state awal di UI
    traceOutput.textContent = 'Memulai simulasi...\n\n';
    updateStepUI();

    // 4. Mulai loop simulasi (animasi)
    simulationInterval = setInterval(runStep, SIMULATION_SPEED_MS);
}

/**
 * Fungsi "Game Loop" yang menjalankan SATU langkah simulasi
 */
function runStep() {
    // 1. Jalankan satu langkah logika di mesin
    tm.step();

    // 2. Perbarui UI dengan hasil langkah tersebut
    updateStepUI();

    // 3. Cek apakah simulasi harus berhenti
    if (tm.isHaltingState()) {
        clearInterval(simulationInterval); // Hentikan loop
        displayFinalResult(); // Tampilkan hasil akhir
        runButton.disabled = false; // Aktifkan tombol kembali
        input.disabled = false;
    }
}

/**
 * Memperbarui UI (Pita, State, Jejak) setelah satu langkah
 */
function updateStepUI() {
    // 1. Tampilkan Jejak Eksekusi (Trace)
    traceOutput.textContent = tm.getTrace();
    // Auto-scroll ke bawah
    traceOutput.scrollTop = traceOutput.scrollHeight;

    // 2. Tampilkan Status Saat Ini
    currentStateDisplay.textContent = tm.currentState;

    // 3. Tampilkan Visualisasi Pita (Tape)
    const snapshot = tm.getTapeSnapshot();
    updateTapeUI(snapshot.tape, snapshot.head);
}

/**
 * Menampilkan kotak DITERIMA / DITOLAK di akhir
 */
function displayFinalResult() {
    const isAccepted = (tm.currentState === tm.acceptState);

    resultDisplay.classList.remove('accept', 'reject');
    
    if (isAccepted) {
        resultDisplay.textContent = 'DITERIMA';
        resultDisplay.classList.add('accept');
    } else {
        resultDisplay.textContent = 'DITOLAK';
        resultDisplay.classList.add('reject');
    }
    resultDisplay.style.display = 'block';
}

/**
 * Menggambar ulang visualisasi pita (tape)
 */
function updateTapeUI(tape, head) {
    tapeContainer.innerHTML = '';

    // Tentukan rentang yang terlihat (misal: 10 ke kiri, 20 ke kanan)
    const viewStart = Math.max(0, head - 10);
    const viewEnd = Math.min(tape.length, head + 20);

    for (let i = viewStart; i < viewEnd; i++) {
        const symbol = tape[i];
        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        cell.textContent = symbol;
        
        if (i === head) {
            cell.classList.add('head'); // Tandai sel head
        }
        
        tapeContainer.appendChild(cell);
    }
}

/**
 * Membersihkan UI ke kondisi awal
 */
function resetUI() {
    // Hentikan loop simulasi apa pun yang sedang berjalan
    clearInterval(simulationInterval);
    
    // Reset UI
    tapeContainer.innerHTML = '';
    traceOutput.textContent = 'Menunggu input...';
    currentStateDisplay.textContent = '-';
    
    resultDisplay.textContent = '';
    resultDisplay.classList.remove('accept', 'reject');
    resultDisplay.style.display = 'none';
    
    runButton.disabled = false;
    input.disabled = false;
    input.value = ''; // Kosongkan input
}

// Inisialisasi UI saat halaman dimuat
resetUI();