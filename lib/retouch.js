/**
    
    var r = require('retouch');
    
    var retouched = r.exec(MyHelper, {
        target: 'core',  //default is this
        multicast: true, //invoke list targets
        gsetter: true,  //make .setXyz & .getXyz to be .xyz
        returnValue: function(method, args, ret){
            //return wrappers
        }
    });

    r.mixin(MyClass.prototype, retouched);

 */

 (function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    } else if(typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root['retouch'] = factory();
    }
})(this, function() {
    
    if(!Array.isArray){
        Array.isArray = function(o){
            return  Object.prototype.toString.call(o).slice(8, -1) == 'Array';
        };
    }

    function mixin(des, src, map){
        if(typeof des !== 'object' 
            && typeof des !== 'function'){
            throw new TypeError('Unable to enumerate properties of '+ des);
        }
        if(typeof src !== 'object' 
            && typeof src !== 'function'){
            throw new TypeError('Unable to enumerate properties of '+ src);
        }

        map = map || function(d, s, i, des, src){
            //add des[i], to do with unenumerable properties
            if(!(des[i] || (i in des))){
                return s;
            }
            return d;
        }

        if(map === true){   //override
            map = function(d,s){
                return s;
            }
        }

        for (var i in src) {
            des[i] = map(des[i], src[i], i, des, src);
            //delete the property if it is undefined
            if(des[i] === undefined) delete des[i]; 
        }
        return des;     
    }

    function methodize(func, attr){
        if (attr) {
            return function() {
                return func.apply(null, [this[attr]].concat([].slice.call(arguments)));
            };
        }
        return function() {
            return func.apply(null, [this].concat([].slice.call(arguments)));
        };
    }

    function multicast(func){
        return function(){
            var list = arguments[0];
            if(!Array.isArray(list)){
                return func.apply(this, arguments);
            }else{
                var ret = [];
                var args = [].slice.call(arguments);
                for(var i = 0; i < list.length; i++){
                    args[0] = list[i];
                    ret.push(func.apply(this, args));                    
                }
                return ret;
            }
        }
    }

    /**
        getXyz & setXyg -> xyz
     */
    function gsetter(helper){
        for(var key in helper){
            var getter = helper[key];
            if(typeof getter == 'function' && /^get[A-Z]/.test(key)){
                var setter = helper['s' + key.slice(1)];
                if(typeof setter == 'function'){
                    var gsetterKey = key.slice(3,4).toLowerCase() + key.slice(4);
                    if(!(gsetterKey in helper)){
                        (function(setter, getter){
                            helper[gsetterKey] = function(){
                                if(arguments.length <= getter.length){
                                    return getter.apply(this, arguments);
                                }else{
                                    return setter.apply(this, arguments);
                                }
                            }
                        })(setter, getter);
                    }
                }
            }
        }
    }

    function returnWrap(name, func, wrap){
        return function(){
            var args = [].slice.call(arguments);
            var ret = func.apply(this, args);
            if(typeof wrap === 'function'){
                return wrap.call(this, name, args, ret);
            }else{
                return wrap;
            }
        };
    }

    function exec(helper, options){
        var retouched = {};
        options = options || {};
        if(!(methodize in options)){
            options.methodize = true;
        }

        if(options.gsetter){
            gsetter(helper);
        }

        for(var key in helper){
            var property = helper[key];
            if(typeof property === 'function'){

                if(options.multicast){
                    property = multicast(property);
                }
                if(options.methodize){
                    property = methodize(property, options.target);
                }
                if(options.returnValue){
                    property = returnWrap(key, property, options.returnValue);
                }
                
            }
            retouched[key] = property;
        }

        return retouched;
    }

    return {
        exec: exec,
        mixin: mixin
    };
});