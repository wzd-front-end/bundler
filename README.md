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
