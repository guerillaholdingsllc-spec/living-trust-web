import { supabase } from "./supabaseClient.js";

const USER_KEY = "livingtrust_user";
const TOKEN_KEY = "livingtrust_token";

// REGISTER ACCOUNT
export async function registerAccount({ fullName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { fullName }
    }
  });

  if (error) throw new Error(error.message);

  const user = data.user;

  localStorage.setItem(TOKEN_KEY, data.session?.access_token || "");
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.fullName || fullName || ""
  }));

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.fullName || fullName || ""
    }
  };
}

// LOGIN ACCOUNT
export async function loginAccount({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw new Error(error.message);

  const user = data.user;

  localStorage.setItem(TOKEN_KEY, data.session?.access_token || "");
  localStorage.setItem(USER_KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.fullName || ""
  }));

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.fullName || ""
    }
  };
}

// GET CURRENT USER
export async function getCurrentAccount() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  const user = data.user;

  localStorage.setItem(USER_KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.fullName || ""
  }));

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.fullName || ""
    }
  };
}

// PASSWORD RESET
export async function requestPasswordReset({ email }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: import.meta.env.VITE_SITE_URL + "/auth/reset"
  });

  if (error) throw new Error(error.message);

  return { message: "Password reset email sent." };
}

// SIGN OUT
export async function signOutAccount() {
  const { error } = await supabase.auth.signOut();

  if (error) throw new Error(error.message);

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  return { message: "Signed out." };
}
