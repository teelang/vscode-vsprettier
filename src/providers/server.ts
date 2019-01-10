import * as server from 'vscode-languageserver';
import prettier from 'prettier';
import { IPrettierConfig, IExtensionConfig } from '../types.d';
import PrettierProvider from './prettier';
import { CONFIG_SECTION } from '../constant';

export default class ServerProvider {
  configCaches = new Map<string, IExtensionConfig>();
  connection: server.IConnection = server.createConnection(server.ProposedFeatures.all);
  documents: server.TextDocuments = new server.TextDocuments();
  prettier: PrettierProvider = new PrettierProvider();

  clientCaps: server.ClientCapabilities;

  constructor() {
    this.prettier.trace = this.trace.bind(this);
  }
  async start(): Promise<ServerProvider> {
    this.setupException();
    this.setupDocuments();
    this.setupConnection();
    return this;
  }
  dispose(): void {
    this.configCaches.clear();
    this.prettier.dispose();
    this.connection.dispose();
  }
  setupException(): void {
    process.on('uncaughtException', reason => {
      this.trace(`Uncaught Exception reason:, ${reason}`, 'warn');
    });
    process.on('unhandledRejection', (reason, p) => {
      this.trace(`Unhandled Rejection at: Promise ${p} reason:, ${reason}`, 'warn');
    });
  }
  setupDocuments(): void {
    this.documents.onDidOpen(e => {
      this.getConfig(e.document.uri).then((config: IExtensionConfig) => {
        this.prettier.getConfig(e.document, config);
      });
    });
    this.documents.onDidClose(e => {
      this.prettier.handleDocumentClose(e.document);
      this.configCaches.delete(e.document.uri);
    });
    this.documents.listen(this.connection);
  }
  setupConnection(): void {
    this.connection.onInitialize(
      (params: server.InitializeParams): server.InitializeResult => {
        this.clientCaps = params.capabilities;
        return {
          capabilities: {
            textDocumentSync: server.TextDocumentSyncKind.Full,
            documentFormattingProvider: true,
          },
        };
      }
    );
    this.connection.onInitialized(() => {
      if (this.clientCaps.workspace && this.clientCaps.workspace.configuration) {
        this.connection.client.register(server.DidChangeConfigurationNotification.type, undefined);
      }
      if (this.clientCaps.workspace && this.clientCaps.workspace.workspaceFolders) {
        this.connection.client.register(server.DidChangeWorkspaceFoldersNotification.type, undefined);
      }
      this.connection.client.register(server.DidChangeWatchedFilesNotification.type, undefined);
      this.connection.client.register(server.DidOpenTextDocumentNotification.type, undefined);
      if (this.clientCaps.workspace && this.clientCaps.workspace.workspaceFolders) {
        this.connection.workspace.onDidChangeWorkspaceFolders(change => {
          this.trace(`onDidChangeWorkspaceFolders: changed`);
        });
      }
      this.connection.onDocumentFormatting(this.handleDocumentFormatting.bind(this));
      this.connection.onDidChangeConfiguration(change => {
        this.configCaches.clear();
        this.documents.all().map(i => {
          this.getConfig(i.uri);
        });
      });
      this.connection.onDidChangeWatchedFiles(params => {
        this.prettier.clearConfigFileCache(params.changes[0].uri);
      });
    });
    this.connection.listen();
  }

  async getConfig(uri: string): Promise<IExtensionConfig> {
    if (this.configCaches.has(uri) === false) {
      let baseConfig = await this.connection.workspace.getConfiguration({ scopeUri: uri, section: CONFIG_SECTION });
      this.configCaches.set(uri, baseConfig);
    }
    return this.configCaches.get(uri);
  }

  async handleDocumentFormatting(params: server.DocumentFormattingParams): Promise<server.TextEdit[]> {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return [];
    let workspaceConfig = await this.getConfig(document.uri);
    return this.prettier.format(document, workspaceConfig);
  }

  trace(message, type = 'info'): void {
    this.connection.console[type](message);
  }
}
