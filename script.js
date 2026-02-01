// ============================================
// Import Firebase Config & Functions
// ============================================
import {
  auth,
  db,
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChange,
  getUserData,
  updateUserProfile,
  uploadProfilePicture,
  createPost,
  getUserPosts,
  getPost,
  updatePost,
  deletePost,
  publishPost,
  saveDraft,
  updateDraft,
  getUserDrafts,
  deleteDraft,
  getAnalytics,
  addComment,
  getPostComments,
  likePost,
  unlikePost,
  isPostLikedByUser,
  getPublishedPosts,
  incrementViewCount,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDoc,
  updateDoc,
} from "../firebase-config.js";

// Admin Panel - Full-Featured Post Management
// Vanilla JS - admin interface with publish, edit, delete, drafts, analytics

const SETTINGS_KEY = "diary_settings_v1";

// DOM Elements
const postImageInput = document.getElementById("postImage");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const editor = document.getElementById("editorArea");
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

// Custom confirm dialog
let confirmCallback = null;

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

// Close confirm modal on overlay click
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) {
    confirmModal.classList.add("hidden");
    if (confirmCallback) confirmCallback(false);
    confirmCallback = null;
  }
});

// Storage helpers - Removed localStorage, using Firebase instead
function loadJSON(key) {
  // All data is now stored in Firebase - returning empty object
  return {};
}
function saveJSON(key, val) {
  // All data is now stored in Firebase - no localStorage usage
}

// Update UI on load
function updateTopBarAvatar() {
  const user = currentUser();
  if (!user) return;

  if (user.profilePic) {
    if (!profileBtn.querySelector(".topBarAvatar")) {
      const avatarImg = document.createElement("img");
      avatarImg.className = "topBarAvatar";
      avatarImg.src = user.profilePic;
      avatarImg.alt = "Profile";
      avatarImg.style.cssText = "width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-primary);margin-right:8px";
      profileBtn.innerHTML = "";
      profileBtn.appendChild(avatarImg);
    } else {
      profileBtn.querySelector(".topBarAvatar").src = user.profilePic;
    }
  } else {
    if (profileBtn.querySelector(".topBarAvatar")) {
      profileBtn.innerHTML = "👤 Profile";
    }
  }
}

function updateAuthUI() {
  const user = currentUser();
  const mainContainer = document.getElementById("mainContainer");
  const authModal = document.getElementById("authModal");
  const topBar = document.getElementById("topBar");
  const blurOverlay = document.getElementById("blurOverlay");

  if (user) {
    currentUserName.textContent = user.displayName || user.username;
    profileBtn.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
    if (mainContainer) mainContainer.style.display = "block";
    if (topBar) topBar.style.display = "flex";
    if (blurOverlay) blurOverlay.classList.add("hidden");
    authModal.classList.add("hidden");
  } else {
    currentUserName.textContent = "";
    profileBtn.style.display = "none";
    logoutBtn.style.display = "none";
    if (mainContainer) mainContainer.style.display = "block";
    if (topBar) topBar.style.display = "flex";
    if (blurOverlay) blurOverlay.classList.remove("hidden");
    showAuthModal();
  }
}

// Show login modal
function showAuthModal() {
  document.getElementById("authModal").classList.remove("hidden");
}

// Publish post
publishBtn.addEventListener("click", () => {
  const user = currentUser();
  if (!user) {
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


  const posts = loadPosts();
  let imageData = "";
  if (postImageInput && postImageInput.files && postImageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imageData = e.target.result;
      finalizePublish(imageData);
    };
    reader.readAsDataURL(postImageInput.files[0]);
    return; // Wait for FileReader
  } else {
    finalizePublish("");
  }

  function finalizePublish(imageData) {
    const newPost = {
      id: Date.now().toString(),
      title: titleInput.value,
      content: editor.innerHTML,
      date: new Date().toISOString().split("T")[0],
      category: category.value || "Short Story",
      mood: mood.value,
      tags: document
        .getElementById("tags")
        .value.split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: user.username,
      createdAt: Date.now(),
      published: true,
      image: imageData,
    };
    posts.push(newPost);
    savePosts(posts);

    // Remove from drafts if it was a draft
    const drafts = loadDrafts();
    if (drafts[user.username]) {
      drafts[user.username] = drafts[user.username].filter(
        (d) => d.id !== newPost.id,
      );
      saveDrafts(drafts);
    }

    showNotification("✨ Story published successfully!", "success");
    clearEditor();
    // Extra: ensure image input and preview are cleared after publish
    if (postImageInput) postImageInput.value = "";
    if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
    if (imagePreview) imagePreview.src = "";
    renderPublished();
    renderDrafts();
    updateAnalytics();
    refreshAnalyticsIfVisible();
  }

  // Remove from drafts if it was a draft
  const drafts = loadDrafts();
  if (drafts[user.username]) {
    drafts[user.username] = drafts[user.username].filter(
      (d) => d.id !== newPost.id,
    );
    saveDrafts(drafts);
  }

  showNotification("✨ Story published successfully!", "success");
  clearEditor();
  renderPublished();
  renderDrafts();
  updateAnalytics();
  refreshAnalyticsIfVisible();
});

// Save draft
saveDraftBtn.addEventListener("click", () => {
  const user = currentUser();
  if (!user) {
    showNotification("⚠️ Please log in to save drafts.", "error");
    return;
  }

  if (!titleInput.value.trim()) {
    showNotification("⚠️ Please enter a title.", "error");
    return;
  }

  autoSaveDraft();
  showNotification("✅ Draft saved successfully!", "success");
  renderDrafts();
  refreshAnalyticsIfVisible();
});

// Clear editor
clearBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "🗑️ Clear Editor",
    "Are you sure you want to clear the editor? All unsaved content will be lost.",
    "Clear",
    "Cancel",
  );
  if (confirmed) clearEditor();
});

function clearEditor() {
  titleInput.value = "";
  editor.innerHTML = "";
  category.value = "";
  mood.value = "";
  document.getElementById("tags").value = "";
  charCount.textContent = "0";
  wordCount.textContent = "0";
  readingEst.textContent = "0 min";
  document.getElementById("paragraphCount").textContent = "0";
  currentEditingDraftId = null;

  // Clear image preview and input
  if (postImageInput) postImageInput.value = "";
  if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
  if (imagePreview) imagePreview.src = "";

  const status = document.getElementById("editorStatus");
  if (status) {
    status.classList.remove("saved");
    status.textContent = "⚠️ Unsaved";
  }
}

// Preview (show as published list card, not full page)
previewBtn.addEventListener("click", () => {
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
    category.value === "Novel"
      ? "📖"
      : category.value === "Poem"
        ? "✍️"
        : category.value === "Short Story"
          ? "📝"
          : "📝";

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
});

closePreview.addEventListener("click", () => {
  previewModal.classList.add("hidden");
});

// Tabs
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(tabName).classList.add("active");

    if (tabName === "published") renderPublished();
    if (tabName === "drafts") renderDrafts();
    if (tabName === "analytics") updateAnalytics();
  });
});

// Render published posts
function renderPublished() {
  const user = currentUser();
  if (!user) return;

  const searchTerm = (
    document.getElementById("searchPublished")?.value || ""
  ).toLowerCase();
  const categoryFilter =
    document.getElementById("filterPublishedCategory")?.value || "";

  const posts = loadPosts().filter(
    (p) =>
      p.author === user.username &&
      p.published &&
      (!categoryFilter || p.category === categoryFilter) &&
      (!searchTerm ||
        (p.title || "").toLowerCase().includes(searchTerm) ||
        (p.content || "")
          .replace(/<[^>]*>/g, "")
          .toLowerCase()
          .includes(searchTerm) ||
        (p.tags || []).some((t) =>
          (t || "").toLowerCase().includes(searchTerm),
        )),
  );
  // Data loaded from Firebase - using empty objects for now
  const likes = {};
  const comments = {};

  if (posts.length === 0) {
    publishedPosts.innerHTML =
      '<p style="text-align:center;color:var(--secondary);padding:40px 20px">No published stories yet. Start writing! ✍️</p>';
    return;
  }

  publishedPosts.innerHTML = posts
    .map((p) => {
      const postLikes = likes[p.id] || 0;
      const postComments = (comments[p.id] || []).length;
      const tagsHTML =
        (p.tags || []).length > 0
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
      ${p.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
    </div>`
          : "";
      const categoryIcon =
        p.category === "Novel"
          ? "📖"
          : p.category === "Poem"
            ? "✍️"
            : p.category === "Short Story"
              ? "📝"
              : "📝";

      return `
      <div class="postCard">
        ${p.image ? `<div style=\"width:100%;text-align:center;margin-bottom:12px\"><img src=\"${p.image}\" alt=\"Post Image\" style=\"max-width:100%;max-height:180px;border-radius:10px;box-shadow:0 2px 8px #e6394620;\"></div>` : ""}
        <div class="postCardHeader">
          <h3 class="postCardTitle">${p.title}</h3>
          <div style="display:flex;gap:8px">
            <span style="font-size:12px;color:var(--secondary)">❤️ ${postLikes}</span>
            <span style="font-size:12px;color:var(--secondary)">💬 ${postComments}</span>
          </div>
        </div>
        <div class="postCardMeta">
          <span>${new Date(p.date).toLocaleDateString()}</span>
          ${p.category ? `<span class=\"postMoodTag\" style=\"background:rgba(67,123,157,0.15);color:#457b9d\">${categoryIcon} ${p.category}</span>` : ""}
          <span class="postMoodTag" style="background:rgba(230,57,70,0.15);color:#e63946">${p.mood || "No mood"}</span>
          <span>⏱️ ${estimateReadingTime(p.content).minutes} min</span>
        </div>
        ${tagsHTML}
        <div style="margin:12px 0;color:var(--text);font-size:14px;line-height:1.6">
          ${p.content.substring(0, 150).replace(/<[^>]*>/g, "")}...
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
}

// Render drafts
function renderDrafts() {
  const user = currentUser();
  if (!user) return;

  const searchTerm = (
    document.getElementById("searchDrafts")?.value || ""
  ).toLowerCase();
  const categoryFilter =
    document.getElementById("filterDraftsCategory")?.value || "";

  const drafts = loadDrafts();
  const userDrafts = (drafts[user.username] || []).filter(
    (d) =>
      (!categoryFilter || d.category === categoryFilter) &&
      (!searchTerm ||
        (d.title || "").toLowerCase().includes(searchTerm) ||
        (d.content || "")
          .replace(/<[^>]*>/g, "")
          .toLowerCase()
          .includes(searchTerm) ||
        (d.tags || []).some((t) =>
          (t || "").toLowerCase().includes(searchTerm),
        )),
  );

  const draftCountNum = document.getElementById("draftCountNum");
  draftCountNum.textContent = userDrafts.length;

  if (userDrafts.length === 0) {
    draftPosts.innerHTML =
      '<p style="text-align:center;color:var(--secondary);padding:40px 20px">No drafts yet. Start writing and save! 📝</p>';
    return;
  }

  draftPosts.innerHTML = userDrafts
    .map((d) => {
      const tagsHTML =
        (d.tags || []).length > 0
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
      ${d.tags.map((tag) => `<span class="tagBadge">#${tag}</span>`).join("")}
    </div>`
          : "";

      return `
      <div class="postCard">
        ${d.image ? `<div style=\"width:100%;text-align:center;margin-bottom:12px\"><img src=\"${d.image}\" alt=\"Draft Image\" style=\"max-width:100%;max-height:180px;border-radius:10px;box-shadow:0 2px 8px #e6394620;\"></div>` : ""}
        <div class="postCardHeader">
          <h3 class="postCardTitle">${d.title}</h3>
          <span style="font-size:12px;color:var(--secondary)">📝 ${new Date(d.savedAt).toLocaleDateString()}</span>
        </div>
        <div class="postCardMeta">
          <span class="postMoodTag" style="background:rgba(67,123,157,0.15);color:#457b9d">${d.mood || "No mood"}</span>
          <span>⏱️ ${estimateReadingTime(d.content).minutes} min</span>
        </div>
        ${tagsHTML}
        <div style="margin:12px 0;color:var(--text);font-size:14px;line-height:1.6">
          ${d.content.substring(0, 150).replace(/<[^>]*>/g, "")}...
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

// Load draft to editor
function loadDraft(draftId) {
  const user = currentUser();
  if (!user) return;

  const drafts = loadDrafts();
  const draft = (drafts[user.username] || []).find((d) => d.id === draftId);

  if (!draft) return;

  titleInput.value = draft.title;
  editor.innerHTML = draft.content;
  category.value = draft.category || "";
  mood.value = draft.mood;
  document.getElementById("tags").value = (draft.tags || []).join(", ");
  // Show image in preview if present
  if (draft.image && imagePreview && imagePreviewContainer) {
    imagePreview.src = draft.image;
    imagePreviewContainer.style.display = "block";
  } else if (imagePreview && imagePreviewContainer) {
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
  }
  if (postImageInput) postImageInput.value = "";
  editor.dispatchEvent(new Event("input"));
  tabBtns[0].click();
}

// Delete draft
async function deleteDraft(draftId) {
  const user = currentUser();
  if (!user) return;

  const confirmed = await showConfirm(
    "🗑️ Delete Draft",
    "Are you sure you want to delete this draft? This action cannot be undone.",
    "Delete",
    "Cancel",
  );

  if (!confirmed) return;

  const drafts = loadDrafts();
  if (drafts[user.username]) {
    drafts[user.username] = drafts[user.username].filter(
      (d) => d.id !== draftId,
    );
    saveDrafts(drafts);
  }

  showNotification("✅ Draft deleted successfully!", "success");
  renderDrafts();
}

// Delete post
async function deletePost(postId) {
  const confirmed = await showConfirm(
    "⚠️ Delete Story",
    "Are you sure you want to delete this story permanently? This action cannot be undone.",
    "Delete",
    "Cancel",
  );

  if (!confirmed) return;

  let posts = loadPosts();
  posts = posts.filter((p) => p.id !== postId);
  savePosts(posts);

  showNotification("✅ Story deleted successfully!", "success");
  renderPublished();
  updateAnalytics();
  refreshAnalyticsIfVisible();
}

// Edit post (load to editor)
function editPost(postId) {
  const post = loadPosts().find((p) => p.id === postId);
  if (!post) return;

  titleInput.value = post.title;
  editor.innerHTML = post.content;
  category.value = post.category || "";
  mood.value = post.mood;
  document.getElementById("tags").value = (post.tags || []).join(", ");
  // Show image in preview if present
  if (post.image && imagePreview && imagePreviewContainer) {
    imagePreview.src = post.image;
    imagePreviewContainer.style.display = "block";
  } else if (imagePreview && imagePreviewContainer) {
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
  }
  if (postImageInput) postImageInput.value = "";
  editor.dispatchEvent(new Event("input"));
  tabBtns[0].click();
}

// View post
function viewPost(postId) {
  const post = loadPosts().find((p) => p.id === postId);
  if (!post) return;

  const estimate = estimateReadingTime(post.content);
  const tags = post.tags || [];
  const tagsHTML =
    tags.length > 0
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0">
    ${tags.map((tag) => `<span style="display:inline-block;padding:4px 10px;background:linear-gradient(135deg, rgba(230,57,70,0.1) 0%, rgba(247,127,136,0.1) 100%);border:1px solid var(--accent-primary);border-radius:12px;font-size:12px;color:var(--accent-primary);font-weight:500">#${tag}</span>`).join("")}
  </div>`
      : "";
  const categoryIcon =
    post.category === "Novel"
      ? "📖"
      : post.category === "Poem"
        ? "✍️"
        : post.category === "Short Story"
          ? "📝"
          : "📝";

  previewContent.innerHTML = `
    <article class="post card" style="max-width:100%;border:none;box-shadow:none;padding:0">
      ${post.image ? `<div style=\"width:100%;text-align:center;margin-bottom:18px\"><img src=\"${post.image}\" alt=\"Post Image\" style=\"max-width:100%;max-height:260px;border-radius:12px;box-shadow:0 2px 12px #e6394620;\"></div>` : ""}
      <div class="postHeader" style="margin-bottom:16px">
        <h2 style="margin:0 0 12px 0;color:var(--text);font-size:28px;line-height:1.3">${post.title}</h2>
        <div class="postMeta" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:14px;color:var(--secondary)">
          <span>📅 ${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          ${post.category ? `<span style=\"padding:4px 12px;background:rgba(67,123,157,0.15);color:var(--accent-tertiary);border-radius:12px;font-weight:600\">${categoryIcon} ${post.category}</span>` : ""}
          ${post.mood ? `<span style=\"padding:4px 12px;background:rgba(230,57,70,0.15);color:var(--accent-primary);border-radius:12px;font-weight:600\">🎭 ${post.mood}</span>` : ""}
          <span>⏱️ ${estimate.minutes} min read</span>
          <span>📝 ${estimate.words} words</span>
        </div>
        ${tagsHTML}
      </div>
      <div class="postContent" style="line-height:1.8;font-size:16px;color:var(--text)">${post.content}</div>
      <div style="margin-top:24px;padding-top:24px;border-top:2px solid var(--border);display:flex;gap:16px;align-items:center">
        <span style="color:var(--secondary);font-size:14px">❤️ Likes · 💬 Comments · 📊 Views</span>
      </div>
    </article>
  `;
  previewModal.classList.remove("hidden");
}

// Analytics
function updateAnalytics() {
  const user = currentUser();
  if (!user) return;

  const posts = loadPosts().filter(
    (p) => p.author === user.username && p.published,
  );
  const drafts = loadDrafts()[user.username] || [];
  
  // Data loaded from Firebase - using empty objects
  const likes = {};
  const comments = {};

  let totalLikes = 0;
  let totalComments = 0;
  let totalWords = 0;
  let totalReads = 0;

  posts.forEach((p) => {
    totalLikes += likes[p.id] || 0;
    totalComments += (comments[p.id] || []).length;
    totalReads += p.views || 0;
    const text =
      new DOMParser().parseFromString(p.content, "text/html").body
        .textContent || "";
    totalWords += text.trim().split(/\s+/).length;
  });

  // Get total user accounts (readers) - Load dynamically from Firebase
  loadAllUsers().then(allUsers => {
    if (allUsers && allUsers.length > 0) {
      document.getElementById("totalReaders").textContent = allUsers.length;
    } else {
      document.getElementById("totalReaders").textContent = "0";
    }
  }).catch(e => {
    console.log('Note: User count loading from Firebase');
    document.getElementById("totalReaders").textContent = "—";
  });

  document.getElementById("totalPosts").textContent = posts.length;
  document.getElementById("totalDrafts").textContent = drafts.length;
  document.getElementById("totalLikes").textContent = totalLikes;
  document.getElementById("totalComments").textContent = totalComments;
  document.getElementById("avgReadingTime").textContent =
    posts.length > 0
      ? Math.round(totalWords / posts.length / 200) + " min"
      : "0 min";

  // Recent activity
  const recentActivity = document.getElementById("recentActivity");
  const recent = posts
    .slice(-3)
    .reverse()
    .map((p) => {
      return `<div class="activityItem">
      <strong>${p.title}</strong> - Published
      <div class="activityTime">${new Date(p.createdAt).toLocaleDateString()}</div>
    </div>`;
    })
    .join("");
  recentActivity.innerHTML =
    recent ||
    '<p style="color:var(--secondary);font-size:13px">No recent activity</p>';

  // Top stories (by likes)
  const topStories = document.getElementById("topStories");
  const sortedByLikes = [...posts]
    .sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0))
    .slice(0, 5);
  const topList = sortedByLikes
    .map((p) => {
      return `<div class="topStoryItem">
      <strong>${p.title}</strong> - ${likes[p.id] || 0} ❤️ | ${p.views || 0} 👁️
    </div>`;
    })
    .join("");
  topStories.innerHTML =
    topList ||
    '<p style="color:var(--secondary);font-size:13px">No stories yet</p>';

  // Popular posts (by views/reads)
  const popularPostsList = document.getElementById("popularPostsList");
  const sortedByViews = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);
  const popularList = sortedByViews
    .map((p) => {
      return `<div class="postStatItem">
      <div style="flex:1">
        <strong>${p.title}</strong>
        <p style="font-size:12px;color:var(--secondary);margin:4px 0">Published: ${new Date(p.createdAt).toLocaleDateString()}</p>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:700;color:var(--accent-primary)">${p.views || 0}</div>
        <div style="font-size:11px;color:var(--secondary)">views</div>
      </div>
    </div>`;
    })
    .join("");
  popularPostsList.innerHTML =
    popularList ||
    '<p style="color:var(--secondary);font-size:13px">No posts yet</p>';

  // Newest posts (by date, latest first)
  const newestPostsList = document.getElementById("newestPostsList");
  const sortedByNewest = [...posts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);
  const newestList = sortedByNewest
    .map((p) => {
      return `<div class="postStatItem">
      <div style="flex:1">
        <strong>${p.title}</strong>
        <p style="font-size:12px;color:var(--secondary);margin:4px 0">Published: ${new Date(p.createdAt).toLocaleDateString()}</p>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px">🆕</div>
        <div style="font-size:11px;color:var(--secondary)">${p.views || 0} reads</div>
      </div>
    </div>`;
    })
    .join("");
  newestPostsList.innerHTML =
    newestList ||
    '<p style="color:var(--secondary);font-size:13px">No posts yet</p>';

  // Oldest posts (by date, earliest first)
  const oldestPostsList = document.getElementById("oldestPostsList");
  const sortedByOldest = [...posts]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 5);
  const oldestList = sortedByOldest
    .map((p) => {
      return `<div class="postStatItem">
      <div style="flex:1">
        <strong>${p.title}</strong>
        <p style="font-size:12px;color:var(--secondary);margin:4px 0">Published: ${new Date(p.createdAt).toLocaleDateString()}</p>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px">📖</div>
        <div style="font-size:11px;color:var(--secondary)">${p.views || 0} reads</div>
      </div>
    </div>`;
    })
    .join("");
  oldestPostsList.innerHTML =
    oldestList ||
    '<p style="color:var(--secondary);font-size:13px">No posts yet</p>';

  // All posts with read counts
  const allPostsReadStats = document.getElementById("allPostsReadStats");
  const allPostsList = [...posts]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => {
      return `<div class="postStatItem" style="border-left:3px solid ${p.views > 50 ? 'var(--accent-success)' : p.views > 20 ? 'var(--accent-primary)' : 'var(--border)'}">
      <div style="flex:1">
        <strong>${p.title}</strong>
        <p style="font-size:12px;color:var(--secondary);margin:4px 0">
          ${new Date(p.createdAt).toLocaleDateString()} | 
          <span style="color:var(--accent-secondary)">${p.category || 'Uncategorized'}</span>
        </p>
      </div>
      <div style="text-align:right;display:flex;gap:16px;align-items:center">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--accent-primary)">${p.views || 0}</div>
          <div style="font-size:10px;color:var(--secondary)">👁️ reads</div>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--accent-secondary)">${p.likes || 0}</div>
          <div style="font-size:10px;color:var(--secondary)">❤️ likes</div>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--accent-tertiary)">${(comments[p.id] || []).length}</div>
          <div style="font-size:10px;color:var(--secondary)">💬 comments</div>
        </div>
      </div>
    </div>`;
    })
    .join("");
  allPostsReadStats.innerHTML =
    allPostsList ||
    '<p style="color:var(--secondary);font-size:13px">No posts yet</p>';

  // Load admin analytics if user is admin
  isCurrentUserAdmin().then(isAdmin => {
    const adminSection = document.getElementById("adminAnalyticsSection");
    if (isAdmin && adminSection) {
      adminSection.style.display = "block";
      loadAdminAnalytics();
    } else if (adminSection) {
      adminSection.style.display = "none";
    }
  });
}

// Trigger analytics refresh - called whenever data changes
function refreshAnalyticsIfVisible() {
  const analyticsTab = document.getElementById("analytics");
  if (analyticsTab && analyticsTab.classList.contains("active")) {
    updateAnalytics();
  }
}

// Profile
profileBtn.addEventListener("click", () => {
  const user = currentUser();
  if (!user) return;

  const displayName = user.displayName || user.username;

  // Enhanced profile modal with multiple features
  const posts = loadPosts().filter(
    (p) => p.author === user.username && p.published,
  );
  const drafts = loadDrafts()[user.username] || [];
  const accountAge = Math.floor(
    (Date.now() - (user.createdAt || Date.now())) / (1000 * 60 * 60 * 24),
  );
  // Data loaded from Firebase - using empty objects for now
  const totalLikes = {};
  const totalComments = {};
  let userTotalLikes = 0;
  let userTotalComments = 0;
  let totalWords = 0;
  posts.forEach((p) => {
    userTotalLikes += totalLikes[p.id] || 0;
    userTotalComments += (totalComments[p.id] || []).length;
    const text =
      new DOMParser().parseFromString(p.content, "text/html").body
        .textContent || "";
    totalWords += text.trim().split(/\s+/).length;
  });

  const profilePicUrl = user.profilePic || "";
  const avatarDisplay = profilePicUrl
    ? `<img src="${profilePicUrl}" alt="Profile" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--accent-primary)">`
    : `<div class="profileAvatar" style="width:80px;height:80px;font-size:32px">${user.username.charAt(0).toUpperCase()}</div>`;

  profileContent.innerHTML = `
    <div class="profileSection">
      <div class="profileHeader">
        ${avatarDisplay}
        <div class="profileInfo">
          <h4>${displayName}</h4>
          <p class="profileRole">✨ Admin Account</p>
          <p class="profileUsername">@${user.username}</p>
          <button id="changeProfilePic" class="btnSecondary" style="margin-top:8px;padding:6px 12px;font-size:12px">📷 Change Photo</button>
          <input type="file" id="profilePicInput" accept="image/*" style="display:none" />
        </div>
      </div>
    </div>

    <div class="profileSection">
      <h4>📊 Account Statistics</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-top:12px">
        <div class="statBox" style="padding:12px;background:var(--soft);border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent-primary)">${posts.length}</div>
          <div style="font-size:12px;color:var(--secondary);margin-top:4px">📝 Published</div>
        </div>
        <div class="statBox" style="padding:12px;background:var(--soft);border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent-tertiary)">${drafts.length}</div>
          <div style="font-size:12px;color:var(--secondary);margin-top:4px">📋 Drafts</div>
        </div>
        <div class="statBox" style="padding:12px;background:var(--soft);border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent-secondary)">${userTotalLikes}</div>
          <div style="font-size:12px;color:var(--secondary);margin-top:4px">❤️ Likes</div>
        </div>
        <div class="statBox" style="padding:12px;background:var(--soft);border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent-success)">${userTotalComments}</div>
          <div style="font-size:12px;color:var(--secondary);margin-top:4px">💬 Comments</div>
        </div>
        <div class="statBox" style="padding:12px;background:var(--soft);border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent-primary)">${totalWords.toLocaleString()}</div>
          <div style="font-size:12px;color:var(--secondary);margin-top:4px">📝 Words</div>
        </div>
        <div class="statBox" style="padding:12px;background:var(--soft);border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent-tertiary)">${accountAge}</div>
          <div style="font-size:12px;color:var(--secondary);margin-top:4px">📅 Days</div>
        </div>
      </div>
    </div>
    
    <div class="profileSection">
      <h4>👤 Edit Profile</h4>
      <form id="profileEditForm" class="profileForm">
        <div class="formGroup">
          <label for="editDisplayName">Display Name</label>
          <input type="text" id="editDisplayName" value="${user.displayName || user.username}" placeholder="Your display name" />
        </div>
        <div class="formGroup">
          <label for="editEmail">Email Address</label>
          <input type="email" id="editEmail" value="${user.email || ""}" placeholder="your.email@example.com" />
        </div>
        <div class="formGroup">
          <label for="editBio">Bio</label>
          <textarea id="editBio" rows="3" placeholder="Tell us about yourself..." style="width:100%;padding:10px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text);resize:vertical">${user.bio || ""}</textarea>
        </div>
        <button type="submit" class="btnPrimary">💾 Save Profile</button>
      </form>
    </div>
    
    <div class="profileSection">
      <h4>🔐 Change Password</h4>
      <form id="passwordForm" class="profileForm">
        <div class="formGroup">
          <label for="oldPassword">Current Password</label>
          <input type="password" id="oldPassword" placeholder="Enter current password" required />
        </div>
        <div class="formGroup">
          <label for="newPassword">New Password</label>
          <input type="password" id="newPassword" placeholder="Enter new password" required />
        </div>
        <div class="formGroup">
          <label for="confirmPassword">Confirm New Password</label>
          <input type="password" id="confirmPassword" placeholder="Confirm new password" required />
        </div>
        <button type="submit" class="btnPrimary">🔒 Update Password</button>
      </form>
    </div>

    <div class="profileSection">
      <h4>⚙️ Preferences</h4>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
        <div class="formGroup">
          <label for="langSelectProfile">🌐 Language</label>
          <select id="langSelectProfile" style="padding:8px 12px;border-radius:8px;border:2px solid var(--border);background:var(--bg);color:var(--text);width:100%;font-size:14px;">
            <option value="en">EN - English</option>
            <option value="bn">বাংলা - Bangla</option>
          </select>
        </div>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <input type="checkbox" id="autoSaveEnabled" ${user.autoSave !== false ? "checked" : ""} style="width:18px;height:18px;cursor:pointer" />
          <span style="color:var(--text)">💾 Enable auto-save drafts (30s interval)</span>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <input type="checkbox" id="notificationsEnabled" ${user.notifications !== false ? "checked" : ""} style="width:18px;height:18px;cursor:pointer" />
          <span style="color:var(--text)">🔔 Enable notifications</span>
        </label>
      </div>
    </div>

    <div class="profileSection">
      <h4>📱 Social Links</h4>
      <form id="socialLinksForm" class="profileForm">
        <div class="formGroup">
          <label for="website">🌐 Website</label>
          <input type="url" id="website" value="${user.website || ""}" placeholder="https://yourwebsite.com" />
        </div>
        <div class="formGroup">
          <label for="twitter">🐦 Twitter</label>
          <input type="text" id="twitter" value="${user.twitter || ""}" placeholder="@username" />
        </div>
        <div class="formGroup">
          <label for="instagram">📸 Instagram</label>
          <input type="text" id="instagram" value="${user.instagram || ""}" placeholder="@username" />
        </div>
        <button type="submit" class="btnPrimary">💾 Save Links</button>
      </form>
    </div>

    <div class="profileSection">
      <h4>🎯 Writing Goal</h4>
      <form id="goalForm" class="profileForm">
        <div class="formGroup">
          <label for="writingGoal">Daily Word Goal</label>
          <input type="number" id="writingGoal" value="${user.writingGoal || 500}" min="100" step="100" />
          <small style="color:var(--secondary);font-size:12px;margin-top:4px;display:block">Set your daily writing target in words</small>
        </div>
        <button type="submit" class="btnPrimary">🎯 Set Goal</button>
      </form>
    </div>

    <div class="profileSection">
      <h4>📤 Export Data</h4>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button id="exportPosts" class="btnSecondary">📄 Export Posts (JSON)</button>
        <button id="exportDrafts" class="btnSecondary">📋 Export Drafts (JSON)</button>
        <button id="exportAll" class="btnSecondary">💾 Export All Data</button>
      </div>
    </div>
  `;

  // Profile edit form
  document.getElementById("profileEditForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const displayName = document.getElementById("editDisplayName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const bio = document.getElementById("editBio").value.trim();

    const users = loadUsers();
    users[user.username].displayName = displayName;
    users[user.username].email = email;
    users[user.username].bio = bio;
    saveUsers(users);

    currentUserName.textContent = displayName || user.username;
    showNotification("✅ Profile updated successfully!", "success");
  });

  // Password change
  document.getElementById("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const oldPass = document.getElementById("oldPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;

    if (user.password !== oldPass) {
      showNotification("❌ Incorrect current password.", "error");
      return;
    }

    if (newPass.length < 6) {
      showNotification(
        "⚠️ New password must be at least 6 characters.",
        "error",
      );
      return;
    }

    if (newPass !== confirmPass) {
      showNotification("⚠️ Passwords do not match.", "error");
      return;
    }

    const users = loadUsers();
    users[user.username].password = newPass;
    saveUsers(users);
    showNotification("✅ Password updated successfully!", "success");
    document.getElementById("passwordForm").reset();
  });

  // Preferences
  document.getElementById("autoSaveEnabled").addEventListener("change", (e) => {
    const users = loadUsers();
    users[user.username].autoSave = e.target.checked;
    saveUsers(users);
    showNotification(
      e.target.checked ? "✅ Auto-save enabled" : "⚠️ Auto-save disabled",
      "info",
    );
  });

  document
    .getElementById("notificationsEnabled")
    .addEventListener("change", (e) => {
      const users = loadUsers();
      users[user.username].notifications = e.target.checked;
      saveUsers(users);
      showNotification(
        e.target.checked
          ? "🔔 Notifications enabled"
          : "🔕 Notifications disabled",
        "info",
      );
    });

  // Profile picture change
  document.getElementById("changeProfilePic").addEventListener("click", () => {
    document.getElementById("profilePicInput").click();
  });

  document.getElementById("profilePicInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("⚠️ Please select an image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;
      
      // Update in local storage first for immediate UI update
      const users = loadUsers();
      users[user.username].profilePic = imageData;
      saveUsers(users);
      
      // Also update in Firebase for persistence across devices
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          photoUrl: imageData
        });
      } catch (e) {
        console.log('Firebase profile picture update note:', e.message);
      }
      
      showNotification("✅ Profile picture updated!", "success");
      updateTopBarAvatar();
      profileBtn.click(); // Reload profile modal
    };
    reader.readAsDataURL(file);
  });

  // Social links form
  document.getElementById("socialLinksForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const users = loadUsers();
    users[user.username].website = document
      .getElementById("website")
      .value.trim();
    users[user.username].twitter = document
      .getElementById("twitter")
      .value.trim();
    users[user.username].instagram = document
      .getElementById("instagram")
      .value.trim();
    saveUsers(users);
    showNotification("✅ Social links updated!", "success");
  });

  // Writing goal form
  document.getElementById("goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const goal = parseInt(document.getElementById("writingGoal").value);
    const users = loadUsers();
    users[user.username].writingGoal = goal;
    saveUsers(users);
    showNotification(`🎯 Daily goal set to ${goal} words!`, "success");
  });

  // Export functions
  document.getElementById("exportPosts").addEventListener("click", () => {
    const posts = loadPosts().filter(
      (p) => p.author === user.username && p.published,
    );
    const dataStr = JSON.stringify(posts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `posts_${user.username}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("📄 Posts exported successfully!", "success");
  });

  document.getElementById("exportDrafts").addEventListener("click", () => {
    const drafts = loadDrafts()[user.username] || [];
    const dataStr = JSON.stringify(drafts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `drafts_${user.username}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("📋 Drafts exported successfully!", "success");
  });

  document.getElementById("exportAll").addEventListener("click", () => {
    const allData = {
      posts: loadPosts().filter(
        (p) => p.author === user.username && p.published,
      ),
      drafts: loadDrafts()[user.username] || [],
      profile: user,
      stats: {
        totalLikes: userTotalLikes,
        totalComments: userTotalComments,
        totalWords,
        accountAge,
      },
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all_data_${user.username}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("💾 All data exported successfully!", "success");
  });

  // Language selector (in profile)
  const langSelectProfile = document.getElementById("langSelectProfile");
  if (langSelectProfile) {
    // Set current language from localStorage or default to 'en'
    const currentLang = localStorage.getItem("selectedLanguage") || "en";
    langSelectProfile.value = currentLang;

    langSelectProfile.addEventListener("change", (e) => {
      const newLang = e.target.value;
      localStorage.setItem("selectedLanguage", newLang);
      showNotification(newLang === "en" ? "🌐 Language changed to English" : "🌐 ভাষা পরিবর্তিত হয়েছে বাংলা", "success");
    });
  }

  profileModal.classList.remove("hidden");
});

closeProfile.addEventListener("click", () => {
  profileModal.classList.add("hidden");
});

// Logout
logoutBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "👋 Log Out",
    "Are you sure you want to log out?",
    "Log Out",
    "Cancel",
  );

  if (confirmed) {
    clearSession();
    const mainContainer = document.getElementById("mainContainer");
    if (mainContainer) mainContainer.style.display = "none";
    showNotification("👋 Logged out successfully!", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});

// Initialize default admin account
function initDefaultAdmin() {
  const users = loadUsers();
  if (!users["Ahona Islam"]) {
    users["Ahona Islam"] = {
      password: "AhonaxAhsanur",
      createdAt: Date.now(),
      isAdmin: true,
    };
    saveUsers(users);
  }
}

// Handle auth form submission (Login only)
document.getElementById("authForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;

  if (!username || !password) {
    showNotification("⚠️ Please fill in all fields.", "error");
    return;
  }

  const users = loadUsers();

  if (users[username] && users[username].password === password) {
    setSession(username);
    updateAuthUI();
    const mainContainer = document.getElementById("mainContainer");
    const topBar = document.getElementById("topBar");
    const blurOverlay = document.getElementById("blurOverlay");
    if (mainContainer) mainContainer.style.display = "block";
    if (topBar) topBar.style.display = "flex";
    if (blurOverlay) blurOverlay.classList.add("hidden");
    document.getElementById("authForm").reset();
    showNotification("✨ Welcome back, " + username + "!", "success");
    // Auto-select Write tab after login
    const writeTabBtn = document.querySelector('.tabBtn[data-tab="editorTab"]');
    writeTabBtn && writeTabBtn.click();
  } else {
    showNotification("❌ Invalid username or password.", "error");
  }
});

// Hook up filter listeners
const searchPublishedInput = document.getElementById("searchPublished");
const filterPublishedCategory = document.getElementById(
  "filterPublishedCategory",
);
const searchDraftsInput = document.getElementById("searchDrafts");
const filterDraftsCategory = document.getElementById("filterDraftsCategory");

if (searchPublishedInput)
  searchPublishedInput.addEventListener("input", renderPublished);
if (filterPublishedCategory)
  filterPublishedCategory.addEventListener("change", renderPublished);
if (searchDraftsInput)
  searchDraftsInput.addEventListener("input", renderDrafts);
if (filterDraftsCategory)
  filterDraftsCategory.addEventListener("change", renderDrafts);

// Notification system
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

// Auto-save draft
let currentEditingDraftId = null;

function autoSaveDraft() {
  const user = currentUser();
  if (!user) return;

  const titleValue = titleInput.value.trim();
  const contentValue = editor.textContent.trim();

  if (!titleValue || !contentValue) return;

  const drafts = loadDrafts();
  if (!drafts[user.username]) drafts[user.username] = [];

  let imageData = "";
  if (postImageInput && postImageInput.files && postImageInput.files[0]) {
    imageData = imagePreview.src || "";
  } else if (imagePreview && imagePreview.src) {
    imageData = imagePreview.src;
  }
  const draft = {
    id: currentEditingDraftId || Date.now().toString(),
    title: titleValue,
    content: editor.innerHTML,
    date: new Date().toISOString().split("T")[0],
    category: category.value || "",
    mood: mood.value,
    tags: (document.getElementById("tags")?.value || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    createdAt: currentEditingDraftId
      ? drafts[user.username].find((d) => d.id === currentEditingDraftId)
          ?.createdAt || Date.now()
      : Date.now(),
    savedAt: Date.now(),
    image: imageData,
  };

  const existingIndex = drafts[user.username].findIndex(
    (d) => d.id === draft.id,
  );
  if (existingIndex >= 0) {
    drafts[user.username][existingIndex] = draft;
  } else {
    drafts[user.username].push(draft);
  }

  saveDrafts(drafts);
  currentEditingDraftId = draft.id;

  const status = document.getElementById("editorStatus");
  if (status) {
    status.classList.add("saved");
    status.textContent = "💾 Saved";
  }
}

// Init
// Image upload preview and remove logic
if (postImageInput && imagePreview && imagePreviewContainer && removeImageBtn) {
  postImageInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.src = "";
      imagePreviewContainer.style.display = "none";
    }
  });
  removeImageBtn.addEventListener("click", function () {
    postImageInput.value = "";
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
  });
}
initDefaultAdmin();
updateAuthUI();
updateTopBarAvatar();

// Auto-select Write tab on page load
const writeTabBtn = document.querySelector('.tabBtn[data-tab="editorTab"]');
if (writeTabBtn) writeTabBtn.click();

// Theme toggle functionality
if (toggleTheme) {
  // Set initial icon based on current theme
  const updateThemeIcon = () => {
    const isDark = document.body.classList.contains('dark');
    toggleTheme.textContent = isDark ? '☀️' : '🌙';
    toggleTheme.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  updateThemeIcon();

  toggleTheme.addEventListener('click', (e) => {
    e.stopPropagation();
    const isDark = document.body.classList.contains('dark');
    // toggle
    if (isDark) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
    const nowDark = document.body.classList.contains('dark');
    // Persist preference (use unified key)
    try { localStorage.setItem('ahona_theme', nowDark ? 'dark' : 'light'); } catch (e) {}
    // Update icon
    updateThemeIcon();
    try {
      showNotification(nowDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'success');
    } catch (e) { console.log('Theme switched', nowDark ? 'dark' : 'light'); }
  });
}

// Hamburger menu toggle
const hamburger = document.getElementById("hamburger");
const controls = document.getElementById("controls");

if (hamburger && controls) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    controls.classList.toggle("active");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!hamburger.contains(e.target) && !controls.contains(e.target)) {
      hamburger.classList.remove("active");
      controls.classList.remove("active");
    }
  });

  // Close menu after clicking any button inside
  controls.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      hamburger.classList.remove("active");
      controls.classList.remove("active");
    }
  });
  
  // Close menu when clicking mobile tab navigation buttons
  const mobileTabNav = document.querySelector('.mobileTabNav');
  if (mobileTabNav) {
    mobileTabNav.addEventListener('click', (e) => {
      if (e.target.classList.contains('tabBtn')) {
        hamburger.classList.remove('active');
        controls.classList.remove('active');
      }
    });
  }
}

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

// Check if current user is admin
async function isCurrentUserAdmin() {
  const user = currentUser();
  if (!user) return false;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() && userDoc.data().isAdmin === true;
  } catch (e) {
    console.error('Error checking admin status:', e);
    return false;
  }
}

// Load all users (admin only)
async function loadAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const users = [];
    
    snap.forEach(doc => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (e) {
    console.error('Error loading users:', e);
    return [];
  }
}

// Toggle admin status for a user
async function toggleAdminStatus(userId, newAdminStatus) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isAdmin: newAdminStatus
    });
    showNotification(`✅ User ${newAdminStatus ? 'promoted to admin' : 'removed from admin'}.`, 'success');
    renderUsersTab();
    updateAnalytics();
    refreshAnalyticsIfVisible();
  } catch (e) {
    console.error('Error updating admin status:', e);
    showNotification('❌ Failed to update user status.', 'error');
  }
}

// Delete a user (admin only)
async function deleteUserAccount(userId) {
  try {
    await deleteDoc(doc(db, 'users', userId));
    showNotification('✅ User deleted.', 'success');
    renderUsersTab();
    updateAnalytics();
    refreshAnalyticsIfVisible();
  } catch (e) {
    console.error('Error deleting user:', e);
    showNotification('❌ Failed to delete user.', 'error');
  }
}

// Load all posts (admin moderation)
async function loadAllPosts() {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const posts = [];
    
    snap.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    
    return posts;
  } catch (e) {
    console.error('Error loading posts:', e);
    return [];
  }
}

// Delete post (admin only)
async function adminDeletePost(postId) {
  const confirmed = await showConfirm(
    '🗑️ Delete Post',
    'Are you sure you want to delete this post? This cannot be undone.',
    'Delete',
    'Cancel'
  );
  
  if (!confirmed) return;
  
  try {
    await deleteDoc(doc(db, 'posts', postId));
    showNotification('✅ Post deleted.', 'success');
    renderModerationTab();
    updateAnalytics();
    refreshAnalyticsIfVisible();
  } catch (e) {
    console.error('Error deleting post:', e);
    showNotification('❌ Failed to delete post.', 'error');
  }
}

// Load all comments (admin moderation)
async function loadAllComments() {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const comments = [];
    
    snap.forEach(doc => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    return comments;
  } catch (e) {
    console.error('Error loading comments:', e);
    return [];
  }
}

// Delete comment (admin only)
async function adminDeleteComment(commentId) {
  const confirmed = await showConfirm(
    '🗑️ Delete Comment',
    'Are you sure you want to delete this comment?',
    'Delete',
    'Cancel'
  );
  
  if (!confirmed) return;
  
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    showNotification('✅ Comment deleted.', 'success');
    renderModerationTab();
    updateAnalytics();
    refreshAnalyticsIfVisible();
  } catch (e) {
    console.error('Error deleting comment:', e);
    showNotification('❌ Failed to delete comment.', 'error');
  }
}

// Render moderation tab
async function renderModerationTab() {
  const postsModerationList = document.getElementById('postsModerationList');
  const commentsModerationList = document.getElementById('commentsModerationList');
  
  if (!postsModerationList || !commentsModerationList) return;
  
  // Load posts
  const posts = await loadAllPosts();
  if (posts.length === 0) {
    postsModerationList.innerHTML = '<p style="text-align:center;color:var(--secondary)">No posts to moderate.</p>';
  } else {
    postsModerationList.innerHTML = posts.slice(0, 20).map(p => `
      <div class="moderationItem">
        <div>
          <strong>${p.title || 'Untitled'}</strong>
          <p style="font-size:12px;color:var(--secondary)">By: ${p.authorName || 'Unknown'} | Status: ${p.status}</p>
          <p style="font-size:12px;margin:4px 0">${(p.content || '').substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
        </div>
        <button class="btnDanger" onclick="adminDeletePost('${p.id}')">🗑️ Delete</button>
      </div>
    `).join('');
  }
  
  // Load comments
  const comments = await loadAllComments();
  if (comments.length === 0) {
    commentsModerationList.innerHTML = '<p style="text-align:center;color:var(--secondary)">No comments to moderate.</p>';
  } else {
    commentsModerationList.innerHTML = comments.slice(0, 20).map(c => `
      <div class="moderationItem">
        <div>
          <strong>Comment on Post: ${c.postId || 'Unknown'}</strong>
          <p style="font-size:12px;color:var(--secondary)">By: ${c.userName || 'Anonymous'}</p>
          <p style="font-size:12px;margin:4px 0">${(c.text || '').substring(0, 100)}...</p>
        </div>
        <button class="btnDanger" onclick="adminDeleteComment('${c.id}')">🗑️ Delete</button>
      </div>
    `).join('');
  }
}

// Render users tab
async function renderUsersTab() {
  const usersList = document.getElementById('usersList');
  if (!usersList) return;
  
  const users = await loadAllUsers();
  const searchTerm = (document.getElementById('searchUsers')?.value || '').toLowerCase();
  
  const filtered = users.filter(u => 
    (u.displayName || '').toLowerCase().includes(searchTerm) ||
    (u.email || '').toLowerCase().includes(searchTerm)
  );
  
  if (filtered.length === 0) {
    usersList.innerHTML = '<p style="text-align:center;color:var(--secondary);padding:20px">No users found.</p>';
    return;
  }
  
  usersList.innerHTML = filtered.map(u => `
    <div class="userItemCard">
      <div class="userInfo">
        ${u.photoUrl ? `<img src="${u.photoUrl}" alt="${u.displayName}" class="userAvatar" style="width:40px;height:40px;border-radius:50%;margin-right:10px">` : '<div style="width:40px;height:40px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;margin-right:10px">👤</div>'}
        <div>
          <strong>${u.displayName || u.email}</strong>
          <p style="font-size:12px;color:var(--secondary)">${u.email}</p>
          <p style="font-size:11px;color:var(--secondary)">Joined: ${u.createdAt ? new Date(u.createdAt.toDate?.() || u.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      <div class="userActions">
        ${u.isAdmin ? 
          `<button class="btnSecondary" onclick="toggleAdminStatus('${u.uid}', false)">👑 Revoke Admin</button>` :
          `<button class="btnSecondary" onclick="toggleAdminStatus('${u.uid}', true)">⭐ Make Admin</button>`
        }
        <button class="btnDanger" onclick="deleteUserAccount('${u.uid}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

// Load admin analytics
async function loadAdminAnalytics() {
  try {
    const users = await loadAllUsers();
    const posts = await loadAllPosts();
    const comments = await loadAllComments();
    
    // Count admins
    const adminCount = users.filter(u => u.isAdmin === true).length;
    
    // Count total likes (estimate from posts)
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    // Try to load analytics collection
    let notificationCount = 0;
    try {
      const notifRef = collection(db, 'notifications');
      const notifSnap = await getDocs(notifRef);
      notificationCount = notifSnap.size;
    } catch (e) {
      console.log('Notifications collection not accessible');
    }
    
    // Update UI
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalAdmins').textContent = adminCount;
    document.getElementById('platformPosts').textContent = posts.length;
    document.getElementById('platformComments').textContent = comments.length;
    document.getElementById('platformLikes').textContent = totalLikes;
    document.getElementById('totalNotifications').textContent = notificationCount;
    
    // System data summary
    const systemDataContainer = document.getElementById('systemDataContainer');
    if (systemDataContainer) {
      systemDataContainer.innerHTML = `
        <div style="padding:16px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border)">
          <p><strong>Platform Summary:</strong></p>
          <ul style="list-style:none;padding:8px 0;margin:0;font-size:14px;">
            <li>👥 Active Users: ${users.length}</li>
            <li>👑 Admin Users: ${adminCount}</li>
            <li>📝 Total Posts: ${posts.length}</li>
            <li>💬 Total Comments: ${comments.length}</li>
            <li>❤️ Total Likes: ${totalLikes}</li>
            <li>🔔 Notifications: ${notificationCount}</li>
          </ul>
        </div>
      `;
    }
  } catch (e) {
    console.error('Error loading admin analytics:', e);
    showNotification('❌ Failed to load analytics.', 'error');
  }
}

// Update tab content when admin tabs are viewed
const oldTabListener = document.addEventListener;
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('tabBtn')) {
    const tabName = e.target.dataset.tab;
    
    // Check if user is admin before showing admin tabs
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin && ['moderation', 'users'].includes(tabName)) {
      showNotification('⛔ You do not have admin access.', 'error');
      e.preventDefault();
      return;
    }
    
    if (tabName === 'moderation') {
      renderModerationTab();
    } else if (tabName === 'users') {
      renderUsersTab();
    }
  }
});

// Search users in real-time
const searchUsersInput = document.getElementById('searchUsers');
if (searchUsersInput) {
  searchUsersInput.addEventListener('input', () => {
    renderUsersTab();
  });
}
