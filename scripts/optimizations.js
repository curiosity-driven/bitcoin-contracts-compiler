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

var byteCodeOptimizations = {
    dropLastVerify: function(instructions) {
        return instructions.filter(function(element, index) {
            return !(element.opcode === "verify" && index === instructions.length - 1);
        });
    },

    optimizeDups: function(instructions) {
        return instructions.map(function(instruction) {
            return instruction.opcode === "pick" && instruction.index === 0 ? {
                opcode: "dup"
            } : instruction;
        });
    },

    optimizeDupCheckSig: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "dup"
            },
            null, {
                opcode: "checkSig"
            }
        ], function onreplace(slice) {
            return [
                slice[1],
                slice[2]
            ];
        });
    },

    glueVerify: function(instructions, operators) {
        function canGlue(opcode) {
            return opcode in operators && operators[opcode].hasVerifyVersion
        }
        return instructions.reduce(function(previous, current) {
            if (current.opcode === "verify" && canGlue(previous[previous.length - 1].opcode)) {
                previous[previous.length - 1].opcode += "Verify";
                previous[previous.length - 1].stackBalance = -2;
                return previous;
            }
            return previous.concat([current]);
        }, []);
    },

    optimizeIfPick: function(instructions) {
        return replaceBytecode(instructions, [{
            opcode: "if"
        }, {
            opcode: "pick"
        }, {
            opcode: "else"
        }, {
            opcode: "pick"
        }, {
            opcode: "endif"
        }], function onreplace(slice) {
            return [
                slice[0], // if
                {
                    opcode: slice[1].index
                }, // num from PICK
                slice[2], // else
                {
                    opcode: slice[3].index
                }, // num from PICK
                slice[4], // endif
                {
                    opcode: "pick"
                }
            ];
        });
    },
    rewriteMutableAssignment: function(instructions) {
        return replaceBytecode(instructions, [{
                pragma: "marker",
                mutable: "assignment"
            }, {
                opcode: "pick"
            },
            null,
            null, {
                assume: "variable",
                mutable: "assignment"
            }
        ], function onreplace(slice) {
            var marker = slice[0],
                pick = slice[1],
                op1 = slice[2],
                op2 = slice[3],
                assignment = slice[4];
            if (marker.name === pick.name && marker.name === assignment.name) {
                return [
                    op1,
                    op2
                ];
            }
            return slice;
        });
    },

    optimizeSize: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "pick"
            }, {
                opcode: "size"
            }, {
                opcode: "nip"
            }, {
                assume: "variable"
            }, {
                opcode: "pick"
            },
            null,
            null,
            null,
            null, {
                opcode: "pick"
            }
        ], function onreplace(slice) {
            var pickS = slice[0],
                size = slice[1],
                nip = slice[2],
                assumeSize = slice[3],
                pickSize = slice[4],
                min = slice[5],
                max = slice[6],
                within = slice[7],
                verify = slice[8],
                pickS2 = slice[9];
            if (pickS.name === pickS2.name && assumeSize.name === pickSize.name) {
                return [
                    pickS,
                    assumeSize,
                    size, {
                        opcode: "tuck",
                        stackBalance: 1
                    },
                    min,
                    max,
                    within,
                    verify
                    // S will be left on stack
                ];
            }
            return slice;
        });
    },

    // FIXME: this optimization changes the order of variables
    optimizeSizeTuckVariables: function(instructions) {
        return replaceBytecode(instructions, [{
            opcode: "pick"
        }, {
            assume: "variable"
        }, {
            opcode: "size"
        }, {
            opcode: "tuck"
        }, ], function onreplace(slice) {
            var pick = slice[0],
                assume = slice[1],
                size = slice[2],
                tuck = slice[3];
            if (pick.index === 0) {
                return [
                    assume,
                    size,
                    tuck
                ];
            } else if (pick.index === 2) {
                return [{
                        opcode: "swap",
                        stackBalance: 0
                    },
                    assume,
                    size,
                    tuck
                ];
            } else if (pick.index === 4) {
                return [{
                        opcode: "rot",
                        stackBalance: 0
                    },
                    assume,
                    size,
                    tuck
                ];
            } else {
                return slice;
            }
        });
    },

    optimizeBoolPick: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "equal"
            }, // FIXME: can be any boolean not only equal
            {
                opcode: "if"
            }, {
                opcode: 1
            }, {
                opcode: "else"
            }, {
                opcode: 0
            }, {
                opcode: "endif"
            }
        ], function onreplace(slice) {
            return [
                slice[0] // equal
            ];
        });
    },

    optimizePickRollPick: function(instructions) {
        return replaceBytecode(instructions, [{
            opcode: "pick"
        }, {
            opcode: "roll"
        }, {
            assume: "variable"
        }, {
            opcode: "pick"
        }], function onreplace(slice) {
            var pick1 = slice[0],
                roll = slice[1],
                assume = slice[2],
                pick2 = slice[3];
            return [{
                    opcode: pick1.index,
                    stackBalance: 1
                }, {
                    opcode: "roll",
                    stackBalance: -1
                },
                roll,
                assume, {
                    opcode: pick1.index,
                    stackBalance: 1
                }, {
                    opcode: "roll",
                    stackBalance: -1
                },
            ];
        });
    },

    optimizeBoolAndOrPicks: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "pick",
                index: 0
            },
            null,
            null,
            null, {
                opcode: "pick",
                index: 2
            },
            null,
            null, {
                opcode: "boolOr"
            }, {
                opcode: "pick",
                index: 3
            },
            null,
            null, {
                opcode: "boolAnd"
            },
        ], function onreplace(slice) {
            var sha = slice[1],
                const1 = slice[2],
                equal = slice[3],
                key1 = slice[5],
                checkSig1 = slice[6],
                boolOr = slice[7],
                key2 = slice[9],
                checkSig2 = slice[10],
                boolAnd = slice[11];
            return [
                sha,
                const1,
                equal, {
                    opcode: "swap",
                    stackBalance: 0
                },
                key2, // keys have swapped positions
                checkSig1,
                boolOr, {
                    opcode: "swap",
                    stackBalance: 0
                },
                key1,
                checkSig2,
                boolAnd
            ];
        });
    },
    optimizeLastCallPicks: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "pick",
                index: 1
            }, {
                opcode: "pick",
                index: 1
            }, {
                last: true,
                stackBalance: -1
            } // any opcode that takes two args
        ], function onreplace(slice) {
            return [
                slice[2] // drop PICKs
            ];
        });
    },

    optimizeLastCallSwap: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "pick",
                index: 1
            }, {
                last: true,
                stackBalance: -1
            } // any opcode that takes two args
        ], function onreplace(slice) {
            return [{
                    opcode: "swap",
                    stackBalance: 0
                },
                slice[1] // drop PICKs
            ];
        });
    },

    optimizeTwoOp: function(instructions) {
        return replaceBytecode(instructions, [{
                opcode: "pick",
                index: 1,
                last: true
            }, {
                opcode: "pick",
                index: 1,
                last: true
            },
            null, {
                opcode: "pick",
                index: 3,
                last: true
            },
            null
        ], function onreplace(slice) {
            var op1 = slice[2],
                op2 = slice[4];
            return [
                op1,
                op2
            ];
        });
    },

    optimizeCheckSigs: function(instructions) {
        return replaceBytecode(instructions, [
            // two signatures
            {
                assume: "variable"
            }, {
                assume: "variable"
            },
            // check first
            {
                opcode: "pick"
            },
            null, // key
            {
                opcode: "checkSig"
            }, {
                assume: "variable"
            },
            // check second
            {
                opcode: "pick"
            },
            null, // key
            {
                opcode: "checkSig"
            }, {
                assume: "variable"
            }
        ], function onreplace(slice) {
            var assumeSigA = slice[0],
                assumeSigB = slice[1],
                pickSigB = slice[2],
                keyB = slice[3],
                checkSigB = slice[4],
                assumeCheckB = slice[5],
                pickSigA = slice[6],
                keyA = slice[7],
                checkSigA = slice[8],
                assumeCheckA = slice[9];
            if (assumeSigA.name !== pickSigA.name || assumeSigB.name !== pickSigB.name) {
                return slice;
            }
            return [
                keyB,
                checkSigB, {
                    assume: "variable",
                    name: assumeCheckB.name,
                    stackBalance: 1
                }, {
                    opcode: "swap",
                    stackBalance: 0
                },
                keyA,
                checkSigA, {
                    assume: "variable",
                    name: assumeCheckA.name,
                    stackBalance: 1
                }, {
                    opcode: "swap",
                    stackBalance: 0
                },
            ];
        });
    },
    markLastVariableUsage: function(instructions) {
        var variables = {},
            instruction;
        for (var i = instructions.length - 1; instruction = instructions[i]; i--) {
            if (instruction.opcode === "pick") {
                if (!(instruction.name in variables)) {
                    instruction.last = true;
                    variables[instruction.name] = true;
                }
            }
        }
        return instructions;
    },
    adjustPicks: function(instructions) {
        var stacks = [-1],
            declarations = {};
        return instructions.map(function(instruction) {
            var result = null;
            if (instruction.opcode === "pick") {
                result = {
                    opcode: "pick",
                    index: stacks[stacks.length - 1] - declarations[instruction.name].stackIndex,
                    name: instruction.name,
                    stackBalance: 1
                };
            } else if (instruction.opcode) {
                result = instruction;
            }

            if (instruction.stackBalance) {
                stacks[stacks.length - 1] += instruction.stackBalance;
            }

            if (instruction.assume) {
                result = {};
                for (var item in instruction) {
                    result[item] = instruction[item];
                }
                result.stackIndex = stacks[stacks.length - 1]
                declarations[instruction.name] = result;
            }

            if (instruction.stack) {
                instruction.stack.split(",").forEach(function(stackInstruction) {
                    if (stackInstruction === "push") {
                        stacks.push(stacks[stacks.length - 1]);
                    } else if (stackInstruction === "pop") {
                        stacks.pop();
                    } else {
                        throw new Error("Unknown stack instruction: " + stackInstruction);
                    }
                })
            }
            return result;
        }).filter(function(instruction) {
            return !!instruction;
        });
    }

};
