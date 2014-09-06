Superscript compiler
====================

This small programming language has been designed to better illustrate the advanced
scripting used in the [Bitcoin contracts article](https://curiosity-driven.org/bitcoin-contracts).

Note that this compiler is made only for educational purposes and is **highly experimental** and not actively maintained. You are welcomed to fork and hack on it.

Both Superscript and Bitcoin Script are [stack-oriented programming languages](http://en.wikipedia.org/wiki/Stack-oriented_programming_language) and that makes the simple
compiler (`scripts/bytecode.js`) trivial.

As each byte of Bitcoin transaction [makes the transaction fees bigger](https://en.bitcoin.it/wiki/Transaction_fees#Technical_info)
the full compiler is comprised of a set of optimizations (e.g. optimizing
`OP_0 OP_PICK` into one `OP_DUP`). Most of them are generic (can be applied to any script) but some of them are specific to scripts used in the [Bitcoin contracts article](https://curiosity-driven.org/bitcoin-contracts).

The language
============

The Superscript code consist of an optional assume statement followed by a number
of assignments, conditionals or verification statements.

Assume statements
-----------------
They do not generate any code but are ambient declarations about the state of stack before the script executes. Basically they describe the expected input script and are used by the compiler to resolve variable names to their positions on the stack.

    assume signatureA, signatureB, secret

This statement expects one secret and two signatures to appear on the stack, `secret` being the top-most item.

Assignments
-----------
They range from the immutable bindings (`let NAME = value`) to mutable bindings (`let mutable NAME = value`) to modifications (`NAME <- value`). Modifications can work only on names bound to mutable names. Immutable bindings can be inlined.

    let pubKeyA = '04d4bf4642f56fc7af0d2382e2cac34fa16ed3321633f91d06128f0e5c0d17479778cc1f2cc7e4a0c6f1e72d905532e8e127a031bb9794b3ef9b68b657f51cc691'
    let signedByA = checkSig(signatureA, pubKeyA)

Conditional statements
----------------------
They take an expression and if it is truthy execute the associated block (`if (expr) { block }`) optionally providing an alternative block (`else`) that is executed if the expression is not truthy.

    let mutable num = sizeB + sizeC + sizeA - 96
    if (num > 2) {
        num <- num - 3
    }

Verification statements
-----------------------
These statements evaluate the expression and if it is not truthy abort the script execution. Verify can emit `OP_VERIFY` opcode or be glued during optimization with previous opcode (e.g. producing `OP_EQUALVERIFY`).

Verify statements at the end of the script are removed entirely (see `dropLastVerify` in `scripts/optimizations.js`). This is safe as [Bitcoin script execution](https://en.bitcoin.it/wiki/Script) requires a truthy value on the top of the stack to succeed.

    verify (secretKnown || signedByB) && signedByA

Function calls
--------------
Each function call produces an opcode derived from the function name (e.g. `sha256(secret)` produces `OP_SHA256`). Some opcodes have special behavior that influences
the compiler (see `scripts/builtin.js`). Operators (such as `==`) map to opcodes
(see `scripts/emitter.js`).

For more technical details of Bitcoin Script execution see [Script on Bitcoin Wiki](https://en.bitcoin.it/wiki/Script).
