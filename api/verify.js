export default function handler(req, res) {
  try {
    const { token, type, redirect_to } = req.query;

    if (!token || !type) {
      return res.status(400).send("Missing token or type");
    }

    const SUPABASE_PROJECT_URL = "https://tdotbucnazgversgbake.supabase.co";

    const finalUrl =
      `${SUPABASE_PROJECT_URL}/auth/v1/verify?` +
      `token=${encodeURIComponent(token)}` +
      `&type=${encodeURIComponent(type)}` +
      (redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : "");

    console.log("🔁 Redirecting to:", finalUrl);

    return res.redirect(302, finalUrl);
  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Internal Server Error");
  }
}
