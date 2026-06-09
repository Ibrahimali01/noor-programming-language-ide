/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export type TokenType = 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'STRING' | 'OPERATOR' | 'PUNCTUATION' | 'EOF' | 'COMMENT';
export interface Token {
    type: TokenType;
    value: string;
    line: number;
}
export declare function tokenize(source: string): Token[];
export type ASTNode = {
    type: 'Program';
    body: ASTNode[];
} | {
    type: 'VariableDecl';
    name: string;
    value: ASTNode;
    line: number;
} | {
    type: 'Assignment';
    name: string;
    value: ASTNode;
    line: number;
} | {
    type: 'IndexAssignment';
    object: ASTNode;
    index: ASTNode;
    value: ASTNode;
    line: number;
} | {
    type: 'IfStatement';
    test: ASTNode;
    consequent: ASTNode[];
    alternate: ASTNode[] | null;
    alternateIfs?: {
        test: ASTNode;
        body: ASTNode[];
    }[];
    line: number;
} | {
    type: 'WhileStatement';
    test: ASTNode;
    body: ASTNode[];
    line: number;
} | {
    type: 'FunctionDecl';
    name: string;
    params: string[];
    body: ASTNode[];
    line: number;
} | {
    type: 'ReturnStatement';
    argument: ASTNode | null;
    line: number;
} | {
    type: 'PrintStatement';
    arguments: ASTNode[];
    line: number;
} | {
    type: 'ObjectLiteral';
    properties: {
        key: string;
        value: ASTNode;
    }[];
    line: number;
} | {
    type: 'BlockStatement';
    body: ASTNode[];
    line: number;
} | {
    type: 'ExpressionStatement';
    expression: ASTNode;
    line: number;
} | {
    type: 'BinaryExpression';
    operator: string;
    left: ASTNode;
    right: ASTNode;
    line: number;
} | {
    type: 'Literal';
    value: any;
    kind: 'string' | 'number' | 'boolean' | 'null';
    line: number;
} | {
    type: 'Identifier';
    name: string;
    line: number;
} | {
    type: 'CallExpression';
    callee: string;
    arguments: ASTNode[];
    line: number;
} | {
    type: 'PropertyAccess';
    object: ASTNode;
    property: string;
    line: number;
} | {
    type: 'ArrayLiteral';
    elements: ASTNode[];
    line: number;
} | {
    type: 'ArrayIndex';
    array: ASTNode;
    index: ASTNode;
    line: number;
};
export declare class Parser {
    private tokens;
    private current;
    constructor(tokens: Token[]);
    private peek;
    private previous;
    private isAtEnd;
    private advance;
    private check;
    private match;
    private consume;
    parse(): ASTNode;
    private synchronize;
    private statement;
    private blockStatement;
    private variableDeclaration;
    private ifStatement;
    private whileStatement;
    private functionDeclaration;
    private returnStatement;
    private printStatement;
    private expressionStatement;
    private expression;
    private assignment;
    private logicalOr;
    private logicalAnd;
    private equality;
    private comparison;
    private term;
    private factor;
    private unary;
    private call;
    private finishCall;
    private primary;
}
export declare class Environment {
    private values;
    private parent;
    constructor(parent?: Environment | null);
    define(name: string, value: any): void;
    get(name: string, line: number): any;
    assign(name: string, value: any, line: number): void;
    getAllValues(): Map<string, any>;
}
export interface ReturnException {
    type: 'NoorReturnException';
    value: any;
}
export declare function getNoorRequire(): any;
export declare class DatabaseConnection {
    private type;
    private connectionString;
    private fileHandle?;
    private socketClient?;
    private mockState;
    constructor(type: 'file' | 'socket', connectionString: string);
    executeQuery(query: string, logCallback: (msg: string) => void): any;
}
export declare const resolveColor: (colorStr: string) => string;
export declare const resolveBackground: (bgStr: string) => string;
export declare const STATIC_STDLIB: Record<string, string>;
export declare class NoorInterpreter {
    localRegistry: Record<number, any>;
    activePage: any;
    publishedWorldData: any;
    private globalEnv;
    private consoleLogs;
    private executionCount;
    private MAX_EXEC_OPS;
    constructor();
    private setup3DGlobals;
    private setupGlobals;
    getLogs(): string[];
    run(source: string): {
        success: boolean;
        logs: string[];
        error?: string;
    };
    private evaluate;
}
