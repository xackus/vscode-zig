import { buildDiagnosticCollection, logChannel } from './extension';
import * as cp from 'child_process';
import * as vscode from 'vscode';

export function zigBuild(): void {
    const editor = vscode.window.activeTextEditor;

    const textDocument = editor.document;
    if (textDocument.languageId !== 'zig') {
        return;
    }

    const config = vscode.workspace.getConfiguration('zig');
    const buildOption = config.get<string>("buildOption");
    let processArg: string[] = [buildOption];

    switch (buildOption) {
        case "build":
            break;
        default:
            processArg.push(textDocument.fileName);
            break;
    }

    let extraArgs = config.get<string[]>("buildArgs");;
    extraArgs.forEach(element => {
        processArg.push(element);
    });

    // TODO: switch rootpath to support multi root
    const cwd = vscode.workspace.rootPath;
    const buildPath = config.get<string>("zigPath") || 'zig';

    logChannel.appendLine(`Starting building the current workspace at ${cwd}`);

    let childProcess = cp.execFile(buildPath, processArg, { cwd }, (err, stdout, stderr) => {
        logChannel.appendLine(stderr);
        var diagnostics: { [id: string]: vscode.Diagnostic[]; } = {};
        let regex = /(\S.*):(\d*):(\d*): ([^:]*): (.*)/g;

        buildDiagnosticCollection.clear();
        for (let match = regex.exec(stderr); match;
            match = regex.exec(stderr)) {
            let path = match[1].trim();
            let line = parseInt(match[2]) - 1;
            let column = parseInt(match[3]) - 1;
            let type = match[4];
            let message = match[5];

            let severity = type.trim().toLowerCase() === "error" ?
                vscode.DiagnosticSeverity.Error :
                vscode.DiagnosticSeverity.Information;

            let range = new vscode.Range(line, column, line, column + 1);

            if (diagnostics[path] == null) diagnostics[path] = [];
            diagnostics[path].push(new vscode.Diagnostic(range, message, severity));
        }

        for (let path in diagnostics) {
            let diagnostic = diagnostics[path];
            buildDiagnosticCollection.set(vscode.Uri.file(path), diagnostic);
        }
    });
}
