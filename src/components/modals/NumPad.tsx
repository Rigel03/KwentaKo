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

function getButtonStyle(key: string): string {
  if (key === '=') return 'numpad-btn numpad-btn-accent';
  if (key === 'C') return 'numpad-btn numpad-btn-danger';
  if (key === '⌫') return 'numpad-btn numpad-btn-danger';
  if (key === '+' || key === '-') return 'numpad-btn bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60';
  return 'numpad-btn';
}

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
        // Only allow decimal if the last number segment doesn't already have one
        const segments = expression.split(/[+\-]/);
        const last = segments[segments.length - 1] ?? '';
        if (!last.includes('.')) {
          onChange(expression + (expression === '' ? '0.' : '.'));
        }
        break;
      }
      case '+':
      case '-': {
        // Don't allow operator at start; don't allow two operators in a row
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
        // Digits — limit to 10 chars total per number segment
        const parts = expression.split(/[+\-]/);
        const lastPart = parts[parts.length - 1] ?? '';
        const [, dec] = lastPart.split('.');
        if (dec !== undefined && dec.length >= 2) break; // max 2 decimal places
        if (lastPart.replace('.', '').length >= 10) break; // max digits
        onChange(expression + key);
        break;
      }
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {ROWS.flat().map((key, idx) => (
        <button
          key={`${key}-${idx}`}
          id={`numpad-${key === '⌫' ? 'backspace' : key === '=' ? 'equals' : key}`}
          className={getButtonStyle(key)}
          onClick={() => handleKey(key)}
          aria-label={
            key === '⌫' ? 'Backspace' :
            key === 'C' ? 'Clear' :
            key === '=' ? 'Evaluate' : key
          }
        >
          {key === '⌫'
            ? <i className="fa-solid fa-delete-left" />
            : key}
        </button>
      ))}
    </div>
  );
}
