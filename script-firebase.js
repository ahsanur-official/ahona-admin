// ============================================
// AHONA BLOG - ADMIN PANEL (Firebase Ready)
// ============================================
import {
  auth,
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChange,
  getUserData,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  ensureUserDocument,
  createPost,
  getPost,
  getUserPosts,
  updatePost,
  deletePost,
  publishPost,
  saveDraft,
  updateDraft,
  getUserDrafts,
  deleteDraft,
  getAnalytics,
} from "../firebase-config.js";

// ============================================
// DOM Elements
// ============================================
const editor = document.getElementById("editorArea");
const titleInput = document.getElementById("title");
const category = document.getElementById("category");
const mood = document.getElementById("mood");
const readingEst = document.getElementById("readingEst");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const lastSavedAt = document.getElementById("lastSavedAt");
const wordGoalInput = document.getElementById("wordGoal");
const templateSelect = document.getElementById("templateSelect");
const goalText = document.getElementById("goalText");
const goalPercent = document.getElementById("goalPercent");
const goalBarFill = document.getElementById("goalBarFill");
const publishBtn = document.getElementById("publish");
const saveDraftBtn = document.getElementById("saveDraft");
const clearBtn = document.getElementById("clear");
const previewBtn = document.getElementById("preview");
const exportHtmlBtn = document.getElementById("exportHtml");
const exportTextBtn = document.getElementById("exportText");
const restoreBackupBtn = document.getElementById("restoreBackup");
const toggleTheme = document.getElementById("toggleTheme");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");
// const currentUserName = document.getElementById("currentUserName"); // Element removed from HTML
const tabBtns = document.querySelectorAll(".tabBtn");
const tabContents = document.querySelectorAll(".tab-content");
const publishedPosts = document.getElementById("publishedPosts");
const draftPosts = document.getElementById("draftPosts");
const profileModal = document.getElementById("profileModal");
const profileContent = document.getElementById("profileContent");
const closeProfile = document.getElementById("closeProfile");
const previewModal = document.getElementById("previewModal");
const previewContent = document.getElementById("previewContent");
const closePreview = document.getElementById("closePreview");
const toolbar = document.querySelector(".toolbar");
const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOk = document.getElementById("confirmOk");
const confirmCancel = document.getElementById("confirmCancel");
const fullPostModal = document.getElementById("fullPostModal");
const fullPostBody = document.getElementById("fullPostBody");
const fullPostTitle = document.getElementById("fullPostTitle");
const closeFullPost = document.getElementById("closeFullPost");

// ============================================
// Beautiful Alert Function
// ============================================
function showAlert(message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `custom-alert custom-alert-${type}`;

  // Set colors based on type
  let bgColor = "#10b981"; // green for success
  let icon = "✅";

  if (type === "error") {
    bgColor = "#ef4444";
    icon = "❌";
  } else if (type === "warning") {
    bgColor = "#f59e0b";
    icon = "⚠️";
  } else if (type === "info") {
    bgColor = "#3b82f6";
    icon = "ℹ️";
  }

  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${bgColor};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;

  alertDiv.innerHTML = `<span style="margin-right: 8px;">${icon}</span> ${message}`;

  // Add animation styles if not present
  if (!document.getElementById("alert-styles")) {
    const style = document.createElement("style");
    style.id = "alert-styles";
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(alertDiv);

  // Auto remove after 3 seconds
  setTimeout(() => {
    alertDiv.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
}

// ============================================
// State
// ============================================
let currentUserData = null;
let currentEditingPostId = null;
let currentEditingDraftId = null;
let confirmCallback = null;
let profilePicPreviewUrl = null;

// ============================================
// Theme Management
// ============================================
// Language support (English / Bangla)
const LANGS = {
  en: {
    write: '✍️ Write',
    published: '📚 Published',
    drafts: '📝 Drafts',
    analytics: '📊 Stats',
    publishedStories: 'Published Stories',
    noPublished: 'No published stories yet. Start writing! ✍️',
    more: 'More →',
    edit: '✏️ Edit',
    delete: '🗑️ Delete',
  },
  bn: {
    write: 'লিখুন ✍️',
    published: 'প্রকাশিত 📚',
    drafts: 'খসড়া 📝',
    analytics: 'পরিসংখ্যান 📊',
    publishedStories: 'প্রকাশিত গল্পসমূহ',
    noPublished: 'কোনো প্রকাশিত গল্প নেই। লেখাশুরু করুন! ✍️',
    more: 'বিস্তারিত →',
    edit: 'সম্পাদনা ✏️',
    delete: 'মুছুন 🗑️',
  },
};

let currentLang = 'en';
function applyLanguage(lang) {
  currentLang = LANGS[lang] ? lang : 'en';
  try { localStorage.setItem('ahona_lang', currentLang); } catch (e) {}
  // update static UI labels
  const map = LANGS[currentLang];
  const writeBtn = document.querySelector('.tabBtn[data-tab="editorTab"]');
  const pubBtn = document.querySelector('.tabBtn[data-tab="published"]');
  const draftBtn = document.querySelector('.tabBtn[data-tab="drafts"]');
  const analyticsBtn = document.querySelector('.tabBtn[data-tab="analytics"]');
  if (writeBtn) writeBtn.textContent = map.write;
  if (pubBtn) pubBtn.textContent = map.published;
  if (draftBtn) draftBtn.textContent = map.drafts;
  if (analyticsBtn) analyticsBtn.textContent = map.analytics;
  // page-specific headings
  const editorH2 = document.querySelector('#editorTab h2');
  const pubH2 = document.querySelector('#published h2');
  const draftsH2 = document.querySelector('#drafts h2');
  const analyticsH2 = document.querySelector('#analytics h2');
  if (editorH2) editorH2.textContent = map.write;
  if (pubH2) pubH2.textContent = map.publishedStories;
  if (draftsH2) draftsH2.textContent = map.drafts;
  if (analyticsH2) analyticsH2.textContent = map.analytics;
}

// initialize language from storage
try { currentLang = localStorage.getItem('ahona_lang') || 'en'; } catch (e) { currentLang = 'en'; }
applyLanguage(currentLang);

// Hook up language selector in header
const langSelectEl = document.getElementById('langSelect');
if (langSelectEl) {
  try { langSelectEl.value = currentLang; } catch (e) {}
  langSelectEl.addEventListener('change', (e) => {
    const v = e.target.value || 'en';
    applyLanguage(v);
    // re-render lists to apply new labels
    try { renderPublished(); renderDrafts(); } catch (err) {}
    // update heading elements
    const pubH2 = document.querySelector('#published h2');
    if (pubH2) pubH2.textContent = LANGS[currentLang].publishedStories;
  });
}
function loadTheme() {
  // Resolve effective theme in this priority order:
  // 1. localStorage 'ahona_theme' (fast, avoids flash)
  // 2. currentUserData.settings.theme (server-stored), if present
  // 3. default to dark
  try {
    const stored = localStorage.getItem('ahona_theme');
    if (stored === 'light') {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else if (stored === 'dark') {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else if (currentUserData?.settings?.theme) {
      const s = currentUserData.settings.theme === 'light' ? 'light' : 'dark';
      if (s === 'light') {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      } else {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
      }
      try { localStorage.setItem('ahona_theme', s); } catch (e) {}
    } else {
      // default
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      try { localStorage.setItem('ahona_theme', 'dark'); } catch (e) {}
    }
  } catch (e) {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }

  updateThemeBtn();
}

function updateThemeBtn() {
  if (toggleTheme) {
    const isDarkMode = document.body.classList.contains('dark');
    toggleTheme.textContent = isDarkMode ? '☀️' : '🌙';
    toggleTheme.setAttribute('title', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

// Toggle theme and save preference to Firebase + localStorage
toggleTheme?.addEventListener('click', async () => {
  try {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
    const nowDark = document.body.classList.contains('dark');
    try { localStorage.setItem('ahona_theme', nowDark ? 'dark' : 'light'); } catch (e) {}
    updateThemeBtn();

    // Persist for logged-in user
    if (currentUserData && auth?.currentUser) {
      try {
        const newTheme = nowDark ? 'dark' : 'light';
        if (typeof updateUserProfile === 'function') {
          await updateUserProfile(auth.currentUser.uid, {
            settings: { ...(currentUserData.settings || {}), theme: newTheme },
          });
        } else {
          await updateDoc(doc(db, 'users', currentUserData.uid), {
            'settings.theme': newTheme,
          });
        }
        if (!currentUserData.settings) currentUserData.settings = {};
        currentUserData.settings.theme = newTheme;
      } catch (err) {
        console.error('Error saving theme to server:', err);
      }
    }

    try { showNotification(nowDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success'); } catch (e) { console.log('Theme changed'); }
  } catch (e) { console.error('Theme toggle error', e); }
});

// ============================================
// Auth UI
// ============================================
function updateAuthUI() {
  const user = auth.currentUser;
  const mainContainer = document.getElementById("mainContainer");
  const authModal = document.getElementById("authModal");

  if (user && currentUserData) {
    // currentUserName element was removed from HTML, no longer updating it here
    profileBtn.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
    if (mainContainer) mainContainer.style.display = "block";
    if (authModal) authModal.classList.add("hidden");
  } else {
    // currentUserName element was removed from HTML, no longer updating it here
    profileBtn.style.display = "none";
    logoutBtn.style.display = "none";
    if (mainContainer) mainContainer.style.display = "none";
    if (authModal) authModal.classList.remove("hidden");
  }
}

// ============================================
// Firebase Auth State
// ============================================
onAuthStateChange(async (firebaseUser) => {
  console.log("Auth state changed:", firebaseUser?.email);

  if (firebaseUser) {
    // ⚠️ ADMIN PANEL PROTECTION: Only allow ahona@blog.com
    if (firebaseUser.email !== "ahona@blog.com") {
      console.warn("Unauthorized access attempt:", firebaseUser.email);
      showAlert(
        "⚠️ Admin Panel is restricted. Only authorized admin can access.",
        "error",
      );
      await logoutUser();
      return;
    }

    try {
      const userData = await getUserData(firebaseUser.uid);
      console.log("Admin data loaded:", userData?.displayName);

      if (userData) {
        currentUserData = userData;
      } else {
        // If no user data, create admin document
        const created = await ensureUserDocument(firebaseUser.uid, {
          email: firebaseUser.email,
          username: firebaseUser.email?.split("@")[0] || "admin",
          displayName: "Ahona Islam",
          isAdmin: true,
        });
        currentUserData = created || {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: "Ahona Islam",
          profilePic: "",
        };
        console.log("Created admin data");
      }

      updateAuthUI();
      updateTopBarAvatar();
      updateWritingGoalFromDatabase();

      // Apply theme preference immediately after user data loads
      loadTheme();

      // Restore editor content from last draft
      await restoreEditorContent();

      // Restore active tab
      const activeTab = getActiveTab();
      if (activeTab && activeTab !== "editorTab") {
        setTimeout(() => switchToTab(activeTab), 100);
      }

      // Load posts if we're on the published tab
      const publishedTab = document.querySelector('[data-tab="published"]');
      if (publishedTab && publishedTab.classList.contains("active")) {
        renderPublished();
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      currentUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: "Ahona Islam",
      };
      updateAuthUI();
    }
  } else {
    console.log("User logged out");
    currentUserData = null;
    updateAuthUI();
  }
});

// ============================================
// Utility Functions
// ============================================
async function restoreEditorContent() {
  if (!auth.currentUser || currentEditingDraftId) return;

  try {
    // Check if there's an ongoing draft
    const drafts = await getUserDrafts(auth.currentUser.uid);
    const lastDraft = drafts[0]; // Get most recent draft

    if (lastDraft && lastDraft.content) {
      // Restore the last draft content
      titleInput.value = lastDraft.title || "";
      editor.innerHTML = lastDraft.content || "";
      category.value = lastDraft.category || "";
      mood.value = lastDraft.mood || "";
      const tagsInput = document.getElementById("tags");
      if (tagsInput) tagsInput.value = (lastDraft.tags || []).join(", ");

      currentEditingDraftId = lastDraft.id;
      editor.dispatchEvent(new Event("input"));

      showNotification("📝 Last draft restored!", "info");
    }
  } catch (e) {
    console.error("Error restoring editor content:", e);
  }
}

function estimateReadingTime(html) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length || 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

function getPreviewText(html, lines = 7) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const elements = Array.from(doc.body.children);

  let lineCount = 0;
  let previewHTML = "";
  // Build a clean preview: prefer first few paragraphs, fall back to trimmed text
  for (const elem of elements) {
    const text = elem.textContent.trim();
    if (!text) continue;

    // Only take up to 'lines' number of paragraph blocks
    previewHTML += `<p class="previewLine">${escapeHtml(elem.textContent).substring(0, 300)}</p>`;
    lineCount += 1;
    if (lineCount >= lines) break;
  }

  // If no block elements, create from raw text
  if (!previewHTML) {
    const plain = new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
    previewHTML = `<p class="previewLine">${escapeHtml(plain).substring(0, 300)}</p>`;
  }

  return `<div class="previewContent">${previewHTML}${plainEllipsis(previewHTML)}</div>`;
}

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function plainEllipsis(html) {
  // Add ellipsis if content likely trimmed
  return html.length > 280 ? '<div class="previewMore">…</div>' : '';
}

function showFullPost(postId, title, content, meta) {
  fullPostTitle.textContent = title;

  // Parse content and display line by line
  const doc = new DOMParser().parseFromString(content, "text/html");
  const paragraphs = Array.from(doc.body.children);

  let lineByLineContent = "";
  for (const para of paragraphs) {
    const text = para.textContent.trim();
    if (!text) continue;

    // Get the tag name to preserve formatting
    const tag = para.tagName.toLowerCase();
    const html = para.outerHTML;

    lineByLineContent += html;
  }

  fullPostBody.innerHTML = `
    <h1>${title}</h1>
    <div class="fullPostMeta">
      ${meta}
    </div>
    <div class="fullPostContent">
      ${lineByLineContent || content}
    </div>
    <div class="fullPostActions">
      <button class="postActionBtn" onclick="editPost('${postId}')">✏️ Edit</button>
      <button class="postActionBtn" onclick="deletePost('${postId}')">🗑️ Delete</button>
    </div>
  `;
  fullPostModal.classList.remove("hidden");
}

function updateGoalProgress(words) {
  const goal = Number(wordGoalInput?.value || 0);
  if (!goal || goal <= 0) {
    if (goalText) goalText.textContent = "Goal: 0 words";
    if (goalPercent) goalPercent.textContent = "0%";
    if (goalBarFill) goalBarFill.style.width = "0%";
    return;
  }

  const percent = Math.min(100, Math.round((words / goal) * 100));
  if (goalText) goalText.textContent = `Goal: ${goal} words`;
  if (goalPercent) goalPercent.textContent = `${percent}%`;
  if (goalBarFill) goalBarFill.style.width = `${percent}%`;
}

async function saveLocalBackup() {
  if (!titleInput || !editor || !auth.currentUser) return;
  const payload = {
    title: titleInput.value || "",
    content: editor.innerHTML || "",
    category: category?.value || "",
    mood: mood?.value || "",
    tags: document.getElementById("tags")?.value || "",
    updatedAt: new Date(),
  };
  if (!payload.title && !payload.content) return;
  try {
    await updateUserProfile(auth.currentUser.uid, { lastBackup: payload });
  } catch (e) {
    console.error("Backup save error:", e);
  }
}

function applyBackupData(data) {
  titleInput.value = data.title || "";
  editor.innerHTML = data.content || "";
  if (category) category.value = data.category || "";
  if (mood) mood.value = data.mood || "";
  const tagsInput = document.getElementById("tags");
  if (tagsInput) tagsInput.value = data.tags || "";
  editor.dispatchEvent(new Event("input"));
}

async function restoreLocalBackup() {
  if (!currentUserData?.lastBackup) {
    showNotification("No backup found.", "info");
    return;
  }

  const confirmed = await showConfirm(
    "♻️ Restore Backup",
    "Restore your last backup into the editor?",
    "Restore",
    "Cancel",
  );
  if (!confirmed) return;

  try {
    const data = currentUserData.lastBackup;
    applyBackupData(data);
    showNotification("✅ Backup restored.", "success");
  } catch (e) {
    console.error("Backup restore error:", e);
    showNotification("❌ Failed to restore backup.", "error");
  }
}

async function promptRestoreBackupOnLoad() {
  if (!currentUserData?.lastBackup) return;
  if (titleInput.value.trim() || editor.textContent.trim()) return;

  const confirmed = await showConfirm(
    "♻️ Restore Backup",
    "We found unsaved backup. Restore it now?",
    "Restore",
    "Ignore",
  );

  if (!confirmed) return;

  try {
    const data = currentUserData.lastBackup;
    applyBackupData(data);
    showNotification("✅ Backup restored.", "success");
  } catch (e) {
    console.error("Backup restore error:", e);
    showNotification("❌ Failed to restore backup.", "error");
  }
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openPreview() {
  const estimate = estimateReadingTime(editor.innerHTML);
  const plainText = editor.innerHTML.replace(/<[^>]*>/g, "");
  const excerpt = (plainText || "").substring(0, 150);
  const tags = (document.getElementById("tags")?.value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const tagsHTML =
    tags.length > 0
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
      ${tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
    </div>`
      : "";

  const categoryIcon =
    category.value === "Novel" ? "📖" : category.value === "Poem" ? "✍️" : "📝";

  previewContent.innerHTML = `
    <div class="postCard">
      <div class="postCardHeader">
        <h3 class="postCardTitle">${titleInput.value || "Untitled"}</h3>
        <div style="display:flex;gap:8px">
          <span style="font-size:12px;color:var(--secondary)">❤️ 0</span>
          <span style="font-size:12px;color:var(--secondary)">💬 0</span>
        </div>
      </div>
      <div class="postCardMeta">
        <span>${new Date().toLocaleDateString()}</span>
        ${category.value ? `<span class="postMoodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${categoryIcon} ${category.value}</span>` : ""}
        <span class="postMoodTag" style="background:rgba(230,57,70,0.15);color:#e63946">${mood.value || "No mood"}</span>
        <span>⏱️ ${estimate.minutes} min</span>
      </div>
      ${tagsHTML}
      <div style="margin:12px 0;color:var(--text);font-size:14px;line-height:1.6">${excerpt}...</div>
      <div class="postCardActions">
        <button class="postActionBtn" disabled>✏️ Edit</button>
        <button class="postActionBtn" disabled>🗑️ Delete</button>
        <button class="postActionBtn" disabled>👁️ View</button>
      </div>
    </div>
  `;
  previewModal.classList.remove("hidden");
}

function showConfirm(
  title,
  message,
  okText = "Confirm",
  cancelText = "Cancel",
) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.textContent = okText;
    confirmCancel.textContent = cancelText;
    confirmModal.classList.remove("hidden");
    confirmCallback = resolve;
  });
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 12px 16px;
    background: var(--card);
    border: 2px solid ${type === "success" ? "var(--accent-success)" : type === "error" ? "#d62828" : "var(--accent-primary)"};
    border-radius: 8px;
    color: var(--text);
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================
// Editor Functions
// ============================================
editor.addEventListener("input", () => {
  const text = editor.textContent;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const paragraphs = editor.querySelectorAll("p").length || 1;

  charCount.textContent = chars;
  wordCount.textContent = words;
  document.getElementById("paragraphCount").textContent = paragraphs;

  const estimate = estimateReadingTime(editor.innerHTML);
  readingEst.textContent = estimate.minutes + " min";
  updateGoalProgress(words);

  const status = document.getElementById("editorStatus");
  status.classList.remove("saved");
  status.textContent = "⚠️ Unsaved";

  clearTimeout(window.autoSaveTimeout);
  window.autoSaveTimeout = setTimeout(() => {
    if (titleInput.value.trim() && editor.textContent.trim()) {
      autoSaveDraft();
    }
  }, 30000);

  clearTimeout(window.backupSaveTimeout);
  window.backupSaveTimeout = setTimeout(() => {
    saveLocalBackup();
  }, 1200);
});

toolbar.addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  e.preventDefault();

  const cmd = e.target.dataset.cmd;
  const value = e.target.dataset.value || null;

  document.execCommand(cmd, false, value);
  editor.focus();
});

function clearEditor() {
  if (titleInput) titleInput.value = "";
  if (editor) editor.innerHTML = "";
  if (category) category.value = "";
  if (mood) mood.value = "";

  const tagsInput = document.getElementById("tags");
  if (tagsInput) tagsInput.value = "";

  if (charCount) charCount.textContent = "0";
  if (wordCount) wordCount.textContent = "0";
  if (readingEst) readingEst.textContent = "0 min";

  const paragraphCount = document.getElementById("paragraphCount");
  if (paragraphCount) paragraphCount.textContent = "0";

  currentEditingPostId = null;
  currentEditingDraftId = null;

  // Reset publish button label when clearing editor
  try { if (publishBtn) { publishBtn.textContent = 'Publish'; publishBtn.removeAttribute('data-editing'); } } catch (e) {}

  const status = document.getElementById("editorStatus");
  if (status) {
    status.classList.remove("saved");
    status.textContent = "⚠️ Unsaved";
  }
  if (lastSavedAt) lastSavedAt.textContent = "Last saved: —";
  updateGoalProgress(0);
}

// ============================================
// Post Operations
// ============================================
publishBtn.addEventListener("click", async () => {
  if (!auth.currentUser) {
    showNotification("⚠️ Please log in to publish.", "error");
    return;
  }

  if (!titleInput.value.trim()) {
    showNotification("⚠️ Please enter a title.", "error");
    return;
  }

  if (!editor.textContent.trim()) {
    showNotification("⚠️ Please write some content.", "error");
    return;
  }

  const { words, minutes } = estimateReadingTime(editor.innerHTML);
  const plainText = editor.innerHTML.replace(/<[^>]*>/g, "");
  const excerpt = plainText.substring(0, 150);

  const postData = {
    title: titleInput.value,
    content: editor.innerHTML,
    excerpt: excerpt,
    authorId: auth.currentUser.uid,
    authorName: currentUserData?.displayName || auth.currentUser.email,
    category: category.value || "Short Story",
    mood: mood.value || "",
    tags: document
      .getElementById("tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status: "published",
    wordCount: words,
    readingTime: minutes,
  };

  try {
    if (currentEditingPostId) {
      // Update existing post
      const ok = await updatePost(currentEditingPostId, postData);
      if (ok) {
        showNotification("✅ Story updated successfully!", "success");
        clearEditor();
        await renderPublished();
      } else {
        showNotification("❌ Failed to update post. Please try again.", "error");
      }
    } else {
      const postId = await createPost(postData);
      if (postId) {
        showNotification("✨ Story published successfully!", "success");
        clearEditor();
        renderPublished();
      } else {
        showNotification("❌ Failed to publish post. Please try again.", "error");
      }
    }
  } catch (error) {
    console.error("Publish error:", error);
    showNotification(`❌ Error: ${error.message}`, "error");
  }
});

saveDraftBtn.addEventListener("click", async () => {
  if (!auth.currentUser) {
    showNotification("⚠️ Please log in to save drafts.", "error");
    return;
  }

  if (!titleInput.value.trim()) {
    showNotification("⚠️ Please enter a title.", "error");
    return;
  }

  await autoSaveDraft();
  showNotification("✅ Draft saved successfully!", "success");
  await renderDrafts();
});

clearBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "🗑️ Clear Editor",
    "Are you sure you want to clear the editor?",
    "Clear",
    "Cancel",
  );
  if (confirmed) clearEditor();
});

// ============================================
// Auto-save Draft
// ============================================
async function autoSaveDraft() {
  if (!auth.currentUser) return;

  const titleValue = titleInput.value.trim();
  const contentValue = editor.textContent.trim();

  if (!titleValue || !contentValue) return;

  const { words, minutes } = estimateReadingTime(editor.innerHTML);
  const plainText = editor.innerHTML.replace(/<[^>]*>/g, "");
  const excerpt = plainText.substring(0, 150);

  const draftData = {
    title: titleValue,
    content: editor.innerHTML,
    excerpt: excerpt,
    category: category.value || "",
    mood: mood.value || "",
    tags: (document.getElementById("tags")?.value || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    wordCount: words,
    readingTime: minutes,
  };

  if (currentEditingDraftId) {
    await updateDraft(currentEditingDraftId, draftData);
  } else {
    const draftId = await saveDraft(auth.currentUser.uid, draftData);
    currentEditingDraftId = draftId;
  }

  const status = document.getElementById("editorStatus");
  if (status) {
    status.classList.add("saved");
    status.textContent = "💾 Saved";
  }
  if (lastSavedAt) {
    lastSavedAt.textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
  }
  saveLocalBackup();
}

// ============================================
// Render Posts
// ============================================
async function renderPublished() {
  try {
    if (!auth.currentUser) return;

    const publishedPostsEl = document.getElementById("publishedPosts");
    if (!publishedPostsEl) {
      console.error("publishedPosts element not found");
      return;
    }

    const searchTerm = (
      document.getElementById("searchPublished")?.value || ""
    ).toLowerCase();
    const categoryFilter =
      document.getElementById("filterPublishedCategory")?.value || "";

    let posts = await getUserPosts(auth.currentUser.uid, "published");

    posts = posts.filter(
      (p) =>
        (!categoryFilter || p.category === categoryFilter) &&
        (!searchTerm ||
          (p.title || "").toLowerCase().includes(searchTerm) ||
          (p.excerpt || "").toLowerCase().includes(searchTerm) ||
          (p.tags || []).some((t) =>
            (t || "").toLowerCase().includes(searchTerm),
          )),
    );

    if (posts.length === 0) {
      publishedPostsEl.innerHTML = `<p style="text-align:center;color:var(--secondary);padding:40px 20px">${LANGS[currentLang].noPublished}</p>`;
      return;
    }

    publishedPostsEl.innerHTML = posts
      .map((p) => {
        const categoryIcon =
          p.category === "Novel" ? "📖" : p.category === "Poem" ? "✍️" : "📝";
        const tagsHTML =
          (p.tags || []).length > 0
            ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
            ${p.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
          </div>`
            : "";

            const previewContent = getPreviewText(p.content, 7);
        const metaInfo = `
        <span>${new Date(p.publishedAt?.toDate?.() || new Date()).toLocaleDateString()}</span>
        ${p.category ? `<span class="postMoodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${categoryIcon} ${p.category}</span>` : ""}
        <span class="postMoodTag" style="background:rgba(230,57,70,0.15);color:#e63946">${p.mood || "No mood"}</span>
        <span>⏱️ ${p.readingTime || 1} min</span>
      `;

        return `
        <div class="postCard">
          <div class="postCardHeader">
            <h3 class="postCardTitle">${p.title}</h3>
            <div style="display:flex;gap:8px">
              <span style="font-size:12px;color:var(--secondary)">👁️ ${p.views || 0}</span>
              <span style="font-size:12px;color:var(--secondary)">❤️ ${p.likes || 0}</span>
              <span style="font-size:12px;color:var(--secondary)">💬 ${p.comments || 0}</span>
            </div>
          </div>
          <div class="postCardMeta">
            ${metaInfo}
          </div>
          ${tagsHTML}
          <div class="postCardPreview">
            ${previewContent}
          </div>
          <button class="moreBtn" data-post-id="${p.id}" data-title="${(p.title || "").replace(/"/g, "&quot;")}" data-content="${(p.content || "").replace(/"/g, "&quot;")}" data-meta="${metaInfo.replace(/"/g, "&quot;")}">${LANGS[currentLang].more}</button>
          <div class="postCardActions">
            <button class="postActionBtn" data-action="edit" data-post-id="${p.id}">${LANGS[currentLang].edit}</button>
            <button class="postActionBtn" data-action="delete" data-post-id="${p.id}">${LANGS[currentLang].delete}</button>
          </div>
        </div>
      `;
      })
      .join("");

    // Add event delegation for More and action buttons
    publishedPostsEl.addEventListener("click", (e) => {
      const t = e.target;
      if (t.classList.contains("moreBtn")) {
        const postId = t.dataset.postId;
        const title = t.dataset.title || "Untitled";
        const content = t.dataset.content || "";
        const meta = t.dataset.meta || "";
        showFullPost(postId, title, content, meta);
        return;
      }

      if (t.classList.contains('postActionBtn')) {
        const action = t.dataset.action;
        const id = t.dataset.postId;
        if (action === 'edit') {
          window.editPost && window.editPost(id);
        } else if (action === 'delete') {
          window.deletePost && window.deletePost(id);
        }
      }
    });
  } catch (error) {
    console.error("Error rendering published posts:", error);
    if (publishedPostsEl) {
      publishedPostsEl.innerHTML =
        '<p style="color:red">Error loading posts. Try refreshing.</p>';
    }
  }
}

async function renderDrafts() {
  if (!auth.currentUser) return;

  const searchTerm = (
    document.getElementById("searchDrafts")?.value || ""
  ).toLowerCase();
  const categoryFilter =
    document.getElementById("filterDraftsCategory")?.value || "";

  let drafts = await getUserDrafts(auth.currentUser.uid);

  drafts = drafts.filter(
    (d) =>
      (!categoryFilter || d.category === categoryFilter) &&
      (!searchTerm ||
        (d.title || "").toLowerCase().includes(searchTerm) ||
        (d.excerpt || "").toLowerCase().includes(searchTerm) ||
        (d.tags || []).some((t) =>
          (t || "").toLowerCase().includes(searchTerm),
        )),
  );

  const draftCountNum = document.getElementById("draftCountNum");
  if (draftCountNum) draftCountNum.textContent = drafts.length;

  if (drafts.length === 0) {
    draftPosts.innerHTML =
      '<p style="text-align:center;color:var(--secondary);padding:40px 20px">No drafts yet. Start writing and save! 📝</p>';
    return;
  }

  draftPosts.innerHTML = drafts
    .map((d) => {
      const tagsHTML =
        (d.tags || []).length > 0
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
            ${d.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
          </div>`
          : "";

      return `
        <div class="postCard">
          <div class="postCardHeader">
            <h3 class="postCardTitle">${d.title}</h3>
            <span style="font-size:12px;color:var(--secondary)">📝 ${new Date(d.autoSavedAt?.toDate?.() || new Date()).toLocaleDateString()}</span>
          </div>
          <div class="postCardMeta">
            <span class="postMoodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${d.mood || "No mood"}</span>
            <span>⏱️ ${d.readingTime || 1} min</span>
          </div>
          ${tagsHTML}
          <div style="margin:12px 0;color:var(--text);font-size:14px;line-height:1.6">
            ${d.excerpt || d.content.substring(0, 150).replace(/<[^>]*>/g, "")}...
          </div>
          <div class="postCardActions">
            <button class="postActionBtn" onclick="loadDraft('${d.id}')">✏️ Continue</button>
            <button class="postActionBtn danger" onclick="deleteDraft('${d.id}')">🗑️ Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// ============================================
// Global Functions (for onclick handlers)
// ============================================
window.editPost = async function (postId) {
  const post = await getPost(postId);
  if (!post) return;

  titleInput.value = post.title;
  editor.innerHTML = post.content;
  category.value = post.category || "";
  mood.value = post.mood || "";
  document.getElementById("tags").value = (post.tags || []).join(", ");

  currentEditingPostId = postId;
  editor.dispatchEvent(new Event("input"));
  tabBtns[0].click();
  try { if (publishBtn) { publishBtn.textContent = 'Update'; publishBtn.setAttribute('data-editing', 'true'); } } catch (e) {}
};

window.deletePost = async function (postId) {
  const confirmed = await showConfirm(
    "⚠️ Delete Story",
    "Are you sure? This action cannot be undone.",
    "Delete",
    "Cancel",
  );
  if (!confirmed) return;

  if (await deletePost(postId)) {
    showNotification("✅ Story deleted successfully!", "success");
    await renderPublished();
  } else {
    showNotification("❌ Failed to delete story.", "error");
  }
};

window.viewPost = function (postId) {
  // Implement full post view modal
  showNotification("📖 Opening post view...", "info");
};

window.loadDraft = async function (draftId) {
  const drafts = await getUserDrafts(auth.currentUser.uid);
  const draft = drafts.find((d) => d.id === draftId);

  if (!draft) return;

  titleInput.value = draft.title;
  editor.innerHTML = draft.content;
  category.value = draft.category || "";
  mood.value = draft.mood || "";
  document.getElementById("tags").value = (draft.tags || []).join(", ");

  currentEditingDraftId = draftId;
  editor.dispatchEvent(new Event("input"));
  tabBtns[0].click();
};

window.deleteDraft = async function (draftId) {
  const confirmed = await showConfirm(
    "🗑️ Delete Draft",
    "Are you sure you want to delete this draft?",
    "Delete",
    "Cancel",
  );
  if (!confirmed) return;

  if (await deleteDraft(draftId)) {
    showNotification("✅ Draft deleted successfully!", "success");
    await renderDrafts();
  } else {
    showNotification("❌ Failed to delete draft.", "error");
  }
};

// ============================================
// Tabs
// ============================================
function saveActiveTab(tabName) {
  sessionStorage.setItem("ahona_active_tab", tabName);
}

function getActiveTab() {
  return sessionStorage.getItem("ahona_active_tab") || "editorTab";
}

function switchToTab(tabName) {
  const btn = document.querySelector(`[data-tab="${tabName}"]`);
  if (btn) btn.click();
}

tabBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const tabName = btn.dataset.tab;
    saveActiveTab(tabName);

    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(tabName).classList.add("active");

    if (tabName === "published") await renderPublished();
    if (tabName === "drafts") await renderDrafts();
    if (tabName === "analytics") await updateAnalytics();
    // Auto-hide hamburger drawer on menu/tab click (mobile UX)
    try {
      const ham = document.getElementById('hamburger');
      const ctr = document.getElementById('controls');
      if (ham) ham.classList.remove('active');
      if (ctr) ctr.classList.remove('active');
    } catch (e) {}
  });
});

// Restore active tab on page load
window.addEventListener("load", () => {
  const activeTab = getActiveTab();
  setTimeout(() => switchToTab(activeTab), 100);
});

const searchPublishedInput = document.getElementById("searchPublished");
const filterPublishedCategory = document.getElementById(
  "filterPublishedCategory",
);
const searchDraftsInput = document.getElementById("searchDrafts");
const filterDraftsCategory = document.getElementById("filterDraftsCategory");

if (searchPublishedInput) {
  searchPublishedInput.addEventListener("input", renderPublished);
}
if (filterPublishedCategory) {
  filterPublishedCategory.addEventListener("change", renderPublished);
}
if (searchDraftsInput) {
  searchDraftsInput.addEventListener("input", renderDrafts);
}
if (filterDraftsCategory) {
  filterDraftsCategory.addEventListener("change", renderDrafts);
}

// ============================================
// Analytics
// ============================================
async function updateAnalytics() {
  if (!auth.currentUser) return;

  const analytics = await getAnalytics(auth.currentUser.uid);
  const drafts = await getUserDrafts(auth.currentUser.uid);

  if (!analytics) {
    const analyticsContent = document.getElementById("analyticsContent");
    if (analyticsContent) {
      analyticsContent.innerHTML =
        '<p style="color:var(--secondary)">Failed to load analytics</p>';
    }
    return;
  }

  document.getElementById("totalPosts").textContent = analytics.totalPosts;
  const totalDraftsEl = document.getElementById("totalDrafts");
  if (totalDraftsEl) totalDraftsEl.textContent = drafts.length;
  document.getElementById("totalLikes").textContent = analytics.totalLikes;
  document.getElementById("totalComments").textContent =
    analytics.totalComments;
  document.getElementById("totalReaders").textContent = analytics.totalViews;
  document.getElementById("avgReadingTime").textContent =
    analytics.avgReadingTime + " min";
}

// ============================================
// Profile
// ============================================
profileBtn.addEventListener("click", async () => {
  if (!auth.currentUser || !currentUserData) return;

  const displayNameValue =
    currentUserData.displayName || auth.currentUser.email?.split("@")[0] || "";
  const usernameValue =
    currentUserData.username || auth.currentUser.email?.split("@")[0] || "";
  const websiteValue = currentUserData.website || "";
  const twitterValue = currentUserData.twitter || "";
  const instagramValue = currentUserData.instagram || "";
  const writingGoalValue = currentUserData.writingGoal || 500;
  const isDarkModeActive = document.body.classList.contains("dark");
  const themeValue = isDarkModeActive ? "dark" : "light";
  const notifyValue = currentUserData.settings?.notifications ?? true;
  const initials = displayNameValue
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const fallbackAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%23e63946'/><stop offset='1' stop-color='%23457b9d'/></linearGradient></defs><rect width='200' height='200' rx='100' fill='url(%23g)'/><text x='50%' y='54%' text-anchor='middle' fill='white' font-family='Segoe UI' font-size='72' font-weight='700'>${initials || "AI"}</text></svg>`;
  const profilePic = currentUserData.profilePic || fallbackAvatar;

  profileContent.innerHTML = `
    <div class="profileHero">
      <img class="profileAvatar" id="profileAvatarImg" src="${profilePic}" alt="Profile" />
      <div class="profileHeroInfo">
        <h4>${displayNameValue}</h4>
        <p>${auth.currentUser.email}</p>
        <p>Member since: ${new Date(currentUserData.createdAt?.toDate?.() || new Date()).toLocaleDateString()}</p>
      </div>
    </div>

    <div class="profileSections">
      <div class="profileSection">
        <h4>👤 Profile Information</h4>
        <div class="profileInfoRow">
          <span class="profileInfoLabel">Display Name</span>
          <span class="profileInfoValue">${displayNameValue}</span>
        </div>
        <div class="profileInfoRow">
          <span class="profileInfoLabel">Username</span>
          <span class="profileInfoValue">${usernameValue}</span>
        </div>
        <div class="profileInfoRow">
          <span class="profileInfoLabel">Writing Goal</span>
          <span class="profileInfoValue pill">${writingGoalValue} words</span>
        </div>
        <div class="profileStats" style="margin-top:12px;">
          <div class="profileStatCard"><strong id="profileTotalPosts">—</strong><span>Posts</span></div>
          <div class="profileStatCard"><strong id="profileTotalLikes">—</strong><span>Likes</span></div>
          <div class="profileStatCard"><strong id="profileTotalViews">—</strong><span>Views</span></div>
        </div>
      </div>

      <div class="profileSection">
        <h4>🖼️ Profile Photo</h4>
        <div class="profileAvatarActions">
          <input id="profilePicInput" type="file" accept="image/*" />
          <button id="uploadProfilePic" class="btnSecondary">📤 Upload</button>
          <button id="deleteProfilePic" class="btnDanger" style="margin-left:8px;">🗑️ Delete</button>
        </div>
      </div>

      <div class="profileSection">
        <h4>✏️ Edit Profile</h4>
        <form id="editProfileForm">
          <div class="profileFormGrid">
            <div class="formGroup">
              <label for="editDisplayName">Display Name</label>
              <input type="text" id="editDisplayName" value="${displayNameValue}" />
            </div>
            <div class="formGroup">
              <label for="editUsername">Username</label>
              <input type="text" id="editUsername" value="${usernameValue}" />
            </div>
          </div>
          <div class="formGroup">
            <label for="editBio">Bio</label>
            <textarea id="editBio" rows="3" placeholder="Tell us about yourself...">${currentUserData.bio || ""}</textarea>
          </div>
          <div class="profileFormGrid">
            <div class="formGroup">
              <label for="editWebsite">Website</label>
              <input type="url" id="editWebsite" value="${websiteValue}" placeholder="https://" />
            </div>
            <div class="formGroup">
              <label for="editGoal">Writing Goal (words)</label>
              <input type="number" id="editGoal" min="50" step="50" value="${writingGoalValue}" />
            </div>
          </div>
          <div class="profileActions">
            <button type="submit" class="btnPrimary">💾 Save Profile</button>
          </div>
        </form>
      </div>

      <div class="profileSection">
        <h4>🔗 Social Links</h4>
        <div class="linkRow">
          <input id="editTwitter" type="url" placeholder="Twitter URL" value="${twitterValue}" />
        </div>
        <div class="linkRow">
          <input id="editInstagram" type="url" placeholder="Instagram URL" value="${instagramValue}" />
        </div>
        <div class="profileActions">
          <button id="saveSocial" class="btnSecondary">🔗 Save Links</button>
        </div>
      </div>

      <div class="profileSection">
        <h4>⚙️ Preferences</h4>
        <label class="profileToggle">
          <span>Dark Mode</span>
          <input id="prefTheme" type="checkbox" ${currentUserData?.settings?.theme === "dark" ? "checked" : ""} />
          <span class="switch"></span>
        </label>
        <label class="profileToggle">
          <span>Notifications</span>
          <input id="prefNotify" type="checkbox" ${notifyValue ? "checked" : ""} />
          <span class="switch"></span>
        </label>
      </div>

      <div class="profileSection">
        <h4>📤 Export Data</h4>
        <div class="profileActions">
          <button id="exportPosts" class="btnSecondary">📄 Export Posts</button>
          <button id="exportPostsJson" class="btnSecondary">🧾 Export JSON</button>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("editProfileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const displayName = document.getElementById("editDisplayName").value;
      const username = document.getElementById("editUsername").value;
      const bio = document.getElementById("editBio").value;
      const website = document.getElementById("editWebsite").value;
      const writingGoal = Number(
        document.getElementById("editGoal").value || 500,
      );

      if (
        await updateUserProfile(auth.currentUser.uid, {
          displayName,
          username,
          bio,
          website,
          writingGoal,
        })
      ) {
        showNotification("✅ Profile updated!", "success");
        currentUserData = await getUserData(auth.currentUser.uid);
        updateTopBarAvatar();
        updateWritingGoalFromDatabase();
      }
    });

  document.getElementById("saveSocial").addEventListener("click", async (e) => {
    e.preventDefault();
    const twitter = document.getElementById("editTwitter").value;
    const instagram = document.getElementById("editInstagram").value;
    if (await updateUserProfile(auth.currentUser.uid, { twitter, instagram })) {
      showNotification("✅ Social links saved!", "success");
      currentUserData = await getUserData(auth.currentUser.uid);
    }
  });

  const uploadBtn = document.getElementById("uploadProfilePic");
  const profilePicInput = document.getElementById("profilePicInput");
  const avatarImg = document.getElementById("profileAvatarImg");
  const deleteBtn = document.getElementById("deleteProfilePic");
  if (profilePicInput) {
    profilePicInput.addEventListener("change", () => {
      const file = profilePicInput.files?.[0];
      if (!file) return;
      if (profilePicPreviewUrl) URL.revokeObjectURL(profilePicPreviewUrl);
      profilePicPreviewUrl = URL.createObjectURL(file);
      if (avatarImg) avatarImg.src = profilePicPreviewUrl;
    });
  }
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
      const file = profilePicInput?.files?.[0];
      if (!file) {
        showNotification("Please choose a photo.", "info");
        return;
      }
      const url = await uploadProfilePicture(auth.currentUser.uid, file);
      if (url) {
        showNotification("✅ Profile photo updated!", "success");
        currentUserData = await getUserData(auth.currentUser.uid);
        updateTopBarAvatar();
        if (avatarImg) avatarImg.src = url;
      }
    });
  }
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm('🗑️ Delete Photo', 'Are you sure you want to delete your profile photo?', 'Delete', 'Cancel');
      if (!confirmed) return;
      try {
        const ok = await deleteProfilePicture(auth.currentUser.uid);
        if (ok) {
          showNotification('✅ Profile photo deleted', 'success');
          currentUserData = await getUserData(auth.currentUser.uid);
          updateTopBarAvatar();
          if (avatarImg) avatarImg.src = currentUserData.profilePic || fallbackAvatar;
        } else {
          showNotification('❌ Failed to delete profile photo', 'error');
        }
      } catch (err) {
        console.error('Delete profile pic error:', err);
        showNotification('❌ Error deleting photo', 'error');
      }
    });
  }

  const prefNotify = document.getElementById("prefNotify");
  const prefTheme = document.getElementById("prefTheme");

  if (prefTheme) {
    // Initialize checkbox based on effective theme (localStorage -> server -> default)
    let effective = 'dark';
    try {
      const stored = localStorage.getItem('ahona_theme');
      if (stored === 'light' || stored === 'dark') effective = stored;
      else if (currentUserData?.settings?.theme) effective = currentUserData.settings.theme === 'light' ? 'light' : 'dark';
    } catch (e) { effective = currentUserData?.settings?.theme === 'light' ? 'light' : 'dark'; }

    prefTheme.checked = effective === 'dark';
    prefTheme.disabled = false;

    prefTheme.addEventListener('change', async () => {
      const newTheme = prefTheme.checked ? 'dark' : 'light';
      // Apply immediately
      if (newTheme === 'dark') {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
      updateThemeBtn();
      try { localStorage.setItem('ahona_theme', newTheme); } catch (e) {}

      // Persist to server
      if (currentUserData && auth?.currentUser) {
        try {
          await updateUserProfile(auth.currentUser.uid, {
            settings: { ...(currentUserData.settings || {}), theme: newTheme },
          });
          if (!currentUserData.settings) currentUserData.settings = {};
          currentUserData.settings.theme = newTheme;
        } catch (err) {
          console.error('Error saving theme preference:', err);
        }
      }

      try { showNotification(newTheme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success'); } catch (e) {}
    });
  }

  if (prefNotify) {
    prefNotify.addEventListener("change", async () => {
      await updateUserProfile(auth.currentUser.uid, {
        settings: {
          ...(currentUserData.settings || {}),
          notifications: prefNotify.checked,
        },
      });
    });
  }

  const exportJsonBtn = document.getElementById("exportPostsJson");
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", async () => {
      const posts = await getUserPosts(auth.currentUser.uid, "published");
      const payload = JSON.stringify(posts, null, 2);
      downloadFile("posts.json", payload, "application/json");
    });
  }

  const exportPostsBtn = document.getElementById("exportPosts");
  if (exportPostsBtn) {
    exportPostsBtn.addEventListener("click", async () => {
      const posts = await getUserPosts(auth.currentUser.uid, "published");
      const rows = posts.map((p) => [
        p.title,
        p.category,
        p.mood,
        p.readingTime || 1,
        p.views || 0,
        p.likes || 0,
        p.comments || 0,
        new Date(p.publishedAt?.toDate?.() || new Date()).toISOString(),
      ]);
      const header =
        "Title,Category,Mood,ReadingTime,Views,Likes,Comments,PublishedAt";
      const csv = [
        header,
        ...rows.map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");
      downloadFile("posts.csv", csv, "text/csv");
    });
  }

  const analytics = await getAnalytics(auth.currentUser.uid);
  if (analytics) {
    document.getElementById("profileTotalPosts").textContent =
      analytics.totalPosts;
    document.getElementById("profileTotalLikes").textContent =
      analytics.totalLikes;
    document.getElementById("profileTotalViews").textContent =
      analytics.totalViews;
  }

  profileModal.classList.remove("hidden");
});

closeProfile.addEventListener("click", () => {
  profileModal.classList.add("hidden");
  if (profilePicPreviewUrl) {
    URL.revokeObjectURL(profilePicPreviewUrl);
    profilePicPreviewUrl = null;
  }
});

if (closeFullPost) {
  closeFullPost.addEventListener("click", () => {
    fullPostModal.classList.add("hidden");
  });
}

// ============================================
// Logout
// ============================================
logoutBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "👋 Log Out",
    "Are you sure you want to log out?",
    "Log Out",
    "Cancel",
  );

  if (confirmed) {
    await logoutUser();
    showNotification("👋 Logged out successfully!", "success");
    // Don't reload, let Firebase auth state handle the redirect
    setTimeout(() => {
      // Just hide the main UI and show auth modal
      if (mainContainer) mainContainer.style.display = "none";
      if (authModal) authModal.classList.remove("hidden");
    }, 500);
  }
});

// ============================================
// Confirm Dialog
// ============================================
confirmOk.addEventListener("click", () => {
  confirmModal.classList.add("hidden");
  if (confirmCallback) confirmCallback(true);
  confirmCallback = null;
});

confirmCancel.addEventListener("click", () => {
  confirmModal.classList.add("hidden");
  if (confirmCallback) confirmCallback(false);
  confirmCallback = null;
});

// ============================================
// Profile Avatar
// ============================================
function updateTopBarAvatar() {
  if (!currentUserData?.profilePic) return;

  if (!profileBtn.querySelector(".topBarAvatar")) {
    const avatarImg = document.createElement("img");
    avatarImg.className = "topBarAvatar";
    avatarImg.src = currentUserData.profilePic;
    avatarImg.style.width = "32px";
    avatarImg.style.height = "32px";
    avatarImg.style.borderRadius = "50%";
    avatarImg.style.objectFit = "cover";
    profileBtn.innerHTML = "";
    profileBtn.appendChild(avatarImg);
  }
}

// ============================================
// Hamburger Menu
// ============================================
const hamburger = document.getElementById("hamburger");
const controls = document.getElementById("controls");

if (hamburger && controls) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    controls.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !controls.contains(e.target)) {
      hamburger.classList.remove("active");
      controls.classList.remove("active");
    }
  });
}

if (previewBtn) {
  previewBtn.addEventListener("click", openPreview);
}

if (closePreview) {
  closePreview.addEventListener("click", () => {
    previewModal.classList.add("hidden");
  });
}

if (previewModal) {
  previewModal.addEventListener("click", (e) => {
    if (e.target === previewModal) {
      previewModal.classList.add("hidden");
    }
  });
}

if (exportHtmlBtn) {
  exportHtmlBtn.addEventListener("click", () => {
    const title = titleInput.value.trim() || "untitled";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${editor.innerHTML}</body></html>`;
    downloadFile(`${title}.html`, html, "text/html");
  });
}

if (exportTextBtn) {
  exportTextBtn.addEventListener("click", () => {
    const title = titleInput.value.trim() || "untitled";
    downloadFile(`${title}.txt`, editor.textContent || "", "text/plain");
  });
}

if (restoreBackupBtn) {
  restoreBackupBtn.addEventListener("click", restoreLocalBackup);
}

if (wordGoalInput) {
  // Goal is loaded from database via updateWritingGoalFromDatabase()
  wordGoalInput.addEventListener("input", async () => {
    const words = editor.textContent.trim().split(/\s+/).filter(Boolean).length;
    updateGoalProgress(words);

    // Save goal to Firebase database
    if (auth.currentUser) {
      try {
        await updateUserProfile(auth.currentUser.uid, {
          writingGoal: Number(wordGoalInput.value || 500),
        });
        currentUserData = await getUserData(auth.currentUser.uid);
      } catch (e) {
        console.error("Goal save error:", e);
      }
    }
  });
}

// ============================================
// Update Goal from Database
// ============================================
function updateWritingGoalFromDatabase() {
  if (currentUserData?.writingGoal && wordGoalInput) {
    wordGoalInput.value = currentUserData.writingGoal;
    const words = editor.textContent.trim().split(/\s+/).filter(Boolean).length;
    updateGoalProgress(words);
  }
}

if (templateSelect) {
  const templates = {
    poem: `<p>Line 1...</p><p>Line 2...</p><p>Line 3...</p>`,
    shortStory: `<h3>Hook</h3><p>Introduce the main conflict...</p><h3>Middle</h3><p>Build tension and stakes...</p><h3>Ending</h3><p>Resolve the story with impact...</p>`,
    novel: `<h2>Chapter Title</h2><p>Set the scene and establish tone...</p><p>Introduce a key character moment...</p>`,
    loveLetter: `<p>Dear ___,</p><p>Today I want to tell you...</p><p>Forever yours,</p><p>___</p>`,
  };

  templateSelect.addEventListener("change", () => {
    const value = templateSelect.value;
    if (!value) return;
    const html = templates[value] || "";
    if (html) {
      editor.focus();
      document.execCommand("insertHTML", false, html);
      editor.dispatchEvent(new Event("input"));
    }
    templateSelect.value = "";
  });
}

document.addEventListener("keydown", (e) => {
  const isCmd = e.ctrlKey || e.metaKey;
  if (!isCmd) return;

  const key = e.key.toLowerCase();
  if (key === "s") {
    e.preventDefault();
    autoSaveDraft();
    showNotification("💾 Draft saved", "success");
  }
  if (key === "enter") {
    e.preventDefault();
    publishBtn?.click();
  }
  if (key === "p") {
    e.preventDefault();
    openPreview();
  }
});

// ============================================
// Authentication Form Handler
// ============================================
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.querySelector(".authSubtitle");
const authUsernameInput = document.getElementById("authUsername");
const authPasswordInput = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmit");

let isRegisterMode = false;

// Get toggle elements from HTML
const authToggleText = document.getElementById("authToggleText");
const authToggleLink = document.getElementById("authToggleLink");

function updateAuthForm() {
  const labelElement = document.querySelector('label[for="authUsername"]');

  if (isRegisterMode) {
    authTitle.textContent = "🎉 Create Admin Account";
    authSubtitle.textContent = "Register your first admin account";
    if (labelElement) labelElement.textContent = "📧 Email";
    authUsernameInput.type = "email";
    authUsernameInput.placeholder = "Enter your email";
    authSubmitBtn.textContent = "Register ✨";
    if (authToggleText) authToggleText.textContent = "Already have an account?";
    if (authToggleLink) authToggleLink.textContent = "Login here";
  } else {
    authTitle.textContent = "🔐 Admin Login";
    authSubtitle.textContent = "Access admin panel";
    if (labelElement) labelElement.textContent = "📧 Email";
    authUsernameInput.type = "email";
    authUsernameInput.placeholder = "Enter your email";
    authSubmitBtn.textContent = "Sign In ✨";
    if (authToggleText) authToggleText.textContent = "Don't have an account?";
    if (authToggleLink) authToggleLink.textContent = "Register here";
  }
}

// Handle toggle link click
if (authToggleLink) {
  authToggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    updateAuthForm();
  });
}

// Handle auth form submission
if (authForm) {
  // Initial setup
  updateAuthForm();

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = authUsernameInput.value.trim();
    const password = authPasswordInput.value;

    console.log("Auth attempt:", { email, isRegisterMode });

    if (!email || !password) {
      showAlert("Please fill in all fields", "warning");
      return;
    }

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isRegisterMode
      ? "Registering..."
      : "Signing in...";

    try {
      let user;
      if (isRegisterMode) {
        // Register new user
        console.log("Registering user...");
        user = await registerUser(email, password, email.split("@")[0]);
        console.log("Registration success:", user.uid);
        showAlert("Account created successfully!", "success");
      } else {
        // Login existing user
        console.log("Logging in user...");
        user = await loginUser(email, password);
        console.log("Login success:", user.uid);
        showAlert("Welcome back!", "success");
      }

      // Immediately update UI with current user
      if (user) {
        console.log("Getting user data for:", user.uid);
        try {
          const userData = await getUserData(user.uid);
          console.log("User data retrieved:", userData);
          if (userData) {
            currentUserData = userData;
          } else {
            // If no user data found, create minimal user data
            console.log("No user data found, creating minimal data");
            currentUserData = {
              uid: user.uid,
              email: user.email,
              displayName: email.split("@")[0],
              profilePic: "",
            };
          }
        } catch (err) {
          console.error("Error getting user data:", err);
          currentUserData = {
            uid: user.uid,
            email: user.email,
            displayName: email.split("@")[0],
            profilePic: "",
          };
        }

        // Update UI
        console.log("Updating UI...");
        updateAuthUI();
        updateTopBarAvatar();
      }

      // Clear form
      authForm.reset();
    } catch (error) {
      console.error("Auth error:", error);
      showAlert(error.message || "Authentication failed", "error");
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isRegisterMode ? "Register ✨" : "Sign In ✨";
    }
  });
}

// ============================================
// Initialize
// ============================================
// Don't load theme here - it will be loaded after user data is fetched
// Only switch to saved tab if it's not the default editor tab
const savedTab = getActiveTab();
if (savedTab !== "editorTab") {
  const writeTabBtn = document.querySelector(`.tabBtn[data-tab="${savedTab}"]`);
  if (writeTabBtn) {
    setTimeout(() => writeTabBtn.click(), 100);
  }
}
