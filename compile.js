class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        if (this.el) {
            let fragment = this.node2fragment(this.el);
            this.compile(fragment);
            this.el.appendChild(fragment)
        }
    }
    isElementNode(node) {
        return node.nodeType === 1;
    }
    isDirective(name) {
        return name.includes('v-')
    }
    compileElement(node) {
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            let attrName = attr.name;
            if (this.isDirective(attrName)) {
                let expr = attr.value;
                let [, type] = attrName.split('-');
                CompileUtil[type](node, this.vm, expr)
            }
        })
    }
    compileText(node) {
        let expr = node.textContent;
        let reg = /\{\{([^}]+)\}\}/g;
        if (reg.test(expr)) {
            CompileUtil['text'](node, this.vm, expr)
        }
    }
    compile(fragment) {
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                this.compileElement(node)
                this.compile(node)
            } else {
                this.compileText(node)
            }
        })
    }
    node2fragment(el) {
        let fragment = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment;
    }
}

CompileUtil = {
    getVal(vm, expr) {
        expr = expr.split('.');
        return expr.reduce((prev, next) => {
            return prev[next]
        }, vm.$data)
    },
    getTextVal(vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g, (...argument) => {
            return this.getVal(vm, argument[1])
        })
    },
    setVal(vm, expr, value) {
        expr = expr.split('.');
        return expr.reduce((prev, next, currentIndex) => {
            if (currentIndex === expr.length - 1) {
                return prev[next] = value
            }
            return prev[next]
        }, vm.$data)
    },
    model(node, vm, expr) {
        let updateFn = this.updater['modelUpdater'];
        let value = this.getVal(vm, expr);
        new Watcher(vm, expr, (newValue) => {
            updateFn && updateFn(node, this.getVal(vm, expr))
        })
        node.addEventListener('input', (e) => {
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue)
        })
        updateFn && updateFn(node, value)
    },
    text(node, vm, expr) {
        let updateFn = this.updater['textUpdater'];
        let value = this.getTextVal(vm, expr);
        expr.replace(/\{\{([^}]+)\}\}/g, (...argument) => {
            new Watcher(vm, argument[1], (newValue) => {
                updateFn && updateFn(node, this.getTextVal(vm, expr))
            })
        })
        updateFn && updateFn(node, value)
    },
    updater: {
        modelUpdater(node, value) {
            node.value = value;
        },
        textUpdater(node, value) {
            node.textContent = value;
        }
    }
}