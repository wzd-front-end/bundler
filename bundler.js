const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

// 用于分析单个模块
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
    ImportDeclaration({node}) {
      // 获取传入路劲的根路径
      const dirname = path.dirname(filename)
      // 拼接文件中实际引入文件的路径

      const newFile = dirname + node.source.value.substring(1)
      console.log(newFile)
      // 将映射关系存入dependencies对象中
      dependencies[node.source.value] = newFile
    }
  })
  // 利用presets将ast转化为对应的es5代码，第一个参数是抽象节点树，第二个参数是源码，第三个参数是配置
  const {code} = babel.transformFromAst(ast, null, {
    presets: ["@babel/preset-env"]
  })
  return {
    filename,
    dependencies,
    code
  }
}
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
