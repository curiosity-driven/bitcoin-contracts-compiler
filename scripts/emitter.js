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

function IntermediateCodeEmitter(operators) {
    this.operators = operators;
}

IntermediateCodeEmitter.OPERATORS = {
    "==": "equal",
    "&&": "boolAnd",
    "||": "boolOr",
    "+": "add",
    "-": "sub",
    ">": "greaterThan",
    "<": "lessThan"
};

IntermediateCodeEmitter.prototype = {
    assume: function(variables) {
        return variables.map(function(variable) {
            return {
                assume: "variable",
                name: variable,
                stackBalance: 1
            };
        });
    },
    verify: function(args) {
        var results = [];
        Array.prototype.push.apply(results, args);
        results.push({
            opcode: "verify",
            stackBalance: -1
        });
        return results;
    },
    instructions: function(args) {
        var results = [];
        args.forEach(function(arg) {
            Array.prototype.push.apply(results, arg);
        });
        return results;
    },
    invokeFunction: function(func, args, meta) {
        var results = [];
        args.forEach(function(arg) {
            Array.prototype.push.apply(results, arg);
        });
        func = IntermediateCodeEmitter.OPERATORS[func] || func;
        // by default function takes N stack items where N is number of args and leaves 1 result
        var stackBalance = -(args.length - 1);
        if (func in this.operators && 'stackBalance' in this.operators[func]) {
            stackBalance = this.operators[func].stackBalance;
        }
        var instruction = {
            opcode: func,
            stackBalance: stackBalance
        };
        if (meta) {
            for (var item in meta) {
                instruction[item] = meta[item];
            }
        }
        results.push(instruction);
        if (func in this.operators && this.operators[func].append) {
            Array.prototype.push.apply(results, this.operators[func].append);
        }
        return results;
    },
    substitute: function(name) {
        if (name.charAt(0) === "'" && name.charAt(name.length - 1) === "'") {
            return [{
                opcode: name.substring(1, name.length - 1),
                stackBalance: 1
            }];
        }
        if (!isNaN(parseInt(name, 10))) {
            return [{
                opcode: parseInt(name, 10),
                stackBalance: 1
            }];
        }
        return [{
            opcode: "pick",
            name: name,
            stackBalance: 1
        }];
    },
    define: function(name, value, meta) {
        var results = [];
        if (meta && meta.mutable === "assignment") {
            results.push({
                pragma: "marker",
                mutable: "assignment",
                name: name
            });
        }
        Array.prototype.push.apply(results, value);
        var instruction = {
            assume: "variable",
            name: name
        };
        if (meta) {
            for (var item in meta) {
                instruction[item] = meta[item];
            }
        }
        results.push(instruction);
        return results;
    },
    conditional: function(condition, trueBranch, falseBranch) {
        var result = [];
        Array.prototype.push.apply(result, condition);
        result.push({
            opcode: "if",
            stackBalance: -1,
            stack: "push"
        });
        Array.prototype.push.apply(result, trueBranch);
        if (falseBranch) {
            result.push({
                opcode: "else",
                stack: "pop,push"
            });
            Array.prototype.push.apply(result, falseBranch);
        };
        result.push({
            opcode: "endif",
            stack: "pop"
        });
        return result;
    }
};
