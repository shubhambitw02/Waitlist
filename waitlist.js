/* Barrtar waitlist capture — shared by homepage and /download/ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
 getAnalytics,
 isSupported as isAnalyticsSupported,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
import {
 doc,
 setDoc,
 getFirestore,
 serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
 apiKey: "AIzaSyCFnqJih-msdUzytYHCRwrwOxE34SaSuSk",
 authDomain: "barrtar-website.firebaseapp.com",
 projectId: "barrtar-website",
 storageBucket: "barrtar-website.firebasestorage.app",
 messagingSenderId: "929396281674",
 appId: "1:929396281674:web:7f7d7a64139bddc8cfb1b3",
 measurementId: "G-0EJE64YRQG",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

isAnalyticsSupported()
 .then((ok) => {
  if (ok) getAnalytics(app);
 })
 .catch(() => {});

const normalizeEmail = (value) => value.trim().toLowerCase();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

const setStatus = (form, text, state = "") => {
 const status = form.querySelector(".notify-status");
 if (!status) return;
 status.textContent = text;
 status.className = state ? `notify-status ${state}` : "notify-status";
};

document.querySelectorAll(".waitlist-form[data-waitlist]").forEach((form) => {
 const input = form.querySelector('input[type="email"]');
 const btn = form.querySelector('button[type="submit"]');
 const defaultBtnText = btn?.textContent || "Notify me";

 form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!input || !btn) return;

  const email = normalizeEmail(input.value);
  input.value = email;

  if (!isValidEmail(email)) {
   input.setAttribute("aria-invalid", "true");
   setStatus(form, "Enter a valid email address.", "is-error");
   input.focus();
   return;
  }

  input.removeAttribute("aria-invalid");
  btn.disabled = true;
  btn.textContent = "Submitting…";
  setStatus(form, "Saving your request…", "is-loading");

  try {
   await setDoc(
    doc(db, "waitlist_emails", email),
    {
     email,
     createdAt: serverTimestamp(),
     createdAtClient: new Date().toISOString(),
     source: form.closest("#ios-waitlist") ? "ios_waitlist" : "website_waitlist",
     page: window.location.pathname,
     releasePhase: "ios_and_area_notify",
    },
    { merge: true },
   );
   input.value = "";
   input.placeholder = "Request received";
   btn.textContent = "You're on the list!";
   setStatus(form, "Thanks! We’ll notify you when iOS access opens or Barrtar expands to your area.", "is-success");
  } catch (error) {
   console.error("Waitlist error:", error);
   btn.disabled = false;
   btn.textContent = defaultBtnText;
   setStatus(form, "Could not submit right now. Please try again.", "is-error");
  }
 });
});
