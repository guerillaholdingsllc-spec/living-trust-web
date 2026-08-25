 

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

 

  return { user };

}

 

// PASSWORD RESET

export async function requestPasswordReset({ email }) {

  const { error } = await supabase.auth.resetPasswordForEmail(email, {

    redirectTo: import.meta.env.VITE_SITE_URL + "/auth/reset"

  });

  if (error) throw new Error(error.message);

 

  return { message: "Password reset email sent." };

}
