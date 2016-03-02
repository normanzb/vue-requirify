define([
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
