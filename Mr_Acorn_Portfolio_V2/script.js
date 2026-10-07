import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js';

// 1) Replace this config with the Firebase Web App config from your Firebase project.
const firebaseConfig = {
  apiKey: 'PASTE_YOUR_FIREBASE_API_KEY',
  authDomain: 'PASTE_YOUR_FIREBASE_AUTH_DOMAIN',
  projectId: 'PASTE_YOUR_FIREBASE_PROJECT_ID',
  storageBucket: 'PASTE_YOUR_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_YOUR_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'PASTE_YOUR_FIREBASE_APP_ID'
};

// 2) This is YOUR owner account. Only this email gets the admin dashboard.
const ADMIN_EMAIL = 'everythinggabew@gmail.com';
const configured = !firebaseConfig.apiKey.startsWith('PASTE_');
let auth, db, storage;

if (configured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); db = getFirestore(app); storage = getStorage(app);
}

const $ = id => document.getElementById(id);
$('year').textContent = new Date().getFullYear();

$('signInBtn').onclick = () => $('authModal').classList.remove('hidden');
$('closeModal').onclick = () => $('authModal').classList.add('hidden');
$('signOutBtn').onclick = () => auth && signOut(auth);
$('googleSignIn').onclick = async () => {
  if (!configured) return alert('Firebase is not configured yet. Follow SETUP.md first.');
  try { await signInWithPopup(auth, new GoogleAuthProvider()); $('authModal').classList.add('hidden'); }
  catch (e) { alert(e.message); }
};

function setUser(user) {
  const owner = !!user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  $('signInBtn').classList.toggle('hidden', !!user);
  $('signOutBtn').classList.toggle('hidden', !user);
  $('userLabel').textContent = user ? (owner ? 'OWNER' : user.email) : '';
  $('commentLoginNotice').classList.toggle('hidden', !!user);
  $('commentForm').classList.toggle('hidden', !user);
  $('admin').classList.toggle('hidden', !owner);
}

window.copyDiscord = async () => { try { await navigator.clipboard.writeText('MrAcornDev'); alert('Discord copied: MrAcornDev'); } catch { alert('Discord: MrAcornDev'); } };

function renderProjects(items, owner) {
  const grid = $('projectGrid');
  grid.innerHTML = items.length ? '' : '<div class="notice">No project photos yet. The owner can add them from the Admin Dashboard.</div>';
  items.forEach(x => {
    const card = document.createElement('article'); card.className = 'project-card';
    card.innerHTML = `<div class="project-media"><img src="${x.url}" alt="${escapeHtml(x.title || 'Roblox project')}" loading="lazy"></div><div class="project-info"><div><span>${escapeHtml(x.type || 'BUILD')}</span><h3>${escapeHtml(x.title || 'Roblox Project')}</h3></div>${owner ? `<button class="delete-btn" data-id="${x.id}">Delete</button>` : '<p>Roblox Studio</p>'}</div>`;
    if (owner) card.querySelector('.delete-btn').onclick = () => removeProject(x);
    grid.appendChild(card);
  });
}

function renderVideos(items, owner) {
  const grid = $('videoGrid');
  grid.innerHTML = items.length ? '' : '<div class="notice">No videos yet. The owner can upload the first one from the Admin Dashboard.</div>';
  items.forEach(x => {
    const card = document.createElement('article'); card.className = 'video-card';
    card.innerHTML = `<video controls preload="metadata" src="${x.url}"></video><h3>${escapeHtml(x.title || 'Video Showcase')}</h3>${owner ? `<button class="delete-btn" data-id="${x.id}">Delete video</button>` : ''}`;
    if (owner) card.querySelector('.delete-btn').onclick = () => removeVideo(x);
    grid.appendChild(card);
  });
}

function escapeHtml(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

if (configured) {
  onAuthStateChanged(auth, user => setUser(user));
  onSnapshot(query(collection(db,'comments'), orderBy('createdAt','desc')), snap => renderComments(snap.docs.map(d=>({id:d.id,...d.data()}))));
  onSnapshot(query(collection(db,'projects'), orderBy('createdAt','desc')), snap => renderProjects(snap.docs.map(d=>({id:d.id,...d.data()})), auth.currentUser?.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()));
  onSnapshot(query(collection(db,'videos'), orderBy('createdAt','desc')), snap => renderVideos(snap.docs.map(d=>({id:d.id,...d.data()})), auth.currentUser?.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()));
} else {
  setUser(null); $('projectGrid').innerHTML='<div class="notice">Firebase setup is required. See SETUP.md.</div>'; $('videoGrid').innerHTML='<div class="notice">Firebase setup is required. See SETUP.md.</div>';
}

$('commentForm').onsubmit = async e => {
  e.preventDefault(); if (!auth?.currentUser) return;
  const text = $('commentText').value.trim(); if (!text) return;
  await addDoc(collection(db,'comments'), { text, name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0], email: auth.currentUser.email, uid: auth.currentUser.uid, createdAt: serverTimestamp() });
  $('commentText').value='';
};

function renderComments(items) {
  const list=$('commentsList'); list.innerHTML=''; const owner=auth?.currentUser?.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase();
  if(!items.length){list.innerHTML='<div class="notice">No comments yet. Be the first.</div>';return;}
  items.forEach(x=>{const el=document.createElement('div');el.className='comment';el.innerHTML=`<div class="comment-head"><strong>${escapeHtml(x.name||'User')}</strong><span>${x.createdAt?.toDate ? x.createdAt.toDate().toLocaleString() : ''}${owner?` <button class="delete-btn" data-id="${x.id}">Delete</button>`:''}</span></div><div class="comment-body">${escapeHtml(x.text)}</div>`;if(owner)el.querySelector('.delete-btn').onclick=()=>deleteDoc(doc(db,'comments',x.id));list.appendChild(el);});
}

$('uploadVideoBtn').onclick = () => uploadMedia('video');
$('uploadProjectBtn').onclick = () => uploadMedia('project');

async function uploadMedia(type){
  if(auth?.currentUser?.email?.toLowerCase()!==ADMIN_EMAIL.toLowerCase()) return alert('Owner account required.');
  const file = $(type==='video'?'videoFile':'projectFile').files[0]; const title=$(type==='video'?'videoTitle':'projectTitle').value.trim();
  if(!file) return alert('Choose a file first.'); if(type==='video' && file.size > 500*1024*1024) return alert('Video must be 500 MB or smaller.');
  const status=$(type==='video'?'uploadStatus':'projectStatus'); status.textContent='Uploading...';
  const path=`${type}s/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`; const task=uploadBytesResumable(ref(storage,path),file);
  task.on('state_changed', s=>status.textContent=`Uploading ${Math.round(s.bytesTransferred/s.totalBytes*100)}%`, async()=>{const url=await getDownloadURL(task.snapshot.ref);if(type==='video') await addDoc(collection(db,'videos'),{title:title||file.name,url,path,createdAt:serverTimestamp()});else await addDoc(collection(db,'projects'),{title:title||file.name,type:$('projectType').value.trim()||'BUILD',url,path,createdAt:serverTimestamp()});status.textContent='Done!';},e=>status.textContent=e.message);
}

async function removeVideo(x){if(!confirm('Delete this video?'))return;await deleteDoc(doc(db,'videos',x.id));try{await deleteObject(ref(storage,x.path));}catch(e){console.warn(e)}}
async function removeProject(x){if(!confirm('Delete this photo?'))return;await deleteDoc(doc(db,'projects',x.id));try{await deleteObject(ref(storage,x.path));}catch(e){console.warn(e)}}
