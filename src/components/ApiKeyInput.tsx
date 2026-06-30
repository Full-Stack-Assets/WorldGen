import { useState } from 'react';
import { getGeminiApiKey, setGeminiApiKey } from '../lib/apiKey';

export function ApiKeyInput() {
  const [value, setValue] = useState(() => getGeminiApiKey() ?? '');
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(() => Boolean(getGeminiApiKey()));

  const handleSave = () => {
    setGeminiApiKey(value);
    setSaved(Boolean(value.trim()));
  };

  const handleClear = () => {
    setValue('');
    setGeminiApiKey('');
    setSaved(false);
  };

  return (
    <div className="api-key-section">
      <label className="api-key-label" htmlFor="gemini-api-key">
        Gemini API Key
      </label>
      <div className="api-key-row">
        <input
          id="gemini-api-key"
          className="seed-input"
          type={visible ? 'text' : 'password'}
          value={value}
          placeholder="Paste your API key"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="btn btn-ghost btn-icon"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide API key' : 'Show API key'}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      <div className="api-key-actions">
        <button className="btn btn-primary btn-sm" type="button" onClick={handleSave}>
          Save Key
        </button>
        {saved && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      <p className={`hint api-key-status ${saved ? 'active' : ''}`}>
        {saved ? '✓ AI lore enabled' : 'Get a free key at aistudio.google.com/apikey'}
      </p>
    </div>
  );
}
