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

function parser(tokens) {
    var current, done;

    function next() {
        var next = tokens.next();
        current = next.value;
        done = next.done;
    }
    next();
    return {
        parseBlock: function() {
            var instructions = [];
            while (current !== "}" && !done) {
                if (current === "assume") {
                    instructions.push(this.parseAssume());
                } else if (current === "let") {
                    instructions.push(this.parseLet());
                } else if (current === "if") {
                    instructions.push(this.parseIf());
                } else if (current === "verify") {
                    instructions.push(this.parseVerify());
                } else if (current.match(/[A-Za-z][A-Za-z0-9_]*/)) {
                    instructions.push(this.parseMutableAssignment())
                } else {
                    throw new SyntaxError("Unknown keyword: " + current);
                }
            }
            return new Block(instructions);
        },
        parseAssume: function() {
            var variables = [];
            do {
                next(); // eat "assume" or ","
                variables.push(current);
                next(); // eat variable name
            } while (current === ",")
            return new Assumption(variables);
        },
        parseLet: function() {
            var meta = null;
            next(); // eat "let"
            var name = current;
            if (name === "mutable") {
                meta = {
                    mutable: "variable"
                };
                next(); // eat "mutable"
                name = current;
            }
            next(); // eat variable name
            if (current !== "=") {
                throw new SyntaxError("Expected = in let statement");
            }
            next(); // eat "="
            var value = this.parseExpression();
            return new Assignment(name, value, meta);
        },
        parseMutableAssignment: function() {
            var name = current;
            next(); // eat variable name
            if (current !== "<-") {
                throw new SyntaxError("Expected <- in mutable assignment statement");
            }
            next(); // eat "="
            var value = this.parseExpression();
            return new Assignment(name, value, {
                mutable: "assignment"
            });
        },
        parseIf: function() {
            next(); // eat "if"
            if (current !== "(") {
                throw new SyntaxError("Expected ( in if statement");
            }
            next(); // eat "("
            var condition = this.parseExpression();
            if (current !== ")") {
                throw new SyntaxError("Expected ) in if statement");
            }
            next(); // eat ")"
            if (current !== "{") {
                throw new SyntaxError("Expected { in if statement");
            }
            next(); // eat "{"
            var trueBranch = this.parseBlock();
            if (current !== "}") {
                throw new SyntaxError("Expected } in if statement");
            }
            next(); // eat "}"
            var falseBranch;
            if (current === "else") {
                next(); // eat "else"
                if (current !== "{") {
                    throw new SyntaxError("Expected { in if/else statement");
                }
                next(); // eat "{"
                falseBranch = this.parseBlock();
                if (current !== "}") {
                    throw new SyntaxError("Expected } in if/else statement");
                }
                next(); // eat "}"
            }
            return new Conditional(condition, trueBranch, falseBranch);
        },
        parseExpression: function() {
            var left = this.parsePrimary(),
                right, operator;
            while (current === "==" || current === "&&" || current === "||" || current === "+" || current === "-" || current === ">" || current === "<") {
                operator = current;
                next(); // eat operator
                right = this.parsePrimary();
                left = new FunctionCall(operator, [left, right]);
            }
            return left;
        },
        parsePrimary: function() {
            if (current === "(") {
                next(); // eat "("
                var value = this.parseExpression();
                if (current !== ")") {
                    throw new SyntaxError("Expected ) closing a group.");
                }
                next(); // eat ")"
                return value;
            }
            var identifier = current;
            next(); // eat identifier
            if (current === "(") {
                // function call
                next(); // eat (
                var args = [];
                while (current !== ")") {
                    args.push(this.parseExpression());
                    if (current !== "," && current !== ")") {
                        throw new SyntaxError("Expected , or ) in function call");
                    }
                    if (current === ",") {
                        next(); // eat ","
                    }
                }
                next(); // eat ")"
                return new FunctionCall(identifier, args);
            } else {
                return new Identifier(identifier);
            }
        },
        parseVerify: function() {
            next(); // eat "verify"
            return new Verification(this.parseExpression());
        }
    }
}


function lexer(text) {
    var tokenRegexp = /\/\/[^\n]*\n+|[A-Za-z_][A-Za-z_0-9]+|[0-9]+|'[^']*'|==|&&|\|\||<-|[+-><]|[{}()\.,=]/g;
    var match;
    var matches = [];
    while ((match = tokenRegexp.exec(text)) !== null) {
        if (match[0] && match[0].indexOf('//') === 0) {
            continue;
        }
        matches.push(match[0]);
    }
    var index = -1;
    return {
        next: function() {
            index++;
            return {
                value: matches[index],
                done: index >= matches.length - 1
            };
        }
    };
}
