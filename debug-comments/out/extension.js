"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const MARKER = 'DBG05';
function getCommentSymbol(languageId) {
    switch (languageId) {
        case 'python':
            return '#';
        case 'cpp':
        case 'c':
        case 'java':
        case 'javascript':
        case 'typescript':
            return '//';
        default:
            return undefined;
    }
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// Matches a line that already has a trailing marker (named or unnamed).
// Captures: indent, codePart (everything before the trailing marker), nameSuffix (e.g. ":J1" or undefined)
function buildGenericSuffixRegex(symbol) {
    const escSym = escapeRegex(symbol);
    return new RegExp(`^(\\s*)([\\s\\S]*?)\\s*${escSym}\\s*${MARKER}(:[A-Za-z0-9_]+)?\\s*$`);
}
// Toggles ONE line: flips whether the code portion is commented, keeps/creates the trailing marker.
function toggleLineText(text, symbol) {
    const genericRegex = buildGenericSuffixRegex(symbol);
    const match = text.match(genericRegex);
    if (match) {
        const indent = match[1];
        const codePart = match[2];
        const nameSuffix = match[3] || '';
        const trimmedCode = codePart.replace(/^\s+/, '');
        const isCommented = trimmedCode.startsWith(symbol);
        let newCode;
        if (isCommented) {
            newCode = trimmedCode.slice(symbol.length).replace(/^\s+/, '');
        }
        else {
            newCode = `${symbol} ${trimmedCode}`;
        }
        return `${indent}${newCode} ${symbol} ${MARKER}${nameSuffix}`;
    }
    else {
        // Fresh code line, no marker yet -> comment it and attach unnamed marker
        const leadingWhitespaceMatch = text.match(/^(\s*)/);
        const indent = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : '';
        const code = text.slice(indent.length);
        return `${indent}${symbol} ${code} ${symbol} ${MARKER}`;
    }
}
function activate(context) {
    // 1. Toggle current line (Ctrl+Shift+J)
    const toggleLineCmd = vscode.commands.registerCommand('debug-comments.toggle', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const symbol = getCommentSymbol(editor.document.languageId);
        if (!symbol) {
            vscode.window.showInformationMessage('Debug Comments: language not supported yet.');
            return;
        }
        await editor.edit(editBuilder => {
            for (const selection of editor.selections) {
                const line = editor.document.lineAt(selection.active.line);
                const newText = toggleLineText(line.text, symbol);
                editBuilder.replace(line.range, newText);
            }
        });
    });
    // 2. Toggle all UNNAMED DBG05 lines in the file (Ctrl+Alt+J then A)
    const toggleAllUnnamedCmd = vscode.commands.registerCommand('debug-comments.toggleAllUnnamed', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const symbol = getCommentSymbol(editor.document.languageId);
        if (!symbol) {
            vscode.window.showInformationMessage('Debug Comments: language not supported yet.');
            return;
        }
        const genericRegex = buildGenericSuffixRegex(symbol);
        const document = editor.document;
        let anyMatched = false;
        await editor.edit(editBuilder => {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const match = line.text.match(genericRegex);
                if (match && !match[3]) { // no name suffix = unnamed
                    anyMatched = true;
                    const newText = toggleLineText(line.text, symbol);
                    editBuilder.replace(line.range, newText);
                }
            }
        });
        if (!anyMatched) {
            vscode.window.showInformationMessage('Debug Comments: no unnamed debug comments found.');
        }
    });
    // 3. Toggle all lines matching a specific name (Ctrl+Alt+J then N, then type name)
    const toggleByNameCmd = vscode.commands.registerCommand('debug-comments.toggleByName', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const symbol = getCommentSymbol(editor.document.languageId);
        if (!symbol) {
            vscode.window.showInformationMessage('Debug Comments: language not supported yet.');
            return;
        }
        const name = await vscode.window.showInputBox({
            prompt: 'Enter the debug comment block name to toggle (e.g. J1)',
            placeHolder: 'J1'
        });
        if (!name)
            return;
        const genericRegex = buildGenericSuffixRegex(symbol);
        const document = editor.document;
        let anyMatched = false;
        await editor.edit(editBuilder => {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const match = line.text.match(genericRegex);
                if (match && match[3] === `:${name}`) {
                    anyMatched = true;
                    const newText = toggleLineText(line.text, symbol);
                    editBuilder.replace(line.range, newText);
                }
            }
        });
        if (!anyMatched) {
            vscode.window.showInformationMessage(`Debug Comments: no comments named "${name}" found.`);
        }
    });
    context.subscriptions.push(toggleLineCmd, toggleAllUnnamedCmd, toggleByNameCmd);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map