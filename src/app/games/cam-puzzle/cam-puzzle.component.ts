import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cam-puzzle',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cam-puzzle.component.html',
  styleUrls: ['./cam-puzzle.component.scss'],
})
export class CamPuzzleComponent implements OnInit, OnDestroy {
  @ViewChild('gameArea') gameAreaRef!: ElementRef;
  @ViewChild('uploadInput') uploadInputRef!: ElementRef;

  img = new Image();
  puzzlePieces: any[] = [];
  originalImageWidth!: number;
  originalImageHeight!: number;
  firstSelectedPiece: any = null;
  gameStarted = false;
  alertMsg = '';
  puzzleSize = 4;
  puzzleSizes: number[] = [4, 6, 8, 10, 12];
  private resizeTimeout: any;
  private lastKnownWidth: number = window.innerWidth;

  ngOnInit(): void {
    // Add resize event listener
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy(): void {
    // Remove resize event listener to avoid memory leaks
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  /**
   * onResize
   */
  onResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      const currentWidth = window.innerWidth;

      // Check if the size has changed significantly
      if (Math.abs(currentWidth - this.lastKnownWidth) > 50) {
        this.lastKnownWidth = currentWidth;
        if (this.gameStarted) {
          this.adjustPuzzleSize();
        }
      }
    }, 1000);
  }

  /**
   * onPuzzleSizeChange
   */
  onPuzzleSizeChange(): void {
    if (this.img.src) {
      this.createPuzzle();
    }
  }

  /**
   * handleFileUpload
   * @param event
   */
  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.img.src = e.target.result;
        this.img.onload = () => {
          this.originalImageWidth = this.img.width;
          this.originalImageHeight = this.img.height;
          this.createPuzzle();
        };
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * captureImageFromVideo
   * @param video
   */
  captureImageFromVideo(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply brightness adjustment
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const adjustment = 30;
      for (let i = 0; i < data.length; i += 4) {
        data[i] += adjustment;
        data[i + 1] += adjustment;
        data[i + 2] += adjustment;
      }
      context.putImageData(imageData, 0, 0);

      this.img.src = canvas.toDataURL('image/png');
      this.img.onload = () => {
        this.originalImageWidth = this.img.width;
        this.originalImageHeight = this.img.height;
        this.createPuzzle();
      };
    }
  }

  /**
   * createPuzzle
   */
  createPuzzle() {
    const image: HTMLImageElement = this.img;
    const gameArea = this.gameAreaRef.nativeElement;
    gameArea.innerHTML = '';
    this.puzzlePieces = [];
    this.firstSelectedPiece = null;
    const aspectRatio = this.originalImageWidth / this.originalImageHeight;
    const maxPuzzleWidth = Math.floor(window.innerWidth / 4) * 4;
    const gameAreaWidth = Math.min(maxPuzzleWidth, 1000);
    const gameAreaHeight = gameAreaWidth / aspectRatio;

    gameArea.style.width = `${gameAreaWidth}px`;
    gameArea.style.height = `${gameAreaHeight}px`;
    const pieceWidth = Math.floor(gameAreaWidth / this.puzzleSize);
    const pieceHeight = Math.floor(gameAreaHeight / this.puzzleSize);

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
    this.gameStarted = true;
  }

  /**
   * shufflePuzzle
   */
  shufflePuzzle() {
    this.alertMsg = '';
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

  /**
   * onPieceClick
   * @param event
   */
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
          this.alertMsg = 'Congratulations! You solved the puzzle.';
        }
      }
    }
  }

  /**
   * swapPieces
   * @param piece1
   * @param piece2
   */
  swapPieces(piece1: HTMLElement, piece2: HTMLElement) {
    const tempLeft = piece1.style.left;
    const tempTop = piece1.style.top;
    piece1.style.left = piece2.style.left;
    piece1.style.top = piece2.style.top;
    piece2.style.left = tempLeft;
    piece2.style.top = tempTop;
  }

  /**
   * isPuzzleSolved
   * @returns
   */
  isPuzzleSolved() {
    const tolerance = 1; // Tolerance value for position comparison

    return this.puzzlePieces.every((piece) => {
      const correctLeft = parseInt(piece.dataset.x!) * piece.offsetWidth;
      const correctTop = parseInt(piece.dataset.y!) * piece.offsetHeight;
      const currentLeft = parseFloat(piece.style.left);
      const currentTop = parseFloat(piece.style.top);

      // Check if the current position is within the tolerance range of the correct position
      const leftWithinTolerance =
        Math.abs(currentLeft - correctLeft) <= tolerance;
      const topWithinTolerance = Math.abs(currentTop - correctTop) <= tolerance;

      return leftWithinTolerance && topWithinTolerance;
    });
  }

  /**
   * revealOriginal
   */
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
    }, 2000);
  }

  /**
   * uploadPhoto
   */
  uploadPhoto() {
    this.uploadInputRef.nativeElement.click();
    const uploadInput = this.uploadInputRef.nativeElement;
    uploadInput.addEventListener('change', (e: any) =>
      this.handleFileUpload(e)
    );
  }

  /**
   * adjustPuzzleSize
   */
  adjustPuzzleSize() {
    const gameArea = this.gameAreaRef.nativeElement;
    const aspectRatio = this.originalImageWidth / this.originalImageHeight;
    const maxPuzzleWidth = Math.floor(window.innerWidth / 4) * 4;
    const gameAreaWidth = Math.min(maxPuzzleWidth, 1000);
    const gameAreaHeight = gameAreaWidth / aspectRatio;
    gameArea.style.width = `${gameAreaWidth}px`;
    gameArea.style.height = `${gameAreaHeight}px`;

    const pieceWidth = Math.floor(gameAreaWidth / this.puzzleSize);
    const pieceHeight = Math.floor(gameAreaHeight / this.puzzleSize);

    this.puzzlePieces.forEach((piece) => {
      const originalX = parseInt(piece.dataset.x!);
      const originalY = parseInt(piece.dataset.y!);

      piece.style.left = `${originalX * pieceWidth}px`;
      piece.style.top = `${originalY * pieceHeight}px`;
      piece.style.width = `${pieceWidth}px`;
      piece.style.height = `${pieceHeight}px`;
    });

    // Reshuffle the puzzle to maintain randomness after resize
    this.shufflePuzzle();
  }
}
