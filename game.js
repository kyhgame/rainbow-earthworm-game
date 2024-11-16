const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: 0,
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game; // 게임 변수를 전역으로 선언
let wormHead;
let wormSegments = [];
let food;
let cursors;
let segmentSize = 20; // 세그먼트 크기
let speed = 200; // 초기 이동 속도
let foodEaten = 0; // 먹은 먹이 개수
let timer; // 타이머 변수
let timeLimit = 10; // 제한 시간 (초)

let currentDirection = null; // 현재 이동 방향을 저장할 변수

// 무지개 색상 배열
const rainbowColors = [
    0xff0000, // 빨간색
    0xff7f00, // 주황색
    0xffff00, // 노란색
    0x00ff00, // 초록색
    0x0000ff, // 파란색
    0x4b0082, // 남색
    0x9400d3  // 보라색
];

function preload() {
    // 이미지 로드 필요 없음
}

function create() {
    // 초기 지렁이 머리 생성 (화면 중앙)
    const headSize = segmentSize * 0.7; // 머리 크기를 세그먼트 크기의 80%로 설정
    wormHead = this.add.rectangle(config.width / 2, config.height / 2, headSize, headSize, 0x000000); // 머리를 검정색으로 설정
    wormHead.setStrokeStyle(2, 0xffffff); // 흰색 테두리 추가
    this.physics.world.enable(wormHead);
    wormHead.body.setCollideWorldBounds(true);
    wormSegments.push(wormHead); // 머리 세그먼트 추가
    wormHead.setDepth(9999); // 머리의 깊이를 9999로 설정


    // 초기 몸통 생성 (흰색)
    const initialBody = this.add.rectangle((config.width / 2) + segmentSize + 40, config.height / 2, segmentSize, segmentSize, 0xffffff);
    this.physics.world.enable(initialBody);
    wormSegments.push(initialBody); // 몸통 추가
    initialBody.setDepth(9998); // 몸통의 깊이를 9998로 설정

    // 먹이 생성
    createFood(this);

    cursors = this.input.keyboard.createCursorKeys();

    // 타이머 설정
    startTimer(this);
}

function update() {
    // 지렁이의 이동 처리
    if (cursors.left.isDown) {
        currentDirection = 'left';
    }
    if (cursors.right.isDown) {
        currentDirection = 'right';
    }
    if (cursors.up.isDown) {
        currentDirection = 'up';
    }
    if (cursors.down.isDown) {
        currentDirection = 'down';
    }

    // 현재 방향에 따라 속도 설정
    let velocityX = 0;
    let velocityY = 0;

    if (currentDirection === 'left') {
        velocityX = -speed;
    } else if (currentDirection === 'right') {
        velocityX = speed;
    }

    if (currentDirection === 'up') {
        velocityY = -speed;
    } else if (currentDirection === 'down') {
        velocityY = speed;
    }

    // 지렁이의 속도 설정
    wormHead.body.setVelocityX(velocityX);
    wormHead.body.setVelocityY(velocityY);

    // 지렁이가 먹이를 먹었는지 확인
    if (Phaser.Geom.Intersects.RectangleToRectangle(wormHead.getBounds(), food.getBounds())) {
        eatFood(this);
    }

    // 지렁이 세그먼트 위치 업데이트
    updateWormSegments();
}

// 타이머 시작
function startTimer(scene) {
    timer = scene.time.addEvent({
        delay: 1000, // 1초마다 호출
        callback: updateTimer,
        callbackScope: scene,
        loop: true
    });
}

// 타이머 업데이트
function updateTimer() {
    if (timeLimit == -1) {
        endGame(this);
		timeLimit--;
    }
	if (timeLimit >= 0) {
		document.getElementById('remainingTime').innerText = timeLimit; // 남은 시간 업데이트
		timeLimit--;
	}
}

// 게임 종료 함수
function endGame(scene) {
	timer.remove(); // 기존 타이머 이벤트 제거
    scene.physics.pause(); // 물리 엔진 정지
    scene.input.keyboard.enabled = false; // 키보드 입력 비활성화
    alert('게임 종료! 시간 초과!'); // 게임 종료 알림
	location.href = location.href;
    document.getElementById('startButton').style.display = 'block'; // 시작 버튼 재표시
    document.getElementById('gameContainer').style.display = 'none'; // 게임 화면 숨김
}

// 먹이 생성
function createFood(scene) {
    let x, y;
    let overlap = true;

    // 먹이의 위치가 기존 세그먼트와 겹치지 않도록 반복
    while (overlap) {
        overlap = false;
        x = Phaser.Math.Between(0, scene.sys.game.config.width);
        y = Phaser.Math.Between(0, scene.sys.game.config.height);

        // 먹이 위치가 모든 세그먼트와 겹치는지 확인
        for (let segment of wormSegments) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(
                new Phaser.Geom.Rectangle(x, y, 10, 10), 
                segment.getBounds()
            )) {
                overlap = true;
                break; // 겹치면 반복
            }
        }
    }

    // 최종적으로 겹치지 않는 위치에 먹이 생성 (무지개 색상 순서)
    const foodColor = rainbowColors[foodEaten % rainbowColors.length];
	food = scene.add.rectangle(x, y, segmentSize, segmentSize, foodColor); // 사각형으로 변경
    scene.physics.world.enable(food);
    food.body.setCollideWorldBounds(true);
}

// 먹이 먹기 처리
function eatFood(scene) {
	// 새로운 세그먼트 추가 (먹이의 색상으로 설정)
    const newSegment = scene.add.rectangle(wormHead.x, wormHead.y, segmentSize, segmentSize, food.fillColor); // 먹이의 색상으로 세그먼트 생성
    scene.physics.world.enable(newSegment);
    wormSegments.push(newSegment); // 새로운 세그먼트 추가

    // 깊이를 -1씩 감소시켜 설정
    newSegment.setDepth(9999 - wormSegments.length); // 깊이 설정

    // 먹이 제거
    food.destroy(); // 먹이 삭제
	// 먹은 개수 증가
    foodEaten++;
    createFood(scene); // 새로운 먹이 생성

    document.getElementById('foodEaten').innerText = foodEaten; // 먹은 먹이 수 업데이트

    // 속도 증가 처리
    if (foodEaten % 5 === 0) { // 5개마다 속도 증가
        speed *= 1.5; // 1.5배씩 증가
        document.getElementById('speed').innerText = speed; // 속도 업데이트
    }

    // 타이머 초기화
    timeLimit = 10; // 시간 제한 초기화
	
    // 새롭게 추가된 세그먼트에 애니메이션 추가
    scene.tweens.add({
        targets: newSegment,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        yoyo: true,
        repeat: 0
    });
}

// 지렁이 세그먼트 업데이트
function updateWormSegments() {
    // 지렁이의 세그먼트를 이전 세그먼트 위치로 이동
    for (let i = wormSegments.length - 1; i > 0; i--) {
        wormSegments[i].x = wormSegments[i - 1].x;
        wormSegments[i].y = wormSegments[i - 1].y;
    }

    // 머리의 위치 업데이트
    wormSegments[0].x = wormHead.x;
    wormSegments[0].y = wormHead.y;
}

// 게임 시작 함수
function startGame() {
    // 게임 상태 초기화
    speed = 200; // 속도 초기화
    foodEaten = 0; // 먹은 먹이 초기화
    timeLimit = 10; // 남은 시간 초기화

    // HTML 업데이트
    document.getElementById('speed').innerText = speed;
    document.getElementById('foodEaten').innerText = foodEaten;
    document.getElementById('remainingTime').innerText = timeLimit;

    document.getElementById('startButton').style.display = 'none'; // 버튼 숨기기
    document.getElementById('gameContainer').style.display = 'block'; // 게임 화면 표시
    game = new Phaser.Game(config); // 게임 시작
}

// 버튼 클릭 이벤트 등록
document.getElementById('startButton').addEventListener('click', startGame);
``
