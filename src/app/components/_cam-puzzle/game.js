document.addEventListener('DOMContentLoaded', () => {
  const gameArea = document.getElementById('gameArea');
  const startCameraButton = document.getElementById('startCamera');
  const uploadButton = document.getElementById('uploadPhoto');
  const uploadInput = document.getElementById('upload');
  const shuffleButton = document.getElementById('shuffle');
  const restartButton = document.getElementById('restart');
  const revealButton = document.getElementById('reveal');
  const puzzleSizeSelect = document.getElementById('puzzleSize');

  let img = new Image();
  let puzzleSize = 4;
  let puzzlePieces = [];
  let originalImageWidth, originalImageHeight;
  let firstSelectedPiece = null;

  // Initialize game settings
  puzzleSizeSelect.addEventListener('change', (e) => {
    puzzleSize = parseInt(e.target.value);
    if (img.src) {
      createPuzzle(img);
    }
  });

  startCameraButton.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          let video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          video.addEventListener('canplay', () => {
            captureImageFromVideo(video);
            stream.getTracks().forEach(track => track.stop());
          });
        })
        .catch(err => alert('Camera access denied or not available.'));
    } else {
      alert('Camera access not supported on this device.');
    }
  });

  uploadButton.addEventListener('click', () => {
    uploadInput.click();
  });

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
        img.onload = () => {
          originalImageWidth = img.width;
          originalImageHeight = img.height;
          createPuzzle(img);
        };
      };
      reader.readAsDataURL(file);
    }
  });

  shuffleButton.addEventListener('click', shufflePuzzle);
  restartButton.addEventListener('click', () => createPuzzle(img));
  revealButton.addEventListener('click', revealOriginal);

  function captureImageFromVideo(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    img.src = canvas.toDataURL('image/png');
    img.onload = () => {
      originalImageWidth = img.width;
      originalImageHeight = img.height;
      createPuzzle(img);
    };
  }

  function createPuzzle(image) {
    gameArea.innerHTML = '';
    puzzlePieces = [];
    firstSelectedPiece = null;
    const aspectRatio = originalImageWidth / originalImageHeight;
    const gameAreaWidth = Math.min(window.innerWidth, 1000);
    const gameAreaHeight = gameAreaWidth / aspectRatio;

    gameArea.style.height = `${gameAreaHeight}px`;
    const pieceWidth = gameAreaWidth / puzzleSize;
    const pieceHeight = gameAreaHeight / puzzleSize;

    for (let y = 0; y < puzzleSize; y++) {
      for (let x = 0; x < puzzleSize; x++) {
        const canvas = document.createElement('canvas');
        canvas.width = pieceWidth;
        canvas.height = pieceHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, x * image.width / puzzleSize, y * image.height / puzzleSize, image.width / puzzleSize, image.height / puzzleSize, 0, 0, pieceWidth, pieceHeight);
        canvas.classList.add('puzzlePiece');
        canvas.style.width = `${pieceWidth}px`;
        canvas.style.height = `${pieceHeight}px`;
        canvas.style.left = `${x * pieceWidth}px`;
        canvas.style.top = `${y * pieceHeight}px`;
        canvas.dataset.index = y * puzzleSize + x;
        canvas.dataset.x = x;
        canvas.dataset.y = y;
        canvas.addEventListener('click', onPieceClick);
        gameArea.appendChild(canvas);
        puzzlePieces.push(canvas);
      }
    }
    shufflePuzzle();
  }

  function shufflePuzzle() {
    const positions = puzzlePieces.map(piece => ({ x: piece.style.left, y: piece.style.top }));
    positions.sort(() => Math.random() - 0.5);
    puzzlePieces.forEach((piece, index) => {
      piece.style.left = positions[index].x;
      piece.style.top = positions[index].y;
    });
  }

  function onPieceClick(event) {
    const clickedPiece = event.target;

    if (!firstSelectedPiece) {
      firstSelectedPiece = clickedPiece;
      firstSelectedPiece.style.border = '2px solid lightblue';
    } else {
      if (firstSelectedPiece !== clickedPiece) {
        swapPieces(firstSelectedPiece, clickedPiece);
        firstSelectedPiece.style.border = 'none';
        firstSelectedPiece = null;
        if (isPuzzleSolved()) {
          alert('Congratulations! You solved the puzzle.');
        }
      }
    }
  }

  function swapPieces(piece1, piece2) {
    const tempLeft = piece1.style.left;
    const tempTop = piece1.style.top;
    piece1.style.left = piece2.style.left;
    piece1.style.top = piece2.style.top;
    piece2.style.left = tempLeft;
    piece2.style.top = tempTop;
  }

  function isPuzzleSolved() {
    return puzzlePieces.every(piece => {
      const correctLeft = parseInt(piece.dataset.x) * parseInt(piece.style.width);
      const correctTop = parseInt(piece.dataset.y) * parseInt(piece.style.height);
      return parseInt(piece.style.left) === correctLeft && parseInt(piece.style.top) === correctTop;
    });
  }

  function revealOriginal() {
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.top = 0;
    img.style.left = 0;
    img.style.opacity = 0.9;
    gameArea.appendChild(img);
    setTimeout(() => {
      gameArea.removeChild(img);
    }, 3000);
  }
});
