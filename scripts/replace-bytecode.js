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

function replaceBytecode(instructions, template, onreplace) {
    function matchesTemplate(index) {
        for (var i = 0; i < template.length; i++) {
            if (template[i]) {
                for (var item in template[i]) {
                    if (template[i][item] !== instructions[index + i][item]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    var results = [];
    for (var i = 0; i < instructions.length;) {
        if ((i <= instructions.length - template.length) && matchesTemplate(i)) {
            Array.prototype.push.apply(results, onreplace(instructions.slice(i, i + template.length)));
            i += template.length;
        } else {
            results.push(instructions[i]);
            i++;
        }
    }
    return results;
}
