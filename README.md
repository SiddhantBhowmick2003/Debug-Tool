# Debug-Tool

A VS Code extension to simplify debugging.

This VS Code extension can be used to toggle commenting and uncommenting while debugging, which is very helpful during competitive coding. Following are the only features:

* **`Ctrl` + `Shift` + `J`**  
  Create a temporary comment or toggle inline.
* **`Ctrl` + `Alt` + `J` then `A`**  
  Toggle all temporary comments at once.
* **`Ctrl` + `Alt` + `J` then `N`**  
  Toggle all tagged comments at once.

---

### Tagging Comments
Use naming starting with `DBG05` to tag them with a specific name. 

**Example:**  
`DBG05:J1` creates a temporary comment with the tag `J1`.

### Installation

This extension isn't published on the VS Code Marketplace — install it directly from the `.vsix` file:

1. Go to the [Releases](../../releases) page of this repo and download the latest `.vsix` file.
2. Install it using one of these methods:

   **Option A — Command line:**
```bash
   code --install-extension debug-comments-0.0.1.vsix
```

   **Option B — VS Code UI:**
   - Open VS Code.
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac).
   - Type and select **"Extensions: Install from VSIX..."**.
   - Choose the downloaded `.vsix` file.
3. Reload VS Code if prompted. You're ready to use the keybindings above.

---

### Supported Languages

C, C++, Java, JavaScript, TypeScript, Python (comment syntax auto-detected per file).
Copy this over your current README, commit, and push:
bashgit add README.md
git commit -m "Add installation instructions"
git push
