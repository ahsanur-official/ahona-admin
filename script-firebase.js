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
  createPost,
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
const editor = document.getElementById("editor");
const titleInput = document.getElementById("title");
const category = document.getElementById("category");
const mood = document.getElementById("mood");
const readingEst = document.getElementById("readingEst");
const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");
const publishBtn = document.getElementById("publish");
const saveDraftBtn = document.getElementById("saveDraft");
const clearBtn = document.getElementById("clear");
const previewBtn = document.getElementById("preview");
const toggleTheme = document.getElementById("toggleTheme");
const profileBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserName = document.getElementById("currentUserName");
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

// ============================================
// Theme Management
// ============================================
function loadTheme() {
  const isDark = localStorage.getItem("ahona_dark_mode") === "true";
  if (isDark) document.body.classList.add("dark");
  updateThemeBtn();
}

function updateThemeBtn() {
  toggleTheme.textContent = document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";
}

toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("ahona_dark_mode", isDark);
  updateThemeBtn();
});

// ============================================
// Auth UI
// ============================================
function updateAuthUI() {
  const user = auth.currentUser;
  const mainContainer = document.getElementById("mainContainer");
  const authModal = document.getElementById("authModal");

  if (user && currentUserData) {
    currentUserName.textContent = currentUserData.displayName || user.email;
    profileBtn.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
    if (mainContainer) mainContainer.style.display = "block";
    if (authModal) authModal.classList.add("hidden");
  } else {
    currentUserName.textContent = "";
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
      showAlert("⚠️ Admin Panel is restricted. Only authorized admin can access.", "error");
      await logoutUser();
      return;
    }
    
    try {
      const userData = await getUserData(firebaseUser.uid);
      console.log("Admin data loaded:", userData?.displayName);
      
      if (userData) {
        currentUserData = userData;
      } else {
        // If no user data, create minimal data
        currentUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: "Ahona Islam",
          profilePic: "",
        };
        console.log("Created admin data");
      }
      
      updateAuthUI();
      updateTopBarAvatar();
      
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
function estimateReadingTime(html) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  const words = text.trim().split(/\s+/).filter(Boolean).length || 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

function showConfirm(title, message, okText = "Confirm", cancelText = "Cancel") {
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

  const status = document.getElementById("editorStatus");
  status.classList.remove("saved");
  status.textContent = "⚠️ Unsaved";

  clearTimeout(window.autoSaveTimeout);
  window.autoSaveTimeout = setTimeout(() => {
    if (titleInput.value.trim() && editor.textContent.trim()) {
      autoSaveDraft();
    }
  }, 30000);
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

  const status = document.getElementById("editorStatus");
  if (status) {
    status.classList.remove("saved");
    status.textContent = "⚠️ Unsaved";
  }
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
    const postId = await createPost(postData);
    
    if (postId) {
      showNotification("✨ Story published successfully!", "success");
      clearEditor();
      renderPublished();
    } else {
      showNotification("❌ Failed to publish post. Please try again.", "error");
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
    "Cancel"
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
          (p.tags || []).some((t) => (t || "").toLowerCase().includes(searchTerm)))
    );

    if (posts.length === 0) {
      publishedPostsEl.innerHTML =
        '<p style="text-align:center;color:var(--secondary);padding:40px 20px">No published stories yet. Start writing! ✍️</p>';
      return;
    }

    publishedPostsEl.innerHTML = posts
      .map((p) => {
        const categoryIcon =
        p.category === "Novel"
          ? "📖"
          : p.category === "Poem"
            ? "✍️"
            : "📝";
      const tagsHTML =
        (p.tags || []).length > 0
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
            ${p.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
          </div>`
          : "";

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
            <span>${new Date(p.publishedAt?.toDate?.() || new Date()).toLocaleDateString()}</span>
            ${p.category ? `<span class="postMoodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${categoryIcon} ${p.category}</span>` : ""}
            <span class="postMoodTag" style="background:rgba(230,57,70,0.15);color:#e63946">${p.mood || "No mood"}</span>
            <span>⏱️ ${p.readingTime || 1} min</span>
          </div>
          ${tagsHTML}
          <div style="margin:12px 0;color:var(--text);font-size:14px;line-height:1.6">
            ${p.excerpt || p.content.substring(0, 150).replace(/<[^>]*>/g, "")}...
          </div>
          <div class="postCardActions">
            <button class="postActionBtn" onclick="editPost('${p.id}')">✏️ Edit</button>
            <button class="postActionBtn" onclick="deletePost('${p.id}')">🗑️ Delete</button>
            <button class="postActionBtn" onclick="viewPost('${p.id}')">👁️ View</button>
          </div>
        </div>
      `;
    })
    .join("");
  } catch (error) {
    console.error("Error rendering published posts:", error);
    if (publishedPosts) {
      publishedPosts.innerHTML = '<p style="color:red">Error loading posts. Try refreshing.</p>';
    }
  }
}

async function renderDrafts() {
  if (!auth.currentUser) return;

  const searchTerm = (
    document.getElementById("searchDrafts")?.value || ""
  ).toLowerCase();

  let drafts = await getUserDrafts(auth.currentUser.uid);

  drafts = drafts.filter(
    (d) =>
      !searchTerm ||
      (d.title || "").toLowerCase().includes(searchTerm) ||
      (d.excerpt || "").toLowerCase().includes(searchTerm) ||
      (d.tags || []).some((t) => (t || "").toLowerCase().includes(searchTerm))
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
};

window.deletePost = async function (postId) {
  const confirmed = await showConfirm(
    "⚠️ Delete Story",
    "Are you sure? This action cannot be undone.",
    "Delete",
    "Cancel"
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
    "Cancel"
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
tabBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const tabName = btn.dataset.tab;

    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(tabName).classList.add("active");

    if (tabName === "published") await renderPublished();
    if (tabName === "drafts") await renderDrafts();
    if (tabName === "analytics") await updateAnalytics();
  });
});

// ============================================
// Analytics
// ============================================
async function updateAnalytics() {
  if (!auth.currentUser) return;

  const analytics = await getAnalytics(auth.currentUser.uid);

  if (!analytics) {
    document.getElementById("analyticsContent").innerHTML =
      '<p style="color:var(--secondary)">Failed to load analytics</p>';
    return;
  }

  document.getElementById("totalPosts").textContent = analytics.totalPosts;
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
profileBtn.addEventListener("click", () => {
  if (!auth.currentUser || !currentUserData) return;

  profileContent.innerHTML = `
    <div class="profileSection">
      <h4>👤 Profile Information</h4>
      <p><strong>Email:</strong> ${auth.currentUser.email}</p>
      <p><strong>Display Name:</strong> ${currentUserData.displayName || "Not set"}</p>
      <p><strong>Username:</strong> ${currentUserData.username}</p>
      <p><strong>Member Since:</strong> ${new Date(currentUserData.createdAt?.toDate?.() || new Date()).toLocaleDateString()}</p>
    </div>

    <div class="profileSection">
      <h4>✏️ Edit Profile</h4>
      <form id="editProfileForm">
        <div class="formGroup">
          <label for="editDisplayName">Display Name</label>
          <input type="text" id="editDisplayName" value="${currentUserData.displayName || ""}" />
        </div>
        <div class="formGroup">
          <label for="editBio">Bio</label>
          <textarea id="editBio" rows="3" placeholder="Tell us about yourself...">${currentUserData.bio || ""}</textarea>
        </div>
        <button type="submit" class="btnPrimary">💾 Save Profile</button>
      </form>
    </div>

    <div class="profileSection">
      <h4>📤 Export Data</h4>
      <button id="exportPosts" class="btnSecondary">📄 Export Posts</button>
    </div>
  `;

  document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = document.getElementById("editDisplayName").value;
    const bio = document.getElementById("editBio").value;

    if (await updateUserProfile(auth.currentUser.uid, { displayName, bio })) {
      showNotification("✅ Profile updated!", "success");
      currentUserData = await getUserData(auth.currentUser.uid);
    }
  });

  profileModal.classList.remove("hidden");
});

closeProfile.addEventListener("click", () => {
  profileModal.classList.add("hidden");
});

// ============================================
// Logout
// ============================================
logoutBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "👋 Log Out",
    "Are you sure you want to log out?",
    "Log Out",
    "Cancel"
  );

  if (confirmed) {
    await logoutUser();
    showNotification("👋 Logged out successfully!", "success");
    setTimeout(() => window.location.reload(), 1000);
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
    authSubmitBtn.textContent = isRegisterMode ? "Registering..." : "Signing in...";
    
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
loadTheme();
const writeTabBtn = document.querySelector('.tabBtn[data-tab="editor"]');
if (writeTabBtn) writeTabBtn.click();
