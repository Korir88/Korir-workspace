const express = require("express");
const path = require("path");

const app = express();
const publicDirectory = path.join(__dirname, "public");

app.use(express.json());
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
