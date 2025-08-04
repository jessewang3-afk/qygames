// pages/game/game.js
const badges = ['shangzhong', 'huaer', 'jiaofu']; // 校徽图片名（占位）
function randomBadge() {
  return badges[Math.floor(Math.random() * badges.length)];
}
Page({
  data: {
    board: Array.from({ length: 8 }, () => Array.from({ length: 8 }, randomBadge)),
  },
  onCellTap(e) {
    // TODO: 实现消除逻辑
    wx.showToast({ title: '点击了格子', icon: 'none' });
  },
});
