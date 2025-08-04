
// 触摸滑动支持（手机左右滑动控制，touchmove更灵敏）
let touchStartX = null;
let lastMoveDir = 0;

function handleTouchStart(e) {
  if (!falling) return;
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    lastMoveDir = 0;
  }
}

function handleTouchMove(e) {
  if (!falling || touchStartX === null) return;
  if (e.touches && e.touches.length > 0) {
    const moveX = e.touches[0].clientX;
    const dx = moveX - touchStartX;
    if (Math.abs(dx) > 24) { // 更小阈值更灵敏
      const dir = dx > 0 ? 1 : -1;
      if (dir !== lastMoveDir) {
        moveFalling(dir);
        lastMoveDir = dir;
        touchStartX = moveX; // 连续滑动可多次响应
      }
    }
  }
}

function handleTouchEnd(e) {
  touchStartX = null;
  lastMoveDir = 0;
}


// 绑定触摸事件到游戏区域，确保 DOM 加载后再绑定
window.addEventListener('DOMContentLoaded', () => {
  const gameBoard = document.getElementById('game-board');
  gameBoard.addEventListener('touchstart', handleTouchStart);
  gameBoard.addEventListener('touchmove', handleTouchMove);
  gameBoard.addEventListener('touchend', handleTouchEnd);
});
// 校徽消消乐 H5 版（俄罗斯方块式下落+鼠标左右操控）
const badges = ['shangzhong', 'huaer', 'jiaofu', 'dongchang', 'xinchuan'];
const boardRows = 12;
const boardCols = 8;
let board = [];
let score = 0;
let gameOver = false;
let falling = null; // {row, col, badge}
let fallTimer = null;

function randomBadge() {
  return badges[Math.floor(Math.random() * badges.length)];
}

function createBoard() {
  board = Array.from({ length: boardRows }, () => Array(boardCols).fill(null));
  score = 0;
  gameOver = false;
  falling = null;
  document.getElementById('game-over').style.display = 'none';
  updateScore();
  renderBoard();
  dropNewBadge();
}

function updateScore() {
  document.getElementById('score').innerText = `分数：${score}`;
}

function renderBoard() {
  const gameBoard = document.getElementById('game-board');
  gameBoard.innerHTML = '';
  for (let row = 0; row < boardRows; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    for (let col = 0; col < boardCols; col++) {
      const img = document.createElement('img');
      img.className = 'cell';
      let cell = board[row][col];
      if (falling && falling.row === row && falling.col === col) {
        cell = falling.badge;
        img.style.border = '2px solid #409eff';
        img.style.cursor = 'pointer';
        img.onclick = (e) => {
          const rect = img.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) moveFalling(-1);
          else moveFalling(1);
        };
      }
      img.style.opacity = cell ? 1 : 0;
      img.src = cell ? `images/${cell}.png` : '';
      img.dataset.row = row;
      img.dataset.col = col;
      rowDiv.appendChild(img);
    }
    gameBoard.appendChild(rowDiv);
  }
}

function dropNewBadge() {
  if (gameOver) return;
  const col = Math.floor(Math.random() * boardCols);
  if (board[0][col]) {
    // 顶部已满，游戏结束
    gameOver = true;
    document.getElementById('game-over').style.display = 'block';
    return;
  }
  falling = { row: 0, col, badge: randomBadge() };
  renderBoard();
  fallTimer = setInterval(fallStep, 300);
}

function fallStep() {
  if (!falling) return;
  let { row, col, badge } = falling;
  if (row + 1 < boardRows && !board[row + 1][col]) {
    falling.row++;
    renderBoard();
  } else {
    // 落地
    board[row][col] = badge;
    clearInterval(fallTimer);
    falling = null;
    renderBoard();
    setTimeout(() => {
      handleMergeAndEliminate(row, col);
      if (!gameOver) setTimeout(dropNewBadge, 500);
    }, 200);
  }
}

function moveFalling(dir) {
  if (!falling) return;
  let { row, col } = falling;
  let newCol = col + dir;
  if (newCol >= 0 && newCol < boardCols && !board[row][newCol]) {
    falling.col = newCol;
    renderBoard();
  }
}

window.addEventListener('keydown', (e) => {
  if (!falling) return;
  if (e.key === 'ArrowLeft') moveFalling(-1);
  if (e.key === 'ArrowRight') moveFalling(1);
});

function handleMergeAndEliminate(row, col) {
  const badge = board[row][col];
  const dirs = [
    [0, 1], [1, 0], [0, -1], [-1, 0]
  ];
  let mergeTarget = null;
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (nr >= 0 && nr < boardRows && nc >= 0 && nc < boardCols && board[nr][nc] === badge) {
      mergeTarget = [nr, nc];
      break;
    }
  }
  if (mergeTarget) {
    const idx = badges.indexOf(badge);
    if (idx < badges.length - 1) {
      board[row][col] = null;
      board[mergeTarget[0]][mergeTarget[1]] = badges[idx + 1];
      score += 5;
      updateScore();
      renderBoard();
      setTimeout(() => handleMergeAndEliminate(mergeTarget[0], mergeTarget[1]), 300);
      return;
    }
  }
  // 标准三消：横向或纵向连续3个及以上
  const toEliminate = [];
  // 横向
  for (let r = 0; r < boardRows; r++) {
    let count = 1;
    for (let c = 1; c < boardCols; c++) {
      if (board[r][c] && board[r][c] === board[r][c - 1]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) toEliminate.push([r, c - 1 - k, board[r][c - 1]]);
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) toEliminate.push([r, boardCols - 1 - k, board[r][boardCols - 1]]);
    }
  }
  // 纵向
  for (let c = 0; c < boardCols; c++) {
    let count = 1;
    for (let r = 1; r < boardRows; r++) {
      if (board[r][c] && board[r][c] === board[r - 1][c]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) toEliminate.push([r - 1 - k, c, board[r - 1][c]]);
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) toEliminate.push([boardRows - 1 - k, c, board[boardRows - 1][c]]);
    }
  }
  if (toEliminate.length > 0) {
    // 去重
    const unique = {};
    for (const [r, c, b] of toEliminate) unique[`${r},${c}`] = [r, c];
    for (const key in unique) {
      const [r, c] = unique[key];
      board[r][c] = null;
    }
    score += 10 * Object.keys(unique).length;
    updateScore();
    renderBoard();
    setTimeout(dropDown, 300);
  }
}

function dropDown() {
  for (let col = 0; col < boardCols; col++) {
    for (let row = boardRows - 1; row > 0; row--) {
      if (!board[row][col]) {
        let above = row - 1;
        while (above >= 0 && !board[above][col]) above--;
        if (above >= 0) {
          board[row][col] = board[above][col];
          board[above][col] = null;
        }
      }
    }
  }
  renderBoard();
}

document.getElementById('restart').onclick = () => {
  createBoard();
};

// 初始化
createBoard();