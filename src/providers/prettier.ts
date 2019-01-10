import * as server from 'vscode-languageserver';
import * as prettier from 'prettier';
import { IPrettierConfig, IExtensionConfig } from '../types.d';
import { exists, getGlobalPaths, findPrettier, findPackage } from '../utils';
import { merge } from 'lodash';

var globalPaths = getGlobalPaths();

export default class PrettierProvider {
  configCaches: Map<string, IPrettierConfig> = new Map<string, IPrettierConfig>();
  configFileCaches = new Map<string, any>();
  libraryCaches: Map<string, any> = new Map<string, any>();
  libraryPathCaches: Map<string, string> = new Map<string, string>();
  librarySupportCaches: Map<string, string[]> = new Map<string, string[]>();
  formatterCaches: Map<string, string> = new Map<string, string>();
  trace: Function;

  public getConfig(document: server.TextDocument, workspaceConfig: IExtensionConfig) {
    if (this.configCaches.has(document.uri) === false) {
      let library = this.getLibrary(document);
      let filePath = server.Files.uriToFilePath(document.uri);
      let localConfig = library.resolveConfig.sync(filePath, { useCache: false });
      let localConfigFile = library.resolveConfigFile.sync(filePath, { useCache: false });
      this.cacheConfigFile(localConfigFile, document);
      let formatConfig: IPrettierConfig = merge(workspaceConfig, localConfig);
      this.configCaches.set(document.uri, formatConfig);
    }
    return this.configCaches.get(document.uri);
  }

  public getFormatter(filePath: string, languageId: string, config: IExtensionConfig): string {
    if (this.formatterCaches.has(filePath)) {
      if (config.useTslint == true && languageId == 'typescript') {
        this.formatterCaches.set(filePath, findPackage(filePath, 'prettier-tslint'));
      }
      if (config.useEslint == true && 'javascript,javascriptreact,vue'.split(',').indexOf(languageId) > -1) {
        this.formatterCaches.set(filePath, findPackage(filePath, 'prettier-eslint'));
      }
      if (config.useStylelint == true && ['postcss', 'css', 'scss', 'less'].indexOf(languageId) > -1) {
        this.formatterCaches.set(filePath, findPackage(filePath, 'prettier-stylelint'));
      }
    }
    return this.formatterCaches.get(filePath);
  }

  public getLibraryPath(document: server.TextDocument, wsConfig?: IExtensionConfig): string {
    if (this.libraryPathCaches.has(document.uri) === false) {
      let selectedGlobalPath = wsConfig && wsConfig.packageManager == 'yarn' ? globalPaths.yarn : globalPaths.npm;
      let filePath = server.Files.uriToFilePath(document.uri);
      this.libraryPathCaches.set(document.uri, findPrettier(filePath, [selectedGlobalPath]));
    }
    return this.libraryPathCaches.get(document.uri);
  }

  public getLibrary(document: server.TextDocument, wsConfig?: IExtensionConfig): prettier {
    let libraryPath = this.getLibraryPath(document, wsConfig);
    return require(libraryPath);
  }

  public getLibrarySupport(document: server.TextDocument, wsConfig: IExtensionConfig): string[] {
    let cacheKey = this.getLibraryPath(document, wsConfig);
    if (this.librarySupportCaches.has(cacheKey)) {
      let supportInfo = this.getLibrary(document, wsConfig).getSupportInfo();
      let supportLaguageIds = [];
      for (let i = 0; i < supportInfo.length; ++i) {
        supportLaguageIds.concat(supportInfo[i].vscodeLanguageIds);
      }
      this.librarySupportCaches.set(cacheKey, supportLaguageIds);
    }
    return this.librarySupportCaches.get(cacheKey);
  }

  public shouldFormat(document: server.TextDocument, wsConfig: IExtensionConfig): boolean {
    return true;
  }

  public format(document: server.TextDocument, wsConfig: IExtensionConfig): server.TextEdit[] {
    if (!this.shouldFormat(document, wsConfig)) return [];
    let formatted: string;
    let languageId = document.languageId;
    let filePath = server.Files.uriToFilePath(document.uri);
    if (wsConfig.useTslint == true && languageId == 'typescript') {
      let formatter = require(findPackage(filePath, 'prettier-tslint'));
      formatted = formatter.format({
        text: document.getText(),
        filePath: filePath,
        fallbackPrettierOptions: wsConfig,
      });
    } else if (wsConfig.useEslint == true && 'javascript,javascriptreact,vue'.split(',').indexOf(languageId) > -1) {
      let formatter = require(findPackage(filePath, 'prettier-eslint'));
      formatted = formatter.format({
        text: document.getText(),
        filePath: filePath,
        fallbackPrettierOptions: wsConfig,
      });
    } else if (wsConfig.useStylelint == true && ['postcss', 'css', 'scss', 'less'].indexOf(languageId) > -1) {
      let formatter = require(findPackage(filePath, 'prettier-stylelint'));
      formatted = formatter.format({
        text: document.getText(),
        filePath: filePath,
        prettierOptions: wsConfig,
      });
    } else {
      let config = this.getConfig(document, wsConfig);
      config.filepath = filePath;
      formatted = this.getLibrary(document, wsConfig).format(document.getText(), config);
    }
    return [server.TextEdit.replace(this.getFullDocumentRange(document), formatted)];
  }

  private getFullDocumentRange(document: server.TextDocument) {
    return server.Range.create(server.Position.create(0, 0), document.positionAt(document.getText().length));
  }

  public clearConfigFileCache(uri: string): void {
    let cacheConfigFileName = server.Files.uriToFilePath(uri);
    if (this.configFileCaches.has(cacheConfigFileName) == false) return;
    this.configFileCaches.get(cacheConfigFileName).map(i => {
      this.trace(`configCaches:delete: ${cacheConfigFileName}`);
      this.configCaches.delete(i);
    });
    this.configFileCaches.delete(cacheConfigFileName);
  }

  public cacheConfigFile(path, docUri): void {
    if (this.configFileCaches.has(path) === false) {
      this.configFileCaches.set(path, [docUri]);
    } else {
      this.configFileCaches.get(path).push(docUri);
    }
  }
  public initDocument(document: server.TextDocument, config: IExtensionConfig) {
    let languageId = document.languageId;
  }
  public handleDocumentClose(document: server.TextDocument) {
    this.clearConfigFileCache(document.uri);
  }

  public dispose() {
    this.configCaches.clear();
    this.libraryCaches.clear();
    this.libraryPathCaches.clear();
    this.librarySupportCaches.clear();
  }
}
