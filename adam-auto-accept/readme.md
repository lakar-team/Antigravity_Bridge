# Adam Auto Accept

Personal auto-accept extension for Antigravity IDE.

## Features

- **Auto-Accept Agent Steps**: Automatically accepts all pending Antigravity agent actions.
- **Toggle Control**: Click the status bar item or press `Ctrl+Alt+Shift+U` to toggle.
- **Visual Indicator**: ✅ ON (green) / 🛑 OFF (red) in the status bar.

## Installation

1. Open this folder in VS Code / Antigravity.
2. Run: `npm install -g @vscode/vsce` (if not already installed).
3. Run: `vsce package` to generate `adam-auto-accept-1.0.0.vsix`.
4. In Antigravity: Extensions → `...` menu → `Install from VSIX...` → select the `.vsix` file.
5. Restart Antigravity IDE.

## Usage

- The extension activates automatically on startup.
- Toggle with `Ctrl+Alt+Shift+U` or by clicking the status bar.

## License

MIT
