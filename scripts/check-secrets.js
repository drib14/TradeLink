#!/usr/bin/env node

/**
 * TradeLink Pre-Commit & CI Secret Scanner
 * Scans staged or tracked files for exposed API keys, credentials, and sensitive tokens
 * before they can be committed to Git.
 *
 * Usage:
 *   node scripts/check-secrets.js           # Scans staged files (for pre-commit hook)
 *   node scripts/check-secrets.js --all     # Scans all tracked files in git repository
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCAN_ALL = process.argv.includes('--all');

// Patterns that trigger GitGuardian, GitHub Secret Scanning, or general leaks
const SECRET_RULES = [
  {
    name: 'Groq API Key',
    regex: /gsk_[a-zA-Z0-9]{40,}/g,
  },
  {
    name: 'Google / Gmail App Password (assigned in config)',
    regex: /(?:pass|password|smtp|secret|auth)[^=:\n]*[:=]\s*['"]?[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}\s+[a-z]{4}['"]?/gi,
  },
  {
    name: 'Generic Cloudinary Secret assignment',
    regex: /CLOUDINARY_API_SECRET\s*=\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
  },
  {
    name: 'Database URI with Password',
    regex: /(mysql|postgresql|postgres|mongodb(\+srv)?):\/\/[a-zA-Z0-9_.-]+:[^@\s]{4,}@[^/\s]+/gi,
  },
  {
    name: 'Long Hex Secret in Config (64+ chars)',
    regex: /(?:SECRET|TOKEN|KEY)\s*[:=]\s*['"]?[a-f0-9]{64,}['"]?/gi,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
  },
  {
    name: 'Slack Token',
    regex: /xox[baprs]-[0-9a-zA-Z]{10,}/g,
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----/g,
  },
  {
    name: 'Stripe API Key',
    regex: /(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,}/g,
  },
];

// Files or extensions that must NEVER be committed
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env$/i,
  /\.env\.(production|staging|local|development)$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
];

// Files allowed to have placeholders or scanner definitions
const ALLOWED_FILES = [
  '.env.example',
  'check-secrets.js',
  '.gitleaks.toml',
];

function getFilesToScan() {
  try {
    const gitCommand = SCAN_ALL
      ? 'git ls-files'
      : 'git diff --cached --name-only --diff-filter=ACM';

    const output = execSync(gitCommand, { encoding: 'utf8' }).trim();
    if (!output) return [];
    return output.split(/\r?\n/).filter(Boolean);
  } catch (err) {
    console.warn('[Scanner] Warning: Unable to get git files via git CLI. Fallback to staged inspection.', err.message);
    return [];
  }
}

function redactMatch(str) {
  if (str.length <= 8) return '****';
  return str.slice(0, 4) + '...' + str.slice(-4);
}

function runScanner() {
  console.log(`\n🔒 [TradeLink Secret Scanner] Scanning ${SCAN_ALL ? 'all tracked files' : 'staged files'}...`);
  const files = getFilesToScan();

  if (files.length === 0) {
    console.log('✅ No files to scan.\n');
    process.exit(0);
  }

  let violations = [];

  for (const relPath of files) {
    const fileName = path.basename(relPath);

    // Skip self or example configs
    if (ALLOWED_FILES.some(allowed => relPath.endsWith(allowed))) {
      continue;
    }

    // Check forbidden filenames
    for (const forbidden of FORBIDDEN_FILE_PATTERNS) {
      if (forbidden.test(fileName)) {
        violations.push({
          file: relPath,
          line: 0,
          rule: `Forbidden file committed (${fileName})`,
          match: fileName,
        });
      }
    }

    if (!fs.existsSync(relPath)) continue;

    // Skip binary files and giant files (> 1MB)
    const stats = fs.statSync(relPath);
    if (stats.size > 1024 * 1024) continue;

    let content = '';
    try {
      content = fs.readFileSync(relPath, 'utf8');
    } catch {
      continue; // Binary or non-UTF8
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip lines that are just comments explaining secret names without actual values
      if (line.trim().startsWith('//') && line.includes('example') && !line.includes('gsk_')) {
        continue;
      }

      for (const rule of SECRET_RULES) {
        const matches = line.match(rule.regex);
        if (matches) {
          for (const m of matches) {
            // Check if it's an obvious example/placeholder
            if (
              m.toLowerCase().includes('your_') ||
              m.toLowerCase().includes('placeholder') ||
              m.toLowerCase().includes('example') ||
              m.toLowerCase().includes('insert_') ||
              (m.includes('<') && m.includes('>'))
            ) {
              continue;
            }

            violations.push({
              file: relPath,
              line: i + 1,
              rule: rule.name,
              match: redactMatch(m),
            });
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n🚨 ============================================================');
    console.error('🚨 [SECURITY ALERT] SENSITIVE SECRETS DETECTED IN CODEBASE!');
    console.error('🚨 Commit blocked to prevent GitGuardian alert and data leak.');
    console.error('🚨 ============================================================\n');

    for (const v of violations) {
      console.error(`  ❌ [${v.rule}]`);
      console.error(`     File: ${v.file}${v.line > 0 ? `:${v.line}` : ''}`);
      console.error(`     Snippet: ${v.match}\n`);
    }

    console.error('Remediation:');
    console.error('  1. Remove hardcoded credentials from the files listed above.');
    console.error('  2. Move secrets into your untracked .env file or environment variables.');
    console.error('  3. Re-stage files and retry.\n');

    process.exit(1);
  }

  console.log('✅ [TradeLink Secret Scanner] All scanned files clean! Zero secrets detected.\n');
  process.exit(0);
}

runScanner();
