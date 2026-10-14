// CREATE FILE
async function createFile() {
    const filename = document.getElementById("filename").value.trim();
    const content = document.getElementById("content").value;
    const message = document.getElementById("message");

    if (!filename) {
        message.textContent = "Please enter a file name.";
        return;
    }

    try {
        const response = await fetch("/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, content })
        });

        const result = await response.text();
        message.textContent = result;

        if (response.ok) {
            document.getElementById("filename").value = "";
            document.getElementById("content").value = "";
            await getFiles();
        }
    } catch (error) {
        message.textContent = "Error creating file.";
        console.error(error);
    }
}


// SHOW ALL FILES
async function getFiles() {
    const fileList = document.getElementById("fileList");

    try {
        const response = await fetch("/files");

        if (!response.ok) {
            throw new Error("Unable to load files");
        }

        const files = await response.json();
        fileList.innerHTML = "";

        if (files.length === 0) {
            fileList.textContent = "No files found.";
            return;
        }

        files.forEach(file => {
            const li = document.createElement("li");
            li.className = "file-item";

            const name = document.createElement("span");
            name.textContent = file;

            const readButton = document.createElement("button");
            readButton.textContent = "Read";
            readButton.onclick = () => readFile(file);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";
            deleteButton.onclick = () => deleteFile(file);

            li.appendChild(name);
            li.appendChild(readButton);
            li.appendChild(deleteButton);

            fileList.appendChild(li);
        });

    } catch (error) {
        fileList.textContent = "Error loading files.";
        console.error(error);
    }
}


// READ FILE
async function readFile(filename) {
    try {
        const response = await fetch(`/read?filename=${encodeURIComponent(filename)}`);

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const file = await response.json();

        document.getElementById("modalTitle").textContent =
            "File Name: " + file.filename;

        document.getElementById("modalContent").textContent =
            file.content === "" ? "(This file is empty)" : file.content;

        document.getElementById("fileModal").style.display = "flex";
    } catch (error) {
        alert("Error reading file: " + error.message);
        console.error(error);
    }
}


// CLOSE READ POPUP
function closeModal() {
    document.getElementById("fileModal").style.display = "none";
}


// DELETE FILE
async function deleteFile(filename) {
    const confirmed = confirm(
        "Are you sure you want to delete " + filename + "?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch("/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: filename })
        });

        const result = await response.text();

        if (!response.ok) {
            throw new Error(result);
        }

        alert(result);
        await getFiles();

    } catch (error) {
        alert("Error deleting file: " + error.message);
        console.error(error);
    }
}


// SHOW SYSTEM INFORMATION
async function getSystemInfo() {
    const systemInfo = document.getElementById("systemInfo");

    systemInfo.textContent = "Loading system information...";

    try {
        const response = await fetch("/system-info");

        if (!response.ok) {
            throw new Error("Unable to get system information");
        }

        const info = await response.json();
        systemInfo.innerHTML = "";

        for (const key in info) {
            const row = document.createElement("p");
            const label = document.createElement("strong");

            const labelText = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, letter => letter.toUpperCase());

            label.textContent = labelText + ": ";

            row.appendChild(label);
            row.appendChild(document.createTextNode(info[key]));

            systemInfo.appendChild(row);
        }

    } catch (error) {
        systemInfo.textContent = "Error loading system information.";
        console.error(error);
    }
}