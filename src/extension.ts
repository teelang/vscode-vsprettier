import { join } from 'path';
import * as vscode from 'vscode';
import ClientProvider from './providers/client';
import { CONFIG_SECTION, EXT_NAME } from './constant';

export async function activate(context: vscode.ExtensionContext) {
  let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
  let outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel(EXT_NAME);
  let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(CONFIG_SECTION);
  statusBarItem.text = EXT_NAME;
  statusBarItem.show();
  
  let serverOption = {
    module: context.asAbsolutePath(join('out', 'server.js')),
  };
  let serverOptions = {
    run: serverOption,
    debug: serverOption,
  };
  let clientOptions = {
    synchronize: {
      configurationSection: CONFIG_SECTION,
    },
    diagnosticCollectionName: EXT_NAME,
    initializationFailedHandler: (error): boolean => {
      outputChannel.appendLine(`${EXT_NAME} initialization failed`);
      outputChannel.show(true);
      return false;
    },
  };
  outputChannel.appendLine(`Folders: ${JSON.stringify(vscode.workspace.workspaceFolders)}`);
  let clientProvider = new ClientProvider(config, clientOptions, serverOptions);
  clientProvider.setOutputChannel(outputChannel);
  clientProvider.setStatusBarItem(statusBarItem);
  clientProvider.createClient('default');
  clientProvider.start();
  context.subscriptions.push(clientProvider);
}

export function deactivate(): void {}
