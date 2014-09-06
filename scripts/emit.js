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

function emitCode(instructions) {
    var results = [];

    function numToOpcode(num) {
        if (num >= 0 && num <= 16) {
            return "OP_" + num;
        } else {
            opcode = num.toString(16);
            if (opcode.length % 2 === 1) {
                return "0" + opcode;
            }
            return opcode;
        }
    }
    instructions.forEach(function(instruction) {
        if (instruction.opcode === "pick") {
            if (typeof instruction.index === "number") {
                results.push(numToOpcode(instruction.index));
            }
            results.push("OP_PICK");
        } else {
            if (typeof instruction.opcode === "string") {
                var opcode = instruction.opcode;
                if (opcode.match(/^([a-f0-9][a-f0-9])+$/g)) {
                    results.push(opcode);
                } else {
                    results.push("OP_" + opcode.toUpperCase());
                }
            } else if (typeof instruction.opcode === "number") {
                results.push(numToOpcode(instruction.opcode));
            }
        }
    });
    return results;
}
