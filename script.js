import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';


// ==============================
// FIREBASE CONFIG
// ==============================

const firebaseConfig = {
  apiKey: 'AIzaSyCluF-o2GWh9Rxi-emv_SzFdz6au-r5ySI',
  authDomain: 'mr-acorn-portfolio.firebaseapp.com',
  projectId: 'mr-acorn-portfolio',
  storageBucket: 'mr-acorn-portfolio.firebasestorage.app',
  messagingSenderId: '737701265086',
  appId: '1:737701265086:web:2b201fbf5d0f1e567d28ef',
  measurementId: 'G-VEF8855PXF'
};


// ==============================
// ADMIN ACCOUNT
// ==============================

const ADMIN_EMAIL = 'everythinggabew@gmail.com';


// ==============================
// FIREBASE STARTUP
// ==============================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ==============================
// HELPERS
// ==============================

const $ = id => document.getElementById(id);

$('year').textContent = new Date().getFullYear();

function isAdmin(user) {
  return !!user &&
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function escapeHtml(s = '') {
  return s.replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );
}


// ==============================
// LOGIN / LOGOUT
// ==============================

$('signInBtn').onclick = () => {
  $('authModal').classList.remove('hidden');
};

$('closeModal').onclick = () => {
  $('authModal').classList.add('hidden');
};

$('signOutBtn').onclick = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    alert(e.message);
  }
};

$('googleSignIn').onclick = async () => {
  try {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(auth, provider);

    $('authModal').classList.add('hidden');

  } catch (e) {
    alert(e.message);
  }
};


// ==============================
// USER UI
// ==============================

function setUser(user) {
  const owner = isAdmin(user);

  $('signInBtn').classList.toggle('hidden', !!user);
  $('signOutBtn').classList.toggle('hidden', !user);

  $('userLabel').textContent =
    user
      ? (owner ? 'OWNER' : user.email)
      : '';

  $('commentLoginNotice').classList.toggle(
    'hidden',
    !!user
  );

  $('commentForm').classList.toggle(
    'hidden',
    !user
  );

  $('admin').classList.toggle(
    'hidden',
    !owner
  );

  // Re-render projects/videos so owner delete buttons appear/disappear
  refreshMedia();
}


// ==============================
// DISCORD
// ==============================

window.copyDiscord = async () => {
  try {
    await navigator.clipboard.writeText('MrAcornDev');

    alert('Discord copied: MrAcornDev');

  } catch {
    alert('Discord: MrAcornDev');
  }
};


// ==============================
// PROJECTS
// ==============================

let projectsCache = [];

function renderProjects(items, owner) {
  const grid = $('projectGrid');

  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = `
      <div class="notice">
        No project photos yet.
      </div>
    `;

    return;
  }

  items.forEach(x => {
    const card = document.createElement('article');

    card.className = 'project-card';

    card.innerHTML = `
      <div class="project-media">
        <img
          src="${escapeHtml(x.url || '')}"
          alt="${escapeHtml(x.title || 'Roblox project')}"
          loading="lazy"
        >
      </div>

      <div class="project-info">

        <div>
          <span>${escapeHtml(x.type || 'BUILD')}</span>

          <h3>
            ${escapeHtml(x.title || 'Roblox Project')}
          </h3>
        </div>

        ${
          owner
            ? `
              <button
                class="delete-btn"
                data-id="${escapeHtml(x.id)}"
              >
                Delete
              </button>
            `
            : `
              <p>Roblox Studio</p>
            `
        }

      </div>
    `;

    if (owner) {
      const button = card.querySelector('.delete-btn');

      button.onclick = () => removeProject(x);
    }

    grid.appendChild(card);
  });
}


// ==============================
// VIDEOS
// ==============================

let videosCache = [];

function renderVideos(items, owner) {
  const grid = $('videoGrid');

  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = `
      <div class="notice">
        No videos yet.
      </div>
    `;

    return;
  }

  items.forEach(x => {
    const card = document.createElement('article');

    card.className = 'video-card';

    card.innerHTML = `
      <video
        controls
        preload="metadata"
        src="${escapeHtml(x.url || '')}"
      ></video>

      <h3>
        ${escapeHtml(x.title || 'Video Showcase')}
      </h3>

      ${
        owner
          ? `
            <button
              class="delete-btn"
              data-id="${escapeHtml(x.id)}"
            >
              Delete video
            </button>
          `
          : ''
      }
    `;

    if (owner) {
      const button = card.querySelector('.delete-btn');

      button.onclick = () => removeVideo(x);
    }

    grid.appendChild(card);
  });
}


// ==============================
// MEDIA REFRESH
// ==============================

function refreshMedia() {
  const owner = isAdmin(auth.currentUser);

  renderProjects(projectsCache, owner);
  renderVideos(videosCache, owner);
}


// ==============================
// FIRESTORE LISTENERS
// ==============================

// Comments

onSnapshot(
  query(
    collection(db, 'comments'),
    orderBy('createdAt', 'desc')
  ),

  snap => {
    renderComments(
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))
    );
  },

  error => {
    console.error('Comments error:', error);
  }
);


// Projects

onSnapshot(
  query(
    collection(db, 'projects'),
    orderBy('createdAt', 'desc')
  ),

  snap => {
    projectsCache = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    refreshMedia();
  },

  error => {
    console.error('Projects error:', error);
  }
);


// Videos

onSnapshot(
  query(
    collection(db, 'videos'),
    orderBy('createdAt', 'desc')
  ),

  snap => {
    videosCache = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    refreshMedia();
  },

  error => {
    console.error('Videos error:', error);
  }
);


// ==============================
// AUTH STATE
// ==============================

onAuthStateChanged(auth, user => {
  setUser(user);
});


// ==============================
// COMMENTS
// ==============================

$('commentForm').onsubmit = async e => {
  e.preventDefault();

  if (!auth.currentUser) {
    alert('Please sign in first.');
    return;
  }

  const text = $('commentText').value.trim();

  if (!text) {
    return;
  }

  if (text.length > 1000) {
    alert('Comment must be 1000 characters or less.');
    return;
  }

  try {
    await addDoc(
      collection(db, 'comments'),
      {
        text,

        name:
          auth.currentUser.displayName ||
          auth.currentUser.email.split('@')[0],

        email: auth.currentUser.email,

        uid: auth.currentUser.uid,

        createdAt: serverTimestamp()
      }
    );

    $('commentText').value = '';

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
};


// ==============================
// RENDER COMMENTS
// ==============================

function renderComments(items) {
  const list = $('commentsList');

  list.innerHTML = '';

  const owner = isAdmin(auth.currentUser);

  if (!items.length) {
    list.innerHTML = `
      <div class="notice">
        No comments yet. Be the first.
      </div>
    `;

    return;
  }

  items.forEach(x => {
    const el = document.createElement('div');

    el.className = 'comment';

    const date =
      x.createdAt?.toDate
        ? x.createdAt.toDate().toLocaleString()
        : '';

    el.innerHTML = `
      <div class="comment-head">

        <strong>
          ${escapeHtml(x.name || 'User')}
        </strong>

        <span>
          ${escapeHtml(date)}

          ${
            owner
              ? `
                <button
                  class="delete-btn"
                  data-id="${escapeHtml(x.id)}"
                >
                  Delete
                </button>
              `
              : ''
          }

        </span>

      </div>

      <div class="comment-body">
        ${escapeHtml(x.text)}
      </div>
    `;

    if (owner) {
      const button = el.querySelector('.delete-btn');

      button.onclick = async () => {
        if (!confirm('Delete this comment?')) {
          return;
        }

        try {
          await deleteDoc(
            doc(db, 'comments', x.id)
          );

        } catch (e) {
          alert(e.message);
        }
      };
    }

    list.appendChild(el);
  });
}


// ==============================
// ADMIN MEDIA BUTTONS
// ==============================
//
// Firebase Storage is intentionally NOT used.
//
// Because you're staying on Firebase Spark,
// photos/videos should be hosted in GitHub
// and added to Firestore as media records.
//
// These buttons currently show instructions
// instead of attempting a paid Firebase Storage upload.
// ==============================

$('uploadVideoBtn').onclick = () => {
  if (!isAdmin(auth.currentUser)) {
    alert('Owner account required.');
    return;
  }

  alert(
    'Firebase Storage is disabled because this website is staying on the free Firebase plan.\\n\\nUpload your video to the GitHub repository first, then add its GitHub Pages URL to the portfolio.'
  );
};


$('uploadProjectBtn').onclick = () => {
  if (!isAdmin(auth.currentUser)) {
    alert('Owner account required.');
    return;
  }

  alert(
    'Firebase Storage is disabled because this website is staying on the free Firebase plan.\\n\\nUpload your project image to the GitHub repository first, then add its GitHub Pages URL to the portfolio.'
  );
};


// ==============================
// DELETE PROJECT
// ==============================

async function removeProject(x) {
  if (!isAdmin(auth.currentUser)) {
    alert('Owner account required.');
    return;
  }

  if (!confirm('Delete this project?')) {
    return;
  }

  try {
    await deleteDoc(
      doc(db, 'projects', x.id)
    );

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}


// ==============================
// DELETE VIDEO
// ==============================

async function removeVideo(x) {
  if (!isAdmin(auth.currentUser)) {
    alert('Owner account required.');
    return;
  }

  if (!confirm('Delete this video?')) {
    return;
  }

  try {
    await deleteDoc(
      doc(db, 'videos', x.id)
    );

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}
