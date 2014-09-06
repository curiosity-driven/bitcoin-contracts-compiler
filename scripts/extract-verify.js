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

var extractVerify = new Visitor();
extractVerify.conditional = function(condition, trueBranch, falseBranch) {
    if (trueBranch instanceof Block && falseBranch instanceof Block &&
        (trueBranch.statements.length === 1) &&
        (trueBranch.statements[0] instanceof Verification) &&
        (falseBranch.statements.length === 1) &&
        (falseBranch.statements[0] instanceof Verification)) {
        return new Verification(new Conditional(condition,
            trueBranch.statements[0].value,
            falseBranch.statements[0].value));
    }
    return new Conditional(condition, trueBranch, falseBranch);
};
