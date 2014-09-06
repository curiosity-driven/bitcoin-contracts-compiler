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

function Visitor() {

}

Visitor.prototype = {
    assume: function(variables) {
        return new Assumption(variables);
    },
    verify: function(args) {
        return new Verification(args);
    },
    instructions: function(args) {
        return new Block(args);
    },
    invokeFunction: function(func, args, meta) {
        return new FunctionCall(func, args, meta);
    },
    substitute: function(name) {
        return new Identifier(name);
    },
    define: function(name, value, meta) {
        return new Assignment(name, value, meta);
    },
    conditional: function(condition, trueBranch, falseBranch) {
        return new Conditional(condition, trueBranch, falseBranch);
    }
};
