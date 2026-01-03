import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
}

export interface TableData {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private projectService: ProjectService) {}

  /**
   * Find SQLite database file in project
   */
  private async findDatabasePath(projectId: string): Promise<string | null> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    // Common SQLite database locations
    const possiblePaths = [
      path.join(projectPath, "prisma", "dev.db"),
      path.join(projectPath, "dev.db"),
      path.join(projectPath, "database.db"),
      path.join(projectPath, "data.db"),
      path.join(projectPath, "backend", "prisma", "dev.db"),
      path.join(projectPath, "backend", "dev.db"),
    ];

    for (const dbPath of possiblePaths) {
      if (fs.existsSync(dbPath)) {
        return dbPath;
      }
    }

    return null;
  }

  /**
   * Execute SQLite query
   */
  private executeSqlite(dbPath: string, query: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("sqlite3", ["-json", "-header", dbPath, query], {
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `sqlite3 exited with code ${code}`));
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get list of tables in the database
   */
  async getTables(projectId: string): Promise<TableInfo[]> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    try {
      // Get table names
      const tablesQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';`;
      const result = await this.executeSqlite(dbPath, tablesQuery);

      if (!result.trim()) {
        return [];
      }

      const tables = JSON.parse(result) as { name: string }[];

      // Get row counts for each table
      const tableInfos: TableInfo[] = [];
      for (const table of tables) {
        try {
          const countResult = await this.executeSqlite(
            dbPath,
            `SELECT COUNT(*) as count FROM "${table.name}";`
          );
          const countData = JSON.parse(countResult) as { count: number }[];
          tableInfos.push({
            name: table.name,
            rowCount: countData[0]?.count || 0,
          });
        } catch {
          tableInfos.push({ name: table.name, rowCount: 0 });
        }
      }

      return tableInfos;
    } catch (error) {
      this.logger.error(`Failed to get tables: ${error}`);
      throw new BadRequestException("Failed to read database");
    }
  }

  /**
   * Get table schema
   */
  async getTableSchema(projectId: string, tableName: string): Promise<ColumnInfo[]> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    try {
      const result = await this.executeSqlite(dbPath, `PRAGMA table_info("${tableName}");`);

      if (!result.trim()) {
        return [];
      }

      const columns = JSON.parse(result) as {
        cid: number;
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }[];

      return columns.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        primaryKey: col.pk === 1,
      }));
    } catch (error) {
      this.logger.error(`Failed to get table schema: ${error}`);
      throw new BadRequestException("Failed to read table schema");
    }
  }

  /**
   * Get table data with pagination
   */
  async getTableData(
    projectId: string,
    tableName: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<TableData> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    const offset = (page - 1) * pageSize;

    try {
      // Get columns
      const columns = await this.getTableSchema(projectId, tableName);

      // Get total count
      const countResult = await this.executeSqlite(
        dbPath,
        `SELECT COUNT(*) as count FROM "${tableName}";`
      );
      const total = JSON.parse(countResult)[0]?.count || 0;

      // Get rows
      const dataResult = await this.executeSqlite(
        dbPath,
        `SELECT * FROM "${tableName}" LIMIT ${pageSize} OFFSET ${offset};`
      );

      let rows: Record<string, unknown>[] = [];
      if (dataResult.trim()) {
        rows = JSON.parse(dataResult);
      }

      return {
        columns,
        rows,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error(`Failed to get table data: ${error}`);
      throw new BadRequestException("Failed to read table data");
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeQuery(projectId: string, query: string): Promise<Record<string, unknown>[]> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    // Basic SQL injection prevention
    const normalizedQuery = query.trim().toUpperCase();
    if (
      normalizedQuery.includes("DROP TABLE") ||
      normalizedQuery.includes("DROP DATABASE") ||
      normalizedQuery.includes("TRUNCATE")
    ) {
      throw new BadRequestException("Destructive queries are not allowed");
    }

    try {
      const result = await this.executeSqlite(dbPath, query);
      if (!result.trim()) {
        return [];
      }
      return JSON.parse(result);
    } catch (error) {
      this.logger.error(`Query execution failed: ${error}`);
      throw new BadRequestException(`Query failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Insert a new row
   */
  async insertRow(
    projectId: string,
    tableName: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    const columns = Object.keys(data).join('", "');
    const values = Object.values(data)
      .map((v) => (typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v))
      .join(", ");

    const query = `INSERT INTO "${tableName}" ("${columns}") VALUES (${values});`;

    try {
      await this.executeSqlite(dbPath, query);
    } catch (error) {
      this.logger.error(`Insert failed: ${error}`);
      throw new BadRequestException("Failed to insert row");
    }
  }

  /**
   * Update a row
   */
  async updateRow(
    projectId: string,
    tableName: string,
    primaryKey: string,
    primaryKeyValue: unknown,
    data: Record<string, unknown>
  ): Promise<void> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    const setClause = Object.entries(data)
      .map(([key, value]) => {
        const formattedValue =
          typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : value;
        return `"${key}" = ${formattedValue}`;
      })
      .join(", ");

    const pkValue =
      typeof primaryKeyValue === "string"
        ? `'${primaryKeyValue.replace(/'/g, "''")}'`
        : primaryKeyValue;

    const query = `UPDATE "${tableName}" SET ${setClause} WHERE "${primaryKey}" = ${pkValue};`;

    try {
      await this.executeSqlite(dbPath, query);
    } catch (error) {
      this.logger.error(`Update failed: ${error}`);
      throw new BadRequestException("Failed to update row");
    }
  }

  /**
   * Delete a row
   */
  async deleteRow(
    projectId: string,
    tableName: string,
    primaryKey: string,
    primaryKeyValue: unknown
  ): Promise<void> {
    const dbPath = await this.findDatabasePath(projectId);
    if (!dbPath) {
      throw new NotFoundException("No SQLite database found in project");
    }

    const pkValue =
      typeof primaryKeyValue === "string"
        ? `'${primaryKeyValue.replace(/'/g, "''")}'`
        : primaryKeyValue;

    const query = `DELETE FROM "${tableName}" WHERE "${primaryKey}" = ${pkValue};`;

    try {
      await this.executeSqlite(dbPath, query);
    } catch (error) {
      this.logger.error(`Delete failed: ${error}`);
      throw new BadRequestException("Failed to delete row");
    }
  }
}
