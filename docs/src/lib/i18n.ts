export type Locale = 'en' | 'ko';

export const translations = {
  en: {
    nav: {
      features: 'Features',
      demo: 'Demo',
      docs: 'Docs',
      github: 'GitHub',
    },
    hero: {
      badge: 'AI-Powered Development',
      title: 'Build apps with',
      titleHighlight: 'natural language',
      description: 'Describe what you want in plain English. Claude writes the code, runs it, and shows you the result in real-time.',
      cta: 'Get Started',
      ctaSecondary: 'View Demo',
      install: 'npx claudeship',
    },
    features: {
      title: 'Everything you need',
      subtitle: 'to build faster',
      items: [
        {
          title: 'Natural Language',
          description: 'Just describe what you want. No syntax to remember, no boilerplate to write.',
        },
        {
          title: 'Live Preview',
          description: 'See your app update in real-time as Claude writes the code.',
        },
        {
          title: 'Full-Stack',
          description: 'Frontend with Next.js, backend with Express or FastAPI. Your choice.',
        },
        {
          title: 'Ask & Build Modes',
          description: 'Ask questions about your code or let Claude make changes.',
        },
        {
          title: 'File Explorer',
          description: 'Browse and view all generated files with syntax highlighting.',
        },
        {
          title: 'Multi-Project',
          description: 'Manage up to 99 projects with automatic port allocation.',
        },
      ],
    },
    demo: {
      title: 'See it in action',
      subtitle: 'Type a prompt and watch Claude build your app',
      placeholder: 'Create a todo app with dark mode...',
      send: 'Send',
      thinking: 'Claude is thinking...',
      typing: 'Claude is typing...',
    },
    install: {
      title: 'Ready to start?',
      subtitle: 'One command to install and run',
      copy: 'Copy',
      copied: 'Copied!',
      requirements: 'Requires Node.js 20+, pnpm, and Claude Code CLI',
    },
    footer: {
      built: 'Built with Claude Code',
      links: {
        docs: 'Documentation',
        github: 'GitHub',
        npm: 'npm',
      },
    },
  },
  ko: {
    nav: {
      features: '기능',
      demo: '데모',
      docs: '문서',
      github: 'GitHub',
    },
    hero: {
      badge: 'AI 기반 개발',
      title: '자연어로',
      titleHighlight: '앱을 만드세요',
      description: '원하는 것을 설명하세요. Claude가 코드를 작성하고, 실행하고, 결과를 실시간으로 보여줍니다.',
      cta: '시작하기',
      ctaSecondary: '데모 보기',
      install: 'npx claudeship',
    },
    features: {
      title: '더 빠르게 개발하는',
      subtitle: '모든 것',
      items: [
        {
          title: '자연어 입력',
          description: '원하는 것만 설명하세요. 문법을 외울 필요 없습니다.',
        },
        {
          title: '실시간 프리뷰',
          description: 'Claude가 코드를 작성하는 동안 실시간으로 결과를 확인하세요.',
        },
        {
          title: '풀스택 지원',
          description: 'Next.js 프론트엔드, Express 또는 FastAPI 백엔드.',
        },
        {
          title: 'Ask & Build 모드',
          description: '코드에 대해 질문하거나 변경을 요청하세요.',
        },
        {
          title: '파일 탐색기',
          description: '생성된 모든 파일을 구문 강조와 함께 탐색하세요.',
        },
        {
          title: '멀티 프로젝트',
          description: '자동 포트 할당으로 최대 99개 프로젝트를 관리하세요.',
        },
      ],
    },
    demo: {
      title: '직접 체험해보세요',
      subtitle: '프롬프트를 입력하고 Claude가 앱을 만드는 것을 보세요',
      placeholder: '다크 모드가 있는 할 일 앱을 만들어줘...',
      send: '전송',
      thinking: 'Claude가 생각 중...',
      typing: 'Claude가 입력 중...',
    },
    install: {
      title: '시작할 준비가 되셨나요?',
      subtitle: '한 줄 명령어로 설치하고 실행하세요',
      copy: '복사',
      copied: '복사됨!',
      requirements: 'Node.js 20+, pnpm, Claude Code CLI 필요',
    },
    footer: {
      built: 'Claude Code로 제작',
      links: {
        docs: '문서',
        github: 'GitHub',
        npm: 'npm',
      },
    },
  },
} as const;

export function getTranslations(locale: Locale) {
  return translations[locale];
}
