'use strict';
import * as vscode from 'vscode';
import { LanguageClientOptions, ServerOptions, LanguageClient } from 'vscode-languageclient';
import { ZigFormatProvider, ZigRangeFormatProvider } from './zigFormat';

const ZIG_MODE: vscode.DocumentFilter = { language: 'zig', scheme: 'file' };

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    const zigFormatStatusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
    );
    const logChannel = vscode.window.createOutputChannel('zig');
    context.subscriptions.push(logChannel);
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            ZIG_MODE,
            new ZigFormatProvider(logChannel),
        ),
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentRangeFormattingEditProvider(
            ZIG_MODE,
            new ZigRangeFormatProvider(logChannel),
        ),
    );

    const conf = vscode.workspace.getConfiguration("zig");
	
	let serverOptions: ServerOptions = {
		command: conf.get<string>("zigPath") || 'zig',
		args: ['run', '/home/mwa/code/zig/language-server/server.zig'],
		options: { stdio: 'pipe' }
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'zig' }]
	};

	client = new LanguageClient(
		'zigLanguageServer',
		'Zig Language Server',
		serverOptions,
		clientOptions
	);

	client.start();
}
export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
