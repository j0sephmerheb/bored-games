import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cam-puzzle',
  standalone: true,
  imports: [],
  templateUrl: './cam-puzzle.component.html',
  styleUrl: './cam-puzzle.component.scss',
})
export class CamPuzzleComponent implements AfterViewInit {
  @ViewChild('gameArea') gameAreaRef!: ElementRef;
  @ViewChild('uploadInput') uploadInputRef!: ElementRef;

  img = new Image();
  puzzleSize = 4;
  puzzlePieces: any[] = [];
  originalImageWidth!: number;
  originalImageHeight!: number;
  firstSelectedPiece: any = null;

  ngAfterViewInit() {
    this.initializeGameSettings();
  }

  initializeGameSettings() {
    const puzzleSizeSelect = document.getElementById(
      'puzzleSize'
    ) as HTMLSelectElement;
    puzzleSizeSelect.addEventListener('change', (e: any) => {
      this.puzzleSize = parseInt(e.target.value);
      if (this.img.src) {
        this.createPuzzle(this.img);
      }
    });

    const startCameraButton = document.getElementById('startCamera');
    startCameraButton?.addEventListener('click', () => this.startCamera());

    const uploadButton = document.getElementById('uploadPhoto');
    uploadButton?.addEventListener('click', () => 
      this.uploadInputRef.nativeElement.click()
  );

    const uploadInput = this.uploadInputRef.nativeElement;
    uploadInput.addEventListener('change', (e: any) => 
      this.handleFileUpload(e)
  );

    const restartButton = document.getElementById('restart');
    restartButton?.addEventListener('click', () => this.createPuzzle(this.img));

    const revealButton = document.getElementById('reveal');
    revealButton?.addEventListener('click', () => this.revealOriginal());
  }

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.img.src = e.target.result;
        this.img.onload = () => {
          this.originalImageWidth = this.img.width;
          this.originalImageHeight = this.img.height;
          this.createPuzzle(this.img);
        };
      };
      reader.readAsDataURL(file);
    }
  }

  startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          let video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          video.addEventListener('canplay', () => {
            this.captureImageFromVideo(video);
            stream.getTracks().forEach((track) => track.stop());
          });
        })
        .catch((err) => alert('Camera access denied or not available.'));
    } else {
      alert('Camera access not supported on this device.');
    }
  }

  captureImageFromVideo(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply brightness adjustment (example)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const adjustment = 30; // Example adjustment value
      for (let i = 0; i < data.length; i += 4) {
        data[i] += adjustment;     // R
        data[i + 1] += adjustment; // G
        data[i + 2] += adjustment; // B
      }
      context.putImageData(imageData, 0, 0);

      this.img.src = canvas.toDataURL('image/png');
      this.img.onload = () => {
        this.originalImageWidth = this.img.width;
        this.originalImageHeight = this.img.height;
        this.createPuzzle(this.img);
      };
    }
  }


  createPuzzle(image: HTMLImageElement) {
    const gameArea = this.gameAreaRef.nativeElement;
    gameArea.innerHTML = '';
    this.puzzlePieces = [];
    this.firstSelectedPiece = null;
    const aspectRatio = this.originalImageWidth / this.originalImageHeight;
    const gameAreaWidth = Math.min(window.innerWidth, 1000);
    const gameAreaHeight = gameAreaWidth / aspectRatio;

    gameArea.style.height = `${gameAreaHeight}px`;
    const pieceWidth = gameAreaWidth / this.puzzleSize;
    const pieceHeight = gameAreaHeight / this.puzzleSize;

    for (let y = 0; y < this.puzzleSize; y++) {
      for (let x = 0; x < this.puzzleSize; x++) {
        const canvas = document.createElement('canvas');
        canvas.width = pieceWidth;
        canvas.height = pieceHeight;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(
            image,
            (x * image.width) / this.puzzleSize,
            (y * image.height) / this.puzzleSize,
            image.width / this.puzzleSize,
            image.height / this.puzzleSize,
            0,
            0,
            pieceWidth,
            pieceHeight
          );
          canvas.classList.add('puzzlePiece');
          canvas.style.width = `${pieceWidth}px`;
          canvas.style.height = `${pieceHeight}px`;
          canvas.style.left = `${x * pieceWidth}px`;
          canvas.style.top = `${y * pieceHeight}px`;
          canvas.dataset['index'] = (y * this.puzzleSize + x).toString();
          canvas.dataset['x'] = x.toString();
          canvas.dataset['y'] = y.toString();
          canvas.addEventListener('click', (event) => this.onPieceClick(event));
          gameArea.appendChild(canvas);
          this.puzzlePieces.push(canvas);
        }
      }
    }
    this.shufflePuzzle();
  }

  shufflePuzzle() {
    const positions = this.puzzlePieces.map((piece) => ({
      x: piece.style.left,
      y: piece.style.top,
    }));
    positions.sort(() => Math.random() - 0.5);
    this.puzzlePieces.forEach((piece, index) => {
      piece.style.left = positions[index].x;
      piece.style.top = positions[index].y;
    });
  }

  onPieceClick(event: MouseEvent) {
    const clickedPiece = event.target as HTMLElement;

    if (!this.firstSelectedPiece) {
      this.firstSelectedPiece = clickedPiece;
      this.firstSelectedPiece.style.border = '2px solid lightblue';
    } else {
      if (this.firstSelectedPiece === clickedPiece) {
        // Deselect the piece if clicked again
        this.firstSelectedPiece.style.border = 'none';
        this.firstSelectedPiece = null;
      } else {
        this.swapPieces(this.firstSelectedPiece, clickedPiece);
        this.firstSelectedPiece.style.border = 'none';
        this.firstSelectedPiece = null;
        if (this.isPuzzleSolved()) {
          alert('Congratulations! You solved the puzzle.');
        }
      }
    }
  }

  swapPieces(piece1: HTMLElement, piece2: HTMLElement) {
    const tempLeft = piece1.style.left;
    const tempTop = piece1.style.top;
    piece1.style.left = piece2.style.left;
    piece1.style.top = piece2.style.top;
    piece2.style.left = tempLeft;
    piece2.style.top = tempTop;
  }

  isPuzzleSolved() {
    return this.puzzlePieces.every((piece) => {
      const correctLeft = 
      parseInt(piece.dataset.x!) * parseInt(piece.style.width);
      const correctTop = 
      parseInt(piece.dataset.y!) * parseInt(piece.style.height);
      return (
        parseInt(piece.style.left) === correctLeft &&
        parseInt(piece.style.top) === correctTop
      );
    });
  }

  revealOriginal() {
    const gameArea = this.gameAreaRef.nativeElement;
    this.img.style.position = 'absolute';
    this.img.style.width = '100%';
    this.img.style.height = '100%';
    this.img.style.top = '0';
    this.img.style.left = '0';
    this.img.style.opacity = '0.9';
    gameArea.appendChild(this.img);
    setTimeout(() => {
      gameArea.removeChild(this.img);
    }, 3000);
  }
}
