export default function handler(req, res) {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(400).send("Missing token");
    }

    // Domain do seu Supabase
    const SUPABASE_PROJECT_URL = "https://tdotbucnazgversgbake.supabase.co";

    const redirectUrl = `${SUPABASE_PROJECT_URL}/auth/v1/verify?token=${token}`;

    // Redireciona imediatamente
    return res.redirect(302, redirectUrl);

  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Internal Server Error");
  }
}
