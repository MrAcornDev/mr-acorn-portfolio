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
// SETTINGS
// ==============================

const ADMIN_EMAIL = 'everythinggabew@gmail.com';

const UPLOAD_WORKER_URL =
  'https://restless-salad-f033.everythinggabew.workers.dev';


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
  return String(s).replace(
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
// LOGIN
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
    console.error(e);
    alert(e.message);
  }
};


// ==============================
// USER UI
// ==============================

function setUser(user) {

  const owner = isAdmin(user);

  $('signInBtn').classList.toggle(
    'hidden',
    !!user
  );

  $('signOutBtn').classList.toggle(
    'hidden',
    !user
  );

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

  refreshMedia();
}


// ==============================
// DISCORD
// ==============================

window.copyDiscord = async () => {

  try {

    await navigator.clipboard.writeText(
      'MrAcornDev'
    );

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

    const card =
      document.createElement('article');

    card.className = 'project-card';


    card.innerHTML = `

      <div class="project-media">

        <img
          src="${escapeHtml(x.url || '')}"
          alt="${escapeHtml(
            x.title || 'Roblox project'
          )}"
          loading="lazy"
        >

      </div>


      <div class="project-info">

        <div>

          <span>
            ${escapeHtml(
              x.type || 'BUILD'
            )}
          </span>

          <h3>
            ${escapeHtml(
              x.title || 'Roblox Project'
            )}
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

      card
        .querySelector('.delete-btn')
        .onclick = () => removeProject(x);

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

    const card =
      document.createElement('article');

    card.className = 'video-card';


    card.innerHTML = `

      <video
        controls
        preload="metadata"
        src="${escapeHtml(x.url || '')}"
      ></video>

      <h3>
        ${escapeHtml(
          x.title || 'Video Showcase'
        )}
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

      card
        .querySelector('.delete-btn')
        .onclick = () => removeVideo(x);

    }


    grid.appendChild(card);

  });

}


// ==============================
// MEDIA REFRESH
// ==============================

function refreshMedia() {

  const owner =
    isAdmin(auth.currentUser);

  renderProjects(
    projectsCache,
    owner
  );

  renderVideos(
    videosCache,
    owner
  );

}


// ==============================
// FIRESTORE LISTENERS
// ==============================

// COMMENTS

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
    console.error(
      'Comments error:',
      error
    );
  }
);


// PROJECTS

onSnapshot(
  query(
    collection(db, 'projects'),
    orderBy('createdAt', 'desc')
  ),

  snap => {

    projectsCache =
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    refreshMedia();

  },

  error => {

    console.error(
      'Projects error:',
      error
    );

  }
);


// VIDEOS

onSnapshot(
  query(
    collection(db, 'videos'),
    orderBy('createdAt', 'desc')
  ),

  snap => {

    videosCache =
      snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

    refreshMedia();

  },

  error => {

    console.error(
      'Videos error:',
      error
    );

  }
);


// ==============================
// AUTH STATE
// ==============================

onAuthStateChanged(
  auth,
  user => {
    setUser(user);
  }
);


// ==============================
// COMMENTS
// ==============================

$('commentForm').onsubmit =
  async e => {

    e.preventDefault();


    if (!auth.currentUser) {

      alert(
        'Please sign in first.'
      );

      return;
    }


    const text =
      $('commentText').value.trim();


    if (!text) {
      return;
    }


    if (text.length > 1000) {

      alert(
        'Comment must be 1000 characters or less.'
      );

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

          email:
            auth.currentUser.email,

          uid:
            auth.currentUser.uid,

          createdAt:
            serverTimestamp()

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

  const list =
    $('commentsList');

  list.innerHTML = '';


  const owner =
    isAdmin(auth.currentUser);


  if (!items.length) {

    list.innerHTML = `
      <div class="notice">
        No comments yet. Be the first.
      </div>
    `;

    return;
  }


  items.forEach(x => {

    const el =
      document.createElement('div');

    el.className = 'comment';


    const date =
      x.createdAt?.toDate
        ? x.createdAt
            .toDate()
            .toLocaleString()
        : '';


    el.innerHTML = `

      <div class="comment-head">

        <strong>
          ${escapeHtml(
            x.name || 'User'
          )}
        </strong>

        <span>

          ${escapeHtml(date)}

          ${
            owner
              ? `
                <button
                  class="delete-btn"
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

      el
        .querySelector('.delete-btn')
        .onclick = async () => {

          if (
            !confirm(
              'Delete this comment?'
            )
          ) {
            return;
          }


          try {

            await deleteDoc(
              doc(
                db,
                'comments',
                x.id
              )
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
// FILE → BASE64
// ==============================

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        const result =
          reader.result;


        const base64 =
          result.split(',')[1];


        resolve(base64);

      };


      reader.onerror =
        reject;


      reader.readAsDataURL(file);

    }
  );

}


// ==============================
// UPLOAD TO GITHUB
// ==============================

async function uploadToGitHub(
  type,
  file,
  title
) {

  if (!isAdmin(auth.currentUser)) {

    throw new Error(
      'Owner account required.'
    );

  }


  if (!file) {

    throw new Error(
      'Choose a file first.'
    );

  }


  // GitHub's Contents API has a 100 MB limit.
  if (file.size > 100 * 1024 * 1024) {

    throw new Error(
      'The file must be 100 MB or smaller.'
    );

  }


  const status =
    type === 'video'
      ? $('uploadStatus')
      : $('projectStatus');


  status.textContent =
    'Preparing upload...';


  const fileData =
    await fileToBase64(file);


  status.textContent =
    'Uploading to GitHub...';


  // Get a Firebase ID token.
  const idToken =
    await auth.currentUser.getIdToken(
      true
    );


  const response =
    await fetch(
      UPLOAD_WORKER_URL,
      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json',

          'Authorization':
            `Bearer ${idToken}`

        },

        body: JSON.stringify({

          type,

          fileName:
            file.name,

          fileData

        })

      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    throw new Error(
      result.error ||
      'Upload failed.'
    );

  }


  status.textContent =
    'Saving to portfolio...';


  if (type === 'video') {

    await addDoc(
      collection(db, 'videos'),
      {

        title:
          title ||
          file.name,

        url:
          result.url,

        path:
          result.path,

        createdAt:
          serverTimestamp()

      }
    );

  } else {

    await addDoc(
      collection(db, 'projects'),
      {

        title:
          title ||
          file.name,

        type:
          $('projectType').value.trim() ||
          'BUILD',

        url:
          result.url,

        path:
          result.path,

        createdAt:
          serverTimestamp()

      }
    );

  }


  status.textContent =
    'Upload complete!';


  return result;

}


// ==============================
// VIDEO UPLOAD BUTTON
// ==============================

$('uploadVideoBtn').onclick =
  async () => {

    if (!isAdmin(auth.currentUser)) {

      alert(
        'Owner account required.'
      );

      return;
    }


    const file =
      $('videoFile').files[0];


    const title =
      $('videoTitle')
        .value
        .trim();


    try {

      await uploadToGitHub(
        'video',
        file,
        title
      );

      $('videoFile').value = '';

      $('videoTitle').value = '';

    } catch (e) {

      console.error(e);

      $('uploadStatus').textContent =
        'Upload failed.';

      alert(e.message);

    }

  };


// ==============================
// PROJECT UPLOAD BUTTON
// ==============================

$('uploadProjectBtn').onclick =
  async () => {

    if (!isAdmin(auth.currentUser)) {

      alert(
        'Owner account required.'
      );

      return;
    }


    const file =
      $('projectFile').files[0];


    const title =
      $('projectTitle')
        .value
        .trim();


    try {

      await uploadToGitHub(
        'project',
        file,
        title
      );

      $('projectFile').value = '';

      $('projectTitle').value = '';

    } catch (e) {

      console.error(e);

      $('projectStatus').textContent =
        'Upload failed.';

      alert(e.message);

    }

  };


// ==============================
// DELETE PROJECT
// ==============================

async function removeProject(x) {

  if (!isAdmin(auth.currentUser)) {

    alert(
      'Owner account required.'
    );

    return;
  }


  if (
    !confirm(
      'Delete this project?'
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        'projects',
        x.id
      )
    );


    alert(
      'Project removed from the portfolio.'
    );


    // Note:
    // The GitHub file remains in the repository.
    // We can add automatic GitHub deletion later.

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

    alert(
      'Owner account required.'
    );

    return;
  }


  if (
    !confirm(
      'Delete this video?'
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        'videos',
        x.id
      )
    );


    alert(
      'Video removed from the portfolio.'
    );


    // Note:
    // The GitHub file remains in the repository.
    // We can add automatic GitHub deletion later.

  } catch (e) {

    console.error(e);

    alert(e.message);

  }

}
