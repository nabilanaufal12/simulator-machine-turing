/* ========================================================================== */
/* DEFINISI ATURAN MESIN TURING (7-TUPLE)                       */
/* UNTUK VALIDATOR STRONG PASSWORD                             */
/* ========================================================================== */

// --- Helper untuk mendefinisikan alfabet ---

// Σ (Alfabet Input)
const lowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const numbers = '0123456789'.split('');
const specials = '!@#$%^&*'.split(''); // Dibatasi agar mudah

const alphabet = [
    ...lowercase,
    ...uppercase,
    ...numbers,
    ...specials
];

// Γ (Alfabet Pita)
const BLANK = '_'; // Simbol blank
const LWR = 'l'; // Simbol penanda "sudah ketemu lowercase"
const UPR = 'u'; // Simbol penanda "sudah ketemu uppercase"
const NUM = 'n'; // Simbol penanda "sudah ketemu number"
const SPC = 's'; // Simbol penanda "sudah ketemu special"

const tapeAlphabet = [
    ...alphabet,
    BLANK,
    LWR, UPR, NUM, SPC
];

// --- Helper untuk membuat transisi ---

/**
 * Membuat transisi untuk satu set karakter.
 * @param {string[]} charSet - Array karakter (misal: lowercase)
 * @param {object} transitions - Objek transisi yang akan dimodifikasi
 * @param {string} fromState - State awal
 * @param {string} toState - State tujuan jika ketemu
 * @param {string} writeSymbol - Simbol yang akan ditulis (penanda)
 */
function addFindTransitions(charSet, transitions, fromState, toState, writeSymbol) {
    for (const char of charSet) {
        // δ(fromState, char) = (toState, writeSymbol, 'R')
        transitions[fromState][char] = [toState, writeSymbol, 'R'];
    }
}

/**
 * Membuat transisi untuk "lew_ati" (skip) saat mencari.
 * @param {string[]} charSets - Array dari array karakter (misal: [uppercase, numbers])
 * @param {object} transitions - Objek transisi yang akan dimodifikasi
 * @param {string} state - State yang sedang mencari
 */
function addSkipTransitions(charSets, transitions, state) {
    for (const charSet of charSets) {
        for (const char of charSet) {
            // δ(state, char) = (state, char, 'R')
            transitions[state][char] = [state, char, 'R'];
        }
    }
}

/**
 * Membuat transisi untuk "putar balik" (rewind).
 * @param {string[]} allSymbols - Semua simbol di pita
 * @param {object} transitions - Objek transisi yang akan dimodifikasi
 * @param {string} fromState - State rewind
 * @param {string} toState - State tujuan setelah rewind
 */
function addRewindTransitions(allSymbols, transitions, fromState, toState) {
    for (const char of allSymbols) {
        // δ(fromState, char) = (fromState, char, 'L')
        transitions[fromState][char] = [fromState, char, 'L'];
    }
    // Saat menabrak BLANK di kiri, pindah 'R' ke sel pertama dan ke state tujuan
    transitions[fromState][BLANK] = [toState, BLANK, 'R'];
}

// --- Definisi 7-Tuple ---

// Q: Himpunan State
const states = [
    'q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', // Tahap 1: Cek Panjang
    'q_len_ok', 'q_rewind_lower', 'q_find_lower', // Tahap 2: Cari Lowercase
    'q_rewind_upper', 'q_find_upper', // Tahap 3: Cari Uppercase
    'q_rewind_num', 'q_find_num', // Tahap 4: Cari Angka
    'q_rewind_spec', 'q_find_spec', // Tahap 5: Cari Simbol
    'q_accept', 'q_reject' // State Akhir
];

// q₀: State Awal
const startState = 'q0';

// F: Himpunan State Akhir
const acceptState = 'q_accept';
const rejectState = 'q_reject';

// δ: Fungsi Transisi
const transitions = {};

// Inisialisasi semua state di objek transisi
states.forEach(state => { transitions[state] = {}; });

/* --- TAHAP 1: Cek Panjang (>= 8) --- */
// (q0 -> q1 -> q2 -> ... -> q7 -> q_len_ok)
const lengthCheckStates = ['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
for (let i = 0; i < lengthCheckStates.length; i++) {
    const currentState = lengthCheckStates[i];
    const nextState = (i === lengthCheckStates.length - 1) ? 'q_len_ok' : lengthCheckStates[i + 1];

    // Jika ketemu BLANK sebelum 8 karakter, REJECT
    transitions[currentState][BLANK] = [rejectState, BLANK, 'S'];
    
    // Jika ketemu karakter, pindah ke state berikutnya
    for (const char of alphabet) {
        transitions[currentState][char] = [nextState, char, 'R'];
    }
}

// State q_len_ok: Panjang sudah >= 8. Terus ke kanan sampai akhir.
for (const char of alphabet) {
    transitions['q_len_ok'][char] = ['q_len_ok', char, 'R'];
}
// Setelah sampai di akhir (BLANK), mulai putar balik untuk cari lowercase
transitions['q_len_ok'][BLANK] = ['q_rewind_lower', BLANK, 'L'];


/* --- TAHAP 2: Cari Lowercase --- */
// (q_rewind_lower -> q_find_lower)
addRewindTransitions([...alphabet, UPR, NUM, SPC], transitions, 'q_rewind_lower', 'q_find_lower');
// q_find_lower:
addFindTransitions(lowercase, transitions, 'q_find_lower', 'q_rewind_upper', LWR);
addSkipTransitions([uppercase, numbers, specials, [UPR, NUM, SPC]], transitions, 'q_find_lower');
transitions['q_find_lower'][BLANK] = [rejectState, BLANK, 'S']; // Tidak ketemu lowercase


/* --- TAHAP 3: Cari Uppercase --- */
// (q_rewind_upper -> q_find_upper)
addRewindTransitions([...alphabet, LWR, NUM, SPC], transitions, 'q_rewind_upper', 'q_find_upper');
// q_find_upper:
addFindTransitions(uppercase, transitions, 'q_find_upper', 'q_rewind_num', UPR);
addSkipTransitions([lowercase, numbers, specials, [LWR, NUM, SPC]], transitions, 'q_find_upper');
transitions['q_find_upper'][BLANK] = [rejectState, BLANK, 'S']; // Tidak ketemu uppercase


/* --- TAHAP 4: Cari Angka --- */
// (q_rewind_num -> q_find_num)
addRewindTransitions([...alphabet, LWR, UPR, SPC], transitions, 'q_rewind_num', 'q_find_num');
// q_find_num:
addFindTransitions(numbers, transitions, 'q_find_num', 'q_rewind_spec', NUM);
addSkipTransitions([lowercase, uppercase, specials, [LWR, UPR, SPC]], transitions, 'q_find_num');
transitions['q_find_num'][BLANK] = [rejectState, BLANK, 'S']; // Tidak ketemu angka


/* --- TAHAP 5: Cari Simbol Spesial --- */
// (q_rewind_spec -> q_find_spec)
addRewindTransitions([...alphabet, LWR, UPR, NUM], transitions, 'q_rewind_spec', 'q_find_spec');
// q_find_spec:
addFindTransitions(specials, transitions, 'q_find_spec', acceptState, SPC); // --> ACCEPT!
addSkipTransitions([lowercase, uppercase, numbers, [LWR, UPR, NUM]], transitions, 'q_find_spec');
transitions['q_find_spec'][BLANK] = [rejectState, BLANK, 'S']; // Tidak ketemu simbol


/* --- Ekspor Aturan --- */
export const passwordRules = {
    states: states,
    alphabet: alphabet,
    tapeAlphabet: tapeAlphabet,
    transitions: transitions,
    startState: startState,
    acceptState: acceptState,
    rejectState: rejectState,
    blankSymbol: BLANK
};