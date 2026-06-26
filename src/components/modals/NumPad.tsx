interface NumPadProps {
  expression: string;
  onChange: (expr: string) => void;
  onEvaluate: () => void;
}

const ROWS = [
  ['7', '8', '9', '⌫'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '-'],
  ['.', '0', 'C', '='],
];


export default function NumPad({ expression, onChange, onEvaluate }: NumPadProps) {
  const handleKey = (key: string) => {
    switch (key) {
      case 'C':
        onChange('');
        break;
      case '⌫':
        onChange(expression.slice(0, -1));
        break;
      case '=':
        onEvaluate();
        break;
      case '.': {
        const segments = expression.split(/[+\-]/);
        const last = segments[segments.length - 1] ?? '';
        if (!last.includes('.')) {
          onChange(expression + (expression === '' ? '0.' : '.'));
        }
        break;
      }
      case '+':
      case '-': {
        if (expression === '') break;
        const lastChar = expression.slice(-1);
        if (lastChar === '+' || lastChar === '-') {
          onChange(expression.slice(0, -1) + key);
        } else {
          onChange(expression + key);
        }
        break;
      }
      default: {
        const parts = expression.split(/[+\-]/);
        const lastPart = parts[parts.length - 1] ?? '';
        const [, dec] = lastPart.split('.');
        if (dec !== undefined && dec.length >= 2) break; 
        if (lastPart.replace('.', '').length >= 10) break; 
        onChange(expression + key);
        break;
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%' }}>
      {ROWS.flat().map((key, idx) => {
        const isOperator = ['+', '-', '=', 'C', '⌫'].includes(key);
        const isDelete = key === '⌫' || key === 'C';
        const isEquals = key === '=';
        
        let bg = 'var(--surface-2)';
        let color = 'var(--text-1)';
        
        if (isEquals) {
          bg = 'var(--text-1)';
          color = 'var(--bg)';
        } else if (isDelete) {
          bg = 'rgba(255,59,48,0.1)';
          color = 'var(--expense)';
        } else if (isOperator) {
          bg = 'var(--surface-3)';
          color = 'var(--text-1)';
        }

        return (
          <button
            key={`${key}-${idx}`}
            id={`numpad-${key === '⌫' ? 'backspace' : key === '=' ? 'equals' : key}`}
            onClick={() => handleKey(key)}
            aria-label={key === '⌫' ? 'Backspace' : key === 'C' ? 'Clear' : key === '=' ? 'Evaluate' : key}
            style={{
              padding: '18px 0',
              borderRadius: 16,
              border: 'none',
              background: bg,
              color: color,
              fontSize: 22,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'transform 100ms ease, opacity 100ms ease',
            }}
            className="active:scale-[0.95] active:opacity-80"
          >
            {key === '⌫' ? <i className="fa-solid fa-delete-left" /> : key}
          </button>
        );
      })}
    </div>
  );
}
