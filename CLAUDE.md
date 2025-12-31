# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 모든 대화를 할때는 `GLOBAL-`접두어가 붙은 문서의 컨텍스트는 항상 읽어두어야함

## 언어 규칙

- **대화**: 항상 한글로 응답
- **문서**: 모든 문서(md 파일 등)는 한글로 작성
- **코드**: 영어로 작성 (변수명, 함수명, 주석, docstring, 파일명 등)
- **커밋 메시지**: 영어로 작성

## 폴더 구조

- `design/` - 내부 설계 문서 (리서치, 아키텍처, DSL 설계 등)
- `docs/` - 사용자 문서 (가이드, API 레퍼런스, 튜토리얼)
- `scripts/` - 일회성 스크립트
- `playground/` - 웹 기반 다이어그램 에디터

## 문서 작성 규칙

- 설계 문서(`design/`): 파일명은 3자리 순서 번호로 시작 (예: `001-research.md`)
- 사용자 문서(`docs/`): 명확한 주제별 이름 사용 (예: `getting-started.md`, `api-reference.md`)
- 반드시 LLM이 전역적으로 확인해야하는 문서는 `GLOBAL-`이라는 접두어를 붙임.

## 다이어그램 규칙

설계 문서에는 **흐름도/아키텍처 다이어그램**을 반드시 포함:

- **Mermaid** 또는 **PlantUML** 사용 (마크다운 코드블록으로 삽입)
- 복잡한 흐름은 다이어그램으로 먼저 표현 후 설명
- 다이어그램 종류:
  - `flowchart` / `graph`: 흐름도, 프로세스
  - `sequenceDiagram`: 모듈 간 상호작용
  - `classDiagram`: 클래스/모듈 구조
  - `erDiagram`: DB 스키마
  - `stateDiagram`: 상태 머신

**예시 (Mermaid)**:
```mermaid
flowchart LR
    A[Explorer] --> B[Strategy]
    B --> C[Crawler]
    C --> D[Raw Data]
    D --> E[Extractor]
    E --> F[Result]
```

**예시 (PlantUML)**:
```plantuml
@startuml
Explorer -> Strategy: 생성
Strategy -> Crawler: 전달
Crawler -> Extractor: Raw Data
Extractor -> Result: 추출
@enduml
```

## 커밋 메시지 규칙

커밋 메시지는 다음 형식을 따름 (git hook으로 자동 검증 및 변환):

**허용되는 형식**:
1. `[TYPE] 제목` - 자동으로 Conventional Commits로 변환됨
2. `type: 제목` - Conventional Commits (Release Please 호환)

```
[FEAT] 사용자 인증 기능 추가
→ 자동 변환: feat: 사용자 인증 기능 추가

- 불릿 포인트 (선택, 최대 4줄)
```

**허용되는 TYPE**:
| TYPE | 설명 |
|------|------|
| `FEAT`/`feat` | 새로운 기능 |
| `FIX`/`fix` | 버그 수정 |
| `DOCS`/`docs` | 문서 변경 |
| `STYLE`/`style` | 코드 포맷팅 |
| `REFACTOR`/`refactor` | 리팩토링 |
| `TEST`/`test` | 테스트 |
| `CHORE`/`chore` | 기타 작업 |
| `PERF`/`perf` | 성능 개선 |
| `CI`/`ci` | CI/CD |
| `BUILD`/`build` | 빌드 설정 |

**주의**:
- Claude 서명은 git hook에서 자동 제거됨
- `[TYPE]` 형식은 자동으로 `type:` 형식으로 변환되어 Release Please가 인식

## 개발 프로세스

### Git Workflow (Issue 기반)

모든 기능 개발 및 버그 수정은 다음 워크플로우를 따름:

```mermaid
flowchart LR
    A[Issue 생성] --> B[브랜치 생성]
    B --> C[개발]
    C --> D[PR 생성]
    D --> E[머지]
```

1. **Issue 생성** - GitHub Issue 생성 (기능 설명, 버그 리포트 등)
2. **브랜치 생성** - Issue 번호 기반 브랜치 생성
   ```bash
   git checkout -b feature/#123-add-new-feature
   git checkout -b fix/#124-fix-login-bug
   ```
3. **개발** - 기능 구현 및 커밋
4. **PR 생성** - Pull Request 생성 (Issue 번호 연결)
5. **머지** - 리뷰 후 main 브랜치에 머지

**브랜치 네이밍 규칙**:
| 접두어 | 용도 |
|--------|------|
| `feature/#N-` | 새 기능 |
| `fix/#N-` | 버그 수정 |
| `refactor/#N-` | 리팩토링 |
| `docs/#N-` | 문서 |

### 기능 개발 순서

기능 개발 시 다음 순서를 따름:

1. **UI 설계** - 화면 구성, 컴포넌트 구조, 사용자 흐름 설계
2. **UI 구현** - 프론트엔드 코드 작성 (목업/스텁 데이터 사용 가능)
3. **서버 기능 개발** - UI에서 필요로 하는 API/백엔드 로직 구현

이 순서를 통해 사용자 경험을 먼저 검증하고, 실제 필요한 서버 기능만 개발할 수 있음.

## 의사결정 규칙

- **시스템적 의사결정**(아키텍처, 모듈 구조, 기술 선택 등)은 반드시 사용자와 질의응답을 통해 결정
- **한 번의 대화에 하나의 질문만** 던져서 명확한 답변을 받은 후 다음 질문으로 진행
- 의사결정 결과는 `design/` 폴더에 문서로 기록

