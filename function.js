const fs = require("fs");
const os = require("os");
const si = require("systeminformation");
const ping = require("ping");

// === Quest System ===
function getTodayDate() {
  return new Date().toISOString().split("T")[0]; // format YYYY-MM-DD
}

function loadQuests() {
  if (!fs.existsSync("quests.json")) fs.writeFileSync("quests.json", JSON.stringify([]));
  return JSON.parse(fs.readFileSync("quests.json"));
}

function saveQuests(data) {
  fs.writeFileSync("quests.json", JSON.stringify(data, null, 2));
}

// === Daily Quest ===
function getUserQuest(userId) {
  const quests = loadQuests();
  let userQuest = quests.find(q => q.id === userId);

  // buat baru kalau belum ada
  if (!userQuest) {
    userQuest = { id: userId, lastDaily: "", daily: { quiz: false, share: false }, referral: 0 };
    quests.push(userQuest);
    saveQuests(quests);
  }

  return userQuest;
}

function resetDailyIfNeeded(userQuest) {
  const today = getTodayDate();
  if (userQuest.lastDaily !== today) {
    userQuest.daily = { quiz: false, share: false };
    userQuest.lastDaily = today;
  }
}

function completeDailyQuest(userId, questType) {
  const quests = loadQuests();
  const userQuest = getUserQuest(userId);
  resetDailyIfNeeded(userQuest);

  if (userQuest.daily[questType]) return { success: false, msg: "❌ Kamu sudah menyelesaikan quest ini hari ini." };

  userQuest.daily[questType] = true;
  saveQuests(quests);

  // Reward rhystal
  const reward = 50;
  updateRhystal(userId, reward);
  return { success: true, msg: `✅ Quest ${questType} selesai! Kamu dapat 💎 ${reward} Rhystal.` };
}

function getDailyQuestStatus(userId) {
  const userQuest = getUserQuest(userId);
  resetDailyIfNeeded(userQuest);

  const { quiz, share } = userQuest.daily;
  return `
📅 <b>Daily Quest (${getTodayDate()})</b>

1️⃣ Jawab Kuis: ${quiz ? "✅ Selesai" : "❌ Belum"}
2️⃣ Share Link: ${share ? "✅ Selesai" : "❌ Belum"}

💰 Reward per quest: +50 Rhystal
`;
}

// === Referral Quest ===
function addReferral(referrerId, newUserId) {
  const quests = loadQuests();
  const referrer = getUserQuest(referrerId);

  if (referrerId === newUserId) return false; // no self-ref
  if (!referrer) return false;

  // Cek kalau sudah direfer sebelumnya
  if (referrer.referrals && referrer.referrals.includes(newUserId)) return false;

  if (!referrer.referrals) referrer.referrals = [];
  referrer.referrals.push(newUserId);
  referrer.referral = (referrer.referral || 0) + 1;
  saveQuests(quests);

  updateRhystal(referrerId, 200); // reward 200 Rhystal tiap referal
  return true;
}

function getReferralStats(userId) {
  const userQuest = getUserQuest(userId);
  const count = userQuest.referral || 0;
  return `👥 Kamu sudah merefer ${count} pengguna.\n💎 Total bonus: ${count * 200} Rhystal`;
}


async function getServerStatus() {
  const cpu = await si.currentLoad();
  const mem = await si.mem();
  const uptime = os.uptime();

  // Konversi uptime ke format jam, menit, detik
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  // Coba ping ke Google
  const pingRes = await ping.promise.probe("8.8.8.8", { timeout: 2 });
  const pingMs = pingRes.time ? `${pingRes.time} ms` : "Offline";

  // Format hasilnya
  return `
🖥️ <b>Server Status</b>

💠 <b>CPU Usage:</b> ${cpu.currentLoad.toFixed(1)}%
📈 <b>Memory Used:</b> ${((mem.active / mem.total) * 100).toFixed(1)}%
🕒 <b>Uptime:</b> ${hours}h ${minutes}m ${seconds}s
🌐 <b>Ping:</b> ${pingMs}
⚙️ <b>CPU Cores:</b> ${os.cpus().length}
💾 <b>Total RAM:</b> ${(mem.total / 1024 / 1024 / 1024).toFixed(2)} GB
`;
}

// === Fungsi Util Dasar ===
function loadData(file) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(file));
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === Admin System ===
async function isAdmin(userId) {
  try {
    const admins = loadData("admins.json");
    return admins.some(a => a.id.toString() === userId.toString());
  } catch (error) {
    console.error("Gagal memeriksa admin:", error);
    return false;
  }
}

async function addAdmin(ctx, userId, name, username) {
  try {
    let admins = loadData("admins.json");
    if (admins.some(a => a.id === userId)) {
      ctx.reply("❌ User ini sudah jadi admin.");
      return false;
    }

    const credit = 1000000;
    admins.push({ id: userId, name, username, credit });
    saveData("admins.json", admins);

    console.log(`✅ Admin baru ditambahkan: ${username} (${userId})`);
    ctx.reply(`✅ ${username} berhasil ditambahkan sebagai admin.`);
    return true;
  } catch (error) {
    console.error("❌ Gagal menambahkan admin:", error);
    return false;
  }
}

async function getAdminList() {
  try {
    let admins = loadData("admins.json");
    return admins.map(a => a.id);
  } catch (error) {
    console.error("Gagal mengambil data Admin:", error);
    return [];
  }
}
function hasBalance(userId, amount = 0) {
  try {
    const members = loadData("members.json");
    const member = members.find(m => m.id.toString() === userId.toString());

    if (!member) return false; // user belum terdaftar
    if (typeof member.rhystal !== "number") return false; // data invalid

    // Jika amount = 0 → hanya cek apakah punya saldo
    // Jika amount > 0 → cek apakah saldo cukup
    return member.rhystal >= amount;
  } catch (error) {
    console.error("Gagal memeriksa saldo:", error);
    return false;
  }
}

// === Member System (Dengan Level & Rhystal) ===
async function isMember(userId) {
  try {
    const members = loadData("members.json");
    return members.some(m => m.id.toString() === userId.toString());
  } catch (error) {
    console.error("Gagal memeriksa member:", error);
    return false;
  }
}
async function cekMember(userId) {
  try {
    const members = loadData("members.json");
    return members.some(m => m.id.toString() === userId.toString());
  } catch (error) {
    console.error("Gagal memeriksa member:", error);
    return false;
  }
}

// Tambah Member Baru
async function addMember(ctx, id, name, username, roles = "member") {
  try {
    let members = loadData("members.json");
    if (members.some(m => m.id === id)) {
      ctx.reply("❌ Kamu sudah terdaftar.");
      return false;
    }

    members.push({
      id,
      name,
      username,
      roles,
      level: 1,
      rhystal: 0
    });
    saveData("members.json", members);

    ctx.reply("✅ Pendaftaran berhasil! Anda sekarang dapat menggunakan bot.");
    return true;
  } catch (error) {
    console.error("Gagal mendaftarkan user:", error);
    ctx.reply("❌ Terjadi kesalahan saat mendaftar. Coba lagi.");
    return false;
  }
}

// Ambil Data Member
function getMember(userId) {
  const members = loadData("members.json");
  return members.find(m => m.id.toString() === userId.toString());
}

// Update Rhystal (nambah / kurang)
function updateRhystal(userId, amount) {
  const members = loadData("members.json");
  const member = members.find(m => m.id.toString() === userId.toString());
  if (!member) return false;

  member.rhystal = (member.rhystal || 0) + amount;
  saveData("members.json", members);
  return true;
}
function addRhystal(userId, amount) {
  const members = loadData("members.json");
  const member = members.find(m => m.id.toString() === userId.toString());
  if (!member) return false;

  // pastiin input angka
  const amt = parseInt(amount);
  const current = parseInt(member.rhystal) || 0;

  // tambahkan saldo
  member.rhystal = current + amt;
  saveData("members.json", members);
  return true;
}

function useRhystal(userId, amount) {
  const members = loadData("members.json");
  const member = members.find(m => m.id.toString() === userId.toString());
  if (!member) return false;

  // pastikan amount dan rhystal berupa angka
  const amt = parseInt(amount);
  const current = parseInt(member.rhystal) || 0;

  // kalau saldo kurang, batalin
  if (current < amt) return false;

  member.rhystal = current - amt;
  saveData("members.json", members);
  return true;
}
function getLeader(ctx){
  const leaderboard = JSON.parse(fs.readFileSync('./members.json', 'utf-8'));
  leaderboard.sort((a, b) => b.rhystal - a.rhystal);
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const userIndex = leaderboard.findIndex(u => u.id === userId);
  const userStats = leaderboard[userIndex] || { username, rhystal: 0 };

  const rank = userIndex !== -1 ? userIndex + 1 : leaderboard.length;
  const percentage = ((rank / leaderboard.length) * 100).toFixed(1);

    let msg = `🌍 📊 <b>Your Current Stats</b>\n\n`;
    msg += `👤 User: <b>${username}</b>\n`;
    msg += `🏅 Rank: <b>#${rank.toLocaleString()}</b> (Top ${percentage}%)\n`;
    msg += `💎 Rhystal: <b>${userStats.rhystal.toLocaleString()}</b>\n\n`;
    msg += `\n🕒 Last updated: <i>${new Date().toLocaleString()}</i>`;
    return msg
}
// === Leaderboard System ===
function generateLeaderboard(ctx) {
  const leaderboard = JSON.parse(fs.readFileSync('./members.json', 'utf-8'));

  leaderboard.sort((a, b) => b.rhystal - a.rhystal);
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const userIndex = leaderboard.findIndex(u => u.id === userId);
  const userStats = leaderboard[userIndex] || { username, rhystal: 0 };

  const rank = userIndex !== -1 ? userIndex + 1 : leaderboard.length;
  const percentage = ((rank / leaderboard.length) * 100).toFixed(1);
  const top10 = leaderboard.slice(0, 10);

  let msg = `🌍 <b>Global Leaderboard</b>\n`;
  msg += `Leaderboard for users with the most Rhystals.\n\n`;
  msg += `🏆 <b>Rankings</b>\n\n`;

  top10.forEach((u, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}. `;
    msg += `${medal} <b>@${u.username}</b>\n<i>total Rhystal:</i> ${u.rhystal.toLocaleString()}\n`;
  });

  msg += `\n🕒 Last updated: <i>${new Date().toLocaleString()}</i>`;
  return msg;
}

// === Export Semua ===
module.exports = {
  generateLeaderboard,
  isAdmin,
  isMember,
  addAdmin,
  addMember,
  getAdminList,
  getMember,
  updateRhystal,
  hasBalance,
  cekMember,
  useRhystal,
  addRhystal,
  getLeader,
  getServerStatus,
  getTodayDate,
  loadQuests,
  saveQuests,
  getUserQuest,
  resetDailyIfNeeded,
  completeDailyQuest,
  getDailyQuestStatus,
  addReferral,
  getReferralStats
};
