# vsPrettier - Formatter for VSCode ( support prettier plugin )

## Installation
Install on VSCode Extension. Search term ``vsPrettier``

[vsPrettier - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=teeLang.vsprettier)

```
ext install teeLang.vsprettier
```

## Usage
### Use command pallete
```
1. CMD + Shift + P -> Format Document
OR
1. Select the text you want to format
2. CMD + Shift + P -> Format Selection
```

### Custom keybinding
You can rebind editor.action.formatDocument and editor.action.formatSelection in the Keyboard shortcuts.

## Features
1. Implement VSCode Language Server and Language Client.
2. Support local package -> global package -> default builtin extension package.
3. Support local prettier's plugin ( php, python, swift, apex, elm, java, pg, ruby). 
4. Caching config for fastest formatting speed.
5. ... 

## TODO

- [ ] Optimize Cache function on Language Server
- [ ] Create new solution to resolve cycle loading config & package for eslint,tslint,stylelint .
- [ ] ... Add request features if you have free ideas

## Contribute
Feel free to open issues or pull request .

## Community Thanks
* [VScode](https://code.visualstudio.com)
* [Prettier](https://prettier.io)
* [Eslint](https://eslint.org)
* [Tslint](https://palantir.github.io/tslint/)
* [Typescript](https://www.typescriptlang.org/)
