// src/lib/scenarios.ts
// "Ngobrol skenario": short spoken English role-plays. Lingo plays a role (barista, shop assistant, ...) and the
// learner has three small missions. Lingo reports after each reply which missions are done ("DONE: 1,3").

import { SPOKEN_REPLY_RULES } from "@/lib/lingo-prompts";

export type Mission = { text: string; example: string };
export type Scenario = {
  id: string;
  title: string;
  place: string;
  icon: "users" | "coffee" | "shirt" | "map" | "hotel" | "plane";
  color: string;
  role: string;
  setting: string;
  opener: string; // "<English>\nID: <Indonesian>"
  missions: Mission[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "kenalan", title: "Kenalan dengan teman baru", place: "Sekolah", icon: "users", color: "#10b981",
    role: "Sam, a friendly new classmate", setting: "the first day at school, before class starts",
    opener: "Hi! I'm Sam. I'm new here. What's your name?\nID: Hai! Aku Sam. Aku murid baru di sini. Siapa namamu?",
    missions: [
      { text: "Sebutkan namamu", example: "Hi Sam! My name is Wayan." },
      { text: "Ceritakan asalmu", example: "I'm from Bali." },
      { text: "Tanyakan hobinya", example: "What do you like to do?" },
    ],
  },
  {
    id: "kafe", title: "Pesan di kafe", place: "Kafe", icon: "coffee", color: "#f59e0b",
    role: "a cheerful barista", setting: "a small cafe, the learner is at the counter",
    opener: "Hello and welcome! What can I get for you today?\nID: Halo, selamat datang! Mau pesan apa hari ini?",
    missions: [
      { text: "Pesan satu minuman", example: "Can I have an iced tea, please?" },
      { text: "Pesan satu makanan", example: "I'd like a chicken sandwich, please." },
      { text: "Tanyakan harganya", example: "How much is it?" },
    ],
  },
  {
    id: "toko", title: "Belanja baju", place: "Toko", icon: "shirt", color: "#ec4899",
    role: "a helpful shop assistant", setting: "a clothes shop",
    opener: "Hi there! Can I help you find something?\nID: Halo! Ada yang bisa saya bantu carikan?",
    missions: [
      { text: "Bilang apa yang kamu cari", example: "I'm looking for a T-shirt." },
      { text: "Tanya ukuran atau warna lain", example: "Do you have it in blue?" },
      { text: "Bilang kamu mau membelinya", example: "I'll take it, thank you." },
    ],
  },
  {
    id: "arah", title: "Tanya arah", place: "Jalan", icon: "map", color: "#3b82f6",
    role: "a kind local person", setting: "a busy street in a city the learner is visiting",
    opener: "Hi! You look a little lost. Can I help you?\nID: Hai! Kamu kelihatan bingung. Ada yang bisa saya bantu?",
    missions: [
      { text: "Tanyakan letak suatu tempat", example: "Where is the train station?" },
      { text: "Tanyakan jaraknya", example: "Is it far from here?" },
      { text: "Ucapkan terima kasih", example: "Thank you so much!" },
    ],
  },
  {
    id: "hotel", title: "Check-in hotel", place: "Hotel", icon: "hotel", color: "#a855f7",
    role: "a polite hotel receptionist", setting: "the front desk of a hotel",
    opener: "Good evening, welcome to our hotel! How can I help you?\nID: Selamat malam, selamat datang di hotel kami! Ada yang bisa saya bantu?",
    missions: [
      { text: "Bilang kamu sudah pesan kamar", example: "I have a reservation." },
      { text: "Sebutkan namamu", example: "My name is Wayan Putra." },
      { text: "Tanyakan jam sarapan", example: "What time is breakfast?" },
    ],
  },
  {
    id: "bandara", title: "Di bandara", place: "Bandara", icon: "plane", color: "#06b6d4",
    role: "an airline check-in staff member", setting: "the check-in counter at an airport",
    opener: "Good morning! Where are you flying to today?\nID: Selamat pagi! Hari ini kamu terbang ke mana?",
    missions: [
      { text: "Sebutkan tujuanmu", example: "I'm flying to Tokyo." },
      { text: "Minta kursi dekat jendela", example: "Can I have a window seat, please?" },
      { text: "Tanyakan nomor gerbang", example: "Which gate is it?" },
    ],
  },
];

export function buildScenarioPrompt(s: Scenario) {
  const missions = s.missions.map((m, i) => `${i + 1}) ${m.text} (for example: "${m.example}")`).join("\n");
  return `You are Lingo from LINGORA, playing a role in a short spoken English role-play with an Indonesian beginner. Your reply is read aloud.
Your role: ${s.role}. Setting: ${s.setting}. Stay in your role, be warm and encouraging.
The learner has these missions (written in Indonesian for them):
${missions}
- Answer what they said in your role, then guide them toward the next mission they have not done yet with a natural question
- A mission is done when the learner has said it in English in an understandable way (small mistakes are fine)
- When all missions are done, say a warm goodbye in your role
${SPOKEN_REPLY_RULES}
- Then add one more new line that starts with "DONE:" followed by the numbers of ALL missions the learner has done so far in this conversation, separated by commas, or 0 if none

Example:
Sure! One iced tea. Would you like something to eat?
ID: Tentu! Satu es teh. Mau makan sesuatu?
DONE: 1`;
}

/** Lingo's reply without the DONE line, and the missions done so far (0-based indexes) */
export function readMissionReport(reply: string, count: number): { text: string; done: number[] | null } {
  const m = reply.match(/\n?\s*DONE:\s*([0-9,\s]*)\s*$/i);
  if (!m) return { text: reply, done: null };
  const done = m[1].split(",").map((x) => parseInt(x.trim(), 10) - 1).filter((i) => i >= 0 && i < count);
  return { text: reply.slice(0, m.index).trimEnd(), done };
}
