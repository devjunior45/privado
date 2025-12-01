export default function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("Missing URL");
    }

    // Apenas repassa 100% do link original do Supabase
    return res.redirect(302, url);

  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Internal Server Error");
  }
}
