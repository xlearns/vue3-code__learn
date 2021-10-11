var weakmap = new WeakMap();
var stackEffects = [];
var config = {
    get: function (obj, key) {
        var res = obj[key];
        myTrack(obj, key);
        return typeof res == 'object' ? reactive(res) : res;
    },
    set: function (obj, key, val) {
        obj[key] = val;
        myTrigger(obj, key, val);
    }
};
function myReactive(obj) {
    return new Proxy(obj, config);
}
function myTrack(obj, key) {
    var effect = stackEffects[stackEffects.length - 1];
    if (effect) {
        var depmap = weakmap.get(obj);
        if (!depmap) {
            depmap = new Map();
            weakmap.set(obj, depmap);
        }
        var deps = depmap.get(key);
        if (!deps) {
            deps = new Set();
            depmap.set(key, deps);
        }
        //初始化完成
        if (!deps.has(effect)) {
            deps.push(effect);
            effect.deps.push(effect);
        }
    }
}
function myTrigger(obj, key, val) {
    var depmap = weakmap.get(obj);
    if (!depmap)
        return;
    var effects = new Set();
    var computeds = new Set();
    if (key) {
        var dep = depmap.get(key);
        if (!dep)
            return;
        dep.forEach(function (effect) {
            if (effect.computed) {
                computeds.add(effect);
            }
            else {
                effects.add(effect);
            }
        });
    }
    effects.forEach(function (effect) { return effect(); });
    computeds.forEach(function (computed) { return computed(); });
}
function myeffect(fn, option) {
    if (option === void 0) { option = {}; }
    var e = createReactObj(fn, option);
    if (!option.lazy) {
        e();
    }
    return e;
}
function createReactObj(fn, option) {
    var effect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return myRun(effect, fn, args);
    };
    effect.deps = [];
    effect.computed = option.computed;
    effect.lazy = option.lazy;
    return effect;
}
function myRun(effect, fn, args) {
    if (stackEffects.indexOf(effect) == -1) {
        try {
            stackEffects.push(effect);
            return fn.apply(void 0, args);
        }
        finally {
            stackEffects.pop();
        }
    }
}
function myComputed(fn) {
    var runner = effect(fn, { computed: true, lazy: true });
    return {
        effect: runner,
        get value() {
            return runner();
        }
    };
}
