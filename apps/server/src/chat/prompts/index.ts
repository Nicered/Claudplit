/**
 * System Prompt Selector
 *
 * 프로젝트 타입과 백엔드 프레임워크에 따라 적절한 시스템 프롬프트 반환
 */

import { ProjectType, BackendFramework } from "@prisma/client";
import { WEB_SYSTEM_PROMPT } from "./web-system-prompt";
import { FULLSTACK_EXPRESS_PROMPT } from "./fullstack-express-prompt";
import { FULLSTACK_FASTAPI_PROMPT } from "./fullstack-fastapi-prompt";

export function getSystemPrompt(
  projectType: ProjectType,
  backendFramework: BackendFramework
): string {
  if (projectType === ProjectType.WEB) {
    switch (backendFramework) {
      case BackendFramework.EXPRESS:
        return FULLSTACK_EXPRESS_PROMPT;
      case BackendFramework.FASTAPI:
        return FULLSTACK_FASTAPI_PROMPT;
      case BackendFramework.NONE:
      default:
        return WEB_SYSTEM_PROMPT;
    }
  }

  // NATIVE 타입은 추후 구현 (현재는 WEB 프롬프트 사용)
  return WEB_SYSTEM_PROMPT;
}

export { WEB_SYSTEM_PROMPT } from "./web-system-prompt";
export { FULLSTACK_EXPRESS_PROMPT } from "./fullstack-express-prompt";
export { FULLSTACK_FASTAPI_PROMPT } from "./fullstack-fastapi-prompt";
