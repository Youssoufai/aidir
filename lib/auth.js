import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

// ✅ Persist session across refresh
auth.onAuthStateChanged((user) => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
});

export const loginUser = async (email, password) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken();
    return { user: userCred.user, token };
};

export const logoutUser = async () => {
    await signOut(auth);
    localStorage.removeItem("user");
    window.location.href = "/login";
};

export const getCurrentUser = () => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
};

export { auth };
