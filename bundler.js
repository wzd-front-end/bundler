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
            const newFile = './' + path.join(dirname, node.source.value)
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
