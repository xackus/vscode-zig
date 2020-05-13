'use strict';
import * as vscode from 'vscode';
import ZigCompilerProvider from './zigCompilerProvider';
import { zigBuild } from './zigBuild';
import { LanguageClientOptions, ServerOptions, LanguageClient } from 'vscode-languageclient';
import { ZigFormatProvider, ZigRangeFormatProvider } from './zigFormat';

const ZIG_MODE: vscode.DocumentFilter = { language: 'zig', scheme: 'file' };

export let buildDiagnosticCollection: vscode.DiagnosticCollection;
export const logChannel = vscode.window.createOutputChannel('zig');
export const zigFormatStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    let compiler = new ZigCompilerProvider();
    compiler.activate(context.subscriptions);
    vscode.languages.registerCodeActionsProvider('zig', compiler);

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

    buildDiagnosticCollection = vscode.languages.createDiagnosticCollection('zig');
    context.subscriptions.push(buildDiagnosticCollection);

    // Commands
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.workspace', () => zigBuild()));
    context.subscriptions.push(vscode.commands.registerCommand('zig.format.file', () => console.log('test')));

    const conf = vscode.workspace.getConfiguration("zig");

    const serverOptions: ServerOptions = {
        command: conf.get<string>("zigPath") || 'zig',
        args: ['build', 'run'],
        options: { cwd: conf.get<string>("zigLspPath") }
    };

    const clientOptions: LanguageClientOptions = {
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
