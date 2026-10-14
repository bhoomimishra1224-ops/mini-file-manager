import http from "http";
import fs from "fs";
import os from "os";
import path from "path";

// Folder paths
const publicFolder = path.join(process.cwd(), "public");
const dataFolder = path.join(process.cwd(), "data");

// Create data folder automatically
fs.mkdirSync(dataFolder, { recursive: true });

// Create server
const server = http.createServer((req, res) => {

    // Send response helper
    function send(status, type, data) {
        res.writeHead(status, {
            "Content-Type": type
        });
        res.end(data);
    }

    // Read request body helper
    function readBody(callback) {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 1000000) {
                send(413, "text/plain", "Request too large");
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                callback(JSON.parse(body));
            } catch {
                send(400, "text/plain", "Invalid data");
            }
        });
    }

    // Check filename
    function validFilename(filename) {
        return typeof filename === "string" &&
            filename.trim() !== "" &&
            filename === path.basename(filename) &&
            !filename.includes("..") &&
            !filename.includes("\\");
    }

    // Parse URL without template literals
    const url = new URL(
        req.url,
        "http://" + (req.headers.host || "localhost:5000")
    );

    // HOME PAGE
    if (url.pathname === "/" && req.method === "GET") {

        fs.readFile(path.join(publicFolder, "index.html"), (err, data) => {
            if (err) {
                send(500, "text/plain", "Error loading HTML");
                return;
            }

            send(200, "text/html", data);
        });
    }

    // CSS FILE
    else if (url.pathname === "/style.css" && req.method === "GET") {

        fs.readFile(path.join(publicFolder, "style.css"), (err, data) => {
            if (err) {
                send(500, "text/plain", "Error loading CSS");
                return;
            }

            send(200, "text/css", data);
        });
    }

    // JAVASCRIPT FILE
    else if (url.pathname === "/app.js" && req.method === "GET") {

        fs.readFile(path.join(publicFolder, "app.js"), (err, data) => {
            if (err) {
                send(500, "text/plain", "Error loading JavaScript");
                return;
            }

            send(200, "text/javascript", data);
        });
    }

    // CREATE FILE
    else if (url.pathname === "/create" && req.method === "POST") {

        readBody(input => {
            const filename = input.filename;
            const content = input.content;

            if (!validFilename(filename) ||
                typeof content !== "string") {
                send(400, "text/plain", "Invalid filename or content");
                return;
            }

            fs.writeFile(
                path.join(dataFolder, filename),
                content,
                { flag: "wx" },
                err => {
                    if (err) {
                        if (err.code === "EEXIST") {
                            send(409, "text/plain", "File already exists");
                        } else {
                            send(500, "text/plain", "Error creating file");
                        }
                        return;
                    }

                    send(200, "text/plain", "File created successfully!");
                }
            );
        });
    }

    // SHOW ALL FILES
    else if (url.pathname === "/files" && req.method === "GET") {

        fs.readdir(dataFolder, (err, files) => {
            if (err) {
                console.log(err);
                send(500, "text/plain", "Error reading files");
                return;
            }

            send(200, "application/json", JSON.stringify(files));
        });
    }

    // READ FILE
    else if (url.pathname === "/read" && req.method === "GET") {

        const filename = url.searchParams.get("filename");

        if (!validFilename(filename)) {
            send(400, "text/plain", "Invalid filename");
            return;
        }

        fs.readFile(path.join(dataFolder, filename), "utf8", (err, content) => {
            if (err) {
                send(404, "text/plain", "File not found");
                return;
            }

            send(200, "application/json", JSON.stringify({
                filename: filename,
                content: content
            }));
        });
    }

    // DELETE FILE
    else if (url.pathname === "/delete" && req.method === "POST") {

        readBody(input => {
            const filename = input.filename;

            if (!validFilename(filename)) {
                send(400, "text/plain", "Invalid filename");
                return;
            }

            fs.unlink(path.join(dataFolder, filename), err => {
                if (err) {
                    send(404, "text/plain", "File not found");
                    return;
                }

                send(200, "text/plain", "File deleted successfully!");
            });
        });
    }

    // SYSTEM INFORMATION
    else if (url.pathname === "/system-info" && req.method === "GET") {

        const cpus = os.cpus();

        const info = {
            operatingSystem: os.type(),
            platform: os.platform(),
            architecture: os.arch(),
            nodeVersion: process.version,
            processor: cpus[0] ? cpus[0].model : "Unknown",
            cpuCores: cpus.length,
            totalMemory: (os.totalmem() / (1024 ** 3)).toFixed(2) + " GB",
            freeMemory: (os.freemem() / (1024 ** 3)).toFixed(2) + " GB",
            serverUptime: (process.uptime() / 60).toFixed(2) + " minutes"
        };

        send(200, "application/json", JSON.stringify(info));
    }

    // PAGE NOT FOUND
    else {
        send(404, "text/plain", "404 - Page Not Found");
    }

});

// START SERVER
server.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});