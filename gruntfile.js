/*global module:false*/
module.exports = function(grunt) {

    var SPACE_NAME = 'VueRequirify';
    var EXT_JS = '.js';
    var EXT_JS_MIN = '.min' + EXT_JS;
    var FILE_NAME_OUT_MAX = SPACE_NAME + EXT_JS;
    var FILE_NAME_OUT_MIN = SPACE_NAME + EXT_JS_MIN;
    var FILE_NAME_ENTRY = SPACE_NAME;

    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-bumpup");
    grunt.loadNpmTasks("grunt-tagrelease");

    grunt.config.init({
        requirejs : {
            dist : {
                options : {
                    baseUrl: './src',
                    name: '../bower_components/amdshim/amdshim.embed',
                    include: FILE_NAME_ENTRY,
                    out: FILE_NAME_OUT_MAX,
                    wrap: {
                        start: 
                            "(function() { \n" + 
                            "var global = new Function('return this')();" + 
                            "var myDefine = (function(factory){ " + 
                                "var ret = factory();" +
                                "typeof module != 'undefined' && (module.exports = ret);" +
                                "(function(define){define && define(function(){return ret;});})(global.define);" +
                                "global." + SPACE_NAME + " = ret; });",
                        end: 
                            "myDefine(function() { return require('" + SPACE_NAME + "'); }); \n" + 
                            "}());"
                    },
                    pragmas: {
                        release: true
                    },
                    optimize : "none"
                }
            }
        },
        uglify : {
            dist : {
                src : [ FILE_NAME_OUT_MAX ],
                dest : FILE_NAME_OUT_MIN
            }
        },
        bumpup: {
            files: ['package.json', 'bower.json']
        },
        tagrelease: {
            file: 'package.json',
            commit:  true,
            message: 'Release %version%',
            prefix:  '',
            annotate: false
        }
    });

    grunt.registerTask("dist", "requirejs:dist uglify".split(' '));
    grunt.registerTask("default", "dist".split(' '));
    grunt.registerTask("release", function (type) {

        grunt.task.run('dist');
        
        if (type != null && type != false){
            grunt.task.run('bumpup:' + type);
            grunt.task.run('tagrelease');
        }

    });
};