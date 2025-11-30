declare module 'sql.js' {
    export interface Database {
        run(sql: string, params?: any[] | Record<string, any>): void;
        exec(sql: string, params?: any[] | Record<string, any>): QueryExecResult[];
        close(): void;
        export(): Uint8Array;
    }

    export interface QueryExecResult {
        columns: string[];
        values: any[][];
    }

    export interface SqlJsConfig {
        locateFile?: (file: string) => string;
        wasmBinary?: Uint8Array;
    }

    export default function initSqlJs(config?: SqlJsConfig): Promise<{
        Database: new (data?: Uint8Array) => Database;
    }>;
}
