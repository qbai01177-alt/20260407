let upperPoints = [];
let lowerPoints = [];
let numPoints = 5;
let gameState = "START"; // 遊戲狀態：START, PLAYING, WIN, FAIL
let playerRadius = 3;    // 玩家游標判定半徑
let level = 1;           // 記錄目前關卡
let startTime = 0;       // 記錄關卡開始的時間
let baseTimeLimit = 10;  // 基礎遊戲時間限制（秒）

function setup() {
  createCanvas(800, 400);
  generatePath();
}

function draw() {
  background(240);
  
  // 繪製通道
  drawPath();
  
  if (gameState === "START") {
    // 繪製開始按鈕 (最右邊)
    fill(0, 200, 100);
    noStroke();
    let startX = upperPoints[numPoints - 1].x;
    let startY = height / 2;
    circle(startX, startY, 30);
    
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("點擊綠色按鈕開始", width / 2, height / 2 - 50);
    text("（從右邊出發，移動到最左邊）", width / 2, height / 2 - 20);
    text("目前關卡：第 " + level + " 關", width / 2, height / 2 + 20);
    let currentTimeLimit = max(3, baseTimeLimit - (level - 1) * 0.5);
    text("通關限時：" + currentTimeLimit.toFixed(1) + " 秒", width / 2, height / 2 + 50);
    
  } else if (gameState === "PLAYING") {
    // 進行中，檢測碰撞並繪製玩家
    checkCollision();
    
    // 顯示目前關卡
    fill(0);
    textAlign(LEFT, TOP);
    textSize(16);
    text("Level: " + level, 10, 10);
    
    // 計時器邏輯
    let currentTimeLimit = max(3, baseTimeLimit - (level - 1) * 0.5); // 動態時間限制：每關減0.5秒，最低3秒
    let elapsedTime = (millis() - startTime) / 1000;
    let timeLeft = max(0, currentTimeLimit - elapsedTime);
    
    // 顯示倒數計時（最後3秒字體變紅警告）
    textAlign(RIGHT, TOP);
    if (timeLeft <= 3) fill(255, 0, 0); 
    else fill(0);
    text("Time: " + timeLeft.toFixed(1) + "s", width - 10, 10);
    
    // 超過10秒未破關，判定失敗
    if (timeLeft <= 0) {
      gameState = "FAIL";
    }
    
  } else if (gameState === "WIN") {
    background(200, 255, 200);
    fill(0, 100, 0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(48);
    text("恭喜通過第 " + level + " 關！", width / 2, height / 2 - 20);
    textSize(24);
    text("點擊畫面進入下一關", width / 2, height / 2 + 30);
    
  } else if (gameState === "FAIL") {
    background(255, 200, 200);
    fill(150, 0, 0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(48);
    text("失敗了！止步於第 " + level + " 關", width / 2, height / 2 - 20);
    textSize(24);
    text("點擊畫面重新開始", width / 2, height / 2 + 30);
  }
}

// 產生 5 個點的通道
function generatePath() {
  upperPoints = [];
  lowerPoints = [];
  let startX = 30;              // 終點 (左)
  let endX = width - 30;        // 起點 (右)
  let spacing = (endX - startX) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    let x = startX + i * spacing;
    let midY = height / 2 + random(-120, 120);
    
    // 動態難度：隨著 level 增加，間距越來越窄，但確保有最低寬度 20
    let minGap = max(20, 80 - level * 5);
    let maxGap = max(40, 130 - level * 10);
    let gap = random(minGap, maxGap);
    
    // 確保起點(最右側)對齊畫面中央，且有足夠空間放開始按鈕
    if (i === numPoints - 1) {
      midY = height / 2;
      gap = max(60, maxGap); 
    }
    
    upperPoints.push(createVector(x, midY - gap / 2));
    lowerPoints.push(createVector(x, midY + gap / 2));
  }
}

function drawPath() {
  noFill();
  stroke(50);
  strokeWeight(3);
  
  // 繪製上線條
  beginShape();
  for (let p of upperPoints) vertex(p.x, p.y);
  endShape();
  
  // 繪製下線條
  beginShape();
  for (let p of lowerPoints) vertex(p.x, p.y);
  endShape();
}

function checkCollision() {
  // 玩家游標
  fill(255, 0, 0);
  noStroke();
  circle(mouseX, mouseY, playerRadius * 2);
  
  // 成功條件：到達最左邊的點
  if (mouseX <= upperPoints[0].x) {
    gameState = "WIN";
    return;
  }
  
  // 尋找滑鼠目前位在哪一個線段區間
  let segment = -1;
  for (let i = 0; i < numPoints - 1; i++) {
    if (mouseX >= upperPoints[i].x && mouseX <= upperPoints[i+1].x) {
      segment = i;
      break;
    }
  }
  
  if (segment !== -1) {
    let p1U = upperPoints[segment];
    let p2U = upperPoints[segment + 1];
    let p1L = lowerPoints[segment];
    let p2L = lowerPoints[segment + 1];
    
    // 利用內插法 (lerp) 計算滑鼠目前 X 座標時的準確上下 Y 座標邊界
    let t = (mouseX - p1U.x) / (p2U.x - p1U.x);
    let currentUpperY = lerp(p1U.y, p2U.y, t);
    let currentLowerY = lerp(p1L.y, p2L.y, t);
    
    // 碰撞判斷：如果超出上下界，則失敗
    if (mouseY - playerRadius < currentUpperY || mouseY + playerRadius > currentLowerY) {
      gameState = "FAIL";
    }
  } else {
    // 若滑鼠移到最右邊起點更右側的範圍（移到線外）且不在開始按鈕允許的寬限範圍內
    if (mouseX > upperPoints[numPoints - 1].x + 15 || mouseY < 0 || mouseY > height) {
      gameState = "FAIL";
    }
  }
}

function mousePressed() {
  if (gameState === "START") {
    // 檢查是否點擊到了最右側的綠色開始按鈕
    let startX = upperPoints[numPoints - 1].x;
    let startY = height / 2;
    let d = dist(mouseX, mouseY, startX, startY);
    if (d < 15) {
      gameState = "PLAYING";
      startTime = millis(); // 記錄並重置開始計時的瞬間
    }
  } else if (gameState === "WIN") {
    level++; // 進入下一關
    generatePath();
    gameState = "START";
  } else if (gameState === "LOST_LIFE") {
    generatePath(); // 重新產生相同難度的關卡以重試
    gameState = "START";
  } else if (gameState === "FAIL") {
    level = 1; // 失敗重置關卡
    lives = 3; // 失敗重置生命
    generatePath();
    gameState = "START";
  }
}