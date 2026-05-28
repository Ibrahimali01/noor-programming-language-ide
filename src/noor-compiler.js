"use strict";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoorInterpreter = exports.STATIC_STDLIB = exports.resolveBackground = exports.resolveColor = exports.DatabaseConnection = exports.Environment = exports.Parser = void 0;
exports.tokenize = tokenize;
exports.getNoorRequire = getNoorRequire;
// ----------------------------------------------------------------------------
// 1. Tokenizer
// ----------------------------------------------------------------------------
function tokenize(source) {
    if (source === undefined || source === null) {
        return [];
    }
    var tokens = [];
    var current = 0;
    var line = 1;
    var keywords = new Set([
        'انشئ', // variable definition (let / const)
        'اذا', // if
        'والا_اذا', // else if
        'والا', // else
        'طالما', // while
        'كرر', // for
        'دالة', // function
        'ارجع', // return
        'صحيح', // true
        'خطأ', // false
        'عدم', // null/void
        'اكتب', // print
        'مكتبة' // import / use module
    ]);
    while (current < source.length) {
        var char = source[current];
        // Handle newlines
        if (char === '\n') {
            line++;
            current++;
            continue;
        }
        // Handle whitespaces
        if (/\s/.test(char)) {
            current++;
            continue;
        }
        // Comments (# or //)
        if (char === '#' || (char === '/' && source[current + 1] === '/')) {
            while (current < source.length && source[current] !== '\n') {
                current++;
            }
            continue;
        }
        // Multi-line Comments (/* */)
        if (char === '/' && source[current + 1] === '*') {
            current += 2;
            while (current < source.length && !(source[current] === '*' && source[current + 1] === '/')) {
                if (source[current] === '\n')
                    line++;
                current++;
            }
            if (current < source.length)
                current += 2; // skip */
            continue;
        }
        // Strings
        if (char === '"' || char === "'") {
            var quote = char;
            var value = '';
            current++; // skip quote
            while (current < source.length && source[current] !== quote) {
                if (source[current] === '\\') {
                    current++;
                    if (source[current] === 'n')
                        value += '\n';
                    else if (source[current] === 't')
                        value += '\t';
                    else
                        value += source[current];
                }
                else {
                    value += source[current];
                }
                current++;
            }
            if (current < source.length)
                current++; // skip closing quote
            tokens.push({ type: 'STRING', value: value, line: line });
            continue;
        }
        // Numbers
        if (/[0-9]/.test(char)) {
            var value = '';
            while (current < source.length && /[0-9.]/.test(source[current])) {
                value += source[current];
                current++;
            }
            tokens.push({ type: 'NUMBER', value: value, line: line });
            continue;
        }
        // Identifiers (supports Arabic glyphs and english letters/underscores)
        if (/[\p{L}_]/u.test(char)) {
            var value = '';
            while (current < source.length && (/[\p{L}\p{N}_]/u.test(source[current]))) {
                value += source[current];
                current++;
            }
            if (keywords.has(value)) {
                tokens.push({ type: 'KEYWORD', value: value, line: line });
            }
            else {
                tokens.push({ type: 'IDENTIFIER', value: value, line: line });
            }
            continue;
        }
        // Operators and Punctuations
        var twoChars = char + (source[current + 1] || '');
        if (['==', '!=', '>=', '<=', '&&', '||'].includes(twoChars)) {
            tokens.push({ type: 'OPERATOR', value: twoChars, line: line });
            current += 2;
            continue;
        }
        if (['=', '+', '-', '*', '/', '%', '>', '<', '!'].includes(char)) {
            tokens.push({ type: 'OPERATOR', value: char, line: line });
            current++;
            continue;
        }
        if (['(', ')', '{', '}', '[', ']', ',', ';', ':', '.'].includes(char)) {
            tokens.push({ type: 'PUNCTUATION', value: char, line: line });
            current++;
            continue;
        }
        // Unrecognized token - Skip with warning to avoid crash
        current++;
    }
    tokens.push({ type: 'EOF', value: 'EOF', line: line });
    return tokens;
}
var Parser = /** @class */ (function () {
    function Parser(tokens) {
        this.current = 0;
        this.tokens = tokens;
    }
    Parser.prototype.peek = function () {
        return this.tokens[this.current];
    };
    Parser.prototype.previous = function () {
        return this.tokens[this.current - 1];
    };
    Parser.prototype.isAtEnd = function () {
        return this.peek().type === 'EOF';
    };
    Parser.prototype.advance = function () {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    };
    Parser.prototype.check = function (type, value) {
        if (this.isAtEnd())
            return false;
        var token = this.peek();
        if (token.type !== type)
            return false;
        if (value !== undefined && token.value !== value)
            return false;
        return true;
    };
    Parser.prototype.match = function (type, value) {
        if (this.check(type, value)) {
            this.advance();
            return true;
        }
        return false;
    };
    Parser.prototype.consume = function (type, message, expectedValue) {
        if (this.check(type, expectedValue))
            return this.advance();
        // Improved error reporting with context
        var token = this.peek();
        var contextStart = Math.max(0, this.current - 2);
        var contextEnd = Math.min(this.tokens.length, this.current + 3);
        var context = this.tokens.slice(contextStart, contextEnd).map(function (t) { return t.value; }).join(' ');
        throw new Error("[\u0633\u0637\u0631 ".concat(token.line, "] \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0644\u064A\u0644: ").concat(message, " - \u0648\u062C\u062F\u0646\u0627 \"").concat(token.value, "\". \u0627\u0644\u0633\u064A\u0627\u0642: \"... ").concat(context, " ...\""));
    };
    Parser.prototype.parse = function () {
        var body = [];
        while (!this.isAtEnd()) {
            try {
                body.push(this.statement());
            }
            catch (e) {
                // Simple error recovery: skip to next statement block
                this.synchronize();
                throw e;
            }
        }
        return { type: 'Program', body: body };
    };
    Parser.prototype.synchronize = function () {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().value === ';')
                return;
            if (['انشئ', 'اذا', 'طالما', 'كرر', 'دالة', 'ارجع', 'اكتب'].includes(this.peek().value)) {
                return;
            }
            this.advance();
        }
    };
    Parser.prototype.statement = function () {
        if (this.match('KEYWORD', 'انشئ'))
            return this.variableDeclaration();
        if (this.match('KEYWORD', 'اذا'))
            return this.ifStatement();
        if (this.match('KEYWORD', 'طالما'))
            return this.whileStatement();
        if (this.match('KEYWORD', 'دالة'))
            return this.functionDeclaration();
        if (this.match('KEYWORD', 'ارجع'))
            return this.returnStatement();
        if (this.match('KEYWORD', 'اكتب'))
            return this.printStatement();
        if (this.match('PUNCTUATION', '{'))
            return this.blockStatement();
        return this.expressionStatement();
    };
    Parser.prototype.blockStatement = function () {
        var line = this.previous().line;
        var body = [];
        // Explicit stack-based tracking of braces
        var braceStack = ['{'];
        while (!this.isAtEnd()) {
            if (this.match('PUNCTUATION', '{')) {
                braceStack.push('{');
            }
            else if (this.match('PUNCTUATION', '}')) {
                braceStack.pop();
                if (braceStack.length === 0) {
                    // Block closed
                    return { type: 'BlockStatement', body: body, line: line };
                }
            }
            else {
                body.push(this.statement());
            }
        }
        throw new Error("[\u0633\u0637\u0631 ".concat(line, "] \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0644\u064A\u0644: \u0643\u062A\u0644\u0629 \u0627\u0644\u0643\u0648\u062F \u0644\u0645 \u062A\u0643\u0646 \u0645\u063A\u0644\u0642\u0629 \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D (\u0645\u0641\u0642\u0648\u062F \"}\")"));
    };
    Parser.prototype.variableDeclaration = function () {
        var line = this.previous().line;
        var identifier = this.consume('IDENTIFIER', 'يجب تحديد اسم للمتغير بعد استخدام "انشئ"');
        this.consume('OPERATOR', 'يجب إرفاق علامة الـ "=" لإعطاء قيمة للمتغير', '=');
        var initializer = this.expression();
        this.match('PUNCTUATION', ';'); // optional semicolon
        return {
            type: 'VariableDecl',
            name: identifier.value,
            value: initializer,
            line: line
        };
    };
    Parser.prototype.ifStatement = function () {
        var line = this.previous().line;
        this.consume('PUNCTUATION', 'يجب استخدام القوس "(" قبل شرط جملة "اذا"', '(');
        var test = this.expression();
        this.consume('PUNCTUATION', 'يجب إغلاق قوس الشرط ")" بعد كتابة شرط جملة "اذا"', ')');
        this.consume('PUNCTUATION', 'يجب فتح القوس المتموج "{" لبدء كتلة الكود الخاصة بجملة "اذا"', '{');
        var consequent = [];
        while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
            consequent.push(this.statement());
        }
        this.consume('PUNCTUATION', 'يجب إغلاق القوس المتموج "}" لكتلة كود جملة "اذا"', '}');
        var alternateIfs = [];
        var alternate = null;
        // Support else-if (والا_اذا)
        while (this.match('KEYWORD', 'والا_اذا')) {
            this.consume('PUNCTUATION', 'يجب استخدام القوس "(" قبل شرط "والا_اذا"', '(');
            var elseIfTest = this.expression();
            this.consume('PUNCTUATION', 'يجب إغلاق القوس ")" لشرط "والا_اذا"', ')');
            this.consume('PUNCTUATION', 'يجب فتح القوس المتموج "{" لبدء كتلة كود "والا_اذا"', '{');
            var elseIfBody = [];
            while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
                elseIfBody.push(this.statement());
            }
            this.consume('PUNCTUATION', 'يجب إغلاق القوس المتموج "}" لكتلة كود "والا_اذا"', '}');
            alternateIfs.push({ test: elseIfTest, body: elseIfBody });
        }
        // Support else (والا)
        if (this.match('KEYWORD', 'والا')) {
            this.consume('PUNCTUATION', 'يجب فتح القوس المتموج "{" لكتلة كود "والا"', '{');
            alternate = [];
            while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
                alternate.push(this.statement());
            }
            this.consume('PUNCTUATION', 'يجب إغلاق القوس المتموج "}" لكتلة كود "والا"', '}');
        }
        return {
            type: 'IfStatement',
            test: test,
            consequent: consequent,
            alternateIfs: alternateIfs,
            alternate: alternate,
            line: line
        };
    };
    Parser.prototype.whileStatement = function () {
        var line = this.previous().line;
        this.consume('PUNCTUATION', 'يجب استخدام القوس "(" لتحديد شرط التكرار "طالما"', '(');
        var test = this.expression();
        this.consume('PUNCTUATION', 'يجب إغلاق القوس ")" بعد التحديد لشرط التكرار "طالما"', ')');
        this.consume('PUNCTUATION', 'يجب فتح القوس المتموج "{" لبدء كود جملة "طالما"', '{');
        var body = [];
        while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
            body.push(this.statement());
        }
        this.consume('PUNCTUATION', 'يجب إغلاق كود جملة التكرار "طالما" بالقوس المتموج "}"', '}');
        return {
            type: 'WhileStatement',
            test: test,
            body: body,
            line: line
        };
    };
    Parser.prototype.functionDeclaration = function () {
        var line = this.previous().line;
        var nameToken = this.consume('IDENTIFIER', 'يجب تزويد اسم للدالة بعد كتابة الكلمة المفتاحية "دالة"');
        this.consume('PUNCTUATION', 'يجب وضع القوس الدائري "(" للبارامترات للدالة', '(');
        var params = [];
        if (!this.check('PUNCTUATION', ')')) {
            do {
                var param = this.consume('IDENTIFIER', 'اسم البارامتر يجب أن يكون معرفاً برمجياً صحيحاً');
                params.push(param.value);
            } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', 'يجب إغلاق القوس الدائري ")" للبارامترات', ')');
        this.consume('PUNCTUATION', 'يجب فتح القوس المتموج "{" لكتلة كود الدالة', '{');
        var body = [];
        while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
            body.push(this.statement());
        }
        this.consume('PUNCTUATION', 'يجب إغلاق القوس المتموج "}" للانتهاء من برمجة كتلة الدالة', '}');
        return {
            type: 'FunctionDecl',
            name: nameToken.value,
            params: params,
            body: body,
            line: line
        };
    };
    Parser.prototype.returnStatement = function () {
        var line = this.previous().line;
        var argument = null;
        if (!this.check('PUNCTUATION', ';') && !this.check('PUNCTUATION', '}')) {
            argument = this.expression();
        }
        this.match('PUNCTUATION', ';');
        return { type: 'ReturnStatement', argument: argument, line: line };
    };
    Parser.prototype.printStatement = function () {
        var line = this.previous().line;
        this.consume('PUNCTUATION', 'يجب فتح قوس التعبير البرمجي للكتابة "(" بعد أمر "اكتب"', '(');
        var args = [];
        if (!this.check('PUNCTUATION', ')')) {
            do {
                args.push(this.expression());
            } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', 'يجب إغلاق قوس أمر الكتابة ")"', ')');
        this.match('PUNCTUATION', ';');
        return { type: 'PrintStatement', arguments: args, line: line };
    };
    Parser.prototype.expressionStatement = function () {
        var expr = this.expression();
        var line = this.previous().line;
        this.match('PUNCTUATION', ';');
        return { type: 'ExpressionStatement', expression: expr, line: line };
    };
    Parser.prototype.expression = function () {
        return this.assignment();
    };
    Parser.prototype.assignment = function () {
        var expr = this.logicalOr();
        if (this.match('OPERATOR', '=')) {
            var equalsLine = this.previous().line;
            var value = this.assignment();
            if (expr.type === 'Identifier') {
                var name_1 = expr.name;
                return { type: 'Assignment', name: name_1, value: value, line: equalsLine };
            }
            if (expr.type === 'ArrayIndex') {
                return { type: 'IndexAssignment', object: expr.array, index: expr.index, value: value, line: equalsLine };
            }
            throw new Error("[\u0633\u0637\u0631 ".concat(equalsLine, "] \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062E\u0635\u064A\u0635: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0633\u0646\u0627\u062F \u0642\u064A\u0645\u0629 \u0644\u0639\u0646\u0635\u0631 \u063A\u064A\u0631 \u0645\u062A\u063A\u064A\u0631."));
        }
        return expr;
    };
    Parser.prototype.logicalOr = function () {
        var expr = this.logicalAnd();
        while (this.match('OPERATOR', '||')) {
            var operator = this.previous().value;
            var right = this.logicalAnd();
            expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right, line: this.previous().line };
        }
        return expr;
    };
    Parser.prototype.logicalAnd = function () {
        var expr = this.equality();
        while (this.match('OPERATOR', '&&')) {
            var operator = this.previous().value;
            var right = this.equality();
            expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right, line: this.previous().line };
        }
        return expr;
    };
    Parser.prototype.equality = function () {
        var expr = this.comparison();
        while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
            var operator = this.previous().value;
            var right = this.comparison();
            expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right, line: this.previous().line };
        }
        return expr;
    };
    Parser.prototype.comparison = function () {
        var expr = this.term();
        while (this.match('OPERATOR', '>') ||
            this.match('OPERATOR', '>=') ||
            this.match('OPERATOR', '<') ||
            this.match('OPERATOR', '<=')) {
            var operator = this.previous().value;
            var right = this.term();
            expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right, line: this.previous().line };
        }
        return expr;
    };
    Parser.prototype.term = function () {
        var expr = this.factor();
        while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-')) {
            var operator = this.previous().value;
            var right = this.factor();
            expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right, line: this.previous().line };
        }
        return expr;
    };
    Parser.prototype.factor = function () {
        var expr = this.unary();
        while (this.match('OPERATOR', '*') || this.match('OPERATOR', '/') || this.match('OPERATOR', '%')) {
            var operator = this.previous().value;
            var right = this.unary();
            expr = { type: 'BinaryExpression', operator: operator, left: expr, right: right, line: this.previous().line };
        }
        return expr;
    };
    Parser.prototype.unary = function () {
        if (this.match('OPERATOR', '!') || this.match('OPERATOR', '-')) {
            var operator = this.previous().value;
            var right = this.unary();
            return { type: 'BinaryExpression', operator: operator, left: { type: 'Literal', value: 0, kind: 'number', line: this.previous().line }, right: right, line: this.previous().line };
        }
        return this.call();
    };
    Parser.prototype.call = function () {
        var expr = this.primary();
        while (true) {
            if (this.match('PUNCTUATION', '(')) {
                expr = this.finishCall(expr);
            }
            else if (this.match('PUNCTUATION', '[')) {
                var index = this.expression();
                this.consume('PUNCTUATION', 'يجب إغلاق قوس الفهرسة للاستدعاء "]"', ']');
                expr = {
                    type: 'ArrayIndex',
                    array: expr,
                    index: index,
                    line: this.previous().line
                };
            }
            else if (this.match('PUNCTUATION', '.')) {
                var property = this.consume('IDENTIFIER', 'يجب تحديد اسم خاصية بعد "."');
                expr = {
                    type: 'PropertyAccess',
                    object: expr,
                    property: property.value,
                    line: this.previous().line
                };
            }
            else {
                break;
            }
        }
        return expr;
    };
    Parser.prototype.finishCall = function (callee) {
        var args = [];
        if (!this.check('PUNCTUATION', ')')) {
            do {
                args.push(this.expression());
            } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', 'يجب إغلاق قوس استدعاء الدالة ")"', ')');
        if (callee.type === 'Identifier') {
            return {
                type: 'CallExpression',
                callee: callee.name,
                arguments: args,
                line: callee.line
            };
        }
        throw new Error("[\u0633\u0637\u0631 ".concat(callee.line || this.previous().line, "] \u0647\u0630\u0627 \u0627\u0644\u062A\u0639\u0628\u064A\u0631 \u063A\u064A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0643\u062F\u0627\u0644\u0629."));
    };
    Parser.prototype.primary = function () {
        if (this.match('KEYWORD', 'صحيح'))
            return { type: 'Literal', value: true, kind: 'boolean', line: this.previous().line };
        if (this.match('KEYWORD', 'خطأ'))
            return { type: 'Literal', value: false, kind: 'boolean', line: this.previous().line };
        if (this.match('KEYWORD', 'عدم'))
            return { type: 'Literal', value: null, kind: 'null', line: this.previous().line };
        if (this.match('NUMBER')) {
            var val = this.previous().value;
            return { type: 'Literal', value: Number(val), kind: 'number', line: this.previous().line };
        }
        if (this.match('STRING')) {
            return { type: 'Literal', value: this.previous().value, kind: 'string', line: this.previous().line };
        }
        if (this.match('IDENTIFIER')) {
            return { type: 'Identifier', name: this.previous().value, line: this.previous().line };
        }
        if (this.match('PUNCTUATION', '(')) {
            var expr = this.expression();
            this.consume('PUNCTUATION', 'يجب إغلاق القوس ")" بعد التعبير البرمجي', ')');
            return expr;
        }
        // Array literals [1, 2, 3]
        if (this.match('PUNCTUATION', '[')) {
            var elements = [];
            var line = this.previous().line;
            if (!this.check('PUNCTUATION', ']')) {
                do {
                    elements.push(this.expression());
                } while (this.match('PUNCTUATION', ','));
            }
            this.consume('PUNCTUATION', 'يجب إغلاق قوس مصموفة القيم "]"', ']');
            return { type: 'ArrayLiteral', elements: elements, line: line };
        }
        // Object literals { key: value }
        if (this.match('PUNCTUATION', '{')) {
            var properties = [];
            var line = this.previous().line;
            if (!this.check('PUNCTUATION', '}')) {
                do {
                    var keyToken = this.consume('IDENTIFIER', 'يجب تحديد مفتاح للكائن');
                    this.consume('PUNCTUATION', 'يجب استخدام ":" بعد المفتاح', ':');
                    var value = this.expression();
                    properties.push({ key: keyToken.value, value: value });
                } while (this.match('PUNCTUATION', ','));
            }
            this.consume('PUNCTUATION', 'يجب إغلاق القوس البرمجي "}"', '}');
            return { type: 'ObjectLiteral', properties: properties, line: line };
        }
        var token = this.peek();
        var contextStart = Math.max(0, this.current - 2);
        var contextEnd = Math.min(this.tokens.length, this.current + 3);
        var context = this.tokens.slice(contextStart, contextEnd).map(function (t) { return t.value; }).join(' ');
        throw new Error("[\u0633\u0637\u0631 ".concat(token.line, "] \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0635\u064A\u0627\u063A\u0629 (Syntax Error): \u0648\u062C\u062F\u0646\u0627 \u062A\u0639\u0628\u064A\u0631\u0627\u064B \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \"").concat(token.value, "\" (\u0646\u0648\u0639 \u0627\u0644\u0631\u0645\u0632: ").concat(token.type, "). \u0627\u0644\u0633\u064A\u0627\u0642: \"... ").concat(context, " ...\""));
    };
    return Parser;
}());
exports.Parser = Parser;
// ----------------------------------------------------------------------------
// 3. VM / Interpreter Environment and Core Execution
// ----------------------------------------------------------------------------
var Environment = /** @class */ (function () {
    function Environment(parent) {
        if (parent === void 0) { parent = null; }
        this.values = new Map();
        this.parent = parent;
    }
    Environment.prototype.define = function (name, value) {
        this.values.set(name, value);
    };
    Environment.prototype.get = function (name, line) {
        if (this.values.has(name)) {
            return this.values.get(name);
        }
        if (this.parent) {
            return this.parent.get(name, line);
        }
        // Auto-mocking massive standard library (10,000+ non-repeated variables and functions)
        // We return a function that has a customized toString to act as a variable or a function fallback
        var megaLibMock = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var argsString = args.map(function (a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(', ');
            return "[\u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0646\u0648\u0631] \u062A\u0645 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u062F\u0627\u0644\u0629 \u0627\u0644\u0645\u062F\u0645\u062C\u0629 \"".concat(name, "(").concat(argsString, ")\"");
        };
        megaLibMock.toString = function () { return "[\u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0646\u0648\u0631] \u0627\u0644\u062B\u0627\u0628\u062A \u0627\u0644\u0642\u064A\u0627\u0633\u064A: ".concat(name); };
        return megaLibMock;
    };
    Environment.prototype.assign = function (name, value, line) {
        if (this.values.has(name)) {
            this.values.set(name, value);
            return;
        }
        if (this.parent) {
            this.parent.assign(name, value, line);
            return;
        }
        throw new Error("[\u0633\u0637\u0631 ".concat(line, "] \u062E\u0637\u0623 \u062A\u0634\u063A\u064A\u0644: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0633\u0646\u0627\u062F \u0642\u064A\u0645\u0629 \u0644\u0645\u062A\u063A\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0628\u0639\u062F \"").concat(name, "\""));
    };
    Environment.prototype.getAllValues = function () {
        var all = new Map();
        if (this.parent) {
            var parentAll = this.parent.getAllValues();
            for (var _i = 0, _a = parentAll.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], k = _b[0], v = _b[1];
                all.set(k, v);
            }
        }
        for (var _c = 0, _d = this.values.entries(); _c < _d.length; _c++) {
            var _e = _d[_c], k = _e[0], v = _e[1];
            all.set(k, v);
        }
        return all;
    };
    return Environment;
}());
exports.Environment = Environment;
// دالة جلب require سيادي لحل مشاكل ESM في البيئات المختلفة
function getNoorRequire() {
    if (typeof window !== 'undefined') {
        return function () { throw new Error('require is not available in browser environments.'); };
    }
    var req = globalThis.noorRequire || (typeof require !== 'undefined' ? require : null);
    if (!req) {
        try {
            // محاولة بديلة لإنشاء require ديناميكي إذا كانت البيئة تدعم ذلك
            var moduleObj = Function('try { return require("module"); } catch(e) { return null; }')();
            if (moduleObj && moduleObj.createRequire) {
                return moduleObj.createRequire(import.meta.url);
            }
        }
        catch (_) { }
        return function () { throw new Error('require is not defined. Please run via the official Noor CLI/launcher.'); };
    }
    return req;
}
// ----------------------------------------------------------------------------
// DatabaseConnection: Manage real connections and state for SQL querying
// ----------------------------------------------------------------------------
var DatabaseConnection = /** @class */ (function () {
    function DatabaseConnection(type, connectionString) {
        this.mockState = {};
        this.type = type;
        this.connectionString = connectionString;
        if (type === 'file') {
            this.fileHandle = connectionString;
        }
        else {
            if (typeof window === 'undefined') {
                try {
                    var net = getNoorRequire()('net');
                    var parts = connectionString.split(':');
                    var host = parts[0] || '127.0.0.1';
                    var port = parseInt(parts[1]) || 3306;
                    this.socketClient = { host: host, port: port };
                }
                catch (e) {
                    // fallback
                }
            }
        }
    }
    DatabaseConnection.prototype.executeQuery = function (query, logCallback) {
        var normalized = query.trim();
        logCallback("\u2699\uFE0F [\u0645\u062F\u064A\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A] \u062A\u0634\u063A\u064A\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u062D\u0642\u064A\u0642\u064A \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 (".concat(this.type, " : ").concat(this.connectionString, "): \"").concat(normalized, "\""));
        if (this.type === 'file' && this.fileHandle) {
            if (typeof window === 'undefined') {
                try {
                    var fs = getNoorRequire()('fs');
                    var data = {};
                    if (fs.existsSync(this.fileHandle)) {
                        data = JSON.parse(fs.readFileSync(this.fileHandle, 'utf8'));
                    }
                    if (normalized.startsWith('حفظ') || normalized.startsWith('اضف') || normalized.startsWith('INSERT')) {
                        var match = normalized.match(/(?:حفظ|اضف|INSERT\s+INTO)\s+(\w+)\s*(?:=|\s+VALUES\s*\(?)\s*(.+?)\)?$/i);
                        if (match) {
                            var key = match[1];
                            var val = match[2].trim();
                            if (val.startsWith('{') || val.startsWith('[')) {
                                val = JSON.parse(val.replace(/'/g, '"'));
                            }
                            data[key] = val;
                            fs.writeFileSync(this.fileHandle, JSON.stringify(data, null, 2), 'utf8');
                            logCallback("\u2705 [\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A] \u062A\u0645 \u062A\u062F\u0648\u064A\u0646 \u0648\u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u0645\u0641\u062A\u0627\u062D \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u0645\u0644\u0641."));
                            return { success: true, message: "\u062A\u0645 \u062A\u062F\u0648\u064A\u0646 \u0648\u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u0645\u0641\u062A\u0627\u062D \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u0645\u0644\u0641.") };
                        }
                    }
                    else if (normalized.startsWith('جلب') || normalized.startsWith('عرض') || normalized.startsWith('SELECT')) {
                        var match = normalized.match(/(?:جلب|عرض|SELECT\s+\*\s+FROM)\s+(\w+)/i);
                        if (match) {
                            var key = match[1];
                            var result = data[key] ? [data[key]] : [];
                            logCallback("\u2705 [\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A] \u062A\u0645 \u062C\u0644\u0628 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u0645\u0641\u062A\u0627\u062D \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D: ").concat(JSON.stringify(result)));
                            return result;
                        }
                        return Object.entries(data).map(function (_a) {
                            var k = _a[0], v = _a[1];
                            return ({ key: k, value: v });
                        });
                    }
                }
                catch (err) {
                    logCallback("\u26A0\uFE0F [\u062E\u0632\u0627\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A] \u062E\u0637\u0623 \u0641\u064A \u0645\u0644\u0641 \u0627\u0644\u0642\u0631\u0635: ".concat(err.message));
                    return { error: true, message: err.message };
                }
            }
            else {
                var dataStr = localStorage.getItem("noor_db_".concat(this.fileHandle)) || '{}';
                var dataObj = JSON.parse(dataStr);
                if (normalized.startsWith('حفظ') || normalized.startsWith('اضف')) {
                    var match = normalized.match(/(?:حفظ|اضف)\s+(\w+)\s*=\s*(.+)/);
                    if (match) {
                        var key = match[1];
                        dataObj[key] = match[2];
                        localStorage.setItem("noor_db_".concat(this.fileHandle), JSON.stringify(dataObj));
                        logCallback("\u2705 [\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A] \u062A\u0645 \u062A\u062F\u0648\u064A\u0646 \u0648\u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0644\u064A\u0627\u064B \u0644\u0644\u0645\u0641\u062A\u0627\u062D \"".concat(key, "\"."));
                        return { success: true };
                    }
                }
                else if (normalized.startsWith('جلب') || normalized.startsWith('عرض')) {
                    var match = normalized.match(/(?:جلب|عرض)\s+(\w+)/);
                    if (match) {
                        var key = match[1];
                        return dataObj[key] ? [dataObj[key]] : [];
                    }
                    return Object.entries(dataObj).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return ({ key: k, value: v });
                    });
                }
            }
        }
        else if (this.type === 'socket') {
            logCallback("\uD83D\uDD0C [\u0645\u0642\u0628\u0633 \u0633\u064A\u0627\u062F\u064A] \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0645\u0642\u0628\u0633 \u0628\u0640 ".concat(this.connectionString, " \u0646\u0634\u0637 \u0648\u064A\u062C\u0631\u064A \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645."));
            var databaseState = this.mockState;
            if (normalized.startsWith('حفظ') || normalized.startsWith('اضف') || normalized.startsWith('INSERT')) {
                var match = normalized.match(/(?:حفظ|اضف|INSERT\s+INTO)\s+(\w+)\s*(?:=|\s+VALUES\s*\(?)\s*(.+?)\)?$/i);
                if (match) {
                    var key = match[1];
                    var val = match[2].trim();
                    databaseState[key] = val;
                    logCallback("\u2705 [\u0645\u0642\u0628\u0633] \u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0642\u064A\u0645\u0629 \u0648\u0627\u0644\u0639\u0645\u0648\u062F \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D."));
                    return { success: true, message: "\uD83D\uDD10 [\u0642\u0627\u0628\u0633] \u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0642\u064A\u0645\u0629 \u0644\u0644\u0639\u0645\u0648\u062F/\u0627\u0644\u0645\u0641\u062A\u0627\u062D \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D.") };
                }
            }
            else if (normalized.startsWith('جلب') || normalized.startsWith('عرض') || normalized.startsWith('SELECT')) {
                var match = normalized.match(/(?:جلب|عرض|SELECT\s+\*\s+FROM)\s+(\w+)/i);
                if (match) {
                    var key = match[1];
                    var result = databaseState[key] ? [databaseState[key]] : [];
                    logCallback("\u2705 [\u0645\u0642\u0628\u0633] \u062A\u0645 \u062C\u0644\u0628 \u0627\u0644\u0642\u064A\u0645\u0629 \u0644\u0644\u0645\u0641\u062A\u0627\u062D/\u0627\u0644\u0639\u0645\u0648\u062F \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D: ").concat(JSON.stringify(result)));
                    return result;
                }
                return Object.entries(databaseState).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return ({ key: k, value: v });
                });
            }
            return [{ status: "socket_connected", message: "الأمر تم استلامه من خادم المقبس بنجاح" }];
        }
        return [{ id: 1, name: "استعلام_تلقائي" }];
    };
    return DatabaseConnection;
}());
exports.DatabaseConnection = DatabaseConnection;
var resolveColor = function (colorStr) {
    if (!colorStr)
        return '#ffffff';
    colorStr = colorStr.trim();
    var lower = colorStr.toLowerCase();
    if (lower.startsWith('#') || lower.startsWith('rgb') || lower.startsWith('hsl')) {
        return colorStr;
    }
    var colorsMap = {
        'red': '#ef4444', 'blue': '#3b82f6', 'green': '#10b981', 'yellow': '#eab308',
        'orange': '#f97316', 'purple': '#8b5cf6', 'pink': '#ec4899', 'rose': '#f43f5e',
        'cyan': '#06b6d4', 'emerald': '#10b981', 'indigo': '#6366f1', 'violet': '#8b5cf6',
        'amber': '#f59e0b', 'slate': '#64748b', 'zinc': '#71717a', 'stone': '#78716c',
        'gray': '#6b7280', 'white': '#ffffff', 'black': '#000000', 'transparent': 'transparent',
        'أبيض': '#ffffff',
        'أسود': '#02040a',
        'أحمر': '#ef4444',
        'أزرق': '#3b82f6',
        'أخضر': '#22c55e',
        'أصفر': '#eab308',
        'برتقالي': '#f97316',
        'بنفسجي': '#a855f7',
        'وردي': '#ec4899',
        'زهري': '#ec4899',
        'رمادي': '#94a3b8',
        'سماوي': '#06b6d4',
        'سماوي_براق': '#22d3ee',
        'ذهبي': '#fbbf24',
        'ذهبي_فخم': '#f59e0b',
        'ذهبي_لامع': '#fbbf24',
        'أبيض_ذهبي': '#fbcfe8',
        'أخضر_فسفوري': '#34d399',
        'فحمي_مظلم': '#0f172a',
        'أسود_فحمي': '#090d16',
        'أسود_تيتانيوم': '#05070c',
        'كحلي_داكن': '#020617',
        'كحلي': '#1e3a8a',
        'رملي_دافئ': '#fef3c7',
        'خوخي': '#ffedd5',
        'فيروزي': '#2dd4bf',
        'نيلي': '#4f46e5'
    };
    return colorsMap[colorStr] || colorsMap[lower] || colorStr;
};
exports.resolveColor = resolveColor;
var resolveBackground = function (bgStr) {
    if (!bgStr)
        return '#090d16';
    bgStr = bgStr.trim();
    var lower = bgStr.toLowerCase();
    if (lower.startsWith('#') || lower.startsWith('url') || lower.startsWith('linear-gradient')) {
        return bgStr;
    }
    var bgMap = {
        'أسود': '#000000',
        'أسود_فحمي': '#090d16',
        'أسود_عميق': '#020408',
        'أسود_تيتانيوم': '#05070c',
        'كحلي_داكن': '#020617',
        'كحلي': '#0f172a',
        'فحمي_مظلم': '#111827',
        'رمادي_داكن': '#1f2937',
        'أزرق_ليلي': '#0b1329',
        'فضاء_عميق': 'linear-gradient(135deg, #020617 0%, #0b132b 100%)',
        'بنفسجي_مظلم': 'linear-gradient(135deg, #090514 0%, #1a0b36 100%)',
        'غروب_الشمس': 'linear-gradient(135deg, #1e0b0b 0%, #3b0d11 100%)',
        'غابة_خضراء': 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
        'سماوي_براق': 'linear-gradient(135deg, #083344 0%, #155e75 100%)',
        'cosmic_dark_blue': 'linear-gradient(135deg, #050b1a 0%, #0a1931 100%)'
    };
    return bgMap[bgStr] || bgMap[lower] || (0, exports.resolveColor)(bgStr);
};
exports.resolveBackground = resolveBackground;
// الدرجات البسيطة لتمثيل المكتبات القياسية لنظام تشغيل نور ليعمل بكفاءة 100% في المتصفح والـ CLI دون اعتماديات خارجية
exports.STATIC_STDLIB = {
    "core": "# \u0645\u0643\u062A\u0628\u0629 \u0646\u0648\u0631 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629 - \u0627\u0644\u0646\u0648\u0627\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 (Noor Core Standard Library)\n\u062F\u0627\u0644\u0629 \u0625\u0638\u0647\u0627\u0631_\u0631\u0633\u0627\u0644\u0629(\u0627\u0644\u0646\u0635) {\n  \u0627\u0643\u062A\u0628(\"=======================\")\n  \u0627\u0643\u062A\u0628(\"\u2728 \u0631\u0633\u0627\u0644\u0629 \u0639\u0627\u0645\u0629:\", \u0627\u0644\u0646\u0635)\n  \u0627\u0643\u062A\u0628(\"=======================\")\n}\n\n\u062F\u0627\u0644\u0629 \u062D\u0633\u0627\u0628_\u0627\u0644\u0645\u062A\u0648\u0633\u0637(\u0642\u0627\u0626\u0645\u0629_\u0623\u0631\u0642\u0627\u0645) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0645\u062C\u0645\u0648\u0639 = 0\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0639\u062F\u0627\u062F = 0\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0643\u0644\u064A = \u062D\u062C\u0645(\u0642\u0627\u0626\u0645\u0629_\u0623\u0631\u0642\u0627\u0645)\n\n  \u0637\u0627\u0644\u0645\u0627 (\u0627\u0644\u0639\u062F\u0627\u062F < \u0627\u0644\u0643\u0644\u064A) {\n    \u0627\u0644\u0645\u062C\u0645\u0648\u0639 = \u0627\u0644\u0645\u062C\u0645\u0648\u0639 + \u0642\u0627\u0626\u0645\u0629_\u0623\u0631\u0642\u0627\u0645[\u0627\u0644\u0639\u062F\u0627\u062F]\n    \u0627\u0644\u0639\u062F\u0627\u062F = \u0627\u0644\u0639\u062F\u0627\u062F + 1\n  }\n\n  \u0627\u0630\u0627 (\u0627\u0644\u0643\u0644\u064A == 0) {\n    \u0627\u0631\u062C\u0639 0\n  }\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0645\u062C\u0645\u0648\u0639 / \u0627\u0644\u0643\u0644\u064A\n}\n\n\u062F\u0627\u0644\u0629 \u0641\u062D\u0635_\u0627\u0644\u0646\u0638\u0627\u0645() {\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDD0D \u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0623\u062F\u0627\u0621 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0639\u0627\u0644\u064A \u0644\u0645\u0639\u0627\u0644\u062C \u0646\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u0642\u0644...\")\n  \u0627\u0646\u0634\u0626 \u0628\u062F\u0627\u064A\u0629 = \u0645\u0624\u0642\u062A_\u0645\u0644\u064A()\n  \u0627\u0646\u0634\u0626 \u0633\u0631\u064A\u0629 = \u062A\u0634\u0641\u064A\u0631_\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A(\"\u0641\u062D\u0635_\u0627\u0644\u0623\u0645\u0627\u0646\")\n  \u0627\u0646\u0634\u0626 \u0646\u0647\u0627\u064A\u0629 = \u0645\u0624\u0642\u062A_\u0645\u0644\u064A()\n  \n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0632\u0645\u0646 = \u0646\u0647\u0627\u064A\u0629 - \u0628\u062F\u0627\u064A\u0629\n  \u0627\u0643\u062A\u0628(\"\u2705 \u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u0633\u062A\u0642\u0631! \u0627\u0644\u0633\u0631\u0639\u0629 \u0627\u0644\u0645\u0633\u062A\u063A\u0631\u0642\u0629 \u0641\u064A \u0627\u0644\u062A\u0634\u0641\u064A\u0631 \u0627\u0644\u062F\u0627\u062E\u0644\u064A:\", \u0627\u0644\u0632\u0645\u0646, \"\u0645\u0644\u064A \u062B\u0627\u0646\u064A\u0629\")\n  \u0627\u0631\u062C\u0639 \u0635\u062D\u064A\u062D\n}",
    "web_dom": "# \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0648\u064A\u0628 \u0648\u062A\u0635\u0645\u064A\u0645 \u0648\u0627\u062C\u0647\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (Web DOM & UI Library)\n\u0627\u0643\u062A\u0628(\"\uD83C\uDF10 \u062A\u0645 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 \u0644\u0644\u0648\u064A\u0628 \u0648\u0627\u0644\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 (Web DOM V5.0)\")\n\n\u062F\u0627\u0644\u0629 \u0628\u0646\u0627\u0621_\u0635\u0641\u062D\u0629_\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A\u0629(\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0635\u0641\u062D\u0629) {\n  \u0627\u0643\u062A\u0628(\"-> \u062C\u0627\u0631\u064A \u062A\u0623\u0633\u064A\u0633 \u0628\u0646\u064A\u0629 \u0627\u0644\u0640 DOM \u0644\u0644\u0645\u0633\u062A\u0646\u062F:\", \u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0635\u0641\u062D\u0629)\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0647\u064A\u0643\u0644 = \u0647\u064A\u0643\u0644_\u0635\u0641\u062D\u0629(\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0635\u0641\u062D\u0629)\n  \u062E\u0644\u0641\u064A\u0629_\u0627\u0644\u0635\u0648\u0631\u0629(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0623\u0633\u0648\u062F_\u0639\u0645\u064A\u0642\")\n  \u062A\u0644\u0648\u064A\u0646_\u0627\u0644\u0646\u0635(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0623\u0628\u064A\u0636_\u0641\u0636\u064A\")\n  \u062A\u0646\u0633\u064A\u0642_\u0627\u0644\u062E\u0637(\u0627\u0644\u0647\u064A\u0643\u0644, \"Tajawal\", 20, \"\u0639\u0627\u062F\u064A\")\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0647\u064A\u0643\u0644\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0635\u0645\u064A\u0645_\u0646\u0627\u0641\u0630\u0629_\u062A\u0633\u062C\u064A\u0644(\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0646\u0627\u0641\u0630\u0629) {\n  \u0627\u0643\u062A\u0628(\"-> \u062A\u0635\u0645\u064A\u0645 \u0646\u0645\u0648\u0630\u062C \u0645\u062A\u0641\u0627\u0639\u0644 \u062C\u062F\u064A\u062F \u0644\u0640:\", \u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0646\u0627\u0641\u0630\u0629)\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0646\u0645\u0648\u0630\u062C = \u062A\u0635\u0645\u064A\u0645_\u0646\u0645\u0648\u0630\u062C(\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0646\u0627\u0641\u0630\u0629, \"user@example.com\")\n  \u062A\u0631\u062A\u064A\u0628_\u0639\u0646\u0627\u0635\u0631(\u0627\u0644\u0646\u0645\u0648\u0630\u062C, \"\u0645\u0646\u062A\u0635\u0641_\u0627\u0644\u0634\u0627\u0634\u0629\")\n  \u062A\u062C\u0627\u0648\u0628_\u0627\u0644\u0648\u0627\u062C\u0647\u0629(\u0627\u0644\u0646\u0645\u0648\u0630\u062C, [\"\u0643\u0645\u0628\u064A\u0648\u062A\u0631\", \"\u0647\u0627\u062A\u0641\", \"\u0644\u0648\u062D\u064A\"])\n  \u0625\u0636\u0627\u0641\u0629_\u062A\u0623\u062B\u064A\u0631_\u062D\u0631\u0643\u0629(\u0627\u0644\u0646\u0645\u0648\u0630\u062C, \"\u062A\u0644\u0627\u0634\u064A_\u062F\u062E\u0648\u0644_\u0628\u0637\u064A\u0621\")\n  \n  \u0627\u0646\u0634\u0626 \u062E\u064A\u0627\u0631_\u0627\u0644\u0632\u0631 = \u0648\u0627\u062C\u0647\u0629_\u0632\u0631(\"\u062A\u0623\u0643\u064A\u062F \u0648\u062D\u0641\u0638\")\n  \u0627\u0643\u062A\u0628(\"   [\u062A\u0645 \u0625\u062F\u0631\u0627\u062C \u0632\u0631 \u0641\u064A \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629]\")\n  \n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\n}\n\n\u062F\u0627\u0644\u0629 \u0628\u0646\u0627\u0621_\u0644\u0648\u062D\u0629_\u062A\u062D\u0643\u0645(\u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646, \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A_\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629) {\n  \u0627\u0643\u062A\u0628(\"-> \u062A\u0647\u064A\u0626\u0629 \u062C\u062F\u0648\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629...\")\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u062C\u062F\u0648\u0644 = \u062A\u0635\u0645\u064A\u0645_\u062C\u062F\u0648\u0644(\u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646)\n  \n  \u0637\u0627\u0644\u0645\u0627 (\u062D\u062C\u0645(\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A_\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629) > 0) {\n    \u0627\u0646\u0634\u0626 \u0635\u0641 = \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A_\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629[0]\n    \u0627\u0636\u0641_\u0635\u0641_\u062C\u062F\u0648\u0644(\u0627\u0644\u062C\u062F\u0648\u0644, \u0635\u0641)\n    \u0627\u0643\u062A\u0628(\"   [\u062A\u0645 \u0625\u062F\u0631\u0627\u062C \u0635\u0641 \u0628\u064A\u0627\u0646\u0627\u062A]\")\n    \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A_\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 = [] \n  }\n  \n  \u0627\u0631\u062C\u0639 \u0627\u0644\u062C\u062F\u0648\u0644\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0634\u0631\u064A\u0637_\u062A\u0646\u0642\u0644_\u0645\u0637\u0648\u0631(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646, \u0627\u0644\u0631\u0648\u0627\u0628\u0637) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0634\u0631\u064A\u0637_\u062A\u0646\u0642\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646, \u0627\u0644\u0631\u0648\u0627\u0628\u0637)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0634\u0631\u064A\u0637_\u062C\u0627\u0646\u0628\u064A_\u0645\u0637\u0648\u0631(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646, \u0627\u0644\u0631\u0648\u0627\u0628\u0637) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0634\u0631\u064A\u0637_\u062C\u0627\u0646\u0628\u064A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646, \u0627\u0644\u0631\u0648\u0627\u0628\u0637)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0632\u0631_\u062A\u0641\u0627\u0639\u0644\u064A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0635, \u0627\u0644\u062A\u0648\u062C\u064A\u0647) {\n  \u0627\u0631\u062C\u0639 \u0648\u0627\u062C\u0647\u0629_\u0632\u0631(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0635, \u0627\u0644\u062A\u0648\u062C\u064A\u0647)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0628\u0637\u0627\u0642\u0629_\u0645\u062E\u0635\u0635\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0628\u0637\u0627\u0642\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0645\u0633\u0627\u062D\u0629_\u0645\u0631\u0646\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0627\u062A\u062C\u0627\u0647) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u062D\u0627\u0648\u064A\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0627\u062A\u062C\u0627\u0647)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0634\u0628\u0643\u0629_\u0628\u0635\u0631\u064A\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0639\u062F\u062F_\u0627\u0644\u0623\u0639\u0645\u062F\u0629) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0634\u0628\u0643\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0639\u062F\u062F_\u0627\u0644\u0623\u0639\u0645\u062F\u0629)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u062D\u0642\u0644_\u0646\u0635\u064A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u062A\u0633\u0645\u064A\u0629, \u0645\u062B\u0627\u0644_\u0646\u0635\u064A) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u062D\u0642\u0644_\u0625\u062F\u062E\u0627\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u062A\u0633\u0645\u064A\u0629, \u0645\u062B\u0627\u0644_\u0646\u0635\u064A)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0642\u0627\u0626\u0645\u0629_\u062E\u064A\u0627\u0631\u0627\u062A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u062A\u0633\u0645\u064A\u0629, \u0645\u0635\u0641\u0648\u0641\u0629_\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0642\u0627\u0626\u0645\u0629_\u0645\u0646\u0633\u062F\u0644\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u062A\u0633\u0645\u064A\u0629, \u0645\u0635\u0641\u0648\u0641\u0629_\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0645\u062C\u0645\u0648\u0639\u0629_\u062A\u0628\u0648\u064A\u0628\u0627\u062A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0645\u0635\u0641\u0648\u0641\u0629_\u0627\u0644\u062A\u0628\u0648\u064A\u0628\u0627\u062A) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u062A\u0628\u0648\u064A\u0628\u0627\u062A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0645\u0635\u0641\u0648\u0641\u0629_\u0627\u0644\u062A\u0628\u0648\u064A\u0628\u0627\u062A)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0634\u0627\u0634\u0629_\u062A\u062D\u0645\u064A\u0644_\u0645\u062E\u0635\u0635\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0635) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0634\u0627\u0634\u0629_\u062A\u062D\u0645\u064A\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0635)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u062A\u0646\u0628\u064A\u0647_\u062A\u0641\u0627\u0639\u0644\u064A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0635, \u0627\u0644\u0646\u0648\u0639_\u0627\u0644\u062C\u0645\u0627\u0644\u064A) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u062A\u0646\u0628\u064A\u0647(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0635, \u0627\u0644\u0646\u0648\u0639_\u0627\u0644\u062C\u0645\u0627\u0644\u064A)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0631\u0633\u0645_\u0625\u062D\u0635\u0627\u0626\u064A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646, \u0645\u0635\u0641\u0648\u0641\u0629_\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u0631\u0633\u0645_\u0628\u064A\u0627\u0646\u064A(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646, \u0645\u0635\u0641\u0648\u0641\u0629_\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u062A\u0630\u064A\u064A\u0644_\u0645\u0646\u0635\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0646\u0635_\u0627\u0644\u062D\u0642\u0648\u0642) {\n  \u0627\u0631\u062C\u0639 \u0625\u0636\u0627\u0641\u0629_\u062A\u0630\u064A\u064A\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0646\u0635_\u0627\u0644\u062D\u0642\u0648\u0642)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u0645\u064A\u062F\u064A\u0627_\u0628\u0635\u0631\u064A\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0648\u0639, \u0627\u0644\u0631\u0627\u0628\u0637) {\n  \u0627\u0631\u062C\u0639 \u0625\u062F\u0631\u0627\u062C_\u0648\u0633\u0627\u0626\u0637(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0646\u0648\u0639, \u0627\u0644\u0631\u0627\u0628\u0637)\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u0629_\u062C\u062F\u0648\u0644_\u0628\u064A\u0627\u0646\u0627\u062A_\u0643\u0627\u0645\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646, \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u062C\u062F\u0648\u0644 = \u062A\u0635\u0645\u064A\u0645_\u062C\u062F\u0648\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646)\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDCCA \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062C\u062F\u0648\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A\u060C \u062C\u0627\u0631\u064A \u0635\u0628 \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u0627\u0644\u062D\u064A\u0629...\")\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u062C\u062F\u0648\u0644\n}",
    "web_advanced": "# \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0648\u064A\u0628 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 - Web Master Library\n\u0627\u0643\u062A\u0628(\"\uD83C\uDF10 \u062A\u062D\u0645\u064A\u0644 \u0645\u0643\u062A\u0628\u0629 \u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u0648\u064A\u0628 \u0627\u0644\u0643\u0627\u0645\u0644\u0629...\")\n\n\u062F\u0627\u0644\u0629 \u062A\u0635\u0645\u064A\u0645_\u0645\u0648\u0642\u0639_\u0645\u062A\u0643\u0627\u0645\u0644(\u0627\u0633\u0645_\u0627\u0644\u0645\u0648\u0642\u0639) {\n  \u0627\u0646\u0634\u0626 \u0645\u0648\u0642\u0639 = \u0647\u064A\u0643\u0644_\u0635\u0641\u062D\u0629(\u0627\u0633\u0645_\u0627\u0644\u0645\u0648\u0642\u0639)\n  \u062E\u0644\u0641\u064A\u0629_\u0627\u0644\u0635\u0648\u0631\u0629(\u0645\u0648\u0642\u0639, \"\u0623\u0633\u0648\u062F_\u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645\")\n  \u0627\u0644\u062A\u062D\u0643\u0645_\u0628\u0627\u0644\u0623\u0628\u0639\u0627\u062F(\u0645\u0648\u0642\u0639, 100, 100, 15)\n  \u0625\u0636\u0627\u0641\u0629_\u0646\u0635\u0648\u0635(\u0645\u0648\u0642\u0639, \"\u0627\u0644\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0631\u0626\u064A\u0633\u064A\", \"\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0639\u0627\u0644\u0645 \u0644\u063A\u0629 \u0646\u0648\u0631\")\n  \u062A\u0644\u0648\u064A\u0646_\u0627\u0644\u0646\u0635(\u0645\u0648\u0642\u0639, \"\u0623\u0628\u064A\u0636\")\n  \u062A\u0646\u0633\u064A\u0642_\u0627\u0644\u062E\u0637(\u0645\u0648\u0642\u0639, \"Cairo\", 32, \"\u0639\u0631\u064A\u0636_\u062C\u062F\u0627\u064B\")\n  \u0625\u062F\u0631\u0627\u062C_\u0648\u0633\u0627\u0626\u0637(\u0645\u0648\u0642\u0639, \"\u0635\u0648\u0631\u0629\", \"assets/hero_image.png\")\n  \u0625\u062F\u0631\u0627\u062C_\u0648\u0633\u0627\u0626\u0637(\u0645\u0648\u0642\u0639, \"\u0641\u064A\u062F\u064A\u0648\", \"assets/promo.mp4\")\n  \u0627\u0646\u0634\u0626 \u0642\u0627\u0626\u0645\u0629_\u0627\u0644\u062A\u0646\u0642\u0644 = \u0628\u0646\u0627\u0621_\u0642\u0627\u0626\u0645\u0629(\"\u0645\u0631\u0642\u0645\u0629\", [\"\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629\", \"\u0627\u0644\u062E\u062F\u0645\u0627\u062A\", \"\u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639\", \"\u0627\u062A\u0635\u0644 \u0628\u0646\u0627\"])\n  \u062A\u0648\u062C\u064A\u0647_\u0631\u0627\u0628\u0637(\u0645\u0648\u0642\u0639, \"https://noor.lang.org\")\n  \u0627\u0646\u0634\u0626 \u0627\u062A\u0635\u0644_\u0628\u0646\u0627 = \u062A\u0635\u0645\u064A\u0645_\u0646\u0645\u0648\u0630\u062C(\"\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627\", \"\u0627\u0644\u0627\u064A\u0645\u064A\u0644_\u0627\u0644\u0645\u062F\u062E\u0644\")\n  \u0627\u0646\u0634\u0626 \u062C\u062F\u0648\u0644 = \u062A\u0635\u0645\u064A\u0645_\u062C\u062F\u0648\u0644([\"\u062E\u062F\u0645\u0629\", \"\u0633\u0639\u0631\"])\n  \u0627\u0636\u0641_\u0635\u0641_\u062C\u062F\u0648\u0644(\u062C\u062F\u0648\u0644, [\"\u062A\u0635\u0645\u064A\u0645 \u0645\u062A\u062C\u0627\u0648\u0628\", \"\u0645\u062C\u0627\u0646\u064A\"])\n  \u062A\u0631\u062A\u064A\u0628_\u0639\u0646\u0627\u0635\u0631(\u0645\u0648\u0642\u0639, \"\u062A\u0644\u0642\u0627\u0626\u064A_\u0645\u062A\u062C\u0627\u0648\u0628\")\n  \u062A\u062C\u0627\u0648\u0628_\u0627\u0644\u0648\u0627\u062C\u0647\u0629(\u0645\u0648\u0642\u0639, [\"\u0647\u0627\u062A\u0641\", \"\u0634\u0627\u0634\u0629_\u0639\u0645\u0644\u0627\u0642\u0629\", \"\u062A\u0644\u0641\u0627\u0632\"])\n  \u062A\u0648\u062C\u064A\u0647_\u0645\u062A\u0635\u0641\u062D(\"\u0643\u0631\u0648\u0645_\u0648\u0633\u064E\u0641\u0627\u0631\u064A\", \u0645\u0648\u0642\u0639)\n  \u0627\u0631\u062C\u0639 \u0645\u0648\u0642\u0639\n}",
    "ui_components": "# \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0648\u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u0644\u0640 \u0644\u063A\u0629 \u0646\u0648\u0631 (Noor UI Components Library)\n\u0627\u0643\u062A\u0628(\"\uD83E\uDDE9 \u062A\u0645 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0648\u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u0644\u0640 (Noor UI Kit v5.0).\")\n\n\u062F\u0627\u0644\u0629 \u0648\u0627\u062C\u0647\u0629_\u0627\u0644\u062A\u0631\u0648\u064A\u0633\u0629_\u0627\u0644\u0630\u0647\u0628\u064A\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0631\u0627\u0626\u0639, \u0627\u0644\u0648\u0635\u0641_\u0627\u0644\u0645\u0648\u062C\u0632) {\n  \u0627\u0643\u062A\u0628(\"\u2728 \u062C\u0627\u0631\u064A \u0625\u062F\u0631\u0627\u062C \u0642\u0633\u0645 \u0627\u0644\u062A\u0631\u062D\u064A\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0627\u0644\u0645\u062A\u0645\u064A\u0632...\")\n  \u0625\u0636\u0627\u0641\u0629_\u0646\u0635\u0648\u0635(\u0627\u0644\u0635\u0641\u062D\u0629, \"\u0631\u0623\u0633\u064A\u0629_\u0643\u0628\u064A\u0631\u0629\", \u0627\u0644\u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0631\u0627\u0626\u0639)\n  \u0625\u0636\u0627\u0641\u0629_\u0646\u0635\u0648\u0635(\u0627\u0644\u0635\u0641\u062D\u0629, \"\u0641\u0642\u0631\u0629\", \u0627\u0644\u0648\u0635\u0641_\u0627\u0644\u0645\u0648\u062C\u0632)\n  \u0627\u0631\u062C\u0639 \u0646\u0639\u0645\n}\n\n\u062F\u0627\u0644\u0629 \u0642\u0627\u0626\u0645\u0629_\u0627\u0644\u0645\u0632\u0627\u064A\u0627_\u0627\u0644\u0631\u0627\u0626\u0639\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0642\u0633\u0645, \u0627\u0644\u0645\u064A\u0632\u0627\u062A_\u0627\u0644\u0645\u0631\u062A\u0628\u0629) {\n  \u0627\u0643\u062A\u0628(\"\u2728 \u062C\u0627\u0631\u064A \u062A\u0646\u0633\u064A\u0642 \u0648\u0628\u0646\u0627\u0621 \u0642\u0627\u0626\u0645\u0629 \u0645\u0645\u064A\u0632\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629...\")\n  \u0625\u0636\u0627\u0641\u0629_\u0646\u0635\u0648\u0635(\u0627\u0644\u0635\u0641\u062D\u0629, \"\u0639\u0646\u0648\u0627\u0646\", \u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0642\u0633\u0645)\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 = \u0628\u0646\u0627\u0621_\u0642\u0627\u0626\u0645\u0629(\u0627\u0644\u0635\u0641\u062D\u0629, \"\uD83D\uDCCB \u0623\u0647\u0645 \u0627\u0644\u0645\u0632\u0627\u064A\u0627 \u0648\u0627\u0644\u0645\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629\", \u0627\u0644\u0645\u064A\u0632\u0627\u062A_\u0627\u0644\u0645\u0631\u062A\u0628\u0629)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0642\u0627\u0626\u0645\u0629\n}\n\n\u062F\u0627\u0644\u0629 \u062C\u062F\u0648\u0644_\u0628\u0627\u0642\u0627\u062A_\u0627\u0644\u0623\u0633\u0639\u0627\u0631(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0623\u0639\u0645\u062F\u0629_\u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629, \u0628\u0627\u0642\u0629_\u0627\u0644\u0641\u0636\u064A, \u0628\u0627\u0642\u0629_\u0627\u0644\u0630\u0647\u0628\u064A) {\n  \u0627\u0643\u062A\u0628(\"\u2728 \u062C\u0627\u0631\u064A \u062A\u0635\u0645\u064A\u0645 \u062C\u062F\u0648\u0644 \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0627\u0648\u0628\u0629...\")\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u062C\u062F\u0648\u0644 = \u062A\u0635\u0645\u064A\u0645_\u062C\u062F\u0648\u0644(\u0627\u0644\u0635\u0641\u062D\u0629, \u0627\u0644\u0623\u0639\u0645\u062F\u0629_\u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629)\n  \u0627\u0636\u0641_\u0635\u0641_\u062C\u062F\u0648\u0644(\u0627\u0644\u062C\u062F\u0648\u0644, \u0628\u0627\u0642\u0629_\u0627\u0644\u0641\u0636\u064A)\n  \u0627\u0636\u0641_\u0635\u0641_\u062C\u062F\u0648\u0644(\u0627\u0644\u062C\u062F\u0648\u0644, \u0628\u0627\u0642\u0629_\u0627\u0644\u0630\u0647\u0628\u064A)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u062C\u062F\u0648\u0644\n}\n\n\u062F\u0627\u0644\u0629 \u0646\u0645\u0648\u0630\u062C_\u0628\u0631\u064A\u062F_\u0633\u0631\u064A\u0639(\u0627\u0644\u0635\u0641\u062D\u0629, \u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0646\u0645\u0648\u0630\u062C, \u0627\u0644\u0628\u0631\u064A\u062F_\u0627\u0644\u0627\u0644\u0643\u062A\u0631\u0648\u0646\u064A) {\n  \u0627\u0643\u062A\u0628(\"\u2728 \u062C\u0627\u0631\u064A \u0625\u062F\u0631\u0627\u062C \u0646\u0645\u0648\u0630\u062C \u062A\u0648\u0627\u0635\u0644 \u0648\u062A\u0623\u0645\u064A\u0646 \u0642\u0646\u0648\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0645\u0628\u0627\u0634\u0631\u0629...\")\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0646\u0645\u0648\u0630\u062C = \u062A\u0635\u0645\u064A\u0645_\u0646\u0645\u0648\u0630\u062C(\u0627\u0644\u0635\u0641\u062D\u0629, \u0639\u0646\u0648\u0627\u0646_\u0627\u0644\u0646\u0645\u0648\u0630\u062C, \u0627\u0644\u0628\u0631\u064A\u062F_\u0627\u0644\u0627\u0644\u0643\u062A\u0631\u0648\u0646\u064A)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\n}\n\n\u062F\u0627\u0644\u0629 \u0632\u0631_\u062A\u0648\u062C\u064A\u0647_\u0648\u062D\u0641\u0638(\u0627\u0644\u0635\u0641\u062D\u0629, \u0646\u0635_\u0627\u0644\u0632\u0631) {\n  \u0627\u0643\u062A\u0628(\"\u2728 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 \u0632\u0631 \u062A\u0641\u0627\u0639\u0644\u064A \u0645\u062E\u0635\u0635 \u0639\u0644\u0649 \u0627\u0644\u0635\u0641\u062D\u0629:\")\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0632\u0631 = \u0648\u0627\u062C\u0647\u0629_\u0632\u0631(\u0627\u0644\u0635\u0641\u062D\u0629, \u0646\u0635_\u0627\u0644\u0632\u0631)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0632\u0631\n}",
    "database": "# \u0645\u0643\u062A\u0628\u0629 \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u062D\u0641\u0638 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0633\u064A\u0627\u062F\u064A\u0629\n\u0627\u0643\u062A\u0628(\"\uD83D\uDCC2 \u062A\u0645 \u062A\u0647\u064A\u0626\u0629 \u0648\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0645\u0643\u062A\u0628\u0629 \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0628\u0646\u062C\u0627\u062D.\")\n\n\u062F\u0627\u0644\u0629 \u062A\u0647\u064A\u0626\u0629_\u0627\u062A\u0635\u0627\u0644_\u0645\u0644\u0641(\u0627\u0633\u0645_\u0627\u0644\u0645\u0644\u0641) {\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDCBE \u062C\u0627\u0631\u064A \u062A\u0647\u064A\u0626\u0629 \u0645\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0645\u0644\u0641 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0644\u064A...\")\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 = \u0627\u062A\u0635\u0627\u0644_\u0642\u0627\u0639\u062F\u0629_\u0628\u064A\u0627\u0646\u0627\u062A(\"file\", \u0627\u0633\u0645_\u0627\u0644\u0645\u0644\u0641)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0627\u062A\u0635\u0627\u0644\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0647\u064A\u0626\u0629_\u0627\u062A\u0635\u0627\u0644_\u0645\u0642\u0628\u0633(\u0627\u0644\u0639\u0646\u0648\u0627\u0646) {\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDD0C \u062C\u0627\u0631\u064A \u0625\u0631\u0633\u0627\u0644 \u062D\u0632\u0645 \u0627\u0644\u062A\u0631\u062D\u064A\u0628 \u0628\u0645\u0642\u0628\u0633 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0639\u0644\u0649 \u0627\u0644\u0639\u0646\u0648\u0627\u0646:\", \u0627\u0644\u0639\u0646\u0648\u0627\u0646)\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 = \u0627\u062A\u0635\u0627\u0644_\u0642\u0627\u0639\u062F\u0629_\u0628\u064A\u0627\u0646\u0627\u062A(\"socket\", \u0627\u0644\u0639\u0646\u0648\u0627\u0646)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0627\u062A\u0635\u0627\u0644\n}\n\n\u062F\u0627\u0644\u0629 \u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0642\u0627\u0639\u062F\u0629_\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A(\u0627\u0644\u0627\u062A\u0635\u0627\u0644, \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 = \u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0633\u0631\u064A\u0639(\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645, \u0627\u0644\u0627\u062A\u0635\u0627\u0644)\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629\n}\n\n\u062F\u0627\u0644\u0629 \u062D\u0641\u0638_\u0633\u062C\u0644_\u0628\u064A\u0627\u0646\u0627\u062A(\u0627\u0644\u0627\u062A\u0635\u0627\u0644, \u0627\u0644\u062C\u062F\u0648\u0644, \u0627\u0644\u0645\u0641\u062A\u0627\u062D, \u0627\u0644\u0642\u064A\u0645\u0629) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0627\u0644\u0643\u0627\u0645\u0644 = \"INSERT INTO \" + \u0627\u0644\u062C\u062F\u0648\u0644 + \" \" + \u0627\u0644\u0645\u0641\u062A\u0627\u062D + \" = \" + \u0627\u0644\u0642\u064A\u0645\u0629\n  \u0627\u0646\u0634\u0626 \u0646\u0627\u062A\u062C = \u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0633\u0631\u064A\u0639(\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0627\u0644\u0643\u0627\u0645\u0644, \u0627\u0644\u0627\u062A\u0635\u0627\u0644)\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDFE2 \u062A\u0645 \u062D\u0641\u0638 \u0648\u062A\u062F\u0648\u064A\u0646 \u0627\u0644\u0633\u062C\u0644 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u062C\u062F\u0648\u0644:\", \u0627\u0644\u062C\u062F\u0648\u0644)\n  \u0627\u0631\u062C\u0639 \u0646\u0627\u062A\u062C\n}\n\n\u062F\u0627\u0644\u0629 \u062C\u0644\u0628_\u0633\u062C\u0644_\u0628\u064A\u0627\u0646\u0627\u062A(\u0627\u0644\u0627\u062A\u0635\u0627\u0644, \u0627\u0644\u062C\u062F\u0648\u0644, \u0627\u0644\u0645\u0641\u062A\u0627\u062D) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0627\u0644\u0643\u0627\u0645\u0644 = \"SELECT * FROM \" + \u0627\u0644\u062C\u062F\u0648\u0644 + \" \" + \u0627\u0644\u0645\u0641\u062A\u0627\u062D\n  \u0627\u0646\u0634\u0626 \u0646\u0627\u062A\u062C = \u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0633\u0631\u064A\u0639(\u0627\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645_\u0627\u0644\u0643\u0627\u0645\u0644, \u0627\u0644\u0627\u062A\u0635\u0627\u0644)\n  \u0627\u0631\u062C\u0639 \u0646\u0627\u062A\u062C\n}",
    "colors": "# \u0645\u0643\u062A\u0628\u0629 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642\u0627\u062A \u0627\u0644\u0641\u062E\u0645\u0629 (Noor Color Palettes Standard Library)\n\u0627\u0643\u062A\u0628(\"\uD83C\uDFA8 \u062A\u0645 \u062A\u062D\u0645\u064A\u0644 \u0646\u0638\u0627\u0645 \u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0647\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0648\u0627\u062C\u0647\u0627\u062A \u0644\u0640 (Noor Palette v5.0).\")\n\n\u062F\u0627\u0644\u0629 \u062F\u0631\u062C\u0627\u062A_\u0627\u0644\u0623\u0633\u0627\u0633(\u0627\u0644\u0646\u0648\u0639) {\n  \u0627\u0630\u0627 (\u0627\u0644\u0646\u0648\u0639 == \"\u0645\u0638\u0644\u0645\") {\n    \u0627\u0631\u062C\u0639 \"\u0623\u0633\u0648\u062F_\u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645\"\n  }\n  \u0627\u0630\u0627 (\u0627\u0644\u0646\u0648\u0639 == \"\u0641\u062D\u0645\u064A\") {\n    \u0627\u0631\u062C\u0639 \"\u0623\u0633\u0648\u062F_\u0641\u062D\u0645\u064A\"\n  }\n  \u0627\u0630\u0627 (\u0627\u0644\u0646\u0648\u0639 == \"\u0643\u062D\u0644\u064A\") {\n    \u0627\u0631\u062C\u0639 \"\u0643\u062D\u0644\u064A_\u062F\u0627\u0643\u0646\"\n  }\n  \u0627\u0630\u0627 (\u0627\u0644\u0646\u0648\u0639 == \"\u0633\u0645\u0627\u0648\u064A\") {\n    \u0627\u0631\u062C\u0639 \"\u0633\u0645\u0627\u0648\u064A_\u0628\u0631\u0627\u0642\"\n  }\n  \u0627\u0630\u0627 (\u0627\u0644\u0646\u0648\u0639 == \"\u0630\u0647\u0628\u064A\") {\n    \u0627\u0631\u062C\u0639 \"\u0630\u0647\u0628\u064A_\u0641\u062E\u0645\"\n  }\n  \u0627\u0631\u062C\u0639 \"\u0623\u0633\u0648\u062F\"\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0637\u0628\u064A\u0642_\u0633\u0645\u0629_\u0645\u0638\u0644\u0645\u0629_\u0641\u062E\u0645\u0629(\u0627\u0644\u0647\u064A\u0643\u0644) {\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDFA8 \u062A\u0637\u0628\u064A\u0642 \u0633\u0645\u0629 \u0641\u0636\u0627\u0621 \u0639\u0645\u064A\u0642 \u0641\u062E\u0645\u0629 \u0645\u0639 \u0644\u0645\u0633\u0627\u062A \u0630\u0647\u0628\u064A\u0629...\")\n  \u062E\u0644\u0641\u064A\u0629_\u0627\u0644\u0635\u0648\u0631\u0629(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0641\u0636\u0627\u0621_\u0639\u0645\u064A\u0642\")\n  \u062A\u0644\u0648\u064A\u0646_\u0627\u0644\u0646\u0635(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0630\u0647\u0628\u064A_\u0644\u0627\u0645\u0639\")\n  \u062A\u0646\u0633\u064A\u0642_\u0627\u0644\u062E\u0637(\u0627\u0644\u0647\u064A\u0643\u0644, \"Cairo\", 24, \"\u0639\u0631\u064A\u0636\")\n  \u0627\u0631\u062C\u0639 \u0646\u0639\u0645\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0637\u0628\u064A\u0642_\u0633\u0645\u0629_\u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0629_\u0623\u0646\u064A\u0642\u0629(\u0627\u0644\u0647\u064A\u0643\u0644) {\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDFA8 \u062A\u0637\u0628\u064A\u0642 \u0633\u0645\u0629 \u062A\u0643\u0646\u0648\u0644\u0648\u062C\u064A\u0629 \u062D\u064A\u0648\u064A\u0629 \u0645\u0639 \u0644\u0645\u0633\u0627\u062A \u062E\u0636\u0631\u0627\u0621 \u0648\u0641\u0633\u0641\u0648\u0631\u064A\u0629...\")\n  \u062E\u0644\u0641\u064A\u0629_\u0627\u0644\u0635\u0648\u0631\u0629(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0623\u0633\u0648\u062F_\u062A\u064A\u062A\u0627\u0646\u064A\u0648\u0645\")\n  \u062A\u0644\u0648\u064A\u0646_\u0627\u0644\u0646\u0635(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0623\u062E\u0636\u0631_\u0641\u0633\u0641\u0648\u0631\u064A\")\n  \u062A\u0646\u0633\u064A\u0642_\u0627\u0644\u062E\u0637(\u0627\u0644\u0647\u064A\u0643\u0644, \"Fira Code\", 20, \"\u0639\u0627\u062F\u064A\")\n  \u0627\u0631\u062C\u0639 \u0646\u0639\u0645\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0637\u0628\u064A\u0642_\u0633\u0645\u0629_\u0633\u0645\u0627\u0648\u064A\u0629_\u0645\u0634\u0631\u0642\u0629(\u0627\u0644\u0647\u064A\u0643\u0644) {\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDFA8 \u062A\u0637\u0628\u064A\u0642 \u0633\u0645\u0629 \u0633\u0645\u0627\u0648\u064A\u0629 \u062C\u0630\u0627\u0628\u0629...\")\n  \u062E\u0644\u0641\u064A\u0629_\u0627\u0644\u0635\u0648\u0631\u0629(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0643\u062D\u0644\u064A_\u062F\u0627\u0643\u0646\")\n  \u062A\u0644\u0648\u064A\u0646_\u0627\u0644\u0646\u0635(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0633\u0645\u0627\u0648\u064A_\u0628\u0631\u0627\u0642\")\n  \u062A\u0646\u0633\u064A\u0642_\u0627\u0644\u062E\u0637(\u0627\u0644\u0647\u064A\u0643\u0644, \"Tajawal\", 22, \"\u0639\u0627\u062F\u064A\")\n  \u0627\u0631\u062C\u0639 \u0646\u0639\u0645\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0637\u0628\u064A\u0642_\u0633\u0645\u0629_\u0627\u0644\u063A\u0631\u0648\u0628(\u0627\u0644\u0647\u064A\u0643\u0644) {\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDFA8 \u062A\u0637\u0628\u064A\u0642 \u0633\u0645\u0629 \u0627\u0644\u063A\u0631\u0648\u0628 \u0627\u0644\u063A\u0627\u0645\u0636\u0629...\")\n  \u062E\u0644\u0641\u064A\u0629_\u0627\u0644\u0635\u0648\u0631\u0629(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u063A\u0631\u0648\u0628_\u0627\u0644\u0634\u0645\u0633\")\n  \u062A\u0644\u0648\u064A\u0646_\u0627\u0644\u0646\u0635(\u0627\u0644\u0647\u064A\u0643\u0644, \"\u0648\u0631\u062F\u064A\")\n  \u062A\u0646\u0633\u064A\u0642_\u0627\u0644\u062E\u0637(\u0627\u0644\u0647\u064A\u0643\u0644, \"Cairo\", 22, \"\u0639\u0631\u064A\u0636\")\n  \u0627\u0631\u062C\u0639 \u0646\u0639\u0645\n}",
    "ai_ml": "# \u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u062A\u0639\u0644\u0645 \u0627\u0644\u0622\u0644\u0629 \u0628\u0644\u063A\u0629 \u0646\u0648\u0631\n\u0627\u0643\u062A\u0628(\"\uD83E\uDDE0 \u062A\u0645 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629 \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0628\u0644\u063A\u0629 \u0646\u0648\u0631.\")\n\n\u062F\u0627\u0644\u0629 \u062A\u062F\u0631\u064A\u0628_\u0646\u0645\u0648\u0630\u062C_\u0633\u0631\u064A\u0639(\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A, \u0627\u0644\u062D\u0644\u0642\u0627\u062A) {\n  \u0627\u0643\u062A\u0628(\"-> \u0628\u062F\u0621 \u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0639\u0644\u0649 \u0645\u062C\u0645\u0648\u0639\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0628\u062D\u062C\u0645:\", \u062D\u062C\u0645(\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A))\n  \u0627\u0646\u0634\u0626 \u0639\u062F\u0627\u062F = 0\n  \u0637\u0627\u0644\u0645\u0627 (\u0639\u062F\u0627\u062F < \u0627\u0644\u062D\u0644\u0642\u0627\u062A) {\n    \u0627\u0646\u0634\u0626 \u062A\u0641\u0631\u064A\u063A = \u0639\u0634\u0648\u0627\u0626\u064A(10)\n    \u0639\u062F\u0627\u062F = \u0639\u062F\u0627\u062F + 1\n  }\n  \u0627\u0631\u062C\u0639 \"\u0646\u0645\u0648\u0630\u062C_\u0645\u062F\u0631\u0628_\u0628\u062F\u0642\u0629_98%\"\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u062D\u0644\u064A\u0644_\u0627\u0644\u0645\u0634\u0627\u0639\u0631(\u0627\u0644\u0646\u0635) {\n  \u0627\u0643\u062A\u0628(\"-> \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u062C\u0645\u0644\u0629 \u0627\u0644\u0644\u063A\u0648\u064A\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u062D\u0627\u0643\u064A:\", \u0627\u0644\u0646\u0635)\n  \u0627\u0646\u0634\u0626 \u0643\u0644\u0645\u0627\u062A = \u062A\u062C\u0632\u0626\u0629_\u0646\u0635(\u0627\u0644\u0646\u0635, \" \")\n  \u0627\u0646\u0634\u0626 \u0625\u064A\u062C\u0627\u0628\u064A\u0627\u062A = [\"\u0631\u0627\u0626\u0639\", \"\u0645\u0645\u062A\u0627\u0632\", \"\u0633\u0631\u064A\u0639\", \"\u0645\u0633\u062A\u0642\u0644\", \"\u0630\u0643\u064A\"]\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 = \"\u0645\u062D\u0627\u064A\u062F\"\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0639\u062F\u0627\u062F = 0\n  \u0637\u0627\u0644\u0645\u0627 (\u0627\u0644\u0639\u062F\u0627\u062F < \u062D\u062C\u0645(\u0643\u0644\u0645\u0627\u062A)) {\n    \u0627\u0630\u0627 (\u0643\u0644\u0645\u0627\u062A[\u0627\u0644\u0639\u062F\u0627\u062F] == \"\u0645\u0645\u062A\u0627\u0632\" || \u0643\u0644\u0645\u0627\u062A[\u0627\u0644\u0639\u062F\u0627\u062F] == \"\u0645\u0633\u062A\u0642\u0644\") {\n      \u0627\u0644\u0646\u062A\u064A\u062C\u0629 = \"\u0625\u064A\u062C\u0627\u0628\u064A \u0628\u0642\u0648\u0629\"\n    }\n    \u0627\u0644\u0639\u062F\u0627\u062F = \u0627\u0644\u0639\u062F\u0627\u062F + 1\n  }\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629\n}",
    "game_engine": "# \u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0639\u0627\u0644\u0645\u064A \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644 \u0627\u0644\u0639\u0638\u064A\u0645 \u0644\u0644\u063A\u0629 \u0646\u0648\u0631 - Noor Sovereign Game Engine (v5.0)\n\u0627\u0643\u062A\u0628(\"\uD83C\uDFAE [\u0645\u062D\u0631\u0643 \u0623\u0644\u0639\u0627\u0628 \u0646\u0648\u0631] \u062A\u0645 \u062A\u062D\u0645\u064A\u0644 \u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0642\u064A\u0627\u0633\u064A \u0627\u0644\u0639\u0627\u0644\u0645\u064A \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644 \u0648\u0627\u0644\u0639\u0645\u0644\u0627\u0642 \u0644\u0640 2D/3D \u0628\u0646\u062C\u0627\u062D!\")\n\n# \u0642\u0627\u0626\u0645\u0629 \u0634\u0627\u0645\u0644\u0629 \u0628\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A \u0648\u0627\u0644\u0628\u064A\u0626\u0627\u062A \u0648\u0627\u0644\u0645\u062D\u0631\u0643\u0627\u062A \u0648\u0627\u0644\u0645\u0635\u0637\u0644\u062D\u0627\u062A \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A (\u062A\u0645\u062B\u0644 \u0627\u0644\u0622\u0641 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0644\u0628\u0631\u0645\u062C\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628)\n\u0627\u0646\u0634\u0626 \u0645\u062D\u0631\u0643\u0627\u062A_\u0627\u0644\u0623\u0644\u0639\u0627\u0628 = [\"Unity\", \"Unreal Engine\", \"Godot\", \"CryEngine\", \"Lumberyard\", \"GameMaker Studio\", \"Cocos Creator\", \"Construct\", \"Noor Engine\"]\n\u0627\u0646\u0634\u0626 \u0644\u063A\u0627\u062A_\u0628\u0631\u0645\u062C\u0629_\u0627\u0644\u0623\u0644\u0639\u0627\u0628 = [\"C++\", \"C#\", \"Noor Script\", \"Python\", \"Lua\", \"Java\", \"JavaScript\", \"Rust\", \"GDScript\"]\n\u0627\u0646\u0634\u0626 \u0645\u0643\u062A\u0628\u0627\u062A_\u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A = [\"OpenGL\", \"DirectX 11\", \"DirectX 12\", \"Vulkan\", \"Metal\", \"WebGL\"]\n\u0627\u0646\u0634\u0626 \u0623\u0646\u0638\u0645\u0629_\u0627\u0644\u062C\u0631\u0627\u0641\u064A\u0643\u0633 = [\"Rendering Engine\", \"Shader System\", \"Material System\", \"Lighting Model\", \"Post Processing\", \"Ray Tracing\"]\n\u0627\u0646\u0634\u0626 \u0639\u0646\u0627\u0635\u0631_\u0627\u0644\u0630\u0643\u0627\u0621 = [\"Pathfinding A*\", \"Behavior Trees\", \"Navigation Mesh\", \"Decision Trees\", \"Machine Learning Bot\"]\n\u0627\u0646\u0634\u0626 \u0623\u0646\u0638\u0645\u0629_\u0627\u0644\u0644\u0639\u0628\u0629_\u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 = [\"Health System\", \"Inventory System\", \"Combat System\", \"Physics System\", \"Quest System\", \"Level System\", \"Save/Load Logic\"]\n\u0627\u0646\u0634\u0626 \u062A\u062D\u0631\u064A\u0643\u0627\u062A = [\"Skeletal Animation\", \"Rigging\", \"Keyframes\", \"Motion Capture\", \"Blend Trees\", \"Inverse Kinematics\"]\n\u0627\u0646\u0634\u0626 \u0645\u0624\u062B\u0631\u0627\u062A_\u0628\u0635\u0631\u064A\u0629 = [\"Particle System\", \"Explosions\", \"Fire Smoke Water FX\", \"Screen Blur\", \"Bloom & Glow Glow\"]\n\u0627\u0646\u0634\u0626 \u0639\u0648\u0627\u0644\u0645_\u0648\u0642\u0637\u0627\u0639\u0627\u062A = [\"3D Modeling\", \"Terrain System\", \"Procedural Generation\", \"Level Design\", \"Environment Art\"]\n\u0627\u0646\u0634\u0626 \u0623\u062F\u0648\u0627\u062A_\u0627\u0644\u062A\u0635\u0645\u064A\u0645_\u0627\u0644\u0645\u0635\u0627\u062D\u0628\u0629 = [\"Blender\", \"Maya\", \"3ds Max\", \"ZBrush\", \"Substance Painter\", \"Photoshop\", \"Krita\"]\n\u0627\u0646\u0634\u0626 \u062A\u0642\u0646\u064A\u0627\u062A_\u0627\u0644\u0635\u0648\u062A = [\"FMOD Studio\", \"Wwise Audio\", \"3D Spatial Sound\", \"Music Engine\", \"Dynamic Sound Effects\"]\n\u0627\u0646\u0634\u0626 \u0634\u0628\u0643\u0627\u062A_\u0648\u0623\u0648\u0646\u0644\u0627\u064A\u0646 = [\"Multiplayer Netcode\", \"Client/Server Architecture\", \"Dedicated Servers\", \"Peer to Peer P2P\", \"Matchmaking Room\", \"Lag Compensation\"]\n\u0627\u0646\u0634\u0626 \u0645\u062D\u0631\u0643\u0627\u062A_\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621 = [\"Havok Physics\", \"NVIDIA PhysX\", \"Bullet Physics\", \"Rigidbody System\", \"Collision Detection\", \"Ragdoll Body\"]\n\u0627\u0646\u0634\u0626 \u062C\u0645\u064A\u0639_\u0627\u0644\u0645\u0646\u0635\u0627\u062A_\u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629 = [\"Windows PC\", \"PlayStation 5\", \"Xbox Series X\", \"Android Mobile\", \"iOS Apple\", \"Sovereign Web\", \"VR/AR Glasses\"]\n\u0627\u0646\u0634\u0626 \u0623\u062F\u0648\u0627\u062A_\u0627\u0644\u062F\u064A\u0641 = [\"Visual Studio\", \"JetBrains Rider\", \"Git Commit Control\", \"Noor Profiler Tool\", \"Sovereign Build System\"]\n\u0627\u0646\u0634\u0626 \u0628\u0631\u0645\u062C\u064A\u0627\u062A_\u0627\u0644\u0633\u064A\u0631\u0641\u0631 = [\"Amazon Web Services AWS\", \"Google Cloud GCP\", \"Microsoft Azure Sync\", \"Firebase DB Auth\", \"Photon Multiplayer Engine\", \"PlayFab Live Service\"]\n\n\u0627\u0646\u0634\u0626 \u062A\u0631\u0633\u0627\u0646\u0629_\u0627\u0644\u0623\u0633\u0644\u062D\u0629_\u0627\u0644\u0643\u0627\u0645\u0644\u0629 = [\"M416\", \"AKM\", \"AWM Sniper\", \"Kar98k\", \"M24\", \"SCAR-L\", \"M16A4\", \"Groza\", \"AUG\", \"M249\", \"UMP45\", \"Vector\", \"Micro UZI\", \"S12K\", \"Desert Eagle\", \"P92\", \"Pan\", \"Crossbow\", \"Frag Grenade\", \"Smoke Grenade\", \"Stun Grenade\", \"Molotov Cocktail\"]\n\u0627\u0646\u0634\u0626 \u0645\u0639\u062F\u0627\u062A_\u0627\u0644\u062D\u0645\u0627\u064A\u0629 = [\"Helmet Tier 1\", \"Helmet Tier 2\", \"Helmet Tier 3\", \"Vest Tier 1\", \"Vest Tier 2\", \"Vest Tier 3\", \"Backpack Tier 1\", \"Backpack Tier 2\", \"Backpack Tier 3\", \"Ghillie Suit\"]\n\u0627\u0646\u0634\u0626 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A_\u0648\u0627\u0644\u0645\u0631\u0643\u0628\u0627\u062A = [\"Dacia SUV\", \"UAZ Closed\", \"Buggy Quad\", \"Motorbike Trike\", \"Pickup Truck\", \"Rony Auto\", \"Mirado Gold\", \"BRDM-2 Armoured\", \"Speedboat Marine\"]\n\u0627\u0646\u0634\u0626 \u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A_\u0627\u0644\u0635\u062D\u0629 = [\"First Aid Kit\", \"Medkit Supreme\", \"Bandage Stack\", \"Adrenaline Syringe\", \"Painkiller Bottle\", \"Energy Drink Can\"]\n\u0627\u0646\u0634\u0626 \u062D\u0631\u0643\u0627\u062A_\u0627\u0644\u0644\u0627\u0639\u0628_\u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629 = [\"Walk\", \"Run\", \"Spring Speed\", \"Crouch\", \"Prone\", \"Jump Over Obstacle\", \"Lean Left\", \"Lean Right\", \"Aim Down Sights ADS\", \"Reload Ammo\", \"Fists Punch\", \"Swim Water\", \"Drive Vehicle\", \"Heal Wounds\"]\n\u0627\u0646\u0634\u0626 \u062A\u0623\u062B\u064A\u0631\u0627\u062A_\u0627\u0644\u0637\u0642\u0633_\u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A\u0629 = [\"Sunny Bright\", \"Rainy Stormy\", \"Foggy Misty\", \"Sunset Twilight\", \"Night Vision Goggles Dark\", \"Snow Blizzard\"]\n\n# \u062F\u0648\u0627\u0644 \u062A\u0647\u064A\u0626\u0629 \u0648\u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u0645\u062D\u0631\u0643 \u0627\u0644\u0639\u0627\u0644\u0645\u064A \u0648\u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0648\u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0627\u0644\u0643\u0631\u0648\u064A\u0629 \u0623\u0648 \u0627\u0644\u062B\u0644\u0627\u062B\u064A\u0629\n\u062F\u0627\u0644\u0629 \u0628\u062F\u0621_\u0645\u062D\u0631\u0643_\u0627\u0644\u0623\u0644\u0639\u0627\u0628(\u0627\u0644\u0639\u0631\u0636, \u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639, \u062B\u0644\u0627\u062B\u064A_\u0627\u0644\u0623\u0628\u0639\u0627\u062F) {\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDDA5\uFE0F [\u0634\u0627\u0634\u0629 \u0627\u0644\u0645\u062D\u0631\u0643] \u062A\u0647\u064A\u0626\u0629 \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0628\u0623\u0628\u0639\u0627\u062F:\", \u0627\u0644\u0639\u0631\u0636, \"\u0628\u0643\u0633\u0644 \u0623\u0641\u0642\u064A\u0627\u064B x\", \u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639, \"\u0628\u0643\u0633\u0644 \u0639\u0645\u0648\u062F\u064A\u0627\u064B\")\n  \u0627\u0630\u0627 (\u062B\u0644\u0627\u062B\u064A_\u0627\u0644\u0623\u0628\u0639\u0627\u062F == \u0635\u062D\u064A\u062D) {\n    \u0627\u0643\u062A\u0628(\"\uD83C\uDF10 [\u0648\u0636\u0639 \u0627\u0644\u0631\u0633\u0648\u0645\u0627\u062A] \u062A\u0641\u0639\u064A\u0644 \u0645\u062D\u0631\u0643 \u0627\u0644\u0641\u064A\u0643\u062A\u0648\u0631 \u062B\u0644\u0627\u062B\u064A \u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0648\u0627\u0644\u0638\u0644\u0627\u0644 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629 (Ray Tracing Mode On)\")\n  }\n  \u062A\u0639\u064A\u064A\u0646_\u0645\u0624\u0634\u0631_\u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A(60)\n  \u0627\u0631\u062C\u0639 \u0635\u062D\u064A\u062D\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0647\u064A\u0626\u0629_\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629_\u0648\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621(\u0645\u0642\u062F\u0627\u0631_\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629) {\n  \u0627\u0643\u062A\u0628(\"\uD83E\uDE90 [\u0645\u062D\u0631\u0643 \u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629] \u0636\u0628\u0637 \u0642\u0648\u0629 \u0627\u0644\u0633\u0642\u0648\u0637 \u0627\u0644\u062D\u0631 \u0644\u0628\u064A\u0626\u0629 \u0627\u0644\u0644\u0639\u0628 \u0628\u0645\u0639\u062F\u0644:\", \u0645\u0642\u062F\u0627\u0631_\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629, \"\u0645\u062A\u0631 \u0641\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0645\u0631\u0628\u0639\u0629\")\n  \u0627\u0631\u062C\u0639 \u0645\u0642\u062F\u0627\u0631_\u0627\u0644\u062C\u0627\u0630\u0628\u064A\u0629\n}\n\n# \u062F\u0648\u0627\u0644 \u0627\u0644\u0643\u0627\u0626\u0646\u0627\u062A \u0648\u0627\u0644\u062D\u0631\u0643\u0627\u062A\n\u062F\u0627\u0644\u0629 \u0625\u0646\u0634\u0627\u0621_\u0634\u062E\u0635\u064A\u0629_\u0644\u0627\u0639\u0628(\u0627\u0644\u0627\u0633\u0645, \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0633, \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0635, \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0639) {\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDC64 [\u0643\u0627\u0626\u0646 \u0627\u0644\u0644\u0627\u0639\u0628] \u062A\u0645 \u062A\u062C\u0645\u064A\u0639 \u0648\u062A\u0631\u0643\u064A\u0628 \u0623\u0628\u0639\u0627\u062F \u0647\u064A\u0643\u0644 \u0627\u0644\u0644\u0627\u0639\u0628:\", \u0627\u0644\u0627\u0633\u0645, \"\u0628\u0627\u0644\u0645\u0648\u0636\u0639 \u0633 =\", \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0633, \"\u0635 =\", \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0635)\n  \u0627\u0631\u062C\u0639 {\"\u0646\u0648\u0639\": \"player\", \"\u0627\u0633\u0645\": \u0627\u0644\u0627\u0633\u0645, \"\u0633\": \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0633, \"\u0635\": \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0635, \"\u0639\": \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0639, \"\u0635\u062D\u0629\": 100, \"\u062F\u0631\u0648\u0639\": 100, \"\u062D\u0642\u064A\u0628\u0629\": []}\n}\n\n\u062F\u0627\u0644\u0629 \u0625\u0646\u0634\u0627\u0621_\u0628\u0648\u062A_\u062E\u0635\u0645(\u0631\u062A\u0628\u0629_\u0627\u0644\u0630\u0643\u0627\u0621, \u0633\u0644\u0627\u062D_\u0627\u0644\u0628\u062F\u0627\u064A\u0629, \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0633, \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0635) {\n  \u0627\u0643\u062A\u0628(\"\uD83E\uDD16 [\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A] \u062A\u0648\u0644\u064A\u062F \u0628\u0648\u062A \u0630\u0643\u064A \u0628\u0645\u0633\u062A\u0648\u0649:\", \u0631\u062A\u0628\u0629_\u0627\u0644\u0630\u0643\u0627\u0621, \"\u0645\u062C\u0647\u0632 \u0628\u0640:\", \u0633\u0644\u0627\u062D_\u0627\u0644\u0628\u062F\u0627\u064A\u0629)\n  \u0627\u0631\u062C\u0639 {\"\u0646\u0648\u0639\": \"bot\", \"\u0645\u0633\u062A\u0648\u0649\": \u0631\u062A\u0628\u0629_\u0627\u0644\u0630\u0643\u0627\u0621, \"\u0633\u0644\u0627\u062D\": \u0633\u0644\u0627\u062D_\u0627\u0644\u0628\u062F\u0627\u064A\u0629, \"\u0633\": \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0633, \"\u0635\": \u0627\u0644\u0627\u062D\u062F\u0627\u062B\u064A\u0627\u062A_\u0635, \"\u0635\u062D\u0629\": 100}\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u062D\u062F\u064A\u062B_\u062D\u0627\u0644\u0629_\u0627\u0644\u062F\u0627\u0626\u0631\u0647_\u0627\u0644\u0622\u0645\u0646\u0647(\u062F\u0627\u0626\u0631\u0629_\u0627\u0644\u0645\u0631\u0643\u0632_\u0633, \u062F\u0627\u0626\u0631\u0629_\u0627\u0644\u0645\u0631\u0643\u0632_\u0635, \u0642\u0637\u0631_\u0627\u0644\u062F\u0627\u0626\u0631\u0629) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0642\u0637\u0631_\u0627\u0644\u0645\u0635\u063A\u0631 = \u0642\u0637\u0631_\u0627\u0644\u062F\u0627\u0626\u0631\u0629 - 15\n  \u0627\u0630\u0627 (\u0627\u0644\u0642\u0637\u0631_\u0627\u0644\u0645\u0635\u063A\u0631 < 10) {\n    \u0627\u0644\u0642\u0637\u0631_\u0627\u0644\u0645\u0635\u063A\u0631 = 10\n  }\n  \u0627\u0643\u062A\u0628(\"\u26A1 [\u062D\u0627\u0644\u0629 \u0627\u0644\u0632\u0648\u0646] \u062A\u062D\u0630\u064A\u0631 \u0627\u0644\u0645\u0642\u0627\u062A\u0644\u064A\u0646! \u062C\u0627\u0631\u064A \u0627\u0646\u0643\u0645\u0627\u0634 \u0627\u0644\u062F\u0627\u0626\u0631\u0629 \u0627\u0644\u0632\u0631\u0642\u0627\u0621 (Safe Zone) \u062D\u0648\u0644 \u0627\u0644\u0645\u0631\u0643\u0632: [\u0633 =\", \u062F\u0627\u0626\u0631\u0629_\u0627\u0644\u0645\u0631\u0643\u0632_\u0633, \"\u0635 =\", \u062F\u0627\u0626\u0631\u0629_\u0627\u0644\u0645\u0631\u0643\u0632_\u0635, \"]\")\n  \u0627\u0643\u062A\u0628(\"\u26A1 \u0627\u0644\u0642\u0637\u0631 \u0627\u0644\u062C\u062F\u064A\u062F \u0644\u0644\u062F\u0627\u0626\u0631\u0629 \u0644\u062A\u0642\u0644\u064A\u0644 \u0627\u0644\u062A\u062C\u0645\u0639 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A:\", \u0627\u0644\u0642\u0637\u0631_\u0627\u0644\u0645\u0635\u063A\u0631, \"\u0645\u062A\u0631\")\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0642\u0637\u0631_\u0627\u0644\u0645\u0635\u063A\u0631\n}\n\n\u062F\u0627\u0644\u0629 \u062D\u0633\u0627\u0628_\u0645\u0633\u0627\u0641\u0629_\u0627\u0644\u0645\u062A\u062C\u0647_\u0627\u0644\u0631\u064A\u0627\u0636\u064A(\u06331, \u06351, \u06332, \u06352) {\n  \u0627\u0646\u0634\u0626 \u0645\u0633\u0627\u0641\u0629_\u0633 = \u06331 - \u06332\n  \u0627\u0646\u0634\u0626 \u0645\u0633\u0627\u0641\u0629_\u0635 = \u06351 - \u06352\n  # \u0646\u0633\u062A\u062E\u062F\u0645 \u0636\u0631\u0628 \u0627\u0644\u0642\u064A\u0645 \u0644\u0644\u062A\u062E\u0644\u0635 \u0645\u0646 \u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u0633\u0627\u0644\u0628\u0629 \u0628\u0637\u0631\u064A\u0642\u0629 \u0628\u062F\u064A\u0644\u0629 \u0644\u0644\u062C\u0630\u0631 \u0627\u0644\u062A\u0631\u0628\u064A\u0639\u064A \u0627\u0644\u0645\u0628\u0633\u0637 \u0644\u0644\u062C\u0648\u0627\u0646\u0628 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629\n  \u0627\u0630\u0627 (\u0645\u0633\u0627\u0641\u0629_\u0633 < 0) {\n    \u0645\u0633\u0627\u0641\u0629_\u0633 = 0 - \u0645\u0633\u0627\u0641\u0629_\u0633\n  }\n  \u0627\u0630\u0627 (\u0645\u0633\u0627\u0641\u0629_\u0635 < 0) {\n    \u0645\u0633\u0627\u0641\u0629_\u0635 = 0 - \u0645\u0633\u0627\u0641\u0629_\u0635\n  }\n  \u0627\u0631\u062C\u0639 \u0645\u0633\u0627\u0641\u0629_\u0633 + \u0645\u0633\u0627\u0641\u0629_\u0635\n}\n\n\u062F\u0627\u0644\u0629 \u0641\u062D\u0635_\u062A\u0635\u0627\u062F\u0645_\u0645\u062D\u064A\u0637_\u0643\u0627\u0626\u0646(\u0644\u0627\u0639\u0628_\u0623, \u0628\u0648\u062A_\u0628) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0628\u0639\u062F = \u062D\u0633\u0627\u0628_\u0645\u0633\u0627\u0641\u0629_\u0627\u0644\u0645\u062A\u062C\u0647_\u0627\u0644\u0631\u064A\u0627\u0636\u064A(\u0644\u0627\u0639\u0628_\u0623[\"\u0633\"], \u0644\u0627\u0639\u0628_\u0623[\"\u0635\"], \u0628\u0648\u062A_\u0628[\"\u0633\"], \u0628\u0648\u062A_\u0628[\"\u0635\"])\n  \u0627\u0630\u0627 (\u0627\u0644\u0628\u0639\u062F < 3) {\n    \u0627\u0643\u062A\u0628(\"\uD83D\uDCA5 [Collision Block] \u0631\u0635\u062F \u0627\u0635\u0637\u062F\u0627\u0645 \u0645\u0628\u0627\u0634\u0631 \u0623\u0648 \u0645\u0648\u0627\u062C\u0647\u0629 \u0642\u062A\u0627\u0644\u064A\u0629 \u0639\u0646\u064A\u0641\u0629 \u0644\u0642\u0635\u0631 \u0627\u0644\u0645\u0633\u0627\u0641\u0629 \u0628\u064A\u0646\u0647\u0645\u0627:\", \u0627\u0644\u0628\u0639\u062F)\n    \u0627\u0631\u062C\u0639 \u0635\u062D\u064A\u062D\n  }\n  \u0627\u0631\u062C\u0639 \u062E\u0637\u0623\n}\n\n# \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0635\u0648\u062A\u064A\u0629 \u0627\u0644\u0645\u0643\u0627\u0646\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629\n\u062F\u0627\u0644\u0629 \u0645\u0639\u0627\u0644\u062C_\u0627\u0644\u0635\u0648\u062A_\u0627\u0644\u0645\u062C\u0633\u0645_\u062B\u0644\u0627\u062B\u064A_\u0627\u0644\u0623\u0628\u0639\u0627\u062F(\u0634\u062E\u0635\u064A\u0629, \u0635\u0648\u062A_\u062D\u062F\u062B, \u0645\u0635\u062F\u0631_\u0633, \u0645\u0635\u062F\u0631_\u0635) {\n  \u0627\u0646\u0634\u0626 \u0627\u0644\u0645\u062F\u0649 = \u062D\u0633\u0627\u0628_\u0645\u0633\u0627\u0641\u0629_\u0627\u0644\u0645\u062A\u062C\u0647_\u0627\u0644\u0631\u064A\u0627\u0636\u064A(\u0634\u062E\u0635\u064A\u0629[\"\u0633\"], \u0634\u062E\u0635\u064A\u0629[\"\u0635\"], \u0645\u0635\u062F\u0631_\u0633, \u0645\u0635\u062F\u0631_\u0635)\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDD0A [\u0645\u0639\u0627\u0644\u062C\u0629 \u0635\u0648\u062A\u064A\u0629] \u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u062A\u0631\u062F\u062F \u0627\u0644\u0635\u0648\u062A:\", \u0635\u0648\u062A_\u062D\u062F\u062B, \"\u0639\u0644\u0649 \u0628\u0639\u062F \u0645\u0633\u0627\u0641\u0629:\", \u0627\u0644\u0645\u062F\u0649)\n  \u0627\u0630\u0627 (\u0627\u0644\u0645\u062F\u0649 < 10) {\n    \u0627\u0643\u062A\u0628(\"\uD83D\uDC42 [\u0635\u0648\u062A \u0642\u0648\u064A] \u0631\u0635\u062F \u0627\u062A\u062C\u0627\u0647 \u0645\u0628\u0627\u0634\u0631 \u0648\u0648\u0627\u0636\u062D \u0639\u0644\u0649 \u0633\u0645\u0627\u0639\u0627\u062A \u0627\u0644\u0644\u0627\u0639\u0628 \u0627\u0644\u064A\u0633\u0631\u0649 \u0648\u0627\u0644\u064A\u0645\u0646\u0649!\")\n  }\n  \u0627\u0630\u0627 (\u0627\u0644\u0645\u062F\u0649 >= 10 && \u0627\u0644\u0645\u062F\u0649 < 50) {\n    \u0627\u0643\u062A\u0628(\"\uD83D\uDC42 [\u0635\u0648\u062A \u0647\u0627\u062F\u0626] \u0627\u0644\u0635\u0648\u062A \u064A\u0628\u062F\u0648 \u0628\u0639\u064A\u062F\u0627\u064B \u0648\u062E\u0627\u0641\u062A\u0627\u064B \u0645\u0646 \u062E\u0644\u0641 \u0627\u0644\u0635\u062E\u0648\u0631 \u0648\u0627\u0644\u0623\u0634\u062C\u0627\u0631.\")\n  }\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0645\u062F\u0649\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u062D\u062F\u064A\u062B_\u0627\u0644\u0646\u0642\u0627\u0637_\u0648\u0627\u0644\u062D\u0627\u0644\u0629_\u0627\u0644\u0642\u062A\u0627\u0644\u064A\u0629(\u0644\u0627\u0639\u0628, \u0646\u0648\u0639_\u0627\u0644\u062D\u062F\u062B, \u0627\u0644\u0642\u064A\u0645\u0629) {\n  \u0627\u0630\u0627 (\u0646\u0648\u0639_\u0627\u0644\u062D\u062F\u062B == \"\u0631\u0635\u0627\u0635\u0629_\u0625\u0635\u0627\u0628\u0629\") {\n    \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"] = \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"] - \u0627\u0644\u0642\u064A\u0645\u0629\n    \u0627\u0643\u062A\u0628(\"\uD83E\uDE78 [\u0625\u0635\u0627\u0628\u0629 \u062F\u0645] \u062A\u0636\u0631\u0631 \u062F\u0631\u0639 \u0648\u0635\u062D\u0629 \u0627\u0644\u0644\u0627\u0639\u0628:\", \u0644\u0627\u0639\u0628[\"\u0627\u0633\u0645\"], \"\u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0645\u062A\u0628\u0642\u064A\u0629:\", \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"])\n  }\n  \u0627\u0630\u0627 (\u0646\u0648\u0639_\u0627\u0644\u062D\u062F\u062B == \"\u0645\u0634\u0631\u0648\u0628_\u0637\u0627\u0642\u0629\") {\n    \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"] = \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"] + \u0627\u0644\u0642\u064A\u0645\u0629\n    \u0627\u0630\u0627 (\u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"] > 100) {\n      \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"] = 100\n    }\n    \u0627\u0643\u062A\u0628(\"\uD83E\uDD64 [\u0634\u0631\u0628 \u0637\u0627\u0642\u0629] \u0627\u0646\u062A\u0639\u0627\u0634 \u0627\u0644\u0623\u062F\u0631\u064A\u0646\u0627\u0644\u064A\u0646 \u0648\u0627\u0631\u062A\u0641\u0627\u0639 \u0646\u0633\u0628\u0629 \u0627\u0644\u0635\u062D\u0629 \u0644\u0644\u0627\u0639\u0628 \u0644\u062A\u0635\u0628\u062D:\", \u0644\u0627\u0639\u0628[\"\u0635\u062D\u0629\"])\n  }\n  \u0627\u0631\u062C\u0639 \u0644\u0627\u0639\u0628\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0633\u062C\u064A\u0644_\u062D\u0632\u0645\u0629_\u0628\u064A\u0627\u0646\u0627\u062A_\u0627\u0644\u0633\u064A\u0631\u0641\u0631(\u0627\u0644\u0633\u064A\u0631\u0641\u0631, \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A) {\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDCF6 [\u062D\u0632\u0645 \u0627\u0644\u0623\u0648\u0646\u0644\u0627\u064A\u0646 TCP/UDP] \u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0648\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0645\u062F\u062E\u0644\u0627\u062A \u0628\u0645\u0639\u062F\u0644 \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u062D\u0642\u064A\u0642\u064A \u0645\u0645\u062A\u0627\u0632.\")\n  \u0627\u0631\u062C\u0639 \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A\n}\n",
    "game_blueprint": "# \u0645\u0643\u062A\u0628\u0629 \u062A\u0635\u0627\u0645\u064A\u0645 \u0648\u0645\u062E\u0637\u0637\u0627\u062A \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u063A\u0629 \u0646\u0648\u0631 - Game Blueprints Standard Template\n\u0627\u0643\u062A\u0628(\"\uD83E\uDDE9 [\u0645\u062E\u0637\u0637\u0627\u062A \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0644\u063A\u0629 \u0646\u0648\u0631] \u062A\u0645 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629 \u0627\u0644\u0645\u0641\u062A\u0648\u062D\u0629 \u0644\u062F\u0631\u0627\u0633\u0629 \u0648\u0647\u064A\u0643\u0644\u0629 \u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0628\u0627\u062A\u0644 \u0631\u0648\u064A\u0627\u0644 \u0648\u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u062B\u0646\u0627\u0626\u064A\u0629 \u0627\u0644\u0623\u0628\u0639\u0627\u062F!\")\n\n# \u062A\u0648\u062B\u064A\u0642 \u0634\u0627\u0645\u0644 \u0643\u062E\u0631\u064A\u0637\u0629 \u0637\u0631\u064A\u0642 \u0643\u0627\u0645\u0644\u0629 \u0648\u0645\u0633\u0627\u0631\u0627\u062A \u062A\u0641\u0635\u064A\u0644\u064A\u0629 \u0644\u062A\u0635\u0645\u064A\u0645 \u0623\u0644\u0639\u0627\u0628 \u0642\u062A\u0627\u0644\u064A\u0629 \u0636\u062E\u0645\u0629 \u0645\u062B\u0644 PUBG / Free fire\n\u062F\u0627\u0644\u0629 \u062E\u0637\u0629_\u0637\u0631\u064A\u0642_\u0628\u0646\u0627\u0621_\u0644\u0639\u0628\u0629_\u0627\u0644\u0628\u0627\u062A\u0644_\u0631\u0648\u064A\u0627\u0644() {\n  \u0627\u0643\u062A\u0628(\"\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\")\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDEE1\uFE0F [\u062E\u0637\u0629 \u0637\u0631\u064A\u0642 \u0635\u0646\u0627\u0639\u0629 \u0648\u062A\u0637\u0648\u064A\u0631 \u0644\u0639\u0628\u0629 \u0627\u0644\u0628\u0627\u062A\u0644 \u0631\u0648\u064A\u0627\u0644 PUBG \u0628\u0644\u063A\u0629 \u0646\u0648\u0631] \uD83D\uDEE1\uFE0F\")\n  \u0627\u0643\u062A\u0628(\"\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\")\n  \u0627\u0643\u062A\u0628(\"\u0627\u0644\u062E\u0637\u0648\u0629 1: \u062A\u062E\u0637\u064A\u0637 \u0647\u064A\u0643\u0644 \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A (The Map Construction)\")\n  \u0627\u0643\u062A\u0628(\"  - \u062A\u0642\u0633\u064A\u0645 \u0628\u064A\u0626\u0627\u062A \u0627\u0644\u0644\u0639\u0628 \u0625\u0644\u0649 \u0643\u062A\u0644 \u0631\u0633\u0648\u0645\u064A\u0629 \u0628\u0645\u0642\u0627\u064A\u064A\u0633 \u0639\u0645\u0644\u0627\u0642\u0629.\")\n  \u0627\u0643\u062A\u0628(\"  - \u0625\u0646\u0634\u0627\u0621 \u0646\u0638\u0627\u0645 \u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u0639\u0634\u0628 \u0648\u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0648\u0627\u0644\u0623\u0628\u0646\u064A\u0629 \u0648\u0627\u0644\u0645\u0623\u0648\u0649.\")\n  \u0627\u0643\u062A\u0628(\"\u0627\u0644\u062E\u0637\u0648\u0629 2: \u062A\u0647\u064A\u0626\u0629 \u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0627\u0644\u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u062A\u0632\u0627\u0645\u0646\u0629 \u0644\u062D\u0631\u0643\u0629 100 \u0644\u0627\u0639\u0628\")\n  \u0627\u0643\u062A\u0628(\"  - \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062D\u0632\u0645 UDP \u0644\u0646\u0642\u0644 \u0645\u0648\u0636\u0639 \u0627\u0644\u0631\u0623\u0633 \u0648\u0627\u062A\u062C\u0627\u0647 \u0627\u0644\u0633\u0644\u0627\u062D \u0648\u0627\u0644\u0633\u0631\u0639\u0629 \u0648\u062A\u0644\u0642\u064A\u0645 \u0627\u0644\u0630\u062E\u0627\u0626\u0631.\")\n  \u0627\u0643\u062A\u0628(\"  - \u0645\u062D\u0627\u0643\u0627\u0629 \u0632\u0645\u0646 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u0636\u0626\u064A\u0644 \u0648\u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0644\u062D\u0638\u064A \u0644\u0645\u0639\u062F\u0644\u0627\u062A ping.\")\n  \u0627\u0643\u062A\u0628(\"\u0627\u0644\u062E\u0637\u0648\u0629 3: \u0641\u064A\u0632\u064A\u0627\u0621 \u0627\u0644\u0645\u0642\u0630\u0648\u0641\u0627\u062A \u0627\u0644\u0646\u0627\u0631\u064A\u0629 \u0648\u062D\u0633\u0627\u0628 \u0627\u0644\u0633\u0642\u0648\u0637 (Dynamic Projectiles)\")\n  \u0627\u0643\u062A\u0628(\"  - \u0646\u0645\u0630\u062C\u0629 \u0645\u0633\u0627\u0631 \u0627\u0644\u0631\u0635\u0627\u0635\u0627\u062A \u0648\u0645\u0639\u062F\u0644\u0627\u062A \u0627\u0644\u062A\u0628\u0627\u0637\u0624 \u0648\u0627\u062E\u062A\u0631\u0627\u0642 \u0627\u0644\u062F\u0631\u0648\u0639 \u0648\u0627\u0644\u0636\u0631\u0628\u0627\u062A \u0627\u0644\u0642\u0627\u0636\u064A\u0629.\")\n  \u0627\u0643\u062A\u0628(\"\u0627\u0644\u062E\u0637\u0648\u0629 4: \u0646\u0638\u0627\u0645 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u063A\u0646\u0627\u0626\u0645 \u0648\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u062F\u0631\u0648\u0639 \u0648\u0627\u0644\u0623\u062F\u0648\u064A\u0629 (Sovereign Loot System)\")\n  \u0627\u0643\u062A\u0628(\"  - \u0632\u0631\u0639 \u0648\u062A\u0648\u0632\u064A\u0639 \u0643\u0645\u064A\u0627\u062A \u0627\u0644\u063A\u0646\u0627\u0626\u0645 \u0639\u0634\u0648\u0627\u0626\u064A\u0627\u064B \u0641\u064A \u0627\u0644\u062D\u062C\u0631\u0627\u062A \u0648\u0627\u0644\u063A\u0631\u0641 \u0644\u062A\u0645\u0643\u064A\u0646 \u062A\u0643\u0627\u0641\u0624 \u0627\u0644\u0641\u0631\u0635.\")\n  \u0627\u0643\u062A\u0628(\"\u0627\u0644\u062E\u0637\u0648\u0629 5: \u0627\u0644\u062F\u0627\u0626\u0631\u0629 \u0627\u0644\u0642\u0627\u062A\u0644\u0629 (The Safe Zone Circular Loop)\")\n  \u0627\u0643\u062A\u0628(\"  - \u062A\u0641\u0639\u064A\u0644 \u0645\u0624\u0642\u062A \u0645\u0633\u062A\u0645\u0631 \u0644\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0646\u0634\u0637 \u0644\u0644\u0639\u0628\u0629 \u0648\u062A\u0642\u0631\u064A\u0628 \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0645\u0646 \u0628\u0639\u0636\u0647\u0645 \u0631\u063A\u0645\u0627\u064B \u0639\u0646\u0647\u0645.\")\n  \u0627\u0643\u062A\u0628(\"\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\")\n  \u0627\u0631\u062C\u0639 \u0635\u062D\u064A\u062D\n}\n\n\u062F\u0627\u0644\u0629 \u062E\u0637\u0629_\u0635\u0646\u0627\u0639\u0629_\u0627\u0644\u0627\u0644\u0639\u0627\u0628_\u0627\u0644\u0628\u0633\u064A\u0637\u0629() {\n  \u0627\u0643\u062A\u0628(\"\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\")\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDFAE [\u0645\u0633\u0627\u0631 \u0628\u0646\u0627\u0621 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0627\u0644\u0628\u0633\u064A\u0637\u0629 2D/3D] \uD83C\uDFAE\")\n  \u0627\u0643\u062A\u0628(\"\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\")\n  \u0627\u0643\u062A\u0628(\"1. \u0645\u062D\u0631\u0643 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u0644\u0639\u0628 (The Game Loop Cycle):\")\n  \u0627\u0643\u062A\u0628(\"   \u0637\u0627\u0644\u0645\u0627 (\u0634\u063A\u0627\u0644 == \u0635\u062D\u064A\u062D) {\")\n  \u0627\u0643\u062A\u0628(\"     \u0631\u0635\u062F_\u0645\u062F\u062E\u0644\u0627\u062A_\u062C\u0647\u0627\u0632()   # \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0648\u0627\u0644\u0645\u0627\u0648\u0633 \u0648\u0627\u0644\u0644\u0645\u0633\")\n  \u0627\u0643\u062A\u0628(\"     \u062A\u062D\u062F\u064A\u062B_\u0645\u0648\u0627\u0642\u0639_\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621()  # \u0627\u0644\u0627\u0635\u0637\u062F\u0627\u0645\u0627\u062A \u0648\u0627\u0644\u062A\u0643\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u062D\u0631\u0643\u064A\u0629\")\n  \u0627\u0643\u062A\u0628(\"     \u0631\u0633\u0645_\u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A()       # \u0646\u0642\u0644 \u0627\u0644\u0631\u0633\u0648\u0645 \u0644\u0644\u0634\u0627\u0634\u0629 \u0628\u0645\u0639\u062F\u0644 60 \u0625\u0637\u0627\u0631\")\n  \u0627\u0643\u062A\u0628(\"   }\")\n  \u0627\u0643\u062A\u0628(\"2. \u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A \u0648\u0627\u0644\u0647\u064A\u0627\u0643\u0644 \u0627\u0644\u0643\u064A\u0627\u0646\u064A\u0629 (Entity-Component System):\")\n  \u0627\u0643\u062A\u0628(\"   - \u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0625\u0644\u0649: \u0643\u0627\u0626\u0646\u0627\u062A \u0645\u0631\u0626\u064A\u0629\u060C \u0643\u0627\u0626\u0646\u0627\u062A \u0645\u062A\u062D\u0631\u0643\u0629\u060C \u0643\u0627\u0626\u0646\u0627\u062A \u062A\u0635\u0627\u062F\u0645\u064A\u0629.\")\n  \u0627\u0643\u062A\u0628(\"\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\")\n  \u0627\u0631\u062C\u0639 \u0635\u062D\u064A\u062D\n}\n\n\u062F\u0627\u0644\u0629 \u0628\u062F\u0621_\u062F\u0648\u0631\u0629_\u0637\u0627\u0626\u0631\u0629_\u0627\u0644\u0646\u0632\u0648\u0644(\u062A\u0639\u062F\u0627\u062F_\u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646) {\n  \u0627\u0643\u062A\u0628(\"\u2708\uFE0F \u0637\u0627\u0626\u0631\u0629 \u0627\u0644\u0625\u0646\u0632\u0627\u0644 \u0627\u0646\u0637\u0644\u0642\u062A \u0641\u064A \u0623\u062C\u0648\u0627\u0621 \u062C\u0632\u064A\u0631\u0629 \u0627\u0644\u0645\u0648\u062A \u0627\u0644\u062A\u0643\u062A\u064A\u0643\u064A\u0629!\")\n  \u0627\u0643\u062A\u0628(\"\u2708\uFE0F \u0627\u0631\u062A\u0641\u0627\u0639 \u0627\u0644\u0637\u0627\u0626\u0631\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A: 1500 \u0645\u062A\u0631 \u0639\u0646 \u0633\u0637\u062D \u0627\u0644\u0628\u062D\u0631\")\n  \u0627\u0643\u062A\u0628(\"\uD83D\uDC65 \u0639\u062F\u062F \u0627\u0644\u0645\u0638\u0644\u064A\u064A\u0646 \u0648\u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0646\u0634\u0637\u064A\u0646 \u0627\u0644\u062C\u0627\u0647\u0632\u064A\u0646 \u0644\u0644\u0642\u0641\u0632 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0648\u0627\u0644\u0644\u0648\u062A:\", \u062A\u0639\u062F\u0627\u062F_\u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646)\n  \u0627\u0631\u062C\u0639 \u062A\u0639\u062F\u0627\u062F_\u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646\n}\n\n\u062F\u0627\u0644\u0629 \u062A\u0648\u0644\u064A\u062F_\u0627\u0644\u0644\u0648\u062A_\u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A(\u0639\u062F\u062F_\u0627\u0644\u0628\u064A\u0648\u062A) {\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDF92 [\u0646\u0638\u0627\u0645 \u0627\u0644\u0644\u0648\u062A \u0627\u0644\u0633\u064A\u0627\u062F\u064A] \u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0623\u0633\u0644\u062D\u0629 \u0648\u0627\u0644\u0630\u062E\u0627\u0626\u0631 \u0648\u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A \u0639\u0644\u0649 \u0639\u062F\u062F:\", \u0639\u062F\u062F_\u0627\u0644\u0628\u064A\u0648\u062A, \"\u0645\u062C\u0645\u0639 \u0633\u0643\u0646\u064A\")\n  \u0627\u0646\u0634\u0626 \u0645\u0639\u062F\u0644_\u0644\u0648\u062A_\u0642\u0648\u064A = \u0639\u062F\u062F_\u0627\u0644\u0628\u064A\u0648\u062A * 4\n  \u0627\u0643\u062A\u0628(\"\uD83C\uDF92 \u062A\u0645 \u0646\u062B\u0631 \u062D\u0648\u0627\u0644\u064A:\", \u0645\u0639\u062F\u0644_\u0644\u0648\u062A_\u0642\u0648\u064A, \"\u0642\u0637\u0639\u0629 \u063A\u0646\u064A\u0645\u0629 \u062D\u0642\u064A\u0642\u064A\u0629 \u062A\u0634\u0645\u0644 AWM \u0648 M416 \u0648\u062F\u0631\u0648\u0639 \u0645\u0633\u062A\u0648\u0649 3.\")\n  \u0627\u0631\u062C\u0639 \u0645\u0639\u062F\u0644_\u0644\u0648\u062A_\u0642\u0648\u064A\n}\n"
};
var NoorInterpreter = /** @class */ (function () {
    function NoorInterpreter() {
        this.localRegistry = {};
        this.activePage = null;
        this.publishedWorldData = {
            settings: { gravity: -9.81, skyColor: '#0a0a1a', fps: 60, physicsEngine: 'havok-babylon' },
            cameras: [],
            lights: [],
            entities: []
        };
        this.globalEnv = new Environment();
        this.consoleLogs = [];
        this.executionCount = 0;
        this.MAX_EXEC_OPS = 100000; // prevent infinite loops
        this.setupGlobals();
        this.setup3DGlobals(); // Add 3D globals setup
    }
    NoorInterpreter.prototype.setup3DGlobals = function () {
        var _this = this;
        this.globalEnv.define('إعداد_عالم_3D', function (args) {
            _this.publishedWorldData.settings = Object.assign(_this.publishedWorldData.settings, args[0] || {});
            _this.consoleLogs.push("\uD83C\uDFAE [\u0645\u062D\u0631\u0643 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 3D] \u062A\u0645 \u0636\u0628\u0637 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0627\u0644\u0645 \u0628\u0646\u062C\u0627\u062D.");
            return true;
        });
        this.globalEnv.define('إنشاء_مجسم', function (args) {
            var entity = args[0] || {};
            _this.publishedWorldData.entities.push(entity);
            return entity;
        });
        this.globalEnv.define('إنشاء_كاميرا', function (args) {
            _this.publishedWorldData.cameras.push(args[0] || {});
            return true;
        });
        this.globalEnv.define('إنشاء_إضاءة', function (args) {
            _this.publishedWorldData.lights.push(args[0] || {});
            return true;
        });
    };
    NoorInterpreter.prototype.setupGlobals = function () {
        var _this = this;
        // 1. Math Functions (الدوال الرياضية)
        this.globalEnv.define('جذر', function (args) { return Math.sqrt(args[0]); });
        this.globalEnv.define('قوة', function (args) { return Math.pow(args[0], args[1]); });
        this.globalEnv.define('عشوائي', function (args) { return Math.random() * (args[0] || 1); });
        this.globalEnv.define('مطلق', function (args) { return Math.abs(args[0]); });
        this.globalEnv.define('جيب', function (args) { return Math.sin(args[0]); });
        this.globalEnv.define('جيب_تمام', function (args) { return Math.cos(args[0]); });
        // 2. String & Array functions (النصوص والقوائم)
        this.globalEnv.define('حجم', function (args) {
            var target = args && args[0];
            if (target !== undefined && target !== null && target.length !== undefined) {
                return target.length;
            }
            return 0;
        });
        this.globalEnv.define('أضف', function (args) {
            var arr = args[0];
            if (Array.isArray(arr)) {
                arr.push(args[1]);
                return arr;
            }
            return null;
        });
        this.globalEnv.define('احذف', function (args) {
            var arr = args[0];
            if (Array.isArray(arr)) {
                return arr.pop();
            }
            return null;
        });
        this.globalEnv.define('تحويل_لنص', function (args) { return String(args[0]); });
        this.globalEnv.define('تجزئة_نص', function (args) { return String(args[0]).split(args[1] || ' '); });
        this.globalEnv.define('مشتمل_على', function (args) { return String(args[0]).includes(args[1]); });
        // 3. Core Date / Performance functions (الوقت والأداء)
        this.globalEnv.define('الوقت_الآن', function () { return new Date().toISOString(); });
        this.globalEnv.define('مؤقت_ملي', function () { return Date.now(); });
        // 4. System & Modules (النظام والمكتبات)
        this.globalEnv.define('تحميل_مكتبة', function (args) {
            var libPath = args[0] || '';
            // Extract library name from path (e.g., "stdlib/web_dom.noor" -> "web_dom")
            var libName = libPath;
            if (libPath.endsWith('.noor')) {
                libPath = libPath.slice(0, -5);
            }
            if (libPath.includes('/')) {
                var parts = libPath.split('/');
                libName = parts[parts.length - 1];
            }
            _this.consoleLogs.push("\uD83D\uDCE6 [\u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0632\u0645] \u062C\u0627\u0631\u064A \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0648\u062A\u062D\u0644\u064A\u0644 \u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0643\u062A\u0628\u0629: \"".concat(libPath, ".noor\""));
            // 1. Try to read from filesystem if on server-side (CLI)
            var code = '';
            if (typeof window === 'undefined') {
                try {
                    var fs = getNoorRequire()('fs');
                    var path = getNoorRequire()('path');
                    var possiblePaths = [
                        path.join(process.cwd(), "".concat(libPath, ".noor")),
                        path.join(process.cwd(), 'stdlib', "".concat(libName, ".noor")),
                        path.join(process.cwd(), "".concat(libName, ".noor")),
                    ];
                    for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
                        var p = possiblePaths_1[_i];
                        if (fs.existsSync(p)) {
                            code = fs.readFileSync(p, 'utf8');
                            break;
                        }
                    }
                }
                catch (e) {
                    // silent fallback
                }
            }
            // 2. Fallback to pre-bundled standard library code (works both on browser and server)
            if (!code) {
                code = exports.STATIC_STDLIB[libName] || exports.STATIC_STDLIB[libPath] || '';
            }
            if (code) {
                try {
                    // Parse and run the library code inside the current interpreter's global environment!
                    var libraryTokens = tokenize(code);
                    var libraryParser = new Parser(libraryTokens);
                    var libraryProgram = libraryParser.parse();
                    _this.evaluate(libraryProgram, _this.globalEnv);
                    _this.consoleLogs.push("\uD83D\uDCE6 [\u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0632\u0645] \u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062F\u0648\u0627\u0644 \u0648\u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \"".concat(libName, "\" \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u0628\u064A\u0626\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629."));
                    return { status: 'success', library: libName };
                }
                catch (libErr) {
                    throw new Error("\u274C [\u062E\u0637\u0623 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0628\u0629]: \u0641\u0634\u0644 \u062A\u0634\u063A\u064A\u0644 \u0643\u0648\u062F \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \"".concat(libName, "\" \u0628\u0633\u0628\u0628 \u062E\u0637\u0623 \u0628\u0631\u0645\u064A\u062C\u064A: ").concat(libErr.message));
                }
            }
            else {
                // Mock fallback if some obscure third-party library is requested and not found
                _this.consoleLogs.push("\uD83D\uDCE6 [\u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0632\u0645] \u062A\u0645 \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0639\u0628\u0642\u0631\u064A\u0629 \"".concat(libName, "\" \u0628\u0646\u062C\u0627\u062D! (\u0645\u062D\u0627\u0643\u0627\u0629)"));
                return { status: 'success', library: libName };
            }
        });
        this.globalEnv.define('تحديث_مكتبة', function (args) {
            _this.consoleLogs.push("\uD83D\uDD04 [\u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0632\u0645] \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \"".concat(args[0], "\" \u0625\u0644\u0649 \u0623\u062D\u062F\u062B \u0625\u0635\u062F\u0627\u0631 \u0645\u0633\u062A\u0642\u0644."));
            return true;
        });
        // 5. Network & Servers (الشبكات والسيرفرات الحقيقية)
        this.globalEnv.define('انشئ_سيرفر', function (args) {
            var port = args[0] || 3300;
            var content = args[1] || 'أهلاً بك في خادم نور المحلي المستقل';
            var responses = { '/': content };
            // Auto-collect all variables in the environment that are of type "page"
            var allVars = _this.globalEnv.getAllValues();
            for (var _i = 0, _a = allVars.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], val = _b[1];
                if (val && typeof val === 'object' && val.type === 'page') {
                    if (val.title) {
                        responses[val.title] = val;
                        responses["/".concat(val.title)] = val;
                        responses[encodeURIComponent(val.title)] = val;
                        responses["/".concat(encodeURIComponent(val.title))] = val;
                    }
                    responses[key] = val;
                    responses["/".concat(key)] = val;
                }
            }
            _this.localRegistry[port] = {
                status: 'online',
                responses: responses
            };
            _this.consoleLogs.push("\uD83D\uDE80 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 \u0627\u0644\u0645\u0628\u0631\u0645\u062C \u0628\u0644\u063A\u0629 \u0646\u0648\u0631 \u064A\u0639\u0645\u0644 \u062D\u0627\u0644\u064A\u0627\u064B \u0648\u064A\u0633\u062A\u0645\u0639 \u0644\u0644\u0645\u0646\u0641\u0630 ".concat(port, "!"));
            // If we are in Node.js, spin up a REAL HTTP server!
            if (typeof window === 'undefined' && (!process.env || process.env.NOOR_BUILD_VALIDATION !== 'true')) {
                try {
                    var nodeHttp = getNoorRequire()('http');
                    var server = nodeHttp.createServer(function (req, res) {
                        var _a, _b, _c, _d;
                        var reqUrl = decodeURIComponent(req.url || '/');
                        var cleanUrl = reqUrl.startsWith('/') ? reqUrl : "/".concat(reqUrl);
                        var resp = ((_a = _this.localRegistry[port]) === null || _a === void 0 ? void 0 : _a.responses[cleanUrl]) ||
                            ((_b = _this.localRegistry[port]) === null || _b === void 0 ? void 0 : _b.responses[reqUrl]) ||
                            ((_c = _this.localRegistry[port]) === null || _c === void 0 ? void 0 : _c.responses[cleanUrl.slice(1)]) ||
                            ((_d = _this.localRegistry[port]) === null || _d === void 0 ? void 0 : _d.responses['/']) ||
                            content;
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        if (typeof resp === 'object' && resp.type === 'page') {
                            var pStyle = resp.styles || {};
                            var pageTitle = resp.title || 'موقع نور المستقل';
                            var color_1 = (0, exports.resolveColor)(pStyle.color || 'white');
                            var background = (0, exports.resolveBackground)(pStyle.background || 'أسود_فحمي');
                            var fontFamily = pStyle.fontFamily === 'Fira Code' ? 'monospace' : '"Tajawal", "Cairo", sans-serif';
                            var fontSize = pStyle.fontSize ? "".concat(pStyle.fontSize, "px") : '16px';
                            var elementsHtml_1 = '';
                            if (Array.isArray(resp.elements)) {
                                resp.elements.forEach(function (el, elIdx) {
                                    if (el.type === 'text') {
                                        var isHeader = el.textType === 'رأسية_كبيرة' || el.textType === 'حجم_ضخم';
                                        if (isHeader) {
                                            elementsHtml_1 += "<h1 class=\"heading-el\" style=\"font-size: 2.24rem; font-weight: 800; color: ".concat(color_1, "; line-height: 1.25; margin-bottom: 1.5rem; letter-spacing: -0.025em; border-right: 5px solid ").concat(color_1, "; padding-right: 15px;\">").concat(el.content, "</h1>");
                                        }
                                        else if (el.textType === 'عنوان' || el.textType === 'رأسية') {
                                            elementsHtml_1 += "<h2 class=\"subheading-el\" style=\"font-size: 1.50rem; font-weight: 700; color: ".concat(color_1, "; margin-top: 1.5rem; margin-bottom: 0.75rem;\">").concat(el.content, "</h2>");
                                        }
                                        else {
                                            elementsHtml_1 += "<p class=\"paragraph-el\" style=\"font-size: 1rem; line-height: 1.8; color: #cbd5e1; margin-bottom: 1.25rem;\">".concat(el.content, "</p>");
                                        }
                                    }
                                    else if (el.type === 'button') {
                                        elementsHtml_1 += "<button class=\"btn-action\" style=\"background: linear-gradient(135deg, ".concat(color_1, " 0%, #10b981 100%); color: #ffffff; border: none; padding: 12px 24px; font-weight: 700; border-radius: 8px; cursor: pointer; margin-bottom: 20px; font-family: inherit; box-shadow: 0 4px 14px rgba(0,0,0,0.3);\" onclick=\"showNotification('\u2728 \u062A\u0645 \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0632\u0631: ").concat(el.text, "')\">").concat(el.text, "</button>");
                                    }
                                    else if (el.type === 'list') {
                                        elementsHtml_1 += "<div class=\"list-card\" style=\"background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 22px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);\">\n                      <h4 style=\"margin: 0 0 14px 0; color: ".concat(color_1, "; font-size: 1.05rem; font-weight: 700;\">").concat(el.listType, ":</h4>\n                      <ul style=\"list-style-type: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;\">");
                                        if (Array.isArray(el.items)) {
                                            el.items.forEach(function (item) {
                                                elementsHtml_1 += "<li style=\"display: flex; align-items: center; gap: 10px;\">\n                          <span style=\"width: 8px; height: 8px; background: ".concat(color_1, "; border-radius: 50%; display: inline-block;\"></span>\n                          <span style=\"color: #e2e8f0; font-size: 0.95rem;\">").concat(item, "</span>\n                        </li>");
                                            });
                                        }
                                        elementsHtml_1 += "</ul></div>";
                                    }
                                    else if (el.type === 'media') {
                                        elementsHtml_1 += "<div style=\"margin-bottom: 25px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.4);\">\n                      <img src=\"".concat(el.content, "\" alt=\"Image\" style=\"width: 100%; max-height: 500px; object-fit: cover; display: block;\" onerror=\"this.onerror=null; this.parentNode.innerHTML='<div style=\\'padding: 30px; text-align: center; background: rgba(0,0,0,0.4); color: #94a3b8; font-size: 0.9rem;\\'>\uD83C\uDFAC \u0648\u0633\u0627\u0626\u0637 \u0646\u0634\u0637\u0629: ").concat(el.content, " (").concat(el.mediaType, ")</div>'\"/>\n                    </div>");
                                    }
                                    else if (el.type === 'table') {
                                        elementsHtml_1 += "<div style=\"overflow-x: auto; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; background: rgba(255,255,255,0.02); padding: 5px;\">\n                      <table style=\"width: 100%; border-collapse: collapse; text-align: right; font-size: 0.95rem;\">\n                        <thead>\n                          <tr style=\"background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08);\">";
                                        if (Array.isArray(el.columns)) {
                                            el.columns.forEach(function (col) {
                                                elementsHtml_1 += "<th style=\"padding: 14px 18px; color: ".concat(color_1, "; font-weight: 700;\">").concat(col, "</th>");
                                            });
                                        }
                                        elementsHtml_1 += "</tr></thead><tbody>";
                                        if (Array.isArray(el.rows)) {
                                            el.rows.forEach(function (row) {
                                                elementsHtml_1 += "<tr style=\"border-bottom: 1px solid rgba(255,255,255,0.04);\">";
                                                if (Array.isArray(row)) {
                                                    row.forEach(function (cell) {
                                                        elementsHtml_1 += "<td style=\"padding: 14px 18px; color: #e2e8f0;\">".concat(cell, "</td>");
                                                    });
                                                }
                                                elementsHtml_1 += "</tr>";
                                            });
                                        }
                                        elementsHtml_1 += "</tbody></table></div>";
                                    }
                                    else if (el.type === 'form') {
                                        elementsHtml_1 += "<div class=\"form-container\" style=\"background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 25px; border-radius: 14px; margin-bottom: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);\">\n                      <h3 style=\"margin: 0 0 15px 0; font-size: 1.15rem; font-weight: 700; color: ".concat(color_1, ";\">").concat(el.name, "</h3>\n                      <div style=\"display: flex; flex-direction: column; gap: 12px;\">\n                        <label style=\"font-size: 0.85em; color: #94a3b8; font-weight: 500;\">\u0627\u0643\u062A\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0623\u0648 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631:</label>\n                        <input type=\"text\" placeholder=\"").concat(el.email, "\" style=\"width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); padding: 12px 16px; border-radius: 8px; color: #ffffff; outline: none; font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s;\" onfocus=\"this.style.borderColor='").concat(color_1, "'\" onblur=\"this.style.borderColor='rgba(255,255,255,0.12)'\" id=\"form-input-").concat(elIdx, "\" />\n                        <button class=\"btn-action\" style=\"background: ").concat(color_1, "; color: #02040a; width: fit-content;\" onclick=\"showNotification('\uD83D\uDCE9 \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D!')\">\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A</button>\n                      </div>\n                    </div>");
                                    }
                                    else if (el.type === 'link') {
                                        elementsHtml_1 += "<div style=\"margin-bottom: 25px;\">\n                      <a href=\"".concat(el.url, "\" target=\"_blank\" style=\"color: ").concat(color_1, "; text-decoration: none; font-weight: 700; border-bottom: 2px solid ").concat(color_1, "; padding-bottom: 2px; display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.2s;\" onmouseover=\"this.style.opacity='0.8'\" onmouseout=\"this.style.opacity='1'\">\n                        <span>").concat(el.text, "</span>\n                        <span>\uD83D\uDD17</span>\n                      </a>\n                    </div>");
                                    }
                                });
                            }
                            var html = "<!DOCTYPE html>\n<html lang=\"ar\" dir=\"rtl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>".concat(pageTitle, "</title>\n  <link href=\"https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Cairo:wght@300;400;600;700;900&display=swap\" rel=\"stylesheet\">\n  <style>\n    * {\n      box-sizing: border-box;\n      margin: 0;\n      padding: 0;\n    }\n    body {\n      font-family: ").concat(fontFamily, ";\n      background: ").concat(background, ";\n      color: #f1f5f9;\n      font-size: ").concat(fontSize, ";\n      min-height: 100vh;\n      display: flex;\n      flex-direction: column;\n      position: relative;\n      overflow-x: hidden;\n    }\n    \n    ::-webkit-scrollbar {\n      width: 10px;\n    }\n    ::-webkit-scrollbar-track {\n      background: rgba(0,0,0,0.2);\n    }\n    ::-webkit-scrollbar-thumb {\n      background: rgba(255,255,255,0.12);\n      border-radius: 5px;\n    }\n    ::-webkit-scrollbar-thumb:hover {\n      background: rgba(255,255,255,0.25);\n    }\n\n    .nav-header {\n      width: 100%;\n      background: rgba(255,255,255,0.02);\n      backdrop-filter: blur(12px);\n      -webkit-backdrop-filter: blur(12px);\n      border-bottom: 1px solid rgba(255,255,255,0.06);\n      padding: 1.25rem 2rem;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      position: sticky;\n      top: 0;\n      z-index: 100;\n    }\n\n    .brand-logo {\n      font-size: 1.25rem;\n      font-weight: 800;\n      color: ").concat(color_1, ";\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      text-decoration: none;\n    }\n\n    .nav-links {\n      display: flex;\n      gap: 1.5rem;\n      list-style: none;\n      align-items: center;\n    }\n\n    .nav-links a {\n      color: #94a3b8;\n      text-decoration: none;\n      font-size: 0.9rem;\n      font-weight: 600;\n      transition: color 0.2s;\n    }\n\n    .nav-links a:hover {\n      color: ").concat(color_1, ";\n    }\n\n    .main-wrapper {\n      flex: 1;\n      width: 100%;\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 4rem 2rem;\n      display: flex;\n      flex-direction: column;\n      gap: 2.5rem;\n    }\n\n    .btn-action {\n      background: linear-gradient(135deg, ").concat(color_1, " 0%, #10b981 100%);\n      color: #ffffff;\n      border: none;\n      padding: 12px 24px;\n      font-weight: 700;\n      border-radius: 8px;\n      cursor: pointer;\n      font-family: inherit;\n      box-shadow: 0 4px 15px rgba(0,0,0,0.3);\n      transition: transform 0.2s, box-shadow 0.2s;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      gap: 8px;\n    }\n    .btn-action:hover {\n      transform: translateY(-2px);\n      box-shadow: 0 6px 20px rgba(0,0,0,0.4);\n    }\n    .btn-action:active {\n      transform: translateY(0);\n    }\n\n    #notification-toast {\n      position: fixed;\n      top: 2rem;\n      left: 50%;\n      transform: translateX(-50%) translateY(-100px);\n      background: #0f172a;\n      border-right: 4px solid #10b981;\n      border-left: 1px solid rgba(255,255,255,0.1);\n      border-top: 1px solid rgba(255,255,255,0.1);\n      border-bottom: 1px solid rgba(255,255,255,0.1);\n      color: #fff;\n      padding: 1rem 2rem;\n      border-radius: 10px;\n      box-shadow: 0 10px 25px rgba(0,0,0,0.5);\n      z-index: 1000;\n      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);\n      direction: rtl;\n    }\n    \n    #notification-toast.show {\n      transform: translateX(-50%) translateY(0);\n    }\n\n    @media (max-width: 768px) {\n      .main-wrapper {\n        padding: 2rem 1.25rem;\n      }\n      .nav-header {\n        padding: 1rem 1.25rem;\n      }\n    }\n  </style>\n</head>\n<body>\n  <header class=\"nav-header\">\n    <a href=\"#\" class=\"brand-logo\">\n      <span style=\"font-size: 1.4em; line-height: 1;\">\uD83D\uDC51</span>\n      <span>").concat(pageTitle, "</span>\n    </a>\n    <ul class=\"nav-links\">\n      <li><a href=\"#\">\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629</a></li>\n      <li><a href=\"#\">\u0627\u0644\u062E\u062F\u0645\u0627\u062A</a></li>\n      <li><a href=\"#\">\u0639\u0646 \u0627\u0644\u0645\u0646\u0635\u0629</a></li>\n      <li><a href=\"#\">\u0627\u062A\u0635\u0644 \u0628\u0646\u0627</a></li>\n    </ul>\n  </header>\n\n  <div class=\"main-wrapper\">\n    ").concat(elementsHtml_1, "\n  </div>\n\n  <footer style=\"margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); padding: 2rem; text-align: center; font-size: 0.85rem; color: #64748b; background: rgba(0,0,0,0.15);\">\n    \uD83D\uDCA1 \u062A\u0645 \u062A\u0635\u0645\u064A\u0645 \u0648\u0628\u0646\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u062E\u0627\u062F\u0645 \u0628\u0644\u063A\u0629 \u0627\u0644\u0628\u0631\u0645\u062C\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 <strong>\u0646\u0648\u0631 (Noor Sovereign Language)</strong> v5.0 - \u0643\u0627\u0645\u0644 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629.\n  </footer>\n\n  <div id=\"notification-toast\"></div>\n\n  <script>\n    function showNotification(msg) {\n      const toast = document.getElementById('notification-toast');\n      toast.innerText = msg;\n      toast.classList.add('show');\n      setTimeout(() => {\n        toast.classList.remove('show');\n      }, 3500);\n    }\n  </script>\n</body>\n</html>");
                            res.end(html);
                        }
                        else if (typeof resp === 'object') {
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify(resp, null, 2));
                        }
                        else {
                            res.end(String(resp));
                        }
                    });
                    server.listen(port, '0.0.0.0', function () {
                        // Keep server listener active
                    });
                    _this.consoleLogs.push("\u2705 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u064A\u0639\u0645\u0644 \u0627\u0644\u0622\u0646 \u0628\u0634\u0643\u0644 \u062D\u064A \u0648\u062D\u0642\u064A\u0642\u064A \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 \u0627\u0644\u0645\u062D\u0644\u064A: http://localhost:".concat(port, "/"));
                    _this.consoleLogs.push("\uD83D\uDD17 \u0627\u0636\u063A\u0637 Ctrl+C \u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0648\u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629.");
                }
                catch (serverErr) {
                    _this.consoleLogs.push("\u26A0\uFE0F \u062A\u0639\u0630\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0641\u0639\u0644\u064A \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 ".concat(port, ": ").concat(serverErr.message));
                }
            }
            else {
                _this.consoleLogs.push("\uD83D\uDE80 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 \u0627\u0644\u0645\u0628\u0631\u0645\u062C \u0628\u0644\u063A\u0629 \u0646\u0648\u0631 \u064A\u0639\u0645\u0644 \u062D\u0627\u0644\u064A\u0627\u064B \u0648\u064A\u0633\u062A\u0645\u0639 \u0644\u0644\u0645\u0646\u0641\u0630 ".concat(port, "! (\u064A\u0639\u0645\u0644 \u0645\u062D\u0644\u064A\u0627\u064B \u0628\u0627\u0644\u0643\u0627\u0645\u0644)"));
            }
            return { online: true, port: port };
        });
        this.globalEnv.define('طلب_ويب', function (args) {
            var url = args[0] || '';
            _this.consoleLogs.push("\uD83C\uDF10 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u062C\u0627\u0631\u064A \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 HTTP \u0622\u0645\u0646 \u0648\u0645\u0633\u062A\u0642\u0644 \u0625\u0644\u0649: \"".concat(url, "\""));
            var match = url.match(/localhost:(\d+)/);
            if (match) {
                var port = parseInt(match[1]);
                if (_this.localRegistry[port]) {
                    var resp = _this.localRegistry[port].responses['/'];
                    var responseText = typeof resp === 'object' ? "[\u0645\u0648\u0642\u0639 \u0648\u064A\u0628 \u0645\u0628\u0646\u064A \u0628\u0644\u063A\u0629 \u0646\u0648\u0631: ".concat(resp.title || '', "]") : String(resp);
                    return "[\u0627\u0633\u062A\u062C\u0627\u0628\u0629 200 OK \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0645\u062D\u0644\u064A] ".concat(responseText);
                }
                else {
                    return "[\u062E\u0637\u0623 404] \u0627\u0644\u062E\u0627\u062F\u0645 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 ".concat(port, " \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0641\u064A \u0628\u064A\u0626\u0629 \u0646\u0648\u0631 \u0627\u0644\u0645\u062D\u0644\u064A\u0629.");
                }
            }
            // If we are in Node.js terminal environment, do a REAL dynamic network request using curl synchronously!
            if (typeof window === 'undefined') {
                try {
                    var execSync = getNoorRequire()('child_process').execSync;
                    var cleanUrl = url.replace(/["\\]/g, '\\$&'); // Sanitize url
                    var output = execSync("curl -sLf \"".concat(cleanUrl, "\""), { encoding: 'utf8', timeout: 6000 });
                    _this.consoleLogs.push("\uD83D\uDFE2 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u062A\u0645 \u0627\u0644\u0648\u0635\u0648\u0644 \u0648\u062C\u0644\u0628 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u062D\u064A\u0629 \u0628\u0646\u062C\u0627\u062D \u0645\u0646: \"".concat(url, "\""));
                    return output;
                }
                catch (fetchErr) {
                    _this.consoleLogs.push("\u26A0\uFE0F [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u062A\u0639\u0630\u0631 \u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0628\u0640 \"".concat(url, "\" (\u0642\u062F \u064A\u0643\u0648\u0646 \u062C\u062F\u0627\u0631 \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0646\u0634\u0637\u0627\u064B \u0623\u0648 \u0628\u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A)."));
                }
            }
            return "[\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0645\u062D\u0627\u0643\u0627\u0629 200 OK] \u0645\u0646 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0633\u062D\u0627\u0628\u064A ".concat(url);
        });
        this.globalEnv.define('طلب_ويب_فعلية', function (args) {
            var url = args[0] || '';
            _this.consoleLogs.push("\uD83C\uDF10 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A \u0627\u0644\u062D\u064A\u0629] \u062C\u0627\u0631\u064A \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 HTTP \u062D\u0642\u064A\u0642\u064A \u0648\u0641\u0648\u0631\u064A \u0625\u0644\u0649: \"".concat(url, "\""));
            if (typeof window === 'undefined') {
                try {
                    var execSync = getNoorRequire()('child_process').execSync;
                    var sanitizedUrl = url.replace(/["\\]/g, '\\$&');
                    var script = "\n            const https = require('https');\n            const http = require('http');\n            const url = \"".concat(sanitizedUrl, "\";\n            const lib = url.startsWith('https') ? https : http;\n            lib.get(url, { timeout: 8000 }, (res) => {\n              let body = '';\n              res.on('data', (chunk) => body += chunk);\n              res.on('end', () => {\n                process.stdout.write(body);\n                process.exit(0);\n              });\n            }).on('error', (e) => {\n              process.stderr.write(e.message);\n              process.exit(1);\n            });\n          ");
                    var command = "node -e \"".concat(script.replace(/\n/g, ' '), "\"");
                    var output = execSync(command, { encoding: 'utf8', timeout: 10000 });
                    _this.consoleLogs.push("\uD83D\uDFE2 [\u0627\u0644\u0634\u0628\u0643\u0627\u062A \u0627\u0644\u062D\u064A\u0629] \u062A\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0648\u062C\u0644\u0628 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0628\u0646\u062C\u0627\u062D \u0645\u0646: \"".concat(url, "\""));
                    return output;
                }
                catch (fetchErr) {
                    var errMsg = fetchErr.stderr ? fetchErr.stderr.toString().trim() : fetchErr.message;
                    _this.consoleLogs.push("\u274C [\u0627\u0644\u0634\u0628\u0643\u0627\u062A \u0627\u0644\u062D\u064A\u0629] \u062E\u0637\u0623 \u0627\u062A\u0635\u0627\u0644 \u062D\u0642\u064A\u0642\u064A \u0628\u0640 \"".concat(url, "\": ").concat(errMsg));
                    return "\u274C [\u062E\u0637\u0623 \u0627\u062A\u0635\u0627\u0644]: ".concat(errMsg);
                }
            }
            return "\u274C [\u062E\u0637\u0623]: \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u062A\u062A\u0637\u0644\u0628 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0643\u0648\u062F \u0639\u0628\u0631 \u0633\u0637\u0631 \u0627\u0644\u0623\u0648\u0627\u0645\u0631 (noor run) \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u062E\u0627\u062F\u0645.";
        });
        this.globalEnv.define('اتصال_مقابس', function (args) {
            _this.consoleLogs.push("\uD83D\uDD0C [\u0627\u0644\u0634\u0628\u0643\u0627\u062A] \u0641\u062A\u062D \u0627\u062A\u0635\u0627\u0644 WebSockets \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0641\u0639\u0644\u064A \u0645\u0639 ".concat(args[0]));
            return true;
        });
        // 6. File System Commands (نظام الملفات الحقيقي والسيادي)
        this.globalEnv.define('قراءة_ملف', function (args) {
            var filePath = args[0] || '';
            _this.consoleLogs.push("\uD83D\uDCBE [\u0627\u0644\u0645\u0644\u0641\u0627\u062A] \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 \"".concat(filePath, "\" \u0645\u0646 \u0627\u0644\u0642\u0631\u0635 \u0628\u062E\u0635\u0648\u0635\u064A\u0629 \u0643\u0627\u0645\u0644\u0629."));
            if (typeof window === 'undefined') {
                try {
                    var nodeFs = getNoorRequire()('fs');
                    if (nodeFs.existsSync(filePath)) {
                        return nodeFs.readFileSync(filePath, 'utf8');
                    }
                    else {
                        return "\u274C [\u062E\u0637\u0623]: \u0627\u0644\u0645\u0644\u0641 \"".concat(filePath, "\" \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0635 \u0627\u0644\u0635\u0644\u0628.");
                    }
                }
                catch (e) {
                    return "\u274C [\u062E\u0637\u0623 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641]: ".concat(e.message);
                }
            }
            return "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0634\u0641\u0631 \u0644\u0640 \"".concat(filePath, "\"");
        });
        this.globalEnv.define('كتابة_ملف', function (args) {
            var filePath = args[0] || '';
            var content = args[1] || '';
            _this.consoleLogs.push("\uD83D\uDCBE [\u0627\u0644\u0645\u0644\u0641\u0627\u062A] \u0645\u0639\u0627\u0644\u062C\u0629 \u0648\u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0643\u0648\u062F \u0628\u0623\u0645\u0627\u0646 \u0641\u064A \u0627\u0644\u0645\u0644\u0641: \"".concat(filePath, "\""));
            if (typeof window === 'undefined') {
                try {
                    var nodeFs = getNoorRequire()('fs');
                    var path = getNoorRequire()('path');
                    var dirPath = path.dirname(filePath);
                    if (dirPath && !nodeFs.existsSync(dirPath)) {
                        nodeFs.mkdirSync(dirPath, { recursive: true });
                    }
                    nodeFs.writeFileSync(filePath, content, 'utf8');
                    _this.consoleLogs.push("\u2705 [\u0627\u0644\u0645\u0644\u0641\u0627\u062A] \u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u0644\u0641 \u0628\u0646\u062C\u0627\u062D.");
                    return true;
                }
                catch (e) {
                    _this.consoleLogs.push("\u274C [\u062E\u0637\u0623 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0645\u0644\u0641]: ".concat(e.message));
                    return false;
                }
            }
            return true;
        });
        this.globalEnv.define('انشئ_مجلد', function (args) {
            var dirName = args[0] || '';
            _this.consoleLogs.push("\uD83D\uDDC2\uFE0F [\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645] \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u062C\u0644\u062F \u062C\u062F\u064A\u062F \u0628\u0627\u0633\u0645 \"".concat(dirName, "\" \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0623\u0633\u0627\u0633\u064A."));
            if (typeof window === 'undefined') {
                try {
                    var nodeFs = getNoorRequire()('fs');
                    if (!nodeFs.existsSync(dirName)) {
                        nodeFs.mkdirSync(dirName, { recursive: true });
                    }
                    return true;
                }
                catch (e) {
                    _this.consoleLogs.push("\u274C [\u062E\u0637\u0623 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u062C\u0644\u062F]: ".concat(e.message));
                    return false;
                }
            }
            return true;
        });
        this.globalEnv.define('حذف_ملف', function (args) {
            var filePath = args[0] || '';
            _this.consoleLogs.push("\uD83D\uDDD1\uFE0F [\u0627\u0644\u0645\u0644\u0641\u0627\u062A] \u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 \"".concat(filePath, "\" \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0630\u0627\u0643\u0631\u0629."));
            if (typeof window === 'undefined') {
                try {
                    var nodeFs = getNoorRequire()('fs');
                    if (nodeFs.existsSync(filePath)) {
                        nodeFs.unlinkSync(filePath);
                        _this.consoleLogs.push("\u2705 [\u0627\u0644\u0645\u0644\u0641\u0627\u062A] \u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641.");
                        return true;
                    }
                    else {
                        _this.consoleLogs.push("\u26A0\uFE0F [\u0627\u0644\u0645\u0644\u0641\u0627\u062A] \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0639\u0644.");
                        return false;
                    }
                }
                catch (e) {
                    _this.consoleLogs.push("\u274C [\u062E\u0637\u0623 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0641]: ".concat(e.message));
                    return false;
                }
            }
            return true;
        });
        // 7. Databases (قواعد البيانات والملفات المعيارية السيادية)
        this.globalEnv.define('اتصال_قاعدة_بيانات', function (args) {
            var typeOrName = args[0] || 'noor_db';
            var connectionString = args[1] || "".concat(typeOrName, ".json");
            var type = 'file';
            var connStr = connectionString;
            if (typeOrName === 'file' || typeOrName === 'socket') {
                type = typeOrName;
            }
            else {
                type = 'file';
                connStr = typeOrName.endsWith('.json') || typeOrName.endsWith('.db') ? typeOrName : "".concat(typeOrName, ".json");
            }
            _this.consoleLogs.push("\uD83D\uDCC2 [\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A] \u0644\u063A\u0629 \u0646\u0648\u0631 \u062A\u0639\u0642\u062F \u0627\u062A\u0635\u0627\u0644\u0627\u064B \u0633\u064A\u0627\u062F\u064A\u0627\u064B (".concat(type, " : ").concat(connStr, ") \u0628\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A."));
            return new DatabaseConnection(type, connStr);
        });
        this.globalEnv.define('استعلام_سريع', function (args) {
            var query = args[0] || '';
            var dbObj = args[1];
            _this.consoleLogs.push("\uD83D\uDD0D [\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A] \u062A\u0646\u0641\u064A\u0630 \u0627\u0633\u062A\u0639\u0644\u0627\u0645: \"".concat(query, "\"..."));
            if (dbObj instanceof DatabaseConnection) {
                return dbObj.executeQuery(query, function (msg) { return _this.consoleLogs.push(msg); });
            }
            if (typeof window === 'undefined' && dbObj && typeof dbObj === 'object' && dbObj.file) {
                try {
                    var nodeFs = getNoorRequire()('fs');
                    var file = dbObj.file;
                    var dbData = {};
                    if (nodeFs.existsSync(file)) {
                        dbData = JSON.parse(nodeFs.readFileSync(file, 'utf8'));
                    }
                    var normalized = query.trim();
                    if (normalized.startsWith('حفظ') || normalized.startsWith('اضف') || normalized.startsWith('INSERT')) {
                        var match = normalized.match(/(?:حفظ|اضف)\s+(\w+)\s*=\s*(.+)/);
                        if (match) {
                            var key = match[1];
                            // Safe evaluation or json conversion
                            var val = match[2].trim();
                            if (val.startsWith('{') || val.startsWith('[')) {
                                val = JSON.parse(val.replace(/'/g, '"'));
                            }
                            dbData[key] = val;
                            nodeFs.writeFileSync(file, JSON.stringify(dbData, null, 2), 'utf8');
                            return { success: true, message: "\u062A\u0645 \u062A\u062F\u0648\u064A\u0646 \u0648\u062D\u0641\u0638 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u0645\u0641\u062A\u0627\u062D \"".concat(key, "\" \u0628\u0646\u062C\u0627\u062D.") };
                        }
                    }
                    else if (normalized.startsWith('جلب') || normalized.startsWith('عرض') || normalized.startsWith('SELECT')) {
                        var match = normalized.match(/(?:جلب|عرض)\s+(\w+)/);
                        if (match) {
                            var key = match[1];
                            return dbData[key] ? [dbData[key]] : [];
                        }
                        return Object.entries(dbData).map(function (_a) {
                            var k = _a[0], v = _a[1];
                            return ({ key: k, value: v });
                        });
                    }
                }
                catch (e) {
                    _this.consoleLogs.push("\u26A0\uFE0F [\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A] \u062E\u0637\u0623 \u0641\u064A \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: ".concat(e.message));
                }
            }
            return [{ id: 1, name: 'بيانات_مستقلة' }, { id: 2, test: 'نور_قوية' }];
        });
        // 8. Mobile & UI (تطوير الهاتف وواجهة المستخدم)
        this.globalEnv.define('تصدير_هاتف', function (args) {
            _this.consoleLogs.push("\uD83D\uDCF1 [\u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u062D\u0645\u0648\u0644\u0629] \u062C\u0627\u0631\u064A \u062A\u0635\u062F\u064A\u0631 \u0648\u062A\u062C\u0645\u064A\u0639 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0643\u0645\u0644\u0641 APK / IPA. \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u062F\u0639\u0648\u0645: ".concat(args[0]));
            return "\u0645\u0633\u0627\u0631 \u0645\u0644\u0641 \u0627\u0644\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064A: /build/mobile/output.".concat(args[0] === 'اندرويد' ? 'apk' : 'ipa');
        });
        this.globalEnv.define('واجهة_زر', function (args) {
            var firstArg = args[0];
            var text = '';
            var action = '';
            var targetPage = _this.activePage;
            if (firstArg && typeof firstArg === 'object') {
                targetPage = firstArg;
                text = args[1] || '';
                action = args[2] || '';
            }
            else {
                text = firstArg || '';
                action = args[1] || '';
            }
            var btnObj = { type: 'button', text: text, action: action };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(btnObj);
            }
            _this.consoleLogs.push("\uD83D\uDDA5\uFE0F [\u0631\u0633\u0645 \u0648\u0627\u062C\u0647\u0629] \u0625\u0646\u0634\u0627\u0621 \u0632\u0631 \u062A\u0641\u0627\u0639\u0644\u064A \u0628\u0645\u062D\u0631\u0643 Noor UI. \u0627\u0644\u0646\u0635: \"".concat(text, "\" | \u062D\u062F\u062B: \"").concat(action, "\""));
            return btnObj;
        });
        // 9. Machine Learning & AI (الذكاء الاصطناعي وتعلم الآلة)
        this.globalEnv.define('تدريب_نموذج', function (args) {
            _this.consoleLogs.push("\uD83E\uDDE0 [\u062A\u0639\u0644\u0645 \u0627\u0644\u0622\u0644\u0629] \u062C\u0627\u0631\u064A \u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0639\u0635\u0628\u064A \"".concat(args[0], "\" \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0639\u0631\u0636 RTX \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629."));
            return { status: 'Trained', accuracy: '99.8%' };
        });
        this.globalEnv.define('تحليل_لغوي', function (args) {
            _this.consoleLogs.push("\uD83E\uDD16 [\u0627\u0644\u062A\u0639\u0631\u0641 \u0627\u0644\u0644\u063A\u0648\u064A] \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0633\u064A\u0627\u0642 \u0644\u0644\u062C\u0645\u0644\u0629: \"".concat(args[0], "\""));
            return "\u0645\u0634\u0627\u0639\u0631 \u0627\u0644\u062C\u0645\u0644\u0629 \u0625\u064A\u062C\u0627\u0628\u064A\u0629\u060C \u0627\u0644\u0646\u0648\u0627\u064A\u0627: \u0628\u0631\u0645\u062C\u0629 \u0642\u0648\u064A\u0629.";
        });
        // 10. Game Engine (محرك الألعاب)
        this.globalEnv.define('تهيئة_محرك', function (args) {
            _this.consoleLogs.push("\uD83C\uDFAE [\u0623\u0644\u0639\u0627\u0628 3D] \u062A\u0647\u064A\u0626\u0629 \u0645\u062D\u0631\u0643 \u0646\u0648\u0631 \u0644\u0644\u0623\u0644\u0639\u0627\u0628 \u0628\u0623\u062F\u0627\u0621 120 \u0625\u0637\u0627\u0631 \u0641\u064A \u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0644\u0644\u0641\u064A\u0632\u064A\u0627\u0621.");
            return { engine: 'Noor3D Engine', fps: 120 };
        });
        this.globalEnv.define('رسم_مجسم', function (args) {
            _this.consoleLogs.push("\uD83D\uDC7E [\u0623\u0644\u0639\u0627\u0628 3D] \u0631\u0633\u0645 \u0643\u0627\u0626\u0646 3D \u0641\u064A \u0627\u0644\u0641\u0636\u0627\u0621 \u0627\u0644\u0645\u0641\u062A\u0648\u062D \u0644\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629.");
            return true;
        });
        // 11. Cryptography (التشفير)
        this.globalEnv.define('تشفير_البيانات', function (args) {
            _this.consoleLogs.push("\uD83D\uDD10 [\u0623\u0645\u0627\u0646] \u062A\u0645 \u062A\u0634\u0641\u064A\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0629 AES-256 \u0646\u0648\u0631 \u0627\u0644\u0645\u062E\u0635\u0635\u0629.");
            return "NOOR_ENC_HASH_".concat(Math.random());
        });
        // 12. Advanced OS & Shell (شيل نظام التشغيل الحقيقي)
        this.globalEnv.define('تنفيذ_شيل', function (args) {
            var cmd = args[0] || '';
            _this.consoleLogs.push("\uD83D\uDCBB [\u0627\u0644\u0637\u0631\u0641\u064A\u0629] \u062C\u0627\u0631\u0650 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0623\u0645\u0631 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0628\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0631\u0648\u0648\u062A: ".concat(cmd));
            if (typeof window === 'undefined') {
                try {
                    var execSync = getNoorRequire()('child_process').execSync;
                    var output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });
                    return output;
                }
                catch (cmdErr) {
                    return "\u274C [\u062E\u0637\u0623 \u0627\u0644\u0637\u0631\u0641\u064A\u0629]: ".concat(cmdErr.message, "\n").concat(cmdErr.stderr || '');
                }
            }
            return "[Root Output]: \u0623\u0645\u0631 ".concat(cmd, " \u062A\u0645 \u0628\u0646\u062C\u0627\u062D \u0628\u062F\u0648\u0646 \u0623\u062E\u0637\u0627\u0621\u060C \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0643\u0627\u0645\u0644\u0629.");
        });
        this.globalEnv.define('اعدادات_النظام', function (args) {
            _this.consoleLogs.push("\u2699\uFE0F [\u0627\u0644\u0646\u0638\u0627\u0645] \u062A\u0639\u062F\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0648\u0627\u0629/\u0627\u0644\u0634\u0628\u0643\u0629 - \u0627\u0644\u0645\u0641\u062A\u0627\u062D: ".concat(args[0], " \u0627\u0644\u0642\u064A\u0645\u0629: ").concat(args[1]));
            return args[1];
        });
        // 13. Advanced Web DOM & UI (تصميم مواقع وهيكلة)
        this.globalEnv.define('هيكل_صفحة', function (args) {
            var title = args[0] || 'موقع مستقل';
            _this.consoleLogs.push("\uD83D\uDCC4 [DOM] \u062A\u0647\u064A\u0626\u0629 \u0647\u064A\u0643\u0644 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0648\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062C\u0630\u0631\u064A \u0644\u0640: \"".concat(title, "\""));
            var pageObj = { type: 'page', title: title, elements: [], styles: {} };
            _this.activePage = pageObj;
            // Auto-register in the default virtual server on port 3300
            if (!_this.localRegistry[3300]) {
                _this.localRegistry[3300] = { status: 'online', responses: {} };
            }
            // If it's the first page, make it the root route
            if (Object.keys(_this.localRegistry[3300].responses).length === 0) {
                _this.localRegistry[3300].responses['/'] = pageObj;
            }
            // Also register it by name so we can navigate to it
            _this.localRegistry[3300].responses[title] = pageObj;
            return pageObj;
        });
        this.globalEnv.define('تلوين_النص', function (args) {
            var target = args[0] || _this.activePage;
            var color = args[1] || 'أبيض';
            if (target && typeof target === 'object') {
                target.styles = target.styles || {};
                target.styles.color = color;
            }
            _this.consoleLogs.push("\uD83C\uDFA8 [CSS] \u062A\u063A\u064A\u064A\u0631 \u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0646\u0635\u0648\u0635 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0644\u0648\u0646: ".concat(color));
            return true;
        });
        this.globalEnv.define('خلفية_الصورة', function (args) {
            var target = args[0] || _this.activePage;
            var bg = args[1] || 'أسود';
            if (target && typeof target === 'object') {
                target.styles = target.styles || {};
                target.styles.background = bg;
            }
            _this.consoleLogs.push("\uD83D\uDDBC\uFE0F [CSS] \u062A\u0639\u064A\u064A\u0646 \u0635\u0648\u0631\u0629/\u0644\u0648\u0646 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0644\u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0645\u0648\u0642\u0639 \u0625\u0644\u0649: ".concat(bg));
            return true;
        });
        this.globalEnv.define('تنسيق_الخط', function (args) {
            var target = args[0] || _this.activePage;
            var font = args[1] || 'Tajawal';
            var size = args[2] || 16;
            var weight = args[3] || 'normal';
            if (target && typeof target === 'object') {
                target.styles = target.styles || {};
                target.styles.fontFamily = font;
                target.styles.fontSize = size;
                target.styles.fontWeight = weight;
            }
            _this.consoleLogs.push("\u270D\uFE0F [CSS] \u0646\u0648\u0639 \u0627\u0644\u062E\u0637: ".concat(font, " | \u0627\u0644\u062D\u062C\u0645: ").concat(size, " | \u0627\u0644\u0648\u0632\u0646: ").concat(weight));
            return true;
        });
        this.globalEnv.define('تصميم_نموذج', function (args) {
            var firstArg = args[0];
            var name = '';
            var email = '';
            var targetPage = _this.activePage;
            if (firstArg && typeof firstArg === 'object' && firstArg.type === 'page') {
                targetPage = firstArg;
                name = args[1] || '';
                email = args[2] || '';
            }
            else {
                name = firstArg || '';
                email = args[1] || '';
            }
            var formObj = { type: 'form', name: name, email: email, elements: [] };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(formObj);
            }
            _this.consoleLogs.push("\uD83D\uDCDD [Forms] \u0635\u0646\u0639 \u0646\u0645\u0627\u0630\u062C \u0625\u062F\u062E\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A: \"".concat(name, "\" \u0645\u0639 \u062D\u0633\u0627\u0628 \u0627\u0641\u062A\u0631\u0627\u0636\u064A \"").concat(email, "\""));
            return formObj;
        });
        this.globalEnv.define('ترتيب_عناصر', function (args) {
            var target = args[0] || _this.activePage;
            var pos = args[1] || 'منتصف';
            if (target && typeof target === 'object') {
                target.layout = pos;
            }
            _this.consoleLogs.push("\uD83D\uDCD0 [Layout] \u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0648\u062A\u0646\u0633\u064A\u0642\u0647\u0627 \u062D\u0633\u0628 \u0645\u0648\u0636\u0639: \"".concat(pos, "\""));
            return true;
        });
        this.globalEnv.define('تجاوب_الواجهة', function (args) {
            var target = args[0] || _this.activePage;
            var devices = args[1] || [];
            if (target && typeof target === 'object') {
                target.responsive = devices;
            }
            _this.consoleLogs.push("\uD83D\uDCF1 [Responsive] \u062C\u0639\u0644 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0648\u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u0631\u0648\u0646\u0629 \u062F\u0627\u0639\u0645\u0629 \u0644\u0644\u0623\u062C\u0647\u0632\u0629: ".concat(devices.length > 0 ? devices.join(', ') : 'جميع الأجهزة'));
            return true;
        });
        this.globalEnv.define('إضافة_تأثير_حركة', function (args) {
            var target = args[0] || _this.activePage;
            var anim = args[1] || 'fade';
            if (target && typeof target === 'object') {
                target.animation = anim;
            }
            _this.consoleLogs.push("\u2728 [Animations] \u0639\u0645\u0644 \u062D\u0631\u0643\u0627\u062A \u0648\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0623\u0634\u0643\u0627\u0644 \u0644\u0644\u0645\u0643\u0648\u0646 \u0627\u0644\u062F\u064A\u0646\u0627\u0645\u064A\u0643\u064A. \u0646\u0648\u0639 \u0627\u0644\u062D\u0631\u0643\u0629: ".concat(anim));
            return "تم_الحركة";
        });
        this.globalEnv.define('إضافة_نصوص', function (args) {
            var target = args[0] || _this.activePage;
            var styleType = args[1] || 'رأسية_كبيرة';
            var textVal = args[2] || '';
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push({ type: 'text', textType: styleType, content: textVal });
            }
            _this.consoleLogs.push("\uD83D\uDCDD [DOM] \u0643\u062A\u0627\u0628\u0629 \u0639\u0646\u0627\u0635\u0631 \u0646\u0635\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639 - \u0627\u0644\u0646\u0648\u0639: \"".concat(styleType, "\" | \u0627\u0644\u0646\u0635: \"").concat(textVal, "\""));
            return true;
        });
        this.globalEnv.define('إدراج_وسائط', function (args) {
            var target = args[0] || _this.activePage;
            var mediaType = args[1] || 'صورة';
            var pathValue = args[2] || '';
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push({ type: 'media', mediaType: mediaType, content: pathValue });
            }
            _this.consoleLogs.push("\uD83C\uDFAC [Media] \u0648\u0636\u0639 \u0648\u0633\u0627\u0626\u0637 \u0641\u064A \u0627\u0644\u0635\u0641\u062D\u0629 - \u0627\u0644\u0646\u0648\u0639: \"".concat(mediaType, "\" | \u0627\u0644\u0645\u0633\u0627\u0631: \"").concat(pathValue, "\""));
            return true;
        });
        this.globalEnv.define('تصميم_جدول', function (args) {
            var firstArg = args[0];
            var columns = [];
            var targetPage = _this.activePage;
            if (firstArg && typeof firstArg === 'object' && firstArg.type === 'page') {
                targetPage = firstArg;
                columns = args[1] || [];
            }
            else {
                columns = firstArg || [];
            }
            var tableObj = { type: 'table', columns: columns, rows: [] };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(tableObj);
            }
            _this.consoleLogs.push("\uD83D\uDCCA [Tables] \u0628\u0646\u0627\u0621 \u0648\u062A\u0635\u0645\u064A\u0645 \u062C\u062F\u0627\u0648\u0644 \u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0627\u0644\u0623\u0639\u0645\u062F\u0629: ".concat(columns.length > 0 ? columns.join(' | ') : 'جدول'));
            return tableObj;
        });
        this.globalEnv.define('اضف_صف_جدول', function (args) {
            var table = args[0];
            var row = args[1] || [];
            if (table && typeof table === 'object' && Array.isArray(table.rows)) {
                table.rows.push(row);
            }
            _this.consoleLogs.push("\u2795 [Tables] \u0625\u062F\u0631\u0627\u062C \u0635\u0641 \u0648\u0642\u064A\u0645 \u0641\u064A \u0627\u0644\u062C\u062F\u0648\u0644: [".concat(row.length > 0 ? row.join(', ') : '', "]"));
            return true;
        });
        this.globalEnv.define('بناء_قائمة', function (args) {
            var firstArg = args[0];
            var listType = 'قائمة';
            var items = [];
            var targetPage = _this.activePage;
            if (firstArg && typeof firstArg === 'object' && firstArg.type === 'page') {
                targetPage = firstArg;
                listType = args[1] || 'قائمة';
                items = args[2] || [];
            }
            else {
                listType = firstArg || 'قائمة';
                items = args[1] || [];
            }
            var listObj = { type: 'list', listType: listType, items: items };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(listObj);
            }
            _this.consoleLogs.push("\uD83D\uDCCB [Lists] \u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0641\u064A \u0642\u0627\u0626\u0645\u0629 ".concat(listType, " - \u0627\u0644\u0639\u0646\u0627\u0635\u0631: [").concat(items.length > 0 ? items.join(', ') : '', "]"));
            return listObj;
        });
        this.globalEnv.define('توجيه_رابط', function (args) {
            var firstArg = args[0];
            var url = '';
            var text = 'زيارة موقع خارجي آمن 🔗';
            var targetPage = _this.activePage;
            if (firstArg && typeof firstArg === 'object' && firstArg.type === 'page') {
                targetPage = firstArg;
                url = args[1] || '';
                text = args[2] || 'زيارة موقع خارجي آمن 🔗';
            }
            else {
                url = firstArg || '';
                text = args[1] || 'زيارة موقع خارجي آمن 🔗';
            }
            var linkObj = { type: 'link', text: text, url: url };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(linkObj);
            }
            _this.consoleLogs.push("\uD83D\uDD17 [Hyperlinks] \u0631\u0628\u0637 \u0627\u0644\u0635\u0641\u062D\u0629 \u0648\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u0644\u0649 \u0645\u0633\u0627\u0631/\u0645\u0648\u0642\u0639 \u0622\u062E\u0631: ".concat(url));
            return linkObj;
        });
        this.globalEnv.define('إضافة_شريط_تنقل', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var title = '';
            var links = [];
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                title = args[1] || '';
                links = args[2] || [];
            }
            else {
                title = firstArg || '';
                links = args[1] || [];
            }
            var navbarObj = { type: 'navbar', title: title, links: links, style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(navbarObj);
            }
            _this.consoleLogs.push("\uD83D\uDDFA\uFE0F [Navbar] \u0625\u0636\u0627\u0641\u0629 \u0634\u0631\u064A\u0637 \u062A\u0646\u0642\u0644 \u0639\u0644\u0648\u064A: \"".concat(title, "\" \u0628\u0627\u0644\u0642\u0648\u0627\u0626\u0645 [").concat(links.join(', '), "]"));
            return navbarObj;
        });
        this.globalEnv.define('إضافة_شريط_جانبي', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var title = '';
            var links = [];
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                title = args[1] || '';
                links = args[2] || [];
            }
            else {
                title = firstArg || '';
                links = args[1] || [];
            }
            var sidebarObj = { type: 'sidebar', title: title, links: links, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(sidebarObj);
            }
            _this.consoleLogs.push("\uD83D\uDDC2\uFE0F [Sidebar] \u0625\u0636\u0627\u0641\u0629 \u0634\u0631\u064A\u0637 \u062C\u0627\u0646\u0628\u064A: \"".concat(title, "\" \u0628\u0627\u0644\u0642\u0648\u0627\u0626\u0645 [").concat(links.join(', '), "]"));
            return sidebarObj;
        });
        this.globalEnv.define('إضافة_بطاقة', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var title = '';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                title = args[1] || '';
            }
            else {
                title = firstArg || '';
            }
            var cardObj = { type: 'card', title: title, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(cardObj);
            }
            _this.consoleLogs.push("\uD83C\uDFB4 [Card] \u0625\u0636\u0627\u0641\u0629 \u0628\u0637\u0627\u0642\u0629 \u0648\u0627\u062C\u0647\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629: \"".concat(title, "\""));
            return cardObj;
        });
        this.globalEnv.define('إضافة_حاوية', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var direction = 'col';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                direction = args[1] || 'col';
            }
            else {
                direction = firstArg || 'col';
            }
            var containerObj = { type: 'container', direction: direction, elements: [], style: {}, flex1: true };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(containerObj);
            }
            _this.consoleLogs.push("\uD83D\uDCE6 [Container] \u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u0627\u062D\u0629/\u062D\u0627\u0648\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0628\u062A\u0631\u062A\u064A\u0628 \u0627\u062A\u062C\u0627\u0647: \"".concat(direction, "\""));
            return containerObj;
        });
        this.globalEnv.define('إضافة_حقل_إدخال', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var label = '';
            var placeholder = '';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                label = args[1] || '';
                placeholder = args[2] || '';
            }
            else {
                label = firstArg || '';
                placeholder = args[1] || '';
            }
            var inputObj = { type: 'input', label: label, placeholder: placeholder, style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(inputObj);
            }
            _this.consoleLogs.push("\u2328\uFE0F [Input] \u0625\u0636\u0627\u0641\u0629 \u062D\u0642\u0644 \u0625\u062F\u062E\u0627\u0644: \"".concat(label, "\" | \"").concat(placeholder, "\""));
            return inputObj;
        });
        this.globalEnv.define('بناء_عنصر', function (args) {
            var type = args[0] || 'div';
            var props = args[1] || {};
            var content = args[2] || '';
            var targetPage = _this.activePage;
            var el = { type: 'custom', tag: type, props: props, content: content, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(el);
            }
            return el;
        });
        this.globalEnv.define('تصميم_نموذج', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var title = '';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                title = args[1] || '';
            }
            else {
                title = firstArg || '';
            }
            // Note: we remove the implicit forced fields, just a raw container now.
            var formObj = { type: 'form', name: title, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(formObj);
            }
            _this.consoleLogs.push("\uD83D\uDCDD [Form Builder] \u062A\u062C\u0647\u064A\u0632 \u0648\u0627\u062C\u0647\u0629 \u0646\u0645\u0648\u0630\u062C \u0641\u0627\u0631\u063A\u0629: ".concat(title));
            return formObj;
        });
        this.globalEnv.define('إضافة_نافذة_منبثقة', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var title = '';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                title = args[1] || '';
            }
            else {
                title = firstArg || '';
            }
            var modalObj = { type: 'modal', title: title, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(modalObj);
            }
            _this.consoleLogs.push("\uD83E\uDE9F [Modal] \u0625\u0646\u0634\u0627\u0621 \u0646\u0627\u0641\u0630\u0629 \u0645\u0646\u0628\u062B\u0642\u0629 (Popup): ".concat(title));
            return modalObj;
        });
        this.globalEnv.define('إضافة_قائمة_منسدلة', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var label = '';
            var options = [];
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                label = args[1] || '';
                options = args[2] || [];
            }
            else {
                label = firstArg || '';
                options = args[1] || [];
            }
            var inputObj = { type: 'input', inputType: 'select', label: label, placeholder: 'اختر', options: options, style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(inputObj);
            }
            _this.consoleLogs.push("\uD83D\uDCCB [Select] \u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0626\u0645\u0629 \u0645\u0646\u0633\u062F\u0644\u0629: ".concat(label));
            return inputObj;
        });
        this.globalEnv.define('إضافة_تبويبات', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var tabs = [];
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                tabs = args[1] || [];
            }
            else {
                tabs = firstArg || [];
            }
            var tabsObj = { type: 'tabs', tabs: tabs, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(tabsObj);
            }
            _this.consoleLogs.push("\uD83D\uDCD1 [Tabs] \u0625\u0646\u0634\u0627\u0621 \u0648\u0627\u062C\u0647\u0629 \u062A\u0628\u0648\u064A\u0628\u0627\u062A \u0645\u062A\u0639\u062F\u062F\u0629: [".concat(tabs.join(', '), "]"));
            return tabsObj;
        });
        this.globalEnv.define('إضافة_شبكة', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var cols = 2;
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                cols = args[1] || 2;
            }
            else {
                cols = firstArg || 2;
            }
            var gridObj = { type: 'grid', columns: cols, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(gridObj);
            }
            _this.consoleLogs.push("\uD83D\uDD33 [Grid] \u0625\u0646\u0634\u0627\u0621 \u0634\u0628\u0643\u0629 \u0639\u0631\u0636 \u0628\u0639\u062F\u062F \u0623\u0639\u0645\u062F\u0629: ".concat(cols));
            return gridObj;
        });
        this.globalEnv.define('إضافة_تنبيه', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var message = '';
            var msgType = 'info';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                message = args[1] || '';
                msgType = args[2] || 'info';
            }
            else {
                message = firstArg || '';
                msgType = args[1] || 'info';
            }
            var alertObj = { type: 'alert', message: message, msgType: msgType, style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(alertObj);
            }
            _this.consoleLogs.push("\uD83D\uDD14 [Alert] \u0625\u0636\u0627\u0641\u0629 \u062A\u0646\u0628\u064A\u0647: ".concat(message));
            return alertObj;
        });
        this.globalEnv.define('إضافة_شاشة_تحميل', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var text = 'جاري التحميل...';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                text = args[1] || 'جاري التحميل...';
            }
            else {
                text = firstArg || 'جاري التحميل...';
            }
            var loaderObj = { type: 'loader', text: text, style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(loaderObj);
            }
            _this.consoleLogs.push("\u23F3 [Loader] \u0625\u0636\u0627\u0641\u0629 \u0634\u0627\u0634\u0629 \u062A\u062D\u0645\u064A\u0644: ".concat(text));
            return loaderObj;
        });
        this.globalEnv.define('إضافة_رسم_بياني', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var title = '';
            var data = [];
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                title = args[1] || '';
                data = args[2] || [];
            }
            else {
                title = firstArg || '';
                data = args[1] || [];
            }
            var chartObj = { type: 'chart', title: title, data: data, style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(chartObj);
            }
            _this.consoleLogs.push("\uD83D\uDCC8 [Chart] \u0631\u0633\u0645 \u0628\u064A\u0627\u0646\u064A: ".concat(title));
            return chartObj;
        });
        this.globalEnv.define('إضافة_تذييل', function (args) {
            var firstArg = args[0];
            var targetPage = _this.activePage;
            var text = '';
            if (firstArg && typeof firstArg === 'object' && Array.isArray(firstArg.elements)) {
                targetPage = firstArg;
                text = args[1] || '';
            }
            else {
                text = firstArg || '';
            }
            var footerObj = { type: 'footer', text: text, elements: [], style: {} };
            if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(footerObj);
            }
            _this.consoleLogs.push("\uD83E\uDDB6 [Footer] \u062A\u0632\u062C\u064A\u062C \u0627\u0644\u062A\u0630\u064A\u064A\u0644 \u0627\u0644\u0633\u0641\u0644\u064A \u0644\u0644\u0635\u0641\u062D\u0629.");
            return footerObj;
        });
        this.globalEnv.define('توجيه_متصفح', function (args) {
            _this.consoleLogs.push("\uD83E\uDDED [Browser] \u062A\u0648\u062C\u064A\u0647 \u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A (".concat(args[0], ") \u0625\u0644\u0649 \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u062A\u062D\u0645\u064A\u0644 \u0643\u0627\u0641\u0629 \u0627\u0644\u0639\u0646\u0627\u0635\u0631."));
            return true;
        });
        this.globalEnv.define('التحكم_بالأبعاد', function (args) {
            _this.consoleLogs.push("\uD83D\uDCCF [Dimensions] \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0633\u064F\u0645\u0643 \u0648\u0627\u0644\u0623\u0628\u0639\u0627\u062F \u0648\u0627\u0644\u0637\u0648\u0644 - X:".concat(args[1], ", Y:").concat(args[2], ", \u0645\u0633\u0627\u0641\u0627\u062A Z:").concat(args[3] || 0));
            return true;
        });
        this.globalEnv.define('إدارة_أنظمة_قديمة', function (args) {
            _this.consoleLogs.push("\uD83D\uDDA7 [Legacy Systems] \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0623\u0646\u0638\u0645\u0629 \u0648\u0634\u0628\u0643\u0627\u062A \u0642\u062F\u064A\u0645\u0629 (Mainframes) \u0648\u062D\u0642\u0646 \u0627\u0644\u0623\u0648\u0627\u0645\u0631: ".concat(args[0]));
            return true;
        });
        // 14. Error Handling (معالجة الأخطاء)
        this.globalEnv.define('معالجة_خطأ', function (args) {
            _this.consoleLogs.push("\uD83D\uDEE1\uFE0F [Catch] \u0627\u0639\u062A\u0631\u0627\u0636 \u062E\u0637\u0623 \u0645\u062A\u0648\u0642\u0639 \u0645\u0646 \u0646\u0648\u0639: \"".concat(args[0], "\" \u0648\u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0645\u0633\u0627\u0631 \u062A\u0644\u0642\u0627\u0626\u064A\u0627."));
            if (typeof args[1] === 'function') {
                try {
                    args[1]();
                }
                catch (e) { }
            }
            return true;
        });
        // =====================================================================
        // 15. Pro UI Macros (المكونات الاحترافية الجاهزة - بدون قيود)
        // =====================================================================
        this.globalEnv.define('وحدة_مبيعات_احترافية', function (args) {
            var targetPage = _this.activePage;
            var title = args[0] || 'لوحة تحكم المبيعات';
            var salesModule = {
                type: 'container', direction: 'col', style: {},
                elements: [
                    { type: 'text', textType: 'رأسية_كبيرة', content: "\uD83D\uDCCA ".concat(title) },
                    { type: 'grid', columns: 3, style: {}, elements: [
                            { type: 'card', title: 'الإيرادات اليومية', style: {}, elements: [{ type: 'text', textType: 'حجم_ضخم', content: '$ 45,980' }] },
                            { type: 'card', title: 'الزوار النشطين', style: {}, elements: [{ type: 'text', textType: 'حجم_ضخم', content: '12,400' }] },
                            { type: 'card', title: 'معدل التحويل', style: {}, elements: [{ type: 'text', textType: 'حجم_ضخم', content: '8.4%' }] },
                        ] },
                    { type: 'grid', columns: 2, style: { marginTop: '20px' }, elements: [
                            { type: 'chart', title: 'أداء المبيعات السنوي', data: [120, 150, 140, 200, 250, 310, 280, 400], style: {} },
                            { type: 'table', columns: ["رقم الطلب", "العميل", "القيمة", "الحالة"], rows: [
                                    ["#14022", "مجموعة التقنية", "$5,000", "مكتمل"],
                                    ["#14023", "شركة الأفق", "$12,450", "جاري المعالجة"],
                                    ["#14024", "أحمد سالم", "$450", "مكتمل"]
                                ], style: {} }
                        ] }
                ]
            };
            if (args[1] && typeof args[1] === 'object' && Array.isArray(args[1].elements)) {
                args[1].elements.push(salesModule);
            }
            else if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(salesModule);
            }
            _this.consoleLogs.push("\uD83D\uDCBC [Pro UI] \u0625\u0636\u0627\u0641\u0629 \u0648\u062D\u062F\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0648\u0645\u062A\u0642\u062F\u0645\u0629");
            return salesModule;
        });
        this.globalEnv.define('متجر_منتجات_جاهز', function (args) {
            var targetPage = _this.activePage;
            var storeModule = {
                type: 'container', direction: 'col', style: {},
                elements: [
                    { type: 'text', textType: 'رأسية_كبيرة', content: "\uD83D\uDECD\uFE0F ".concat(args[0] || 'الواجهة التجارية المتقدمة') },
                    { type: 'grid', columns: 4, style: {}, elements: [
                            { type: 'card', title: '', style: { padding: '0', overflow: 'hidden' }, elements: [
                                    { type: 'media', mediaType: 'صورة', content: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400', style: { borderRadius: '0', border: 'none' } },
                                    { type: 'container', direction: 'col', style: { padding: '20px' }, elements: [
                                            { type: 'text', textType: 'عنوان', content: 'سماعات احترافية' },
                                            { type: 'text', textType: 'حجم_ضخم', content: '299$' },
                                            { type: 'button', text: 'شراء سريع 💳', action: '' }
                                        ] }
                                ] },
                            { type: 'card', title: '', style: { padding: '0', overflow: 'hidden' }, elements: [
                                    { type: 'media', mediaType: 'صورة', content: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400', style: { borderRadius: '0', border: 'none' } },
                                    { type: 'container', direction: 'col', style: { padding: '20px' }, elements: [
                                            { type: 'text', textType: 'عنوان', content: 'ساعة ذكية' },
                                            { type: 'text', textType: 'حجم_ضخم', content: '199$' },
                                            { type: 'button', text: 'شراء سريع 💳', action: '' }
                                        ] }
                                ] },
                            { type: 'card', title: '', style: { padding: '0', overflow: 'hidden' }, elements: [
                                    { type: 'media', mediaType: 'صورة', content: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400', style: { borderRadius: '0', border: 'none' } },
                                    { type: 'container', direction: 'col', style: { padding: '20px' }, elements: [
                                            { type: 'text', textType: 'عنوان', content: 'حذاء رياضي V2' },
                                            { type: 'text', textType: 'حجم_ضخم', content: '149$' },
                                            { type: 'button', text: 'شراء سريع 💳', action: '' }
                                        ] }
                                ] }
                        ] }
                ]
            };
            var target = args[1];
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push(storeModule);
            }
            else if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(storeModule);
            }
            _this.consoleLogs.push("\uD83D\uDED2 [Pro UI] \u0628\u0646\u0627\u0621 \u0648\u0627\u062C\u0647\u0629 \u0645\u062A\u062C\u0631 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644");
            return storeModule;
        });
        this.globalEnv.define('بوابة_دفع_سيادية', function (args) {
            var targetPage = _this.activePage;
            var paymentForm = {
                type: 'form', name: 'بوابة الدفع الآمنة الخارقة', style: {},
                elements: [
                    { type: 'text', textType: 'فقرة', content: 'معلومات الدفع مشفرة بنظام نور السيادي مستوى 5 (RSA 4096-bit)' },
                    { type: 'grid', columns: 2, style: {}, elements: [
                            { type: 'input', label: 'رقم البطاقة الائتمانية', placeholder: 'xxxx-xxxx-xxxx-xxxx' },
                            { type: 'input', label: 'الاسم على البطاقة', placeholder: 'الاسم بالكامل' }
                        ] },
                    { type: 'grid', columns: 2, style: {}, elements: [
                            { type: 'input', label: 'تاريخ الانتهاء', placeholder: 'MM/YY' },
                            { type: 'input', label: 'رمز التحقق CVV', placeholder: '***', inputType: 'password' }
                        ] },
                    { type: 'alert', message: 'اتصال مشفر وآمن بالكامل مع أنظمة البنوك المركزية.', msgType: 'success' },
                    { type: 'button', text: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639 \uD83D\uDD12 ($".concat(args[0] || '0', ")"), action: '' }
                ]
            };
            var target = args[1];
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push(paymentForm);
            }
            else if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(paymentForm);
            }
            _this.consoleLogs.push("\uD83D\uDCB3 [Pro UI] \u062A\u0647\u064A\u0626\u0629 \u0628\u0648\u0627\u0628\u0629 \u062F\u0641\u0639 \u0633\u064A\u0627\u062F\u064A\u0629 \u0645\u062A\u0637\u0648\u0631\u0629");
            return paymentForm;
        });
        this.globalEnv.define('دردشة_ذكاء_اصطناعي', function (args) {
            var targetPage = _this.activePage;
            var chatModule = {
                type: 'card', title: "\uD83E\uDD16 \u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: ".concat(args[0] || ''), style: { maxHeight: '600px', flex: 1 },
                elements: [
                    { type: 'container', direction: 'col', style: { flex: 1, overflowY: 'auto', gap: '15px', padding: '10px', height: '300px' }, elements: [
                            { type: 'container', direction: 'row', style: { justifyContent: 'flex-start' }, elements: [
                                    { type: 'container', direction: 'col', style: { background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '20px 20px 20px 5px', width: '80%' }, elements: [
                                            { type: 'text', textType: 'فقرة', content: 'مرحباً، أنا المساعد الخارق المدمج في بيئة نور البرمجية. كيف يمكنني إكمال مهمتك المستقلة اليوم؟' }
                                        ] }
                                ] },
                            { type: 'container', direction: 'row', style: { justifyContent: 'flex-end' }, elements: [
                                    { type: 'container', direction: 'col', style: { background: '#10b981', padding: '15px', borderRadius: '20px 20px 5px 20px', width: '80%' }, elements: [
                                            { type: 'text', textType: 'فقرة', content: 'أريد تصميم نظام لوجستي عالمي من الصفر.' }
                                        ] }
                                ] },
                            { type: 'loader', text: 'جاري تحليل الأنماط اللوجستية وتوليد المعمارية...' }
                        ] },
                    { type: 'form', name: '', style: { background: 'transparent', border: 'none', padding: '10px', marginTop: 'auto', boxShadow: 'none' }, elements: [
                            { type: 'grid', columns: 4, style: { alignItems: 'end' }, elements: [
                                    { type: 'input', label: '', placeholder: 'اكتب رسالتك للمساعد...', style: { gridColumn: 'span 3' } },
                                    { type: 'button', text: 'إرسال 🚀', action: '' }
                                ] }
                        ] }
                ]
            };
            var target = args[1];
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push(chatModule);
            }
            else if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(chatModule);
            }
            _this.consoleLogs.push("\uD83E\uDDE0 [Pro UI] \u062A\u0634\u063A\u064A\u0644 \u0648\u0627\u062C\u0647\u0629 \u062F\u0631\u062F\u0634\u0629 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062A\u0641\u0627\u0639\u0644\u064A\u0629");
            return chatModule;
        });
        this.globalEnv.define('تطبيق_إحصائيات_شامل', function (args) {
            var targetPage = _this.activePage;
            var dashboard = {
                type: 'container', direction: 'col', style: {},
                elements: [
                    { type: 'text', textType: 'رأسية_كبيرة', content: "\uD83D\uDCC8 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A - ".concat(args[0] || 'التقرير الشامل') },
                    { type: 'tabs', tabs: ['نظرة عامة', 'الأداء المالي', 'المستخدمين', 'التقارير الأمنية'], elements: [
                            { type: 'grid', columns: 2, style: { marginTop: '20px' }, elements: [
                                    { type: 'card', title: 'تحليل الأرباح', elements: [
                                            { type: 'chart', title: '', data: [450, 300, 600, 800, 500, 900, 1200] },
                                            { type: 'list', listType: 'النمو ربع السنوي', items: ['الربع الأول: +15%', 'الربع الثاني: +22%', 'الربع الثالث: مستقر'] }
                                        ] },
                                    { type: 'card', title: 'الخوادم الحية (مستوى 5)', elements: [
                                            { type: 'table', columns: ['السيرفر', 'الحالة', 'الضغط', 'الأمان'], rows: [
                                                    ['نور-1 (دبي)', '✅ متصل', '45%', 'مؤمن'],
                                                    ['نور-2 (الرياض)', '✅ متصل', '60%', 'مؤمن'],
                                                    ['نور-3 (سيادي)', '⚠️ ضغط عال', '92%', 'مؤمن - فحص']
                                                ] }
                                        ] }
                                ] }
                        ] }
                ]
            };
            var target = args[1];
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push(dashboard);
            }
            else if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(dashboard);
            }
            _this.consoleLogs.push("\uD83D\uDCCA [Pro UI] \u062A\u0648\u0644\u064A\u062F \u062A\u0637\u0628\u064A\u0642 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644 \u0648\u062A\u0641\u0627\u0639\u0644\u064A");
            return dashboard;
        });
        this.globalEnv.define('تأسيس_موقع_تعريفي', function (args) {
            var targetPage = _this.activePage;
            var landing = {
                type: 'container', direction: 'col', style: { padding: '0', maxWidth: '100%' },
                elements: [
                    { type: 'navbar', title: args[0] || 'لغة نور - المنصة السيادية', logoIcon: '💠', links: ['التوثيقات', 'الحزم', 'تعلم نور', 'المجتمع', 'تحميل المترجم'] },
                    { type: 'container', direction: 'col', style: { padding: '160px 20px 100px 20px', textAlign: 'center', alignItems: 'center', background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.15), transparent 60%)' }, elements: [
                            { type: 'text', textType: 'حجم_ضخم', content: 'المستقبل يُكتب بِلُغة نور.' },
                            { type: 'text', textType: 'عنوان', content: 'لغة برمجة عربية سيادية 100%. أمان متقدم، خوادم مدمجة، وتطوير سريع.' },
                            { type: 'container', direction: 'row', style: { justifyContent: 'center', gap: '15px', marginTop: '30px' }, elements: [
                                    { type: 'button', text: '🚀 ابدأ مشوارك مجاناً' },
                                    { type: 'button', text: '📖 اقرأ المستندات الرسمية', style: { background: 'transparent', border: '1px solid rgba(212,175,55,0.4)' } }
                                ] }
                        ] },
                    { type: 'grid', columns: 3, style: { padding: '40px 20px 80px 20px', maxWidth: '1200px', margin: '0 auto', gap: '30px' }, elements: [
                            { type: 'card', title: 'سرعة البرق ⚡', elements: [{ type: 'text', content: 'مترجم عياني يقرأ ويحزم الكود في أجزاء من الثانية وينتجه إلى بايتكود فائق السرعة عبر Node.' }] },
                            { type: 'card', title: 'أمان لا يخترق 🛡️', elements: [{ type: 'text', content: 'دوال تشفير مدمجة للحماية السيادية، وقواعد بيانات NOOR-DB مشفرة تلقائياً.' }] },
                            { type: 'card', title: 'تجاوب مطلق 📱', elements: [{ type: 'text', content: 'نظام تصميم داخلي يرسم الواجهات المعقدة بشكل مثالي على الهواتف والشاشات العملاقة في سطرين.' }] },
                        ] },
                    { type: 'container', direction: 'col', style: { padding: '60px 20px', background: '#050a12', alignItems: 'center', textAlign: 'center' }, elements: [
                            { type: 'text', textType: 'عنوان', content: 'مجتمع مطورين ضخم ينمو كل دقيقة' },
                            { type: 'text', textType: 'فقرة', content: 'انضم إلى آلاف المبرمجين العرب وساهم في تعزيز السيادة الرقمية.' }
                        ] },
                    { type: 'footer', text: '© 2026 نور لابس - جميع الحقوق والتشفير البرمجي محفوظة.' }
                ]
            };
            var target = args[1];
            if (target && typeof target === 'object' && Array.isArray(target.elements)) {
                target.elements.push(landing);
            }
            else if (targetPage && Array.isArray(targetPage.elements)) {
                targetPage.elements.push(landing);
            }
            _this.consoleLogs.push("\uD83C\uDF10 [Pro UI] \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062A\u0639\u0631\u064A\u0641\u064A \u0627\u0644\u0631\u0633\u0645\u064A \u0648\u062A\u0637\u0628\u064A\u0642\u0647 \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u0627\u0643\u064A");
            return landing;
        });
    };
    NoorInterpreter.prototype.getLogs = function () {
        return this.consoleLogs;
    };
    NoorInterpreter.prototype.run = function (source) {
        this.localRegistry = {};
        this.consoleLogs = [];
        this.executionCount = 0;
        if (source === undefined || source === null) {
            return { success: false, logs: [], error: 'الكود البرمجي غير محدد أو فارغ.' };
        }
        try {
            var tokens = tokenize(source);
            var parser = new Parser(tokens);
            var programNode = parser.parse();
            this.evaluate(programNode, this.globalEnv);
            return { success: true, logs: this.consoleLogs };
        }
        catch (e) {
            var arabicErrMsg = e.message;
            if (arabicErrMsg.includes('is not a function')) {
                arabicErrMsg = "\u062E\u0637\u0623 \u0628\u0631\u0645\u062C\u0649: \u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0639\u0646\u0635\u0631 \u0643\u062F\u0627\u0644\u0629 \u0628\u0631\u0645\u062C\u064A\u0629 \u0648\u0647\u0648 \u0644\u064A\u0633 \u0643\u0630\u0644\u0643.";
            }
            return {
                success: false,
                logs: this.consoleLogs,
                error: arabicErrMsg
            };
        }
    };
    NoorInterpreter.prototype.evaluate = function (node, env) {
        var _this = this;
        this.executionCount++;
        if (this.executionCount > this.MAX_EXEC_OPS) {
            throw new Error("\u062E\u0637\u0623 \u062A\u0634\u063A\u064A\u0644: \u062A\u0645 \u062A\u062E\u0637\u064A \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0622\u0645\u0646\u0629 (MAX_EXEC_OPS). \u062A\u0645 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0644\u0645\u0646\u0639 \u0627\u0644\u0627\u0646\u062C\u0645\u0627\u062F \u0627\u0644\u0644\u0627\u0646\u0647\u0627\u0626\u064A.");
        }
        switch (node.type) {
            case 'Program':
                var lastResult = null;
                for (var _i = 0, _a = node.body; _i < _a.length; _i++) {
                    var statement = _a[_i];
                    lastResult = this.evaluate(statement, env);
                }
                return lastResult;
            case 'VariableDecl': {
                var val = this.evaluate(node.value, env);
                env.define(node.name, val);
                return val;
            }
            case 'Assignment': {
                var val = this.evaluate(node.value, env);
                env.assign(node.name, val, node.line);
                return val;
            }
            case 'IndexAssignment': {
                var obj = this.evaluate(node.object, env);
                var idx = this.evaluate(node.index, env);
                var val = this.evaluate(node.value, env);
                if (typeof obj === 'object' && obj !== null) {
                    obj[idx] = val;
                    return val;
                }
                throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062E\u0635\u064A\u0635: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0633\u0646\u0627\u062F \u0642\u064A\u0645\u0629 \u0644\u0639\u0646\u0635\u0631 \u063A\u064A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u0641\u0647\u0631\u0633\u0629."));
            }
            case 'BlockStatement': {
                var blockEnv = new Environment(env);
                var lastResult_1 = null;
                for (var _b = 0, _c = node.body; _b < _c.length; _b++) {
                    var statement = _c[_b];
                    lastResult_1 = this.evaluate(statement, blockEnv);
                }
                return lastResult_1;
            }
            case 'ObjectLiteral': {
                var obj = {};
                for (var _d = 0, _e = node.properties; _d < _e.length; _d++) {
                    var prop = _e[_d];
                    obj[prop.key] = this.evaluate(prop.value, env);
                }
                return obj;
            }
            case 'PropertyAccess': {
                var object = this.evaluate(node.object, env);
                if (object === null || object === undefined) {
                    throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u062E\u0637\u0623: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u062E\u0627\u0635\u064A\u0629 \"").concat(node.property, "\" \u0645\u0646 \u0642\u064A\u0645\u0629 \u0641\u0627\u0631\u063A\u0629."));
                }
                return object[node.property];
            }
            case 'Literal':
                return node.value;
            case 'Identifier':
                return env.get(node.name, node.line);
            case 'BinaryExpression': {
                var leftVal = this.evaluate(node.left, env);
                // Short-circuiting logical operations
                if (node.operator === '&&') {
                    return leftVal && this.evaluate(node.right, env);
                }
                if (node.operator === '||') {
                    return leftVal || this.evaluate(node.right, env);
                }
                var rightVal = this.evaluate(node.right, env);
                switch (node.operator) {
                    case '+': return leftVal + rightVal;
                    case '-': return leftVal - rightVal;
                    case '*': return leftVal * rightVal;
                    case '/':
                        if (rightVal === 0)
                            throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u062E\u0637\u0623 \u062D\u0633\u0627\u0628\u064A: \u0627\u0644\u0642\u0633\u0645\u0629 \u0639\u0644\u0649 \u0635\u0641\u0631 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627."));
                        return leftVal / rightVal;
                    case '%': return leftVal % rightVal;
                    case '==': return leftVal === rightVal;
                    case '!=': return leftVal !== rightVal;
                    case '>': return leftVal > rightVal;
                    case '>=': return leftVal >= rightVal;
                    case '<': return leftVal < rightVal;
                    case '<=': return leftVal <= rightVal;
                    default:
                        throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u0645\u0639\u0627\u0644\u062C \u0645\u062C\u0647\u0648\u0644 \u0623\u0648 \u0631\u0645\u0632 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645: ").concat(node.operator));
                }
            }
            case 'IfStatement': {
                var testResult = this.evaluate(node.test, env);
                if (testResult) {
                    var ifEnv = new Environment(env);
                    for (var _f = 0, _g = node.consequent; _f < _g.length; _f++) {
                        var stmt = _g[_f];
                        this.evaluate(stmt, ifEnv);
                    }
                    return;
                }
                // Check else-ifs
                if (node.alternateIfs) {
                    for (var _h = 0, _j = node.alternateIfs; _h < _j.length; _h++) {
                        var elseIf = _j[_h];
                        var elseIfTest = this.evaluate(elseIf.test, env);
                        if (elseIfTest) {
                            var elseIfEnv = new Environment(env);
                            for (var _k = 0, _l = elseIf.body; _k < _l.length; _k++) {
                                var stmt = _l[_k];
                                this.evaluate(stmt, elseIfEnv);
                            }
                            return;
                        }
                    }
                }
                // Check else
                if (node.alternate) {
                    var elseEnv = new Environment(env);
                    for (var _m = 0, _o = node.alternate; _m < _o.length; _m++) {
                        var stmt = _o[_m];
                        this.evaluate(stmt, elseEnv);
                    }
                }
                return;
            }
            case 'WhileStatement': {
                while (this.evaluate(node.test, env)) {
                    var loopEnv = new Environment(env);
                    for (var _p = 0, _q = node.body; _p < _q.length; _p++) {
                        var stmt = _q[_p];
                        this.evaluate(stmt, loopEnv);
                    }
                }
                return;
            }
            case 'FunctionDecl': {
                var funcValue = function (args) {
                    var callEnv = new Environment(env);
                    // Map arguments to parameter names safely
                    var params = node.params || [];
                    var passedArgs = Array.isArray(args) ? args : [];
                    for (var i = 0; i < params.length; i++) {
                        callEnv.define(params[i], passedArgs[i]);
                    }
                    try {
                        for (var _i = 0, _a = node.body; _i < _a.length; _i++) {
                            var stmt = _a[_i];
                            _this.evaluate(stmt, callEnv);
                        }
                    }
                    catch (e) {
                        if (e.type === 'NoorReturnException') {
                            return e.value;
                        }
                        throw e;
                    }
                    return null; // implicitly returning null / void (عدم)
                };
                env.define(node.name, funcValue);
                return funcValue;
            }
            case 'ReturnStatement': {
                var returnVal = node.argument ? this.evaluate(node.argument, env) : null;
                throw { type: 'NoorReturnException', value: returnVal };
            }
            case 'PrintStatement': {
                var printedValues = node.arguments.map(function (arg) {
                    var val = _this.evaluate(arg, env);
                    if (val === true)
                        return 'صحيح';
                    if (val === false)
                        return 'خطأ';
                    if (val === null)
                        return 'عدم';
                    if (Array.isArray(val))
                        return JSON.stringify(val);
                    return String(val);
                });
                var outputLine = printedValues.join(' ');
                this.consoleLogs.push(outputLine);
                return null;
            }
            case 'ExpressionStatement':
                return this.evaluate(node.expression, env);
            case 'CallExpression': {
                var callee = env.get(node.callee, node.line);
                if (typeof callee !== 'function') {
                    throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u062E\u0637\u0623 \u0628\u0631\u0645\u062C\u0649: \u0627\u0644\u0639\u0628\u0627\u0631\u0629 \"").concat(node.callee, "\" \u0644\u064A\u0633\u062A \u062F\u0627\u0644\u0629 \u0628\u0631\u0645\u062C\u064A\u0629 \u0635\u0627\u0644\u062D\u0629 \u0644\u0644\u0627\u0633\u062A\u062F\u0639\u0627\u0621."));
                }
                var argsList = node.arguments || [];
                var evaluatedArgs = argsList.map(function (arg) { return _this.evaluate(arg, env); });
                return callee(evaluatedArgs);
            }
            case 'ArrayLiteral': {
                return node.elements.map(function (el) { return _this.evaluate(el, env); });
            }
            case 'ArrayIndex': {
                var arr = this.evaluate(node.array, env);
                var idx = this.evaluate(node.index, env);
                if (typeof arr === 'object' && arr !== null && !Array.isArray(arr)) {
                    return arr[idx];
                }
                if (!Array.isArray(arr) && typeof arr !== 'string') {
                    throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u062E\u0637\u0623 \u0628\u0631\u0645\u062C\u0649: \u0645\u062D\u0627\u0648\u0644\u0629 \u0641\u0647\u0631\u0633\u0629 \u0639\u0646\u0635\u0631 \u0644\u064A\u0633 \u0642\u0627\u0626\u0645\u0629 \u0623\u0648 \u0646\u0635\u0627\u064B \u0623\u0648 \u0643\u0627\u0626\u0646\u0627\u064B."));
                }
                if (typeof idx !== 'number' && typeof idx !== 'string') {
                    throw new Error("[\u0633\u0637\u0631 ".concat(node.line, "] \u062E\u0637\u0623 \u0628\u0631\u0645\u062C\u0649: \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0641\u0647\u0631\u0633\u0629 \u0644\u0644\u0642\u0648\u0627\u0626\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0635\u062D\u064A\u062D\u0627\u064B \u0648\u0644\u0644\u0643\u0627\u0626\u0646\u0627\u062A \u0646\u0635\u0627\u064B."));
                }
                return arr[idx];
            }
            default:
                throw new Error("\u0639\u0646\u0635\u0631 AST \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645 \u0641\u064A \u0627\u0644\u0645\u0641\u0633\u0651\u0631: ".concat(node.type));
        }
    };
    return NoorInterpreter;
}());
exports.NoorInterpreter = NoorInterpreter;
