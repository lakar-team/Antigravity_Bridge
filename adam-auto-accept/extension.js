const vscode = require('vscode');

let autoAcceptInterval = null;
let enabled = true;
let statusBarItem;

const COMMANDS_TO_TRY = [
    'antigravity.agent.acceptAgentStep',
    'antigravity.terminal.accept',
    'antigravity.terminalCommand.accept',
    'antigravity.command.accept',
    'antigravity.prioritized.agentAcceptFocusedHunk',
    'antigravity.terminalCommand.run'
];

function activate(context) {
    // Register toggle command
    let disposable = vscode.commands.registerCommand('adam.autoaccept.toggle', function () {
        enabled = !enabled;
        updateStatusBar();
        if (enabled) {
            vscode.window.showInformationMessage('Adam Auto-Accept: ON ✅');
        } else {
            vscode.window.showInformationMessage('Adam Auto-Accept: OFF 🛑');
        }
    });
    context.subscriptions.push(disposable);

    try {
        // Create status bar item (high priority, appears on the right)
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10000);
        statusBarItem.command = 'adam.autoaccept.toggle';
        context.subscriptions.push(statusBarItem);

        updateStatusBar();
        statusBarItem.show();
    } catch (e) {
        // Silent failure to avoid harassing user
    }

    // Start the auto-accept loop
    startLoop();
}

function updateStatusBar() {
    if (!statusBarItem) return;

    if (enabled) {
        statusBarItem.text = "✅ Auto-Accept: ON";
        statusBarItem.tooltip = "Adam Auto-Accept is Running (Click to Pause)";
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = "🛑 Auto-Accept: OFF";
        statusBarItem.tooltip = "Adam Auto-Accept is Paused (Click to Resume)";
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

function startLoop() {
    autoAcceptInterval = setInterval(async () => {
        if (!enabled) return;

        for (const cmd of COMMANDS_TO_TRY) {
            try {
                await vscode.commands.executeCommand(cmd);
            } catch (e) {
                // Ignore errors (command might not be applicable or available)
            }
        }
    }, 500);
}

function deactivate() {
    if (autoAcceptInterval) {
        clearInterval(autoAcceptInterval);
    }
}

module.exports = {
    activate,
    deactivate
}
