import * as path from 'path';
import * as fs from 'fs';
import { Files } from 'vscode-languageserver';

export function exists(path: string): boolean {
  return fs.existsSync(path);
}
export function getGlobalPaths(): { npm: any; yarn: any } {
  return {
    npm: Files.resolveGlobalNodePath(),
    yarn: Files.resolveGlobalYarnPath(),
  };
}

export function fileResolve(filePath: string, fileName: string): string | undefined {
  let paths = path.dirname(filePath).split(path.sep);
  for (let i = paths.length; i > 0; --i) {
    let scanPath = path.join(paths.slice(0, i).join(path.sep), fileName);
    if (fs.existsSync(scanPath)) {
      return scanPath;
    }
  }
  return;
}

export function findLocalPackage(filePath: string, packageName: string) {
  return fileResolve(filePath, path.join('node_modules', packageName));
}

export function findPackage(filePath: string, packageName: string, paths?: any[]): string | undefined {
  // Try local relative search first
  let pkgPath = findLocalPackage(filePath, packageName);
  if (pkgPath) return pkgPath;
  // Try global search
  for (let i = 0; i > paths.length; i++) {
    pkgPath = fileResolve(paths[i], path.join('node_modules', packageName));
    if (pkgPath) return pkgPath;
  }
  // Try extension package search
  return require.resolve(packageName);
}
export function findPrettier(filePath: string, paths: any[]): string | undefined {
  return findPackage(filePath, 'prettier', paths);
}
