import * as vscode from 'vscode';

const MARKER = 'DBG05';

// Maps a language to its comment symbol
function getCommentSymbol(languageId: string): string | undefined {
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

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('debug-comments.toggle', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const symbol = getCommentSymbol(editor.document.languageId);
		if (!symbol) {
			vscode.window.showInformationMessage('Debug Comments: language not supported yet.');
			return;
		}

		// Escape symbol for regex use (// has special chars, # does not, but let's be safe)
		const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const markerRegex = new RegExp(`^(\\s*)${escapedSymbol}\\s*${MARKER}\\s?(.*)$`);

		await editor.edit(editBuilder => {
			for (const selection of editor.selections) {
				const lineNumber = selection.active.line;
				const line = editor.document.lineAt(lineNumber);
				const text = line.text;

				const match = text.match(markerRegex);

				if (match) {
					// Currently a debug comment -> uncomment it (restore original code)
					const indent = match[1];
					const code = match[2];
					editBuilder.replace(line.range, `${indent}${code}`);
				} else {
					// Currently normal code -> turn it into a debug comment
					const leadingWhitespaceMatch = text.match(/^(\s*)/);
					const indent = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : '';
					const code = text.slice(indent.length);
					editBuilder.replace(line.range, `${indent}${symbol} ${MARKER} ${code}`);
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}