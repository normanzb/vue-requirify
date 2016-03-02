(function() { 
var global = new Function('return this')();var myDefine = (function(factory){ var ret = factory();typeof module != 'undefined' && (module.exports = ret);(function(define){define && define(function(){return ret;});})(global.define);global.VueRequirify = ret; });var require, define;
(function (undef) {
    var mod = {}, g = this;
    var NE = '_NE_', OBJECT = 'object';
    function resolvePath(base, relative){
        var ret, upCount = 0, l;

        base = base.split('/');
        relative = relative.split('/');
        if ( relative[0] == '.' || relative[0] == '..' ) {
            base.pop();
            ret = base.concat(relative);
        }
        else {
            ret = relative;
        }

        for(l = ret.length ; l--; ){
            if ( ret[l] == '.' ) {
                ret.splice( l, 1 );
            }
            else if ( ret[l] == '..' ) {
                upCount++;
            }
            else {
                if ( upCount > 0 ) {
                    ret.splice( l, 2 );
                    upCount--;
                }
            }
        }
        return ret.join('/');
    }
    function returnRequire() {
        return require;
    }
    define = function( ){
        var i, arg, id, deps, factory;
        id = arguments[0];
        deps = arguments[1];
        factory = arguments[2];

        if ( !factory ) { 
            id = null;
            deps = [];

            for( i = 0 ; i < arguments.length; i++ ) {
                arg = arguments[i];
                if ( typeof arg == OBJECT && 'length' in arg ) {
                    deps = arg;
                }
                else if ( typeof arg == OBJECT ) {
                    factory = (function(ret) { return function(){ return ret; }})(arg);
                }
                else if ( typeof arg == 'function' ) {
                    factory = arg;
                }
                else if ( typeof arg == 'string' ) {
                    id = arg
                }
            }

            if ( id == null ) {
                id = NA + '/' + aCount++;
            }
            
            return define.call(g, id, deps, factory);
        }
        if ( id in mod ) {
            // oops, duplicated download?
            return;   
        }
        mod[id] = {
            p: id,
            d: deps,
            f: factory
        };
    };
    define.amd = {};
    require = function(deps, factory){
        var module = this;
        var resolved = [], cur, relative, absolute, typeFactory;

        if ( module == null || module === g ) {
            module = { p: NE };
        }

        if ( typeof deps == 'string' && factory == null ) {
            deps = [deps];
        }

        for(var i = 0; i < deps.length; i++) {
            relative = deps[i];
            absolute = resolvePath( module.p, relative );
            if ( absolute == 'require' ) {
                cur = {
                    p: NE,
                    d: [],
                    f: returnRequire
                };
            }
            else {
                cur = mod[absolute];
            }
            if ( !cur ) {throw 'module not found';}
            resolved.push( require.call( cur, cur.d, cur.f ) );
        }

        resolved.push(require, {});
        if ( factory ) {
            typeFactory = typeof factory;
            if ( !('o' in module) ) {
                if (typeFactory === OBJECT) {
                    module.o = factory;
                }
                else {
                    module.o = factory.apply(g, resolved);
                }
            }
            return module.o;
        }
        else {
            return resolved[0];
        }
    };
}());
define("../bower_components/amdshim/amdshim.embed", function(){});

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('../bower_components/compact-promise/Defer',[], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Defer'] = factory();
  }
}(this, function () {

/*
 * A compact version of Promise
 */
var Defer = function () {
    'use strict';
    var PROTOTYPE = 'prototype', FUNCTION = 'function', RESOLVED = 'resolved', REJECTED = 'rejected';
    function resolve() {
        var me = this;
        me.promise.result = arguments[0];
        if (me.promise[RESOLVED] || me.promise[REJECTED]) {
            return;
        }
        me.promise[RESOLVED] = true;
        for (var i = 0; i < me.promise._s.length; i++) {
            me.promise._s[i].call(null, me.promise.result);
        }
        me.promise._s = [];
    }
    function reject() {
        var me = this;
        me.promise.error = arguments[0];
        if (me.promise[RESOLVED] || me.promise[REJECTED]) {
            return;
        }
        me.promise[REJECTED] = true;
        for (var i = 0; i < me.promise._f.length; i++) {
            me.promise._f[i].call(null, me.promise.error);
        }
        me.promise._f = [];
    }
    function Defer(promise) {
        if (!(this instanceof Defer)) {
            return new Defer(promise);
        }
        var me = this;
        me.promise = promise && 'then' in promise ? promise : new Promise(me);
        me.resolve = function () {
            return resolve.apply(me, arguments);
        };
        me.reject = function () {
            return reject.apply(me, arguments);
        };
    }
    function Promise(arg) {
        this._s = [];
        this._f = [];
        this._defer = arg && arg instanceof Defer ? arg : new Defer(this);
        this.result = null;
        this.error = null;
        if (typeof arg === FUNCTION) {
            try {
                arg.call(this, this._defer.resolve, this._defer.reject);
            } catch (ex) {
                this._defer.reject(ex);
            }
        }
    }
    function createResultHandlerWrapper(handler, defer) {
        var me = this;
        return function () {
            var res = handler.apply(me, arguments);
            if (res && typeof res.then === FUNCTION) {
                res.then(function () {
                    defer.resolve.apply(defer, arguments);
                }, function () {
                    defer.reject.apply(defer, arguments);
                });
            } else {
                defer.resolve.apply(defer, res == null ? [] : [res]);
            }
        };
    }
    Promise[PROTOTYPE].then = function (onSuccess, onFailure) {
        var defer = new Defer();
        var me = this;
        var handleSuccess, handleFail;
        if (typeof onSuccess == FUNCTION) {
            handleSuccess = createResultHandlerWrapper.call(me, onSuccess, defer);
        } else {
            handleSuccess = defer.resolve;
        }
        if (me[RESOLVED]) {
            handleSuccess.call(null, me.result);
        } else {
            me._s.push(handleSuccess);
        }
        if (typeof onFailure == FUNCTION) {
            handleFail = createResultHandlerWrapper.call(me, onFailure, defer);
        } else {
            handleFail = defer.reject;
        }
        if (me[REJECTED]) {
            handleFail.call(null, me.error);
        } else {
            me._f.push(handleFail);
        }
        return defer.promise;
    };
    Defer.Promise = Promise;
    Defer.resolve = function (v) {
        var result = new Defer();
        result.resolve(v);
        return result.promise;
    };
    Defer.reject = function (v) {
        var result = new Defer();
        result.reject(v);
        return result.promise;
    };
    Defer.all = function (promises) {
        return new Promise(function (rs, rj) {
            var length = promises.length;
            var count = 0;
            var results = [];
            function check(result) {
                results.push(result);
                count++;
                if (length === count) {
                    rs(results);
                }
            }
            for (var l = promises.length; l--;) {
                if (!('then' in promises[l])) {
                    length--;
                } else {
                    promises[l].then(check, rj);
                }
            }
            if (length <= 0) {
                rs();
                return;
            }
        });
    };
    return Defer;
}();

return Defer;

}));

define('../bower_components/boe/src/boe/global',[],function () {
    return (Function("return this"))();
});
/*
 * Function.bind
 */
define('../bower_components/boe/src/boe/Function/bind',['../global'], function (global) {
    // simply alias it
    var FUNCTION_PROTO = global.Function.prototype;
    var ARRAY_PROTO = global.Array.prototype;

    return FUNCTION_PROTO.bind || function(context) {
        var slice = ARRAY_PROTO.slice;
        var __method = this, args = slice.call(arguments);
        args.shift();
        return function wrapper() {
            if (this instanceof wrapper){
                context = this;
            }
            return __method.apply(context, args.concat(slice.call(arguments)));
        };
    };
});
define('../bower_components/boe/src/boe/util',['./global', './Function/bind'], function(global, bind){
    "use strict";

    var OBJECT_PROTO = global.Object.prototype;
    var ARRAY_PROTO = global.Array.prototype;
    var FUNCTION_PROTO = global.Function.prototype;
    var FUNCTION = 'function';

    var ret = {
        mixinAsStatic: function(target, fn){
            for(var key in fn){
                if (!fn.hasOwnProperty(key)){
                    continue;
                }

                target[key] = bind.call(FUNCTION_PROTO.call, fn[key]);
            }

            return target;
        },
        type: function(obj){
            var typ = OBJECT_PROTO.toString.call(obj);
            var closingIndex = typ.indexOf(']');
            return typ.substring(8, closingIndex);
        },
        mixin: function(target, source, map){

            // in case only source specified
            if (source == null){
                source = target;
                target= {};
            }

            for(var key in source){
                if (!source.hasOwnProperty(key)){
                    continue;
                }

                target[key] = ( typeof map == FUNCTION ? map( key, source[key] ) : source[key] );
            }

            return target;
        },
        slice: function(arr) {
            return ARRAY_PROTO.slice.call(arr);
        },
        g: global
    };

    return ret;
});
/*
 * Trim specified chars at the start of current string.
 * @member String.prototype
 * @return {String} trimed string
 */
define('../bower_components/boe/src/boe/String/trimLeft',['../util'], function (util) {
    return function( trimChar ) {
        var hex;
        if ( util.type(trimChar) == 'String' ) {
            hex = trimChar.charCodeAt(0).toString(16);
            trimChar = hex.length <= 2 ? '\\x' + hex : '\\u' + hex;
        }
        else if ( trimChar instanceof RegExp ) {
            // leave it as is
        }
        else {
            trimChar = '\\s';
        }
        var re = new RegExp('(^' + trimChar + '*)', 'g');
        return this.replace(re, "");
    };
});
/*
 * Trim specified chars at the end of current string.
 * @member String.prototype
 * @return {String} trimed string
 */
define('../bower_components/boe/src/boe/String/trimRight',['../util'], function (util) {
    return function( trimChar ) {
        var hex;
        if ( util.type(trimChar) == 'String' ) {
            hex = trimChar.charCodeAt(0).toString(16);
            trimChar = hex.length <= 2 ? '\\x' + hex : '\\u' + hex;
        }
        else if ( trimChar instanceof RegExp ) {
            // leave it as is
        }
        else {
            trimChar = '\\s';
        }
        var re = new RegExp('(' + trimChar + '*$)', 'g');
        return this.replace(re, "");
    };
});
/*
 * Trim specified chars at the start and the end of current string.
 * @member String.prototype
 * @return {String} trimed string
 * @es5
 */
define('../bower_components/boe/src/boe/String/trim',['../global', './trimLeft', './trimRight'], function (global, trimLeft, trimRight) {
    var STRING_PROTO = global.String.prototype;
    return STRING_PROTO.trim || function() {
        var ret = trimLeft.call( this );
        ret = trimRight.call( ret );
        return ret;
    };
});
define('VueRequirify',[
    '../bower_components/compact-promise/Defer',
    '../bower_components/boe/src/boe/String/trim'
], 
function (
    rsvp,
    trim
) {
    'use strict';

    var ATTR_COMPONENT = 'is';
    var TIMEOUT = 1000 * 30;

    function getComponentListFromDomTree(el) {
        var elements = el.querySelectorAll('[' + ATTR_COMPONENT + ']');
        var list = [];

        for(var l = elements.length; l--;) {
            list.push(elements[l].getAttribute(ATTR_COMPONENT));
        }

        return list;
    }

    function getComponentModuleMap(list) {
        var me = this;
        var map = {};
        var promises = [];

        for(var l = list.length; l--;) {
            promises.push(getComponent.call(me, list[l]));
        }

        return rsvp.all(promises)
            .then(function(componentCtors){
                for(var l = list.length; l--;) {
                    map[list[l]] = componentCtors[list.length - l - 1];
                }

                return rsvp.resolve(map);
            }, function(){
                if (window.console && typeof window.console.error === 'function'){
                    window.console.error('Failed to load modules');
                }
            });
    }

    function getComponent(path) {
        var me = this;
        return new rsvp.Promise(function(resolve, reject){
            if (path == null || trim.call(path) === '') {
                reject('path is not provided');
                return;
            }
            
            var names = path.split('/');
            var name = names[names.length - 1]; 

            me.require(['components/' + path + '/' + name.charAt(0).toUpperCase() + name.substring(1)], function(ComponentCtor){
                resolve(ComponentCtor);
            });

            setTimeout(function(){
                reject('Loading component ' + path + ' timed out');
            }, TIMEOUT);
        });
    }

    function Ctor(options){
        var me = this;
        if (
            options == null || 
            options.root == null || 
            options.vue == null || 
            options.require == null
        ) {
            throw new Error('options are not provided');
        }
        me.root = options.root;
        me.vue = options.vue;
        me.require = options.require;
    }

    Ctor.prototype.start = function() {
        var me = this;
        
        var list = getComponentListFromDomTree(me.root);
        getComponentModuleMap.call(me, list)
            .then(function(map){
                me.RootView = me.vue.extend({
                    el: function(){
                        return me.root;
                    },
                    components: map
                });
                me.rootView = new me.RootView();
            });
    };

    return Ctor;
});

myDefine(function() { return require('VueRequirify'); }); 
}());