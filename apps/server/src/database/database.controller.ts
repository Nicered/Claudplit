import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { DatabaseService } from "./database.service";

@Controller("projects/:projectId/database")
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get("tables")
  getTables(@Param("projectId") projectId: string) {
    return this.databaseService.getTables(projectId);
  }

  @Get("tables/:tableName/schema")
  getTableSchema(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string
  ) {
    return this.databaseService.getTableSchema(projectId, tableName);
  }

  @Get("tables/:tableName/data")
  getTableData(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.databaseService.getTableData(
      projectId,
      tableName,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 50
    );
  }

  @Post("query")
  executeQuery(
    @Param("projectId") projectId: string,
    @Body() body: { query: string }
  ) {
    return this.databaseService.executeQuery(projectId, body.query);
  }

  @Post("tables/:tableName/rows")
  insertRow(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Body() body: { data: Record<string, unknown> }
  ) {
    return this.databaseService.insertRow(projectId, tableName, body.data);
  }

  @Put("tables/:tableName/rows")
  updateRow(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Body()
    body: {
      primaryKey: string;
      primaryKeyValue: unknown;
      data: Record<string, unknown>;
    }
  ) {
    return this.databaseService.updateRow(
      projectId,
      tableName,
      body.primaryKey,
      body.primaryKeyValue,
      body.data
    );
  }

  @Delete("tables/:tableName/rows")
  deleteRow(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Body() body: { primaryKey: string; primaryKeyValue: unknown }
  ) {
    return this.databaseService.deleteRow(
      projectId,
      tableName,
      body.primaryKey,
      body.primaryKeyValue
    );
  }
}
