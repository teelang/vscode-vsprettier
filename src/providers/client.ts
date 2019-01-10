import { join } from 'path';
import { merge } from 'lodash';
import * as vscode from 'vscode';
import * as client from 'vscode-languageclient';
import { CONFIG_SECTION, EXT_NAME } from '../constant';
import { Server } from 'net';

export default class ClientProvider {
  clients: Map<string, client.LanguageClient> = new Map<string, client.LanguageClient>();
  serverOpts: client.ServerOptions;
  clientOpts: client.LanguageClientOptions;
  outputChannel: vscode.OutputChannel;
  statusBarItem: vscode.StatusBarItem;
  constructor(private readonly config: any, clientOpts?: client.LanguageClientOptions, serverOpts?: client.ServerOptions) {
    this.clientOpts = merge(
      {
        documentSelector: [{ scheme: 'file' }, { scheme: 'untitled' }],
        outputChannel: this.outputChannel,
        synchronize: {
          fileEvents: [
            vscode.workspace.createFileSystemWatcher('**/.prettierr{c.js,c.yaml,c.yml,c,c.json}'),
            vscode.workspace.createFileSystemWatcher('**/.prettierignore'),
            vscode.workspace.createFileSystemWatcher('**/package.json'),
          ],
        },
        middleware: {},
      },
      clientOpts
    );
    this.serverOpts = merge(
      {
        run: {
          module: null,
          runtime: null,
          transport: client.TransportKind.ipc,
          options: { cwd: process.cwd() },
        },
        debug: {
          module: null,
          runtime: null,
          transport: client.TransportKind.ipc,
          options: { cwd: process.cwd(), execArgv: ['--nolazy', '--inspect=6010'] },
        },
      },
      serverOpts
    );
  }
  setOutputChannel(outputChanel: vscode.OutputChannel) {
    this.outputChannel = outputChanel;
    return this;
  }
  setStatusBarItem(statusBarItem: vscode.StatusBarItem) {
    this.statusBarItem = statusBarItem;
    return this;
  }
  createClient(name: string): client.LanguageClient {
    if (this.clients.has(name) == false) {
      let clientInstance = new client.LanguageClient(EXT_NAME, EXT_NAME, this.serverOpts, this.clientOpts);
      this.setupClient(clientInstance);
      this.clients.set(name, clientInstance);
    }
    return this.clients.get(name);
  }
  start() {
    this.clients.forEach(client => {
      client.start();
    });
  }
  setupClient(clientInstance: client.LanguageClient): void {
    clientInstance.onDidChangeState(e => {
      if(e.newState == client.State.Running) {
        this.statusBarItem.text = '$(check) '+EXT_NAME;
        this.statusBarItem.tooltip = `${EXT_NAME} is Running`;
      }
      if(e.newState == client.State.Starting) {
        this.statusBarItem.text = '$(eye) '+EXT_NAME;
        this.statusBarItem.tooltip = `${EXT_NAME} is Starting`;
      }
      if(e.newState == client.State.Stopped) {
        this.statusBarItem.text = '$(alert) '+EXT_NAME;
        this.statusBarItem.tooltip = `${EXT_NAME} is Stopped`;
      }
    });
  }
  trace(message, type = 'info'): void {
    this.outputChannel.appendLine(message);
  }
  dispose() {
    this.clients.forEach(client => {
      client.stop();
    });
  }
}
