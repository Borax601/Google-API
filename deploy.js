// deploy.js
// GitHub REST API + PAT で一括アップロード
// 除外: node_modules, .git, dist, .DS_Store

const { Octokit } = require('@octokit/rest');
const globby = require('globby');
const fs = require('fs/promises');
const path = require('path');

const OWNER = 'Borax601';
const REPO = 'Google-API';
const BRANCH = 'main';
const TOKEN = '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'; // セキュリティ上、実運用では .env などに分離してください

const octokit = new Octokit({ auth: TOKEN });

async function getLatestCommitSha(branch) {
  const { data } = await octokit.repos.getBranch({
    owner: OWNER,
    repo: REPO,
    branch,
  });
  return data.commit.sha;
}

async function getTreeSha(commitSha) {
  const { data } = await octokit.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: commitSha,
  });
  return data.tree.sha;
}

async function uploadFile({ filePath, content, branch, sha }) {
  const repoPath = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: repoPath,
    message: `upload: ${repoPath}`,
    content: Buffer.from(content).toString('base64'),
    branch,
    sha: sha || undefined,
  });
}

async function getFileSha(repoPath, branch) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: repoPath,
      ref: branch,
    });
    return data.sha;
  } catch (e) {
    return undefined;
  }
}

async function main() {
const patterns = [
  '**/*',
  '!**/node_modules/**',   // ← すべての node_modules を一括除外
  '!.git/**',
  '!dist/**',
  '!.DS_Store',
  '!deploy.js',
];

  const files = await globby(patterns, { dot: true });
  for (const file of files) {
    const absPath = path.resolve(file);
    const stat = await fs.stat(absPath);
    if (stat.isFile()) {
      const content = await fs.readFile(absPath);
      const repoPath = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
      const sha = await getFileSha(repoPath, BRANCH);
      console.log(`Uploading: ${repoPath}`);
      await uploadFile({ filePath: absPath, content, branch: BRANCH, sha });
    }
  }
  console.log('All files uploaded!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
