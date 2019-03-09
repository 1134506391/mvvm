class Observer {
    constructor(data) {
        this.observer(data)
    }
    observer(data) {
        if (!data || typeof data !== 'object') {
            return;
        }
        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key]);
            this.observer(data[key])
        })
    }
    defineReactive(obj, key, value) {
        let that = this;
        let dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue) {
                if (newValue != value) {
                    that.observer(newValue)
                    value = newValue;
                    dep.notify();
                }
            }
        })
    }
}


class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(watcher) {
        this.subs.push(watcher);
    }
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}