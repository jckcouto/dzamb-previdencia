// Script to push the entire project to GitHub using Octokit API
// Handles empty repositories by initializing with a file first

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Files and directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.replit',
  '.config',
  '.cache',
  'dist',
  '.upm',
  'replit.nix',
  '.breakpoints',
  'generated-icon.png',
  'attached_assets',
  '.env',
  '.env.local',
  'package-lock.json',
  '.local',
  'snippets',
  'tmp',
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.some(part => IGNORE_PATTERNS.includes(part));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting GitHub backup for DZAMB Previdência...\n');
  
  const octokit = await getUncachableGitHubClient();
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`✅ Authenticated as: ${user.login}`);
  
  const repoName = 'dzamb-previdencia';
  const repoDescription = 'DZAMB Previdência - Plataforma de Planejamento Previdenciário para Advogados Brasileiros. Do Zero ao Melhor Benefício.';
  
  // Check if repo exists
  let repoExists = false;
  let repoIsEmpty = false;
  
  try {
    const { data: repo } = await octokit.repos.get({ owner: user.login, repo: repoName });
    repoExists = true;
    console.log(`📦 Repository ${repoName} already exists`);
    
    // Check if it's empty by trying to get commits
    try {
      await octokit.repos.listCommits({ owner: user.login, repo: repoName, per_page: 1 });
    } catch (e: any) {
      if (e.status === 409) {
        repoIsEmpty = true;
        console.log('📦 Repository is empty, will initialize');
      }
    }
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`📦 Creating repository ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: repoDescription,
        private: false,
        auto_init: false,
      });
      console.log(`✅ Repository created`);
      repoIsEmpty = true;
    } else {
      throw e;
    }
  }
  
  // If repo is empty, create initial README using Contents API
  if (repoIsEmpty) {
    console.log('📝 Initializing repository with README...');
    const readmeContent = `# DZAMB Previdência

**Do Zero ao Melhor Benefício**

Plataforma de planejamento previdenciário automatizado para advogados brasileiros especializados em direito previdenciário.

## Funcionalidades

- 📄 Upload e análise de documentos (CNIS, CTPS, PPP, FGTS)
- 🤖 Extração inteligente de vínculos via IA (GPT-4o)
- 🔍 Detecção automática de inconsistências
- 📋 Geração de lista de pendências
- 📝 Editor de pareceres técnicos
- 📊 Dashboard com métricas

## Stack Tecnológico

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Banco de Dados**: PostgreSQL (Neon)
- **IA**: OpenAI GPT-4o Vision
- **Storage**: Replit Object Storage

## Desenvolvido na Replit
`;

    await octokit.repos.createOrUpdateFileContents({
      owner: user.login,
      repo: repoName,
      path: 'README.md',
      message: 'Initial commit - DZAMB Previdência',
      content: Buffer.from(readmeContent).toString('base64'),
    });
    
    console.log('✅ README created');
    await sleep(2000);
  }
  
  // Get all files
  const projectDir = '/home/runner/workspace';
  const files = getAllFiles(projectDir);
  console.log(`\n📁 Found ${files.length} files to upload\n`);
  
  // Get the current main branch reference
  console.log('📌 Getting main branch reference...');
  const { data: ref } = await octokit.git.getRef({
    owner: user.login,
    repo: repoName,
    ref: 'heads/main',
  });
  let baseSha = ref.object.sha;
  console.log(`📌 Main branch at ${baseSha.substring(0, 7)}`);
  
  // Create blobs for all files
  console.log('\n📤 Uploading files...');
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  let uploadedCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    const filePath = path.join(projectDir, file);
    
    try {
      const content = fs.readFileSync(filePath);
      const base64Content = content.toString('base64');
      
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: base64Content,
        encoding: 'base64',
      });
      
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
      
      uploadedCount++;
      if (uploadedCount % 20 === 0) {
        console.log(`   Uploaded ${uploadedCount}/${files.length} files...`);
      }
    } catch (e: any) {
      console.error(`❌ Error uploading ${file}: ${e.message}`);
      errorCount++;
    }
  }
  
  console.log(`✅ Uploaded ${uploadedCount} files (${errorCount} errors)\n`);
  
  if (treeItems.length === 0) {
    console.error('❌ No files were uploaded successfully');
    return;
  }
  
  // Create tree
  console.log('🌳 Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    tree: treeItems,
    base_tree: baseSha,
  });
  
  // Create commit
  const commitMessage = `📦 Backup completo DZAMB Previdência - ${new Date().toLocaleString('pt-BR')}

Inclui:
- Código fonte completo (frontend React + backend Express)
- Schema do banco de dados PostgreSQL (Drizzle ORM)
- Documentação (replit.md, DOCUMENTACAO.md, design_guidelines.md)
- Serviços de IA para análise de CNIS
- Sistema de upload e armazenamento de documentos
- Geração de pareceres e PDFs
- ${uploadedCount} arquivos`;

  console.log('💾 Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: commitMessage,
    tree: tree.sha,
    parents: [baseSha],
  });
  
  // Update reference
  console.log('🔗 Updating branch reference...');
  await octokit.git.updateRef({
    owner: user.login,
    repo: repoName,
    ref: 'heads/main',
    sha: commit.sha,
  });
  
  console.log('\n✅ ========================================');
  console.log(`✅ BACKUP COMPLETO!`);
  console.log(`✅ Repositório: https://github.com/${user.login}/${repoName}`);
  console.log(`✅ Commit: ${commit.sha.substring(0, 7)}`);
  console.log(`✅ Arquivos: ${uploadedCount}`);
  console.log('✅ ========================================\n');
}

main().catch(console.error);
