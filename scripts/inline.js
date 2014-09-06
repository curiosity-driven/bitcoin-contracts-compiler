/**
 * Copyright 2014 Curiosity driven
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

function inlineVariables(block, operators) {
    var counts = {};
    var counter = new Visitor();
    counter.substitute = function(name) {
        if (name in counts) {
            counts[name]++;
        } else {
            counts[name] = 1;
        }
        return Visitor.prototype.substitute.call(this, name);
    };
    var caninline = {
        assume: function(variables) {
            return false;
        },
        verify: function(args) {
            return false;
        },
        instructions: function(args) {
            return args.every(function(arg) {
                return !!arg;
            });
        },
        invokeFunction: function(func, args, meta) {
            if (func in operators && 'inline' in operators[func]) {
                return operators[func].inline;
            }
            return args.every(function(arg) {
                return !!arg;
            });
        },
        substitute: function(name) {
            return true;
        },
        define: function(name, value, meta) {
            return false;
        },
        conditional: function(condition, trueBranch, falseBranch) {
            var result = condition.transform(this) && trueBranch.transform(this);
            if (falseBranch) {
                result = result && falseBranch.transform(this);
            }
            return result;
        }
    }
    var definitions = {};
    var inliner = new Visitor();
    inliner.instructions = function(args) {
        return new Block(args.filter(function(arg) {
            return !!arg; // filter nulls
        }));
    };
    inliner.substitute = function(name) {
        if (name in definitions) {
            return definitions[name];
        }
        return Visitor.prototype.substitute.call(this, name);
    };
    inliner.define = function(name, value, meta) {
        if (counts[name] === 1 && value.transform(caninline)) {
            definitions[name] = value;
            return null; // drop assignment
        }
        return Visitor.prototype.define.call(this, name, value, meta);
    };
    return block.transform(counter).transform(inliner);
}
