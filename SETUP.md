# Mr Acorn Portfolio — Firebase Setup

This version has:
- Visitor accounts with Google sign-in
- Signed-in visitors can leave comments
- Owner-only admin dashboard
- Owner can upload/delete videos from the website
- Owner can upload/delete project photos from the website
- Firestore + Firebase Storage security rules

## Important
Do NOT upload this ZIP file itself into GitHub. Extract it first, then upload the files/folders inside it to your repository.

## 1. Create Firebase
1. Go to https://console.firebase.google.com/
2. Create a project.
3. Add a Web App to the project.
4. Copy the Firebase config object.

## 2. Enable accounts
Firebase Console → Authentication → Sign-in method → enable Google.

Add your GitHub Pages domain to Authorized domains, for example:
`mracorndev.github.io`

## 3. Create the database
Firebase Console → Firestore Database → Create database.

Then open Firestore → Rules and paste the contents of `firestore.rules`.

## 4. Create Storage
Firebase Console → Storage → Get started.

Then open Storage → Rules and paste the contents of `storage.rules`.

## 5. Put your Firebase config into the site
Open `script.js`.
Find `const firebaseConfig = { ... }`.
Replace the placeholder values with the config Firebase gave you.

The admin email is already set to:
`everythinggabew@gmail.com`

Do not change it unless you want a different owner account.

## 6. Upload to GitHub
Extract this ZIP. Upload/replace the files in your `mr-acorn-portfolio` repository.
Commit the changes to `main`.

GitHub Pages should redeploy automatically.

## 7. Test
Open your portfolio.
- Click Sign in.
- Sign in with a normal Google account: you should be able to comment.
- Sign out.
- Sign in with `everythinggabew@gmail.com`: the Admin Dashboard should appear.
- Upload a test video and photo.

## Security
The Firebase web config is okay to be visible in browser code. The real protection comes from Firestore and Storage rules. Never put a Firebase service-account private key or other secret key in this website.
