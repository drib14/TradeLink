#!/usr/bin/env node

/**
 * TradeLink staged/tracked secret scanner.
 * Gitleaks in CI additionally scans the complete Git history.
 *
 * Usage:
 *   node scripts/check-secrets.js       # staged files
 *   node scripts/check-secrets.js --all # all tracked files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCAN_ALL = process.argv.includes('--all');

const SECRET_RULES = [
  { name: 'Groq API key', regex: /gsk_[A-Za-z0-9]{40,}/g },
  { name: 'OpenAI API key', regex: /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}/g },
  { name: 'Anthropic API key', regex: /sk-ant-[A-Za-z0-9_-]{20,}/g },
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'GitHub token', regex: /(?:gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{40,})/g },
  { name: 'Slack token', regex: /xox[baprs]-[0-9a-zA-Z-]{10,}/g },
  { name: 'AWS access key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: 'Stripe/PayMongo secret key', regex: /(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{20,}/g },
  { name: 'Resend API key', regex: /re_[A-Za-z0-9_-]{24,}/g },
  { name: 'Private key block', regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----/g },
  {
    name: 'Database connection URI with password',
    regex: /(?:mysql|postgresql|postgres|mongodb(?:\+srv)?):\/\/[^\s:/]+:[^@\s]{4,}@[^\s/]+/gi
  },
  {
    name: 'Credential-like environment assignment',
    regex: /\b(?:API_KEY|CLIENT_SECRET|JWT_(?:ACCESS|REFRESH|ADMIN_ACCESS|ADMIN_REFRESH)_SECRET|DB_PASSWORD|DATABASE_URL|SMTP_PASS|CLOUDINARY_API_SECRET|GROQ_API_KEY|RESEND_API_KEY)\b\s*[:=]\s*['"]?([^\s'"#]{16,})/gi
  },
  { name: 'Known default TradeLink administrator password', regex: /TradeLink@2026/g }
];

const FORBIDDEN_FILE_PATTERNS = [
  /^\.env(?:\..+)?$/i,
  /\.(?:pem|key|pfx|p12|jks|keystore)$/i
];

const SELF_PATHS = new Set(['scripts/check-secrets.js']);

function getFilesToScan() {
  const command = SCAN_ALL
    ? 'git ls-files -z'
    : 'git diff --cached --name-only --diff-filter=ACMR -z';
  try {
    return execSync(command, { encoding: 'utf8' }).split('\0').filter(Boolean);
  } catch (error) {
    console.error('[Secret Scanner] Unable to enumerate Git files:', error.message);
    process.exit(2);
  }
}

function isPlaceholder(value) {
  const normalized = String(value || '').toLowerCase();
  return (
    normalized.includes('your_') ||
    normalized.includes('replace_with_') ||
    normalized.includes('placeholder') ||
    normalized.includes('example') ||
    normalized.includes('insert_') ||
    normalized.includes('change_me') ||
    normalized.includes('changeme') ||
    normalized.includes('not_a_real') ||
    (normalized.includes('<') && normalized.includes('>'))
  );
}

function redact(value) {
  const text = String(value || '');
  if (text.length <= 8) return '****';
  return text.slice(0, 4) + '...' + text.slice(-4);
}

function runScanner() {
  const files = getFilesToScan();
  console.log(`[TradeLink Secret Scanner] Scanning ${files.length} ${SCAN_ALL ? 'tracked' : 'staged'} files...`);

  const violations = [];

  for (const relPath of files) {
    const normalizedPath = relPath.replace(/\\/g, '/');
    const baseName = path.basename(normalizedPath);

    if (SELF_PATHS.has(normalizedPath)) continue;

    if (normalizedPath.startsWith('server/uploads/')) {
      violations.push({
        file: relPath,
        line: 0,
        rule: 'Runtime uploads must never be committed',
        match: baseName
      });
      continue;
    }

    for (const forbidden of FORBIDDEN_FILE_PATTERNS) {
      if (forbidden.test(baseName) && baseName.toLowerCase() !== '.env.example') {
        violations.push({
          file: relPath,
          line: 0,
          rule: 'Forbidden environment/private-key file',
          match: baseName
        });
      }
    }

    if (!fs.existsSync(relPath)) continue;
    const stats = fs.statSync(relPath);
    if (!stats.isFile() || stats.size > 10 * 1024 * 1024) continue;

    let content;
    try {
      const buffer = fs.readFileSync(relPath);
      // Binary media is separately blocked under server/uploads; avoid decoding
      // arbitrary binary assets as source text.
      if (buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0)) continue;
      content = buffer.toString('utf8');
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      for (const rule of SECRET_RULES) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(line)) !== null) {
          const candidate = match[1] || match[0];
          if (isPlaceholder(candidate)) continue;
          violations.push({
            file: relPath,
            line: lineIndex + 1,
            rule: rule.name,
            match: redact(candidate)
          });
          if (!rule.regex.global) break;
        }
      }
    }
  }

  if (violations.length) {
    console.error('\n[SECURITY BLOCK] Potential committed secrets or private runtime files found:');
    for (const item of violations) {
      console.error(`- ${item.rule}: ${item.file}${item.line ? ':' + item.line : ''} (${item.match})`);
    }
    console.error('\nMove real credentials to server-side environment settings, rotate any exposed values, and remove private files from Git.');
    process.exit(1);
  }

  console.log('[TradeLink Secret Scanner] No matching secrets or forbidden runtime files found.');
}

runScanner();
