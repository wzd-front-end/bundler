# 模仿webpack实现简单的打包工具
**webpack**是一款前端项目构建工具，随着现在前端生态的发展，webpack已经成为前端开发人员必备的技能之一，很多开发人员开始使用react和vue的时候，都会使用默认的单页应该创建指令来创建一个工程化项目，实际上，这些工程化的项目都是基于webpack来搭建的；
当我们熟悉使用这些工程话文件的时候，我们就会开始思考，为什么我们写的代码直接在浏览器运行不了，经过webpack打包以后就能在浏览器上运行，打包的过程发生了什么？

实际上，webpack 是基于node实现的，打包的过程包括了读取文件流进行处理和模块依赖的引入解析和导出等过程，下面来简单的实现这么一个过程。

## 项目初始化
首先，我们新建一个文件夹，可以命名为bundler，并在命令行工具（黑窗口）中使用npm init进行初始化，初始化的过程中，会要求我们输入项目相关的一些信息，如下

``` python
Press ^C at any time to quit.
package name: (bundler)
version: (1.0.0)
description:
entry point: (index.js)
test command:
git repository: (https://github.com/wzd-front-end/bundler.git)
keywords:
author:
license: (ISC)
```

如果我们想跳过这一个环节，可以使用npm init -y，加上-y后，自动生成默认配置，不会再询问；

接下来，在创建测试用例之前，我们先来构建我们的项目，下面是我们的目录结构,src文件夹下面的文件为我们的测试例子：
``` python
--bundler
 --src
    index.js
    message.js
    word.js
 --node_modules
 --bundler.js
 --package.json
 --README.md
```
word.js代码
``` python
export const word = 'hello';
```
message.js代码
``` python
import { word } from './word.js';
const message = `say ${word}`;
export default message;
```
index.js代码
``` python
import message from './message.js';
console.log(message);
```
通过观察上面简单的三个文件的代码，我们会发现，这几段代码的主要功能模块的导入和导出解析,这也是打包工具的主要功能，那这些代码是如何转换为浏览器可识别代码的,接下来，我们来通过代码演示实现这个过程；
## 模块解析
首先，我们在bundler文件下创建bundler.js文件，作为我们打包过程的执行文件，然后我们去执行node bundler.js来执行打包的过程；我们先创建一个名为moduleAnalyser的函数来解析模块，该函数接收一个filename地址字符串，获取到对应地址的文件，并通过
**@babel/parser**模块的parser方法将对应的文件字符串转化为抽象节点树，不清楚抽象节点树的小伙伴可以通过把下面代码中的ast在控制台中打印出来，观察其结构；


