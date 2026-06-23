const CATEGORY_COLORS = ['#afefa5', '#a5d9ef', '#efdba5', '#efa5a5'];
const SEAT_SIZE = 14;
const SEAT_GAP = 3;
const ROW_LABEL_WIDTH = 40;
const SECTOR_PADDING = 20;
const VIRTUAL_W = 1200;
const VIRTUAL_H = 900;

class CanvasRenderer {
  constructor(auditorium) {
    this.auditorium = auditorium;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
    this.minZoom = 0.2;
    this.maxZoom = 5;

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragMoved = false;

    this.seatRects = [];
    this.sectorLayouts = [];

    this._onResize = this.resize.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onWheel = this.onWheel.bind(this);
    this._onClick = this.onClick.bind(this);
  }

  mount(container) {
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;';
    container.appendChild(this.canvas);

    window.addEventListener('resize', this._onResize);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    this.canvas.addEventListener('click', this._onClick);

    this.resize();
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.remove();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.render();
  }

  fitToScreen() {
    const padding = 80;
    const scaleX = (this.canvas.width - padding * 2) / VIRTUAL_W;
    const scaleY = (this.canvas.height - padding * 2) / VIRTUAL_H;
    this.zoom = Math.min(scaleX, scaleY);
    this.panX = (this.canvas.width - VIRTUAL_W * this.zoom) / 2;
    this.panY = (this.canvas.height - VIRTUAL_H * this.zoom) / 2;
  }

  screenToCanvas(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom,
    };
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.dragMoved = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;
    this.panX += dx;
    this.panY += dy;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.render();
  }

  onMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));

    this.panX = mx - (mx - this.panX) * (newZoom / this.zoom);
    this.panY = my - (my - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.render();
  }

  onClick(e) {
    if (this.dragMoved) return;
    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = this.screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);

    for (const sr of this.seatRects) {
      if (x >= sr.x && x <= sr.x + sr.w && y >= sr.y && y <= sr.y + sr.h) {
        sr.seat.occupied ? sr.seat.setFree() : sr.seat.setOccupied('Clicked');
        this.render();
        return;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    this.seatRects = [];
    this.sectorLayouts = [];

    this.drawStage(ctx);
    this.drawSectors(ctx);

    ctx.restore();
  }

  drawStage(ctx) {
    const stageW = 340;
    const stageH = 70;
    const stageX = (VIRTUAL_W - stageW) / 2;
    const stageY = 30;

    ctx.save();
    ctx.fillStyle = 'lightcoral';
    ctx.strokeStyle = '#c0706a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(stageX, stageY, stageW, stageH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Stage', stageX + stageW / 2, stageY + stageH / 2);
    ctx.restore();
  }

  drawSectors(ctx) {
    const sectors = this.auditorium.sectors;
    const count = sectors.length;

    const positions = [
      { cx: VIRTUAL_W * 0.50, cy: VIRTUAL_H * 0.42 },
      { cx: VIRTUAL_W * 0.50, cy: VIRTUAL_H * 0.78 },
      { cx: VIRTUAL_W * 0.22, cy: VIRTUAL_H * 0.72 },
      { cx: VIRTUAL_W * 0.78, cy: VIRTUAL_H * 0.72 },
      { cx: VIRTUAL_W * 0.10, cy: VIRTUAL_H * 0.25 },
      { cx: VIRTUAL_W * 0.10, cy: VIRTUAL_H * 0.42 },
      { cx: VIRTUAL_W * 0.10, cy: VIRTUAL_H * 0.58 },
      { cx: VIRTUAL_W * 0.90, cy: VIRTUAL_H * 0.25 },
      { cx: VIRTUAL_W * 0.90, cy: VIRTUAL_H * 0.42 },
      { cx: VIRTUAL_W * 0.90, cy: VIRTUAL_H * 0.58 },
    ];

    sectors.forEach((sector, i) => {
      const pos = positions[i] || { cx: VIRTUAL_W / 2, cy: VIRTUAL_H / 2 };
      this.drawSector(ctx, sector, pos.cx, pos.cy);
    });
  }

  drawSector(ctx, sector, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const isBox = sector.name.includes('Box');
    const isLeft = sector.name.includes('left');
    const isRight = sector.name.includes('right');
    let angle = 0;
    if (isBox && isLeft) angle = -90;
    else if (isBox && isRight) angle = 90;
    else if (sector.name.includes('Balcony left')) angle = -45;
    else if (sector.name.includes('Balcony right')) angle = 45;

    ctx.rotate((angle * Math.PI) / 180);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    const layout = this.measureSector(sector);
    const pad = SECTOR_PADDING;
    const bgW = layout.width + pad * 2;
    const bgH = layout.height + pad * 2 + 18;

    ctx.beginPath();
    ctx.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(sector.name, 0, -bgH / 2 + 4);

    this.sectorLayouts.push({
      sector,
      cx, cy, angle,
      w: bgW, h: bgH,
    });

    let yOffset = -bgH / 2 + 18 + pad;

    sector.rows.forEach((row, rowIdx) => {
      const seats = row.seats;
      const rowW = seats.length * (SEAT_SIZE + SEAT_GAP) - SEAT_GAP;
      const startX = -rowW / 2 + ROW_LABEL_WIDTH / 2;

      ctx.fillStyle = '#666';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${row.rowNr + 1}.`, -rowW / 2 - 4, yOffset + SEAT_SIZE / 2);

      seats.forEach((seat, seatIdx) => {
        const sx = startX + seatIdx * (SEAT_SIZE + SEAT_GAP);
        const sy = yOffset;

        const highlighted = this.auditorium.highlightedSeats &&
          this.auditorium.highlightedSeats.includes(seat);

        const cat = seat.seatCategory.getCategory();
        ctx.fillStyle = CATEGORY_COLORS[cat] || '#ddd';
        ctx.beginPath();
        ctx.roundRect(sx, sy, SEAT_SIZE, SEAT_SIZE, 2);
        ctx.fill();

        if (seat.occupied) {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.roundRect(sx, sy, SEAT_SIZE, SEAT_SIZE, 2);
          ctx.fill();
        }

        if (highlighted) {
          ctx.fillStyle = 'rgba(229, 57, 53, 0.3)';
          ctx.beginPath();
          ctx.roundRect(sx, sy, SEAT_SIZE, SEAT_SIZE, 2);
          ctx.fill();
          ctx.strokeStyle = '#e53935';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(sx, sy, SEAT_SIZE, SEAT_SIZE, 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.roundRect(sx, sy, SEAT_SIZE, SEAT_SIZE, 2);
          ctx.stroke();
        }

        ctx.fillStyle = seat.occupied ? 'rgba(255,255,255,0.7)' : (highlighted ? '#b71c1c' : '#333');
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${seat.seatNr + 1}`, sx + SEAT_SIZE / 2, sy + SEAT_SIZE / 2);

        this.seatRects.push({ x: sx, y: sy, w: SEAT_SIZE, h: SEAT_SIZE, seat });
      });

      yOffset += SEAT_SIZE + SEAT_GAP;
    });

    ctx.restore();
  }

  measureSector(sector) {
    const maxRowLen = Math.max(...sector.rows.map(r => r.seats.length));
    return {
      width: maxRowLen * (SEAT_SIZE + SEAT_GAP) + ROW_LABEL_WIDTH,
      height: sector.rows.length * (SEAT_SIZE + SEAT_GAP),
    };
  }
}

export { CanvasRenderer };
