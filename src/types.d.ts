export interface IBaseConfig {
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  jsxSingleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  bracketSpacing: boolean;
  jsxBracketSameLine: boolean;
  arrowParens: 'avoid' | 'always';
  requirePragma: boolean;
  insertPragma: boolean;
  proseWrap: 'preserve' | 'always' | 'never';
  htmlWhitespaceSensitivity: 'css' | 'strict' | 'ignore';
  endOfLine: 'auto' | 'lf' | 'crlf' | 'cr';
}
export interface IPrettierConfig extends IBaseConfig {
  rangeStart?: number | undefined;
  rangeEnd?: number | undefined;
  filepath: string;
}

export interface IExtensionConfig extends IBaseConfig {
  enable: boolean;
  packageManager: 'npm' | 'yarn';
  nodePath: string | undefined;
  exclude: string | string[];
  useTslint: boolean | false;
  useEslint: boolean | false;
  useStylelint: boolean | false;
  plugins: string | string[];
  pluginSearchDirs: string | string[];
}
