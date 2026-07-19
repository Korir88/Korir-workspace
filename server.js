const express = require("express");
const path = require("path");

const app = express();
const publicDirectory = path.join(__dirname, "public");

app.use(express.json());

// The publishable key is designed for browser use. Never expose a Supabase
// service-role key here; database access is protected by the RLS policies.
app.get("/api/config", (req, res) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
        return res.status(503).json({ error: "Supabase has not been configured." });
    }
    res.json({ supabaseUrl: url, supabasePublishableKey: key });
});

app.use(express.static(publicDirectory));

app.get("/", (req, res) => {
    res.sendFile(path.join(publicDirectory, "index.html"));
});

// Vercel invokes the exported Express app as a serverless function.
// Only start a listening server when the app is run locally.
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
