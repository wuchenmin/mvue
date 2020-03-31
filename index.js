class Vue {
  //基类 调度
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    //存在根元素，编译模板
    if (this.$el) {
      new Observer(this.$data)
      console.log(this.$data)
      new Compiler(this.$el, this)
    }
  }
}
class Observer {
  constructor(data) {
    console.log(data)
    this.observer(data)
  }
  observer(data) {
    if (data && typeof data == 'object') {
      //如果是对象
      for (let key in data) {
        this.defineReactive(data, key, data[key])
      }
    }
  }
  defineReactive(obj, key, value) {
    this.observer(value)
    Object.defineProperty(obj, key, {
      set: newVal => {
        if (newVal !== value) {
          this.observer(newVal)
          value = newVal
        }
      },
      get() {
        return value
      }
    })
  }
}
class Compiler {
  constructor(el, vm) {
    //判断el属性是不是一个元素
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    //把当前节点中的元素 获取到放到内存中
    let fragment = this.node2fragment(this.el)
    //把节点中的内容进行替换
    //编译模板，用数据编译
    this.compile(fragment)
    //把内容在塞到页面中
    this.el.appendChild(fragment)
  }
  //把当前节点中的元素 获取到放到内存中
  node2fragment(node) {
    //创建一个虚拟节点
    let fragment = document.createDocumentFragment()
    let firstChild
    while ((firstChild = node.firstChild)) {
      //appendChild具有移动性
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  //是不是元素节点
  isElementNode(node) {
    return node.nodeType === 1
  }
  //编译内存中的dom节点
  compile(fragment) {
    let childNodes = fragment.childNodes
    ;[...childNodes].map(child => {
      if (this.isElementNode(child)) {
        this.compileElement(child)
        //如果是元素的话，需要把自己也传进去，进行编译
        this.compile(child)
      } else {
        this.compileText(child)
      }
    })
  }
  //是否带有指令
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }
  //编译元素
  compileElement(node) {
    let attributes = node.attributes
    ;[...attributes].map(attr => {
      // console.log(attr)
      var { name, value: expr } = attr
      if (this.isDirective(name)) {
        let [, directive] = name.split('-')
        //需要调用不同的指令来处理
        CompileUtil[directive](node, expr, this.vm)
        // console.log(node)
      }
    })
  }
  //编译文本
  compileText(node) {
    //判断当前本文节点中内容是否包含{{}}
    let content = node.textContent
    if (/\{\{(.+?)\}\}/.test(content)) {
      CompileUtil['text'](node, content, this.vm)
    }
  }
}

let CompileUtil = {
  //根据表达式取到对应的数据
  getVal(vm, expr) {
    // console.log(expr)
    return expr.split('.').reduce((data, current) => {
      return data[current]
    }, vm.$data)
  },
  //node是节点，expr是表达式，vm是当前实例
  model(node, expr, vm) {
    let fn = this.updater['modelUpdater']
    let value = this.getVal(vm, expr)
    fn(node, value)
  },
  html(node, expr, vm) {},
  text(node, expr, vm) {
    let fn = this.updater['textUpdater']
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(vm, args[1])
    })
    fn(node, content)
  },
  updater: {
    //把数据插入到节点中
    modelUpdater(node, value) {
      node.value = value
    },
    htmlUpdater() {},
    textUpdater(node, text) {
      node.textContent = text
    }
  }
}
