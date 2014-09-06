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

function FunctionCall(name, args, meta) {
    this.name = name;
    this.args = args;
    this.meta = meta;
}

FunctionCall.prototype.toString = function() {
    if (this.name.charAt(0).toUpperCase() !== this.name.charAt(0).toLowerCase()) {
        return this.name + "(" + this.args.join(", ") + ")";
    }
    return this.args[0] + " " + this.name + " " + this.args[1];
};

FunctionCall.prototype.transform = function(context) {
    return context.invokeFunction(this.name, this.args.map(function(arg) {
        return arg.transform(context);
    }), this.meta);
}

function Identifier(name) {
    this.name = name;
}

Identifier.prototype.toString = function() {
    return this.name;
};

Identifier.prototype.transform = function(context) {
    return context.substitute(this.name);
};

function Assumption(args) {
    this.args = args;
}

Assumption.prototype.toString = function() {
    return "assume " + this.args.join(", ") + "\n";
};

Assumption.prototype.transform = function(context) {
    return context.assume(this.args);
}

function Assignment(variableName, value, meta) {
    this.variableName = variableName;
    this.value = value;
    this.meta = meta;
}

Assignment.prototype.toString = function() {
    return "let " + this.variableName + " = " + this.value + "\n";
};

Assignment.prototype.transform = function(context) {
    var value = this.value.transform(context);
    return context.define(this.variableName, value, this.meta);
};

function Block(statements) {
    this.statements = statements;
}

Block.prototype.toString = function() {
    return this.statements.join("\n");
};

Block.prototype.transform = function(context) {
    return context.instructions(this.statements.map(function(statement) {
        return statement.transform(context);
    }));
};

function Conditional(condition, trueBranch, falseBranch) {
    this.condition = condition;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
}

Conditional.prototype.toString = function() {
    var result = "if (" + this.condition + ") {\n  " + this.trueBranch + "}";
    if (this.falseBranch) {
        result += " else {\n  " + this.falseBranch + "  }";
    }
    return result;
};

Conditional.prototype.transform = function(context) {
    var condition = this.condition.transform(context);
    var trueBranch = this.trueBranch.transform(context);
    var falseBranch;
    if (this.falseBranch) {
        falseBranch = this.falseBranch.transform(context);
    }
    return context.conditional(condition, trueBranch, falseBranch);
};

function Verification(value) {
    this.value = value;
}

Verification.prototype.toString = function() {
    return "verify " + this.value + "\n";
};

Verification.prototype.transform = function(context) {
    return context.verify(this.value.transform(context));
};
