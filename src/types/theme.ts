export interface ThemeVars {
  cyan?: string;
  blue?: string;
  green?: string;
  red?: string;
  yellow?: string;
  gray?: string;
  dimGray?: string;
  darkGray?: string;
  accent?: string;
  selectedBg?: string;
  userMsgBg?: string;
  toolPendingBg?: string;
  toolSuccessBg?: string;
  toolErrorBg?: string;
  customMsgBg?: string;
}

export interface ThemeExport {
  pageBg: string;
  cardBg: string;
  infoBg: string;
}

export interface ThemeColors {
  accent: string;
  border: string;
  borderAccent: string;
  borderMuted: string;
  success: string;
  error: string;
  warning: string;
  muted: string;
  dim: string;
  text: string;
  thinkingText: string;

  selectedBg: string;
  userMessageBg: string;
  userMessageText: string;
  customMessageBg: string;
  customMessageText: string;
  customMessageLabel: string;
  toolPendingBg: string;
  toolSuccessBg: string;
  toolErrorBg: string;
  toolTitle: string;
  toolOutput: string;

  mdHeading: string;
  mdLink: string;
  mdLinkUrl: string;
  mdCode: string;
  mdCodeBlock: string;
  mdCodeBlockBorder: string;
  mdQuote: string;
  mdQuoteBorder: string;
  mdHr: string;
  mdListBullet: string;

  toolDiffAdded: string;
  toolDiffRemoved: string;
  toolDiffContext: string;

  syntaxComment: string;
  syntaxKeyword: string;
  syntaxFunction: string;
  syntaxVariable: string;
  syntaxString: string;
  syntaxNumber: string;
  syntaxType: string;
  syntaxOperator: string;
  syntaxPunctuation: string;

  thinkingOff: string;
  thinkingMinimal: string;
  thinkingLow: string;
  thinkingMedium: string;
  thinkingHigh: string;
  thinkingXhigh: string;

  bashMode: string;
}

export interface Theme {
  $schema: string;
  name: string;
  vars?: Record<string, string>;
  colors: ThemeColors;
  export?: ThemeExport;
}

export const DEFAULT_THEME_NAME = 'custom-theme';
export const THEME_SCHEMA_URL = 'https://raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json';
