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
**@babel/parser**模块的parser方法将对应的文件字符串转化为抽象节点树，不清楚抽象节点树的小伙伴可以通过把下面代码中的ast在控制台中打印出来，观察其结构；在我们生成节点树后，我们需要获取其中的import节点，很多人可以想着，那通过字符串截取出import字符不就u可以吗？
当只有一个import的时候，确实可以，但多个的时候，我们通过截取来实现就比较复杂了，这个时候，我们可以借助
**@babel/traverse**来帮我们实现，具体实现可以查看babel官网，引入该模块后，我们可以将parser获取到ast作为参数传入；通过前面输出的节点树我们可以发现，import 节点的type类型为ImportDeclaration,我们可以在traverse()的第二个参数中传入一个对象，以节点的type类型作为名称，可以帮我们获取到对应的节点，最后我们再将处理后的ast重新转化为代码字符串返回，具体实现如下：
``` python
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

const moduleAnalyser = (filename) => {
    // 通过fs模块的异步读取文件api获取传入路径的文件，编码格式为'utf-8'
    const content = fs.readFileSync(filename, 'utf-8');
    // 通过parser.parse方法将读取到的代码转化为抽象节点树，其中sourceType类型是指定导入文件的方式
    const ast = parser.parse(content, {
        sourceType: "module"
    });
    const dependencies = {}
    // 通过traverse获取节点树中类型为ImportDeclaration的节点，并将其映射关系保存到dependencies对象中
    traverse(ast, {
        ImportDeclaration({ node }) {
            // 获取传入路劲的根路径
            const dirname = path.dirname(filename)
            // 拼接文件中实际引入文件的路径

            const newFile = dirname + node.source.value
            // 将映射关系存入dependencies对象中
           dependencies[node.source.value] = newFile
        }
    })
    // 利用presets将ast转化为对应的es5代码，第一个参数是抽象节点树，第二个参数是源码，第三个参数是配置
    const { code } = babel.transformFromAst(ast, null, {
        presets: ["@babel/preset-env"]
    })
    return {
        filename,
        dependencies,
        code
    }
}
console.log(moduleAnalyser('./src/index.js'))
```
通过上面代码，我们可以得到一个模块入口文件的分析，包括模块的名称，依赖以及代码，但我们只是得到一个入口文件的解析，入口模块里面有自己的依赖，依赖里面又有自己的依赖，因此，我们需要去对每一个模块进行深度分析；

``` python
....
// 用于循环调用多个模块
const makeDependenciesGraph = (entry) => {
  // 首先获取入口模块的分析对象
  const entryModule = moduleAnalyser(entry)
  // 保存全部模块的分析对象
  const graphArray = [entryModule]
  // 对graphArray 中的每一项进行分析，分析每一项中的dependencies，如果存在，我们就把新的依赖模块进行分析，直到全部查找完为止
  for (let i = 0; i < graphArray.length; i++) {
    const item = graphArray[i]
    const {dependencies} = item
    // 如果dependencies不为空对象,就利用for..in枚举对象中每个依赖模块，将依赖模块的路径存入，分析生成新的分析结果对象，存入到graphArray数组中
    if (JSON.stringify(dependencies) !== '{}') {
      for (let j in dependencies) {
        graphArray.push(moduleAnalyser(dependencies[j]))
      }
    }
  }
  // 我们把最后的结果通过每个分析结果对象的filename作为key值，存入graph对象中，目的是为了方便后续通过模块路径进行取值
  const graph = {}
  graphArray.forEach(item => {
    graph[item.filename] = {
      dependencies: item.dependencies,
      code: item.code
    }
  })
  return graph
}
console.log(makeDependenciesGraph('./src/index.js'))
```
执行完上面的操作后，我们通过入口文件进入后所有相关的模块已经全部解析完毕，接下来，我们需要把这些模块，转化为浏览器可以执行的代码，转化后生成的代码中，我们会发现，包含了require方法和export对象，这都是我们浏览器不具备的，我们需要进一步声明对应的方法，让浏览器能找到对应的方法去执行，接下来我们执行最后一步的生成代码操作
``` python
....
const generateCode = (entry) => {
  // 因为我们需要返回对应的可执行字符串，所以我们需要把对象先转化为字符串，不然会出现'[object, object]'
  const graph = JSON.stringify(makeDependenciesGraph(entry));
  // 返回字符串使用模板字符串，且使用到闭包，防止污染全局
  return `
		(function(graph){
			function require(module) { 
				function localRequire(relativePath) {
					return require(graph[module].dependencies[relativePath]);
				}
				var exports = {};
				(function(require, exports, code){
					eval(code)
				})(localRequire, exports, graph[module].code);
				return exports;
			};
			require('${entry}')
		})(${graph});
	`;
}
const code = generateCode('./src/index.js')
console.log(code)
```
最后我们在控制台输出的代码，复制到浏览器的控制抬中执行，按照预定的结果运行输出了我们的字串值
``` python
(function(graph){
  function require(module) {
    function localRequire(relativePath) {
      return require(graph[module].dependencies[relativePath]);
    }
    var exports = {};
    (function(require, exports, code){
      eval(code)
    })(localRequire, exports, graph[module].code);
    return exports;
  };
  require('./src/index.js')
})({"./src/index.js":{"dependencies":{"./message.js":"./src\\message.js"},"code":"\"use strict\";\n\nvar _message = _interopRequireDefault(require(\"./message.js\"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { \"default\": obj }; }\n\nconsole.log(_message[\"default\"]);"},"./src\\message.js":{"dependencies":{"./word.js":"./src\\word.js"},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports[\"default\"] = void 0;\n\nvar _word = require(\"./word.js\");\n\nvar message = \"say \".concat(_word.word);\nvar _default = message;\nexports[\"default\"] = _default;"},"./src\\word.js":{"dependencies":{},"code":"\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.word = void 0;\nvar word = 'hello';\nexports.word = word;"}});

```
以上的代码就是我们打包后的代码，我们会发现，在我们打包后，需要用到其他的模块的时候，会调用require 方法，require方法又会通过传入的地址路径参数去查询我们生成的以filename为key值的对象，找到对应的code，利用eval()方法去执行，这就是打包工具的一个基本原理。
