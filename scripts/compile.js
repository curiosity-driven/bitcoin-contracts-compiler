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

function compile(source) {
    var code = getByteCode(source);
    var optimizations = [
        // remove last VERIFY statement - it's not necessary because Bitcoin Script
        // requires last argument on stack to be truthy to succeed
        'dropLastVerify',
        // replace two-word instructions with shorter opcodes
        // EQUAL followed by VERIFY gets replaced by EQUALVERIFY
        'glueVerify',
        // optimize CheckSigs
        'optimizeCheckSigs',
        // optimize size -> size tuck
        'optimizeSize',
        // rewrite mutable
        'rewriteMutableAssignment',
        // adjust relative to absolute PICKs
        'adjustPicks',
        // mark last variables
        'markLastVariableUsage',
        // optimize last1 last2 OP last 3 OP
        'optimizeTwoOp',
        // optimize three vars
        'optimizeSizeTuckVariables',
        // previous optimizations could have changed the order of operators
        // so adjust picks again
        'adjustPicks',
        // optimize pick roll pick
        'optimizePickRollPick',
        // optimize picks with swaps
        'optimizeBoolAndOrPicks',
        // optimize IF 0 PICK ELSE 1 PICK ENDIF
        'optimizeIfPick',
        // optimize EQUAL IF 0 ELSE 1 ENDIF
        'optimizeBoolPick',
        // optimize 1 PICK 1 PICK at the end
        'optimizeLastCallPicks',
        // optimize 1 PICK op at the end
        'optimizeLastCallSwap',
        // use DUPs instead of 0 PICK
        'optimizeDups',
        // drop DUP if used in pubkey CHECKSIG script
        'optimizeDupCheckSig'
    ];

    optimizations.forEach(function(optimization) {
        code = byteCodeOptimizations[optimization](code, operators);
    });

    // generate Bitcoin Script from intermediate code
    return emitCode(code);
}
