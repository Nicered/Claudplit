import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectModule } from "./project/project.module";
import { ChatModule } from "./chat/chat.module";
import { PreviewModule } from "./preview/preview.module";
import { FileModule } from "./file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProjectModule,
    ChatModule,
    PreviewModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
