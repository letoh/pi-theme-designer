<script lang="ts">
  import { onMount } from 'svelte';
  import type { Theme, ThemeColors } from '$types/theme';
  import { THEME_SCHEMA_URL } from '$types/theme';

  let themeName = $state('custom-theme');
  let theme = $state<Theme>({ name: 'custom-theme', colors: {} as ThemeColors, $schema: THEME_SCHEMA_URL });
  let fileInputRef: HTMLInputElement | null = null;

  const colorCategories = {
    'Core UI': ['accent', 'border', 'borderAccent', 'borderMuted', 'success', 'error', 'warning', 'muted', 'dim', 'text', 'thinkingText'],
    'Backgrounds & Content': ['selectedBg', 'userMessageBg', 'userMessageText', 'customMessageBg', 'customMessageText', 'customMessageLabel', 'toolPendingBg', 'toolSuccessBg', 'toolErrorBg', 'toolTitle', 'toolOutput'],
    'Markdown': ['mdHeading', 'mdLink', 'mdLinkUrl', 'mdCode', 'mdCodeBlock', 'mdCodeBlockBorder', 'mdQuote', 'mdQuoteBorder', 'mdHr', 'mdListBullet'],
    'Tool Diffs': ['toolDiffAdded', 'toolDiffRemoved', 'toolDiffContext'],
    'Syntax Highlighting': ['syntaxComment', 'syntaxKeyword', 'syntaxFunction', 'syntaxVariable', 'syntaxString', 'syntaxNumber', 'syntaxType', 'syntaxOperator', 'syntaxPunctuation'],
    'Thinking Level Borders': ['thinkingOff', 'thinkingMinimal', 'thinkingLow', 'thinkingMedium', 'thinkingHigh', 'thinkingXhigh'],
    'Bash Mode': ['bashMode', 'muted']
  };

  let expandedCategories = $state<Record<string, boolean>>({});
  let expandedVars = $state(false);
  let newVarName = $state('');
  let newVarColor = $state('#808080');

  let presets = $state<string[]>([]);
  let selectedPreset = $state('dark');
  let previewColors = $state<Record<string, string>>({});
  let previewBackground = $state<'dark' | 'light'>('dark');

  function loadPreset(presetName: string) {
    selectedPreset = presetName;
    const url = `themes/${presetName}.json`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        theme = data;
        themeName = data.name || presetName;
        previewColors = {};
      });
  }

  function toggleVars() {
    expandedVars = !expandedVars;
  }

  function getColorValue(key: string, category?: string): string {
    if (category === 'Bash Mode' && key === 'muted') {
      return theme.colors['muted'] || '';
    }
    return theme.colors[key] || '';
  }

  function resolveColorValue(color: string): string {
    if (!color) return '';
    if (color.startsWith('#')) return color;
    return theme.vars?.[color] || '';
  }

  function getResolvedColorValue(colorKey: string, category?: string): string {
    const rawValue = getColorValue(colorKey, category);
    const resolved = resolveColorValue(rawValue);
    return resolved;
  }

  function setColorValue(key: string, value: string, category?: string) {
    theme.colors = { ...theme.colors, [key]: value };
    if (category === 'Bash Mode' && key === 'muted') {
      theme.colors = { ...theme.colors, ['muted']: value };
    }
  }

  function handlePreviewChange(e: Event, colorKey: string) {
    const target = e.target as HTMLInputElement;
    previewColors = { ...previewColors, [colorKey]: target.value };
  }

  function handleHexInputKeydown(e: KeyboardEvent, colorKey: string, category?: string) {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const value = target.value.trim();
      setColorValue(colorKey, value, category);
    }
  }

  function applyPreview(colorKey: string, category?: string) {
    const previewColor = previewColors[colorKey];
    if (previewColor) {
      setColorValue(colorKey, previewColor, category);
      previewColors = { ...previewColors };
      delete previewColors[colorKey];
    }
  }

  function resetPreview(colorKey: string) {
    previewColors = { ...previewColors };
    delete previewColors[colorKey];
  }

  function handleVarPreviewChange(varName: string, color: string) {
    previewColors = { ...previewColors, [`var:${varName}`]: color };
  }

  function handleVarHexInputKeydown(e: KeyboardEvent, varName: string) {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const value = target.value.trim();
      if (theme.vars) {
        theme.vars = { ...theme.vars, [varName]: value };
      }
    }
  }

  function applyVarPreview(varName: string) {
    const previewColor = previewColors[`var:${varName}`];
    if (previewColor && theme.vars) {
      theme.vars = { ...theme.vars, [varName]: previewColor };
      previewColors = { ...previewColors };
      delete previewColors[`var:${varName}`];
    }
  }

  function resetVarPreview(varName: string) {
    previewColors = { ...previewColors };
    delete previewColors[`var:${varName}`];
  }

  function handleExport() {
    theme.name = themeName;
    const exportColors = { ...theme.colors };
    const exportTheme = { ...theme, colors: exportColors };
    const exportData = JSON.stringify(exportTheme, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${themeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    themeName = target.value;
  }

  function handleFileUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedTheme: Theme = JSON.parse(event.target?.result as string);
          
          if (loadedTheme.colors) {
            themeName = loadedTheme.name || 'imported-theme';
            theme = {
              name: loadedTheme.name || 'imported-theme',
              $schema: loadedTheme.$schema || THEME_SCHEMA_URL,
              colors: { ...loadedTheme.colors },
              vars: loadedTheme.vars || {}
            };
            previewColors = {};
          }
        } catch (err) {
          alert('無效的 JSON 格式');
        }
      };
      reader.readAsText(file);
    }
  }

  function resetFileInput() {
    if (fileInputRef) {
      fileInputRef.value = '';
    }
  }

  function getCategoryColors(category: string): string[] {
    return colorCategories[category as keyof typeof colorCategories];
  }

  function toggleCategory(category: string) {
    expandedCategories = { ...expandedCategories, [category]: !expandedCategories[category] };
  }

  function isCategoryExpanded(category: string): boolean {
    return expandedCategories[category] ?? false;
  }

  function getColorPreview(color: string): string {
    const resolved = resolveColorValue(color);
    if (!resolved) return '#808080';
    return resolved;
  }

  function getBorderColor(color: string): string {
    const resolved = resolveColorValue(color);
    const preview = getColorPreview(resolved || color);
    return preview === '#808080' ? '#4a4a5a' : preview;
  }

  function renderColorPreview(color: string): string {
    const preview = getColorPreview(color);
    return preview === '#808080' ? 'linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%)' : preview;
  }

  function renderColorPreviewWithGradient(color: string): string {
    const resolved = resolveColorValue(color);
    if (!resolved) {
      return 'repeating-linear-gradient(-45deg, #606060, #606060 2px, #404040 2px, #404040 4px)';
    }
    if (resolved === '#808080') {
      return 'linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%)';
    }
    return resolved;
  }

  function isEmptyValue(color: string): boolean {
    return !color || color === '';
  }

  function renderEmptyPlaceholder(color: string): string {
    const resolved = resolveColorValue(color);
    if (!resolved) {
      return 'repeating-linear-gradient(-45deg, #606060, #606060 2px, #404040 2px, #404040 4px)';
    }
    return resolved;
  }

  function addVar() {
    if (newVarName && !theme.vars) {
      theme.vars = {};
    }
    if (newVarName && !theme.vars?.[newVarName]) {
      theme.vars = { ...theme.vars, [newVarName]: newVarColor };
      newVarName = '';
      newVarColor = '#808080';
    }
  }

  function removeVar(varName: string) {
    if (theme.vars?.[varName]) {
      theme.vars = { ...theme.vars };
      delete theme.vars[varName];
    }
    previewColors = { ...previewColors };
    delete previewColors[`var:${varName}`];
  }

  function updateVarColor(varName: string, color: string) {
    if (theme.vars?.[varName]) {
      theme.vars = { ...theme.vars, [varName]: color };
    }
  }

  function loadDefaultTheme() {
    fetch('themes/index.json')
      .then(res => res.json())
      .then(manifest => {
        presets = manifest.themes || ['dark', 'light'];
        selectedPreset = manifest.default || 'dark';
        loadPreset(selectedPreset);
      })
      .catch(() => {
        presets = ['dark', 'light'];
        selectedPreset = 'dark';
        loadPreset('dark');
      });
  }

  onMount(() => {
    theme = { name: themeName, colors: {} as ThemeColors, $schema: THEME_SCHEMA_URL };
    loadDefaultTheme();
  });

  $effect(() => {
    if (!Object.keys(expandedCategories).length) {
      expandedCategories = Object.fromEntries(
        Object.keys(colorCategories).map(cat => [cat, false])
      );
    }
  });

  function getCoreUIPreviewKeys(): string[] {
    return ['accent', 'border', 'success', 'error', 'muted', 'dim', 'text'];
  }

  function getBgPreviewKeys(): string[] {
    return ['selectedBg'];
  }

  function getMdPreviewKeys(): string[] {
    return ['mdHeading', 'mdLink', 'mdCode', 'mdQuote', 'mdHr'];
  }

  function getDiffPreviewKeys(): string[] {
    return ['toolDiffAdded', 'toolDiffRemoved', 'toolDiffContext'];
  }

  function getSyntaxPreviewKeys(): string[] {
    return ['syntaxKeyword', 'syntaxFunction', 'syntaxString', 'syntaxNumber'];
  }

  function getThinkingPreviewKeys(): string[] {
    return ['thinkingOff', 'thinkingMinimal', 'thinkingLow', 'thinkingMedium', 'thinkingHigh', 'thinkingXhigh'];
  }

  const colorPurposes: Record<string, string> = {
    accent: 'Primary accent (logo, selected items, cursor)',
    border: 'Normal borders',
    borderAccent: 'Highlighted borders',
    borderMuted: 'Subtle borders (editor)',
    success: 'Success states',
    error: 'Error states',
    warning: 'Warning states',
    muted: 'Secondary text',
    dim: 'Tertiary text',
    text: 'Default text (usually "")',
    thinkingText: 'Thinking block text',
    selectedBg: 'Selected line background',
    userMessageBg: 'User message background',
    userMessageText: 'User message text',
    customMessageBg: 'Extension message background',
    customMessageText: 'Extension message text',
    customMessageLabel: 'Extension message label',
    toolPendingBg: 'Tool box (pending)',
    toolSuccessBg: 'Tool box (success)',
    toolErrorBg: 'Tool box (error)',
    toolTitle: 'Tool title',
    toolOutput: 'Tool output text',
    mdHeading: 'Headings',
    mdLink: 'Link text',
    mdLinkUrl: 'Link URL',
    mdCode: 'Inline code',
    mdCodeBlock: 'Code block content',
    mdCodeBlockBorder: 'Code block fences',
    mdQuote: 'Blockquote text',
    mdQuoteBorder: 'Blockquote border',
    mdHr: 'Horizontal rule',
    mdListBullet: 'List bullets',
    toolDiffAdded: 'Added lines',
    toolDiffRemoved: 'Removed lines',
    toolDiffContext: 'Context lines',
    syntaxComment: 'Comments',
    syntaxKeyword: 'Keywords',
    syntaxFunction: 'Function names',
    syntaxVariable: 'Variables',
    syntaxString: 'Strings',
    syntaxNumber: 'Numbers',
    syntaxType: 'Types',
    syntaxOperator: 'Operators',
    syntaxPunctuation: 'Punctuation',
    thinkingOff: 'Thinking off',
    thinkingMinimal: 'Minimal thinking',
    thinkingLow: 'Low thinking',
    thinkingMedium: 'Medium thinking',
    thinkingHigh: 'High thinking',
    thinkingXhigh: 'Extra high thinking',
    bashMode: 'Editor border in bash mode (! prefix)'
  };

  function getPurpose(colorKey: string): string {
    return colorPurposes[colorKey] || '';
  }

  function getColorInfo(colorKey: string, label: string): string {
    const purpose = getPurpose(colorKey);
    const value = getResolvedColorValue(colorKey);
    return `${colorKey}: ${purpose} (${value || 'empty'})`;
  }

</script>

<svelte:head>
  <title>Pi Theme Designer</title>
</svelte:head>

<div class="terminal-container">
  <div class="terminal-header">
    <div class="terminal-title">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="title-text">Pi Theme Designer</span>
    </div>
  </div>

  <div class="terminal-body">
    <div class="top-row">
      <div class="input-section">
        <label for="theme-name" class="prompt">$</label>
        <input 
          type="text" 
          id="theme-name" 
          class="terminal-input"
          value={themeName}
          oninput={handleNameChange}
        />
      </div>

      <div class="preset-select">
        <select 
          id="preset-select"
          class="preset-dropdown"
          bind:value={selectedPreset}
          onchange={(e) => loadPreset((e.target as HTMLSelectElement).value)}
        >
          {#each presets as preset}
            <option value={preset}>{preset}.json</option>
          {/each}
        </select>
      </div>
      
      <button class="export-btn" onclick={() => fileInputRef?.click()}>
        import
      </button>
      
      <button class="bg-toggle" onclick={() => previewBackground = previewBackground === 'dark' ? 'light' : 'dark'}>
        {previewBackground === 'dark' ? '☀️' : '🌙'} bg
      </button>
      
      <button class="export-btn" onclick={handleExport}>
        export
      </button>
    </div>

    <div class="color-category">
      <div 
        class="category-title-wrapper"
        onclick={() => toggleVars()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && toggleVars()}
      >
        <h3 class="category-title">
          Vars 
          <span class="expand-icon">{expandedVars ? '▼' : '▶'}</span>
        </h3>
      </div>
      
      {#if expandedVars}
        {#each Object.keys(theme.vars || {}) as varName}
          <div class="color-item" style="border-color: {getBorderColor(theme.vars?.[varName] || '#808080')}">
            <span class="color-label">{varName}</span>
            
            <span 
              class="color-preview" 
              style="background: {renderColorPreviewWithGradient(resolveColorValue(theme.vars?.[varName]) || theme.vars?.[varName] || '')}"
              onclick={() => resetVarPreview(varName)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && resetVarPreview(varName)}
            ></span>
            
            <input 
              type="color" 
              class="color-picker"
              value={
                previewColors[`var:${varName}`] 
                  ? (resolveColorValue(previewColors[`var:${varName}`]) || '#000000')
                  : (theme.vars?.[varName] === '' 
                      ? '#000000' 
                      : (theme.vars?.[varName] || '#808080'))
              }
              oninput={(e) => handleVarPreviewChange(varName, (e.target as HTMLInputElement).value)}
            />
            
            <input 
              type="text" 
              class="hex-input"
              value={previewColors[`var:${varName}`] ?? theme.vars?.[varName] ?? ''}
              oninput={(e) => handleVarPreviewChange(varName, (e.target as HTMLInputElement).value)}
              onkeydown={(e) => handleVarHexInputKeydown(e, varName)}
            />
            
            {#if previewColors[`var:${varName}`] && previewColors[`var:${varName}`] !== theme.vars?.[varName]}
              <button class="update-btn" onclick={() => applyVarPreview(varName)}>✓</button>
            {/if}
            
            <button 
              class="remove-var-btn"
              onclick={() => removeVar(varName)}
            >
              ×
            </button>
          </div>
        {/each}
      {/if}
      
      <div class="add-var-form">
        <input 
          type="text" 
          class="var-name-input"
          placeholder="Var name"
          bind:value={newVarName}
        />
        
        <input 
          type="color" 
          class="color-picker"
          value={newVarColor}
          oninput={(e) => newVarColor = (e.target as HTMLInputElement).value}
        />
        
        <button class="add-var-btn" onclick={addVar}>
          Add Var
        </button>
      </div>
    </div>

    {#each Object.keys(colorCategories) as category}
      <div class="color-category dual-column">
        <div 
          class="category-title-wrapper"
          onclick={() => toggleCategory(category)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && toggleCategory(category)}
        >
          <h3 class="category-title">
            {category} 
            <span class="expand-icon">{isCategoryExpanded(category) ? '▼' : '▶'}</span>
          </h3>
        </div>
        
        {#if isCategoryExpanded(category)}
          <div class="category-content">
            <div class="preview-column">
              {#if category === 'Core UI'}
                {#each getCoreUIPreviewKeys() as colorKey}
                  {#if isEmptyValue(getColorValue(colorKey))}
                    <div class="preview-block placeholder">
                      <span class="preview-label">{colorKey}</span>
                      <span class="preview-empty">empty</span>
                    </div>
                  {:else}
                    <div class="preview-block" style="border-color: {getBorderColor(getColorValue(colorKey))}">
                      <span class="preview-label">{colorKey}</span>
                      <div class="preview-swatch" style="background: {renderEmptyPlaceholder(getColorValue(colorKey))}"></div>
                    </div>
                  {/if}
                {/each}
                <div class="preview-section-title">Warning</div>
                <div class="warning-preview" class:light={previewBackground === 'light'} style="--warning-color: {getColorPreview(theme.colors.warning)}">
                  <hr class="warning-hr" title={getColorInfo('warning', 'Warning line')} />
                  <span class="warning-subject" title={getColorInfo('warning', 'Warning subject')}>warning subject</span>
                  <span class="warning-content">content</span>
                  <hr class="warning-hr" title={getColorInfo('warning', 'Warning line')} />
                </div>
              {:else if category === 'Backgrounds & Content'}
                {@const userMsgBg = getColorPreview(theme.colors.userMessageBg)}
                {@const userMsgText = getColorPreview(theme.colors.userMessageText)}
                {#each getBgPreviewKeys() as colorKey}
                  {#if isEmptyValue(getColorValue(colorKey))}
                    <div class="preview-block placeholder">
                      <span class="preview-label">{colorKey}</span>
                      <span class="preview-empty">empty</span>
                    </div>
                  {:else}
                    <div class="preview-block" style="background: {renderEmptyPlaceholder(getColorValue(colorKey))}">
                      <span class="preview-label">{colorKey}</span>
                    </div>
                  {/if}
                {/each}
                <div class="preview-section-title">User Message</div>
                <div class="user-message-preview" style="--user-msg-bg: {userMsgBg}; --user-msg-text: {userMsgText}">
                  <span class="user-prompt" title={getColorInfo('userMessageText', 'User prompt')}>user prompt</span>
                </div>
                {@const customMsgBg = getColorPreview(theme.colors.customMessageBg)}
                {@const customMsgText = getColorPreview(theme.colors.customMessageText)}
                <div class="preview-section-title">Extension (Custom) Message</div>
                <div class="custom-message-preview" style="--custom-msg-bg: {customMsgBg}; --custom-msg-text: {customMsgText}">
                  <span class="custom-msg-text" title={getColorInfo('customMessageText', 'Custom message text')}>message</span>
                </div>
                {@const successBg = getColorPreview(theme.colors.toolSuccessBg)}
                {@const titleColor = getColorPreview(theme.colors.toolTitle)}
                {@const outputColor = getColorPreview(theme.colors.toolOutput)}
                <div class="preview-section-title">Tool Success</div>
                <div class="tool-success-preview" style="--success-bg: {successBg}; --title-color: {titleColor}; --output-color: {outputColor}">
                  <span class="cmd-line" title={getColorInfo('toolTitle', 'Command line')}>$ echo "pong!"</span>
                  <span class="output-line" title={getColorInfo('toolOutput', 'Output line')}>pong</span>
                </div>
                {@const errorBg = getColorPreview(theme.colors.toolErrorBg)}
                <div class="preview-section-title">Tool Error</div>
                <div class="tool-error-preview" style="--error-bg: {errorBg}">
                  <span class="tool-name" style="color: {getColorPreview(theme.colors.toolTitle)}" title={getColorInfo('toolTitle', 'Tool name')}>xxx</span>{'{'}
  ...
{'}'}
Tool xxx not found
                </div>
                {@const pendingBg = getColorPreview(theme.colors.toolPendingBg)}
                <div class="preview-section-title">Tool Pending</div>
                <div class="tool-pending-preview" style="--pending-bg: {pendingBg}">
                  <span class="tool-name" style="color: {getColorPreview(theme.colors.toolTitle)}" title={getColorInfo('toolTitle', 'Tool name')}>tool-name</span>
                </div>
              {:else if category === 'Markdown'}
                <div class="md-preview" class:light={previewBackground === 'light'}>
                  <h1 class="md-heading" style="color: {getColorPreview(theme.colors.mdHeading)}" title={getColorInfo('mdHeading', 'Heading')}>Heading 1</h1>
                  
                  <p class="md-text">
                    <a class="md-link" href="#!" style="color: {getColorPreview(theme.colors.mdLink)}" title={getColorInfo('mdLink', 'Link text')}>Link</a>
                    and <a class="md-link-url" href="#!" style="color: {getColorPreview(theme.colors.mdLinkUrl)}" title={getColorInfo('mdLinkUrl', 'Link URL')}>https://url.com</a>
                  </p>
                  
                  <p class="md-text">
                    Inline <code class="md-code" style="color: {getColorPreview(theme.colors.mdCode)}" title={getColorInfo('mdCode', 'Inline code')}>code</code> and code block:
                  </p>
                  
                  <pre class="md-code-block" style="color: {getColorPreview(theme.colors.mdCodeBlock)}; border-color: {getBorderColor(theme.colors.mdCodeBlockBorder)}" title="{getColorInfo('mdCodeBlock', 'Code block content')}; {getColorInfo('mdCodeBlockBorder', 'Code block border')}"><code>const x = 1;</code></pre>
                  
                  <blockquote class="md-quote" style="color: {getColorPreview(theme.colors.mdQuote)}; border-left-color: {getBorderColor(theme.colors.mdQuoteBorder)}" title="{getColorInfo('mdQuote', 'Blockquote text')}; {getColorInfo('mdQuoteBorder', 'Blockquote border')}">
                    <p>Blockquote text</p>
                    <p>continued</p>
                  </blockquote>
                  
                  <ul class="md-list" style="color: {getColorPreview(theme.colors.mdListBullet)}" title={getColorInfo('mdListBullet', 'List bullet')}>
                    <li>List item 1</li>
                    <li>List item 2</li>
                  </ul>
                  
                  <hr class="md-hr" style="border-color: {getBorderColor(theme.colors.mdHr)}" title={getColorInfo('mdHr', 'Horizontal rule')} />
                  
                  <p class="md-text">Horizontal rule</p>
                </div>
              {:else if category === 'Tool Diffs'}
                <div class="diff-preview" class:light={previewBackground === 'light'}>
                  <div class="diff-line diff-added" style="color: {getColorPreview(theme.colors.toolDiffAdded)}" title={getColorInfo('toolDiffAdded', 'Added line')}>
                    <span class="diff-symbol">+</span>
                    <span>Added line</span>
                  </div>
                  <div class="diff-line diff-removed" style="color: {getColorPreview(theme.colors.toolDiffRemoved)}" title={getColorInfo('toolDiffRemoved', 'Removed line')}>
                    <span class="diff-symbol">-</span>
                    <span>Removed line</span>
                  </div>
                  <div class="diff-line diff-context" style="color: {getColorPreview(theme.colors.toolDiffContext)}" title={getColorInfo('toolDiffContext', 'Context line')}>
                    <span class="diff-symbol"> </span>
                    <span>Context line</span>
                  </div>
                </div>
              {:else if category === 'Syntax Highlighting'}
                <div class="syntax-preview" class:light={previewBackground === 'light'}>
                  <pre class="syntax-code"><code><span style="color: {getColorPreview(theme.colors.syntaxComment)}" title={getColorInfo('syntaxComment', 'Comment')}>// comment</span>
<span style="color: {getColorPreview(theme.colors.syntaxKeyword)}" title={getColorInfo('syntaxKeyword', 'Keyword')}>function</span> <span style="color: {getColorPreview(theme.colors.syntaxFunction)}" title={getColorInfo('syntaxFunction', 'Function')}>name</span>()<span style="color: {getColorPreview(theme.colors.syntaxOperator)}" title={getColorInfo('syntaxOperator', 'Operator')}>:</span> <span style="color: {getColorPreview(theme.colors.syntaxType)}" title={getColorInfo('syntaxType', 'Type')}>type</span> {'{'}
  <span style="color: {getColorPreview(theme.colors.syntaxKeyword)}" title={getColorInfo('syntaxKeyword', 'Keyword')}>const</span> <span style="color: {getColorPreview(theme.colors.syntaxVariable)}" title={getColorInfo('syntaxVariable', 'Variable')}>var</span><span style="color: {getColorPreview(theme.colors.syntaxOperator)}" title={getColorInfo('syntaxOperator', 'Operator')}>:</span> <span style="color: {getColorPreview(theme.colors.syntaxType)}" title={getColorInfo('syntaxType', 'Type')}>type</span> <span style="color: {getColorPreview(theme.colors.syntaxOperator)}" title={getColorInfo('syntaxOperator', 'Operator')}>=</span> <span style="color: {getColorPreview(theme.colors.syntaxNumber)}" title={getColorInfo('syntaxNumber', 'Number')}>42</span><span style="color: {getColorPreview(theme.colors.syntaxPunctuation)}" title={getColorInfo('syntaxPunctuation', 'Punctuation')}>;</span>
  <span style="color: {getColorPreview(theme.colors.syntaxKeyword)}" title={getColorInfo('syntaxKeyword', 'Keyword')}>return</span> <span style="color: {getColorPreview(theme.colors.syntaxString)}" title={getColorInfo('syntaxString', 'String')}>"string"</span><span style="color: {getColorPreview(theme.colors.syntaxPunctuation)}" title={getColorInfo('syntaxPunctuation', 'Punctuation')}>;</span>
{'}'}</code></pre>
                </div>
              {:else if category === 'Thinking Level Borders'}
                {#each getThinkingPreviewKeys() as colorKey}
                  {#if isEmptyValue(getColorValue(colorKey))}
                    <div class="preview-block placeholder">
                      <span class="preview-label">{colorKey}</span>
                      <span class="preview-empty">empty</span>
                    </div>
                  {:else}
                    <div class="preview-block thinking" style="border-color: {getColorPreview(getColorValue(colorKey))}">
                      <span class="preview-label">{colorKey}</span>
                    </div>
                  {/if}
                {/each}
              {:else if category === 'Bash Mode'}
                {@const bashColor = getColorPreview(getColorValue('bashMode'))}
                {@const mutedColor = getColorPreview(getColorValue('muted'))}
                {#if isEmptyValue(getColorValue('bashMode'))}
                  <div class="preview-block placeholder">
                    <span class="preview-label">bashMode</span>
                    <span class="preview-empty">empty</span>
                  </div>
                {:else}
                  <div class="bash-preview" class:light={previewBackground === 'light'} style="--bash-color: {bashColor}">
                    <hr title={getColorInfo('bashMode', 'Bash mode border')} />
                    <span class="cmd" title={getColorInfo('bashMode', 'Command')}>!ls</span>
                    <span class="output" style="color: {mutedColor}" title={getColorInfo('muted', 'Output')}>file1
file2</span>
                    <hr title={getColorInfo('bashMode', 'Bash mode border')} />
                  </div>
                {/if}
              {/if}
            </div>
            
            <div class="color-column">
              {#each getCategoryColors(category) as colorKey}
                <div class="color-item" style="border-color: {getBorderColor(getColorValue(colorKey, category))}">
                  <span class="color-label">{colorKey}</span>
                  
                  <span class="color-purpose">{getPurpose(colorKey)}</span>
                  
                  <span 
                    class="color-preview" 
                    style="background: {renderColorPreviewWithGradient(getColorValue(colorKey, category))}"
                    onclick={() => resetPreview(colorKey)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && resetPreview(colorKey)}
                  ></span>
                  
                  <input 
                    type="color" 
                    class="color-picker"
                    value={
                      previewColors[colorKey] 
                        ? (resolveColorValue(previewColors[colorKey]) || '#000000')
                        : (getColorValue(colorKey, category) === '' 
                            ? '#000000' 
                            : (resolveColorValue(getColorValue(colorKey, category)) || '#808080'))
                    }
                    oninput={(e) => handlePreviewChange(e, colorKey)}
                  />
                  
                  <input 
                    type="text" 
                    class="hex-input"
                    value={previewColors[colorKey] ?? getResolvedColorValue(colorKey, category) ?? ''}
                    oninput={(e) => handlePreviewChange(e, colorKey)}
                    onkeydown={(e) => handleHexInputKeydown(e, colorKey, category)}
                  />
                  
                  {#if previewColors[colorKey] && previewColors[colorKey] !== getColorValue(colorKey, category)}
                    <button class="update-btn" onclick={() => applyPreview(colorKey, category)}>✓</button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <input 
      type="file" 
      accept=".json" 
      style="display: none;"
      bind:this={fileInputRef}
      oninput={(e) => { handleFileUpload(e); resetFileInput(); }}
    />
  </div>
</div>

<style>
  .terminal-container {
    font-family: 'Fira Code', 'Courier New', monospace;
    background-color: #1a1a2e;
    color: #e6e6e6;
    padding: 20px;
    border-radius: 8px;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
  }

  .terminal-header {
    background-color: #16213e;
    padding: 10px 15px;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    border-bottom: 2px solid #0f3460;
  }

  .terminal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #e6e6e6;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .dot.red { background-color: #ff5f56; }
  .dot.yellow { background-color: #ffbd2e; }
  .dot.green { background-color: #27ca40; }

  .title-text {
    margin-left: 15px;
    font-weight: bold;
  }

  .terminal-body {
    padding: 20px;
    background-color: #1a1a2e;
    border-radius: 0 0 8px 8px;
  }

  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .input-section {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 200px;
    padding: 10px;
    background-color: #16213e;
    border-radius: 4px;
    border: 1px solid #0f3460;
  }

  .prompt {
    color: #5f87ff;
    font-weight: bold;
    margin-right: 10px;
    font-size: 16px;
  }

  .terminal-input {
    flex: 1;
    background-color: transparent;
    border: none;
    color: #e6e6e6;
    font-family: inherit;
    font-size: 14px;
    outline: none;
  }

  .preset-select {
    display: flex;
    align-items: center;
  }

  .preset-dropdown {
    background-color: #0f3460;
    color: #e6e6e6;
    border: 1px solid #5f87ff;
    padding: 12px 30px;
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .preset-dropdown:hover {
    background-color: #1a4a7a;
    border-color: #00d7ff;
  }

  .preset-dropdown:focus {
    outline: none;
    border-color: #00d7ff;
  }

  .export-btn {
    background-color: #0f3460;
    color: #e6e6e6;
    border: 1px solid #5f87ff;
    padding: 12px 30px;
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .export-btn:hover {
    background-color: #1a4a7a;
    border-color: #00d7ff;
  }

  .bg-toggle {
    background-color: #0f3460;
    color: #e6e6e6;
    border: 1px solid #5f87ff;
    padding: 12px 30px;
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .bg-toggle:hover {
    background-color: #1a4a7a;
    border-color: #00d7ff;
  }

  .color-category {
    background-color: #16213e;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #0f3460;
    margin-bottom: 20px;
  }

  .category-title-wrapper {
    cursor: pointer;
    user-select: none;
  }

  .category-title {
    color: #ffbd2e;
    font-size: 14px;
    margin-bottom: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #0f3460;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .category-title-wrapper:hover .category-title {
    color: #00d7ff;
  }

  .expand-icon {
    font-size: 12px;
    color: #5f87ff;
    transition: transform 0.2s ease;
  }

  .category-content {
    display: flex;
    gap: 20px;
    margin-top: 15px;
  }

  .preview-column {
    width: 40%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .color-column {
    width: 60%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .color-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px;
    background-color: #1a1a2e;
    border-radius: 4px;
    border-left: 3px solid #5f87ff;
    transition: all 0.2s ease;
  }

  .color-item:hover {
    background-color: #1f2a45;
    transform: translateX(5px);
  }

  .color-column .color-item {
    flex-wrap: wrap;
  }

    .color-column .color-label {
      width: auto;
      min-width: 40px;
    }

    .color-column .color-purpose {
      width: 100%;
      margin-left: 48px;
      margin-top: -14px;
      margin-bottom: 8px;
    }

  @media (min-width: 1024px) {
    .color-column .color-item {
      flex-wrap: nowrap;
    }
    
    .color-column .color-label {
      width: auto;
      min-width: 100px;
    }
  }

  .color-category:not(.dual-column) .color-label {
    min-width: 150px;
  }

  .color-label {
    font-size: 12px;
    color: #e6e6e6;
    min-width: 40px;
    font-family: inherit;
  }

  .color-purpose {
    font-size: 11px;
    color: #888;
    font-style: italic;
    flex: 1;
    min-width: 150px;
  }

  .color-picker {
    width: 40px;
    height: 30px;
    border: none;
    cursor: pointer;
    background-color: transparent;
    flex-shrink: 0;
  }

  .color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker::-webkit-color-swatch {
    border: 1px solid #0f3460;
    border-radius: 4px;
  }

  .color-preview {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    border: 1px solid #0f3460;
    flex-shrink: 0;
  }

  .hex-input {
    width: 80px;
    padding: 4px 8px;
    background-color: #1a1a2e;
    border: 1px solid #0f3460;
    color: #e6e6e6;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    border-radius: 4px;
    text-align: center;
    flex-shrink: 0;
  }

  .hex-input:focus {
    outline: none;
    border-color: #5f87ff;
  }

  .remove-var-btn {
    background-color: #ff5f56;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .remove-var-btn:hover {
    background-color: #ff3333;
  }

  .update-btn {
    background-color: #27ca40;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .update-btn:hover {
    background-color: #1fa832;
  }

  .add-var-form {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    padding: 10px;
    background-color: #1a1a2e;
    border-radius: 4px;
    flex-wrap: wrap;
  }

  .var-name-input {
    flex: 1;
    min-width: 120px;
    background-color: #1a1a2e;
    border: 1px solid #0f3460;
    color: #e6e6e6;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    padding: 8px;
    border-radius: 4px;
  }

  .var-name-input:focus {
    outline: none;
    border-color: #5f87ff;
  }

  .add-var-btn {
    background-color: #27ca40;
    color: white;
    border: none;
    padding: 8px 16px;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
  }

  .add-var-btn:hover {
    background-color: #1fa832;
  }

  .preview-block {
    padding: 10px;
    background-color: #1a1a2e;
    border-radius: 4px;
    border-left: 3px solid #5f87ff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .preview-block.placeholder {
    border-left-color: #606060;
    opacity: 0.6;
  }

  .preview-label {
    font-size: 11px;
    color: #aaa;
    min-width: 100px;
  }

  .preview-empty {
    font-size: 10px;
    color: #666;
    font-style: italic;
  }

  .preview-swatch {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid #0f3460;
    flex-shrink: 0;
  }

  .bash-preview {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 11px;
    gap: 2px;
    background-color: #1a1a2e;
  }

  .bash-preview.light {
    background-color: #f5f5f5;
  }

  .bash-preview hr {
    width: 100%;
    height: 2px;
    border: none;
    background: var(--bash-color);
    margin: 2px 0;
    flex-shrink: 0;
  }

  .bash-preview .cmd {
    color: var(--bash-color);
    padding: 2px 4px;
  }

  .bash-preview .output {
    padding: 2px 4px;
    white-space: pre;
  }

  .preview-block.thinking {
    padding: 8px;
    border-left-width: 4px;
  }

  .md-preview {
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    background-color: #1a1a2e;
  }

  .md-preview.light {
    background-color: #f5f5f5;
  }

  .md-heading {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 10px 0;
  }

  .md-text {
    margin: 8px 0;
    line-height: 1.6;
  }

  .md-link,
  .md-link-url {
    text-decoration: underline;
  }

  .md-code {
    font-family: 'Fira Code', monospace;
    font-size: 11px;
    padding: 2px 4px;
    background: rgba(95, 135, 255, 0.15);
    border-radius: 3px;
  }

  .md-code-block {
    font-family: 'Fira Code', monospace;
    font-size: 11px;
    padding: 10px;
    border-radius: 4px;
    border-left: 3px solid;
    margin: 10px 0;
    overflow-x: auto;
  }

  .md-quote {
    margin: 10px 0;
    padding: 8px 12px;
    border-left: 4px solid;
    border-radius: 0 4px 4px 0;
  }

  .md-quote p {
    margin: 4px 0;
  }

  .md-list {
    margin: 10px 0;
    padding-left: 20px;
  }

  .md-list li {
    margin: 4px 0;
  }

  .md-hr {
    border-top: 2px solid;
    margin: 15px 0;
  }

  .diff-preview {
    padding: 12px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    background-color: #1a1a2e;
  }

  .diff-preview.light {
    background-color: #f5f5f5;
  }

  .tool-success-preview {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: var(--success-bg);
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    gap: 2px;
  }

  .tool-success-preview .cmd-line {
    color: var(--title-color);
  }

  .tool-success-preview .output-line {
    color: var(--output-color);
  }

  .tool-error-preview {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background: var(--error-bg);
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    gap: 2px;
    white-space: pre;
  }

  .tool-error-preview .tool-name {
    font-weight: bold;
  }

  .warning-preview {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background-color: #1a1a2e;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    gap: 4px;
  }

  .warning-preview.light {
    background-color: #f5f5f5;
  }

  .warning-preview .warning-hr {
    border: none;
    border-top: 2px solid var(--warning-color);
    margin: 0;
  }

  .warning-preview .warning-subject {
    color: var(--warning-color);
    font-weight: bold;
  }

  .warning-preview .warning-content {
    color: #e6e6e6;
  }

  .tool-pending-preview {
    background: var(--pending-bg);
    padding: 12px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
  }

  .tool-pending-preview .tool-name {
    font-weight: bold;
  }

  .user-message-preview {
    background: var(--user-msg-bg);
    padding: 12px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
  }

  .user-message-preview .user-prompt {
    color: var(--user-msg-text);
  }

  .custom-message-preview {
    background: var(--custom-msg-bg);
    padding: 12px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
  }

  .custom-message-preview .custom-msg-text {
    color: var(--custom-msg-text);
  }

  .preview-section-title {
    font-size: 11px;
    color: #5f87ff;
    margin: 12px 0 8px 0;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .diff-line {
    display: flex;
    gap: 8px;
    margin: 4px 0;
  }

  .diff-symbol {
    width: 16px;
    flex-shrink: 0;
  }

  .syntax-preview {
    padding: 12px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    background-color: #1a1a2e;
  }

  .syntax-preview.light {
    background-color: #f5f5f5;
  }

  .syntax-code {
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .syntax-code code {
    font-family: inherit;
    font-size: inherit;
  }

  @media (max-width: 768px) {
    .terminal-container {
      padding: 10px;
    }

    .category-content {
      flex-direction: column;
    }

    .preview-column,
    .color-column {
      width: 100%;
    }

    .color-item {
      flex-wrap: wrap;
    }

    .color-label {
      min-width: 100%;
      margin-bottom: 5px;
    }

    .color-picker {
      width: 100%;
      height: 40px;
    }

    .color-preview {
      width: 100%;
      height: 40px;
    }

    .hex-input {
      width: 100%;
      margin-top: 5px;
    }
  }

  ::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  ::-webkit-color-swatch {
    border: 1px solid #0f3460;
    border-radius: 4px;
  }
</style>
