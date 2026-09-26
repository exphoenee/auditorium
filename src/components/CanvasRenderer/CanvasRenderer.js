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

    this.pinchStartDist = null;
    this.pinchStartZoom = 1;

    this.seatRects = [];
    this.sectorLayouts = [];

    this._onResize = this.resize.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onWheel = this.onWheel.bind(this);
    this._onClick = this.onClick.bind(this);
    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);
  }

  mount(container) {
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;touch-action:none;';
    container.appendChild(this.canvas);
    this.createZoomControls(container);

    window.addEventListener('resize', this._onResize);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    this.canvas.addEventListener('click', this._onClick);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd);
    this.canvas.addEventListener('touchcancel', this._onTouchEnd);

    this.resize();
    this.fitToScreen();
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this.canvas.removeEventListener('touchcancel', this._onTouchEnd);
    if (this.zoomControls) this.zoomControls.remove();
    this.canvas.remove();
  }

  createZoomControls(container) {
    const controls = document.createElement('div');
    controls.className = 'zoom-controls';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.type = 'button';
    zoomInBtn.className = 'zoom-btn zoom-in';
    zoomInBtn.title = 'Zoom in';
    zoomInBtn.setAttribute('aria-label', 'Zoom in');
    zoomInBtn.textContent = '+';
    zoomInBtn.addEventListener('click', () => this.zoomByStep(1.25));

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.type = 'button';
    zoomOutBtn.className = 'zoom-btn zoom-out';
    zoomOutBtn.title = 'Zoom out';
    zoomOutBtn.setAttribute('aria-label', 'Zoom out');
    zoomOutBtn.textContent = '−';
    zoomOutBtn.addEventListener('click', () => this.zoomByStep(1 / 1.25));

    const fitBtn = document.createElement('button');
    fitBtn.type = 'button';
    fitBtn.className = 'zoom-btn zoom-fit';
    fitBtn.title = 'Fit to screen';
    fitBtn.setAttribute('aria-label', 'Fit to screen');
    fitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    fitBtn.addEventListener('click', () => {
      this.fitToScreen();
      this.render();
    });

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(fitBtn);
    container.appendChild(controls);
    this.zoomControls = controls;
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
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.min(scaleX, scaleY)));
    this.panX = (this.canvas.width - VIRTUAL_W * this.zoom) / 2;
    this.panY = (this.canvas.height - VIRTUAL_H * this.zoom) / 2;
    this.render();
  }

  /** Zooms so that `newZoom` is reached while keeping the point under (sx, sy) fixed on screen. */
  zoomAtPoint(sx, sy, newZoom) {
    newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    this.panX = sx - (sx - this.panX) * (newZoom / this.zoom);
    this.panY = sy - (sy - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
  }

  /** Zooms by `factor` around the canvas center, for the +/- buttons. */
  zoomByStep(factor) {
    this.zoomAtPoint(this.canvas.width / 2, this.canvas.height / 2, this.zoom * factor);
    this.render();
  }

  getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  getTouchMidpoint(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
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
    this.zoomAtPoint(mx, my, this.zoom * factor);
    this.render();
  }

  onClick(e) {
    if (this.dragMoved) return;
    this.selectSeatAtClient(e.clientX, e.clientY);
  }

  selectSeatAtClient(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = this.screenToCanvas(clientX - rect.left, clientY - rect.top);

    for (const sr of this.seatRects) {
      if (x >= sr.x && x <= sr.x + sr.w && y >= sr.y && y <= sr.y + sr.h) {
        sr.seat.occupied ? sr.seat.setFree() : sr.seat.setOccupied('Clicked');
        this.render();
        return;
      }
    }
  }

  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.pinchStartDist = null;
    } else if (e.touches.length === 2) {
      this.isDragging = false;
      this.pinchStartDist = this.getTouchDist(e.touches);
      this.pinchStartZoom = this.zoom;
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    if (e.touches.length === 2 && this.pinchStartDist) {
      const dist = this.getTouchDist(e.touches);
      const mid = this.getTouchMidpoint(e.touches);
      const newZoom = this.pinchStartZoom * (dist / this.pinchStartDist);
      this.zoomAtPoint(mid.x - rect.left, mid.y - rect.top, newZoom);
      this.render();
    } else if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.dragStartX;
      const dy = e.touches[0].clientY - this.dragStartY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;
      this.panX += dx;
      this.panY += dy;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.render();
    }
  }

  onTouchEnd(e) {
    if (e.touches.length === 0) {
      if (this.isDragging && !this.dragMoved && e.changedTouches.length) {
        const t = e.changedTouches[0];
        this.selectSeatAtClient(t.clientX, t.clientY);
      }
      this.isDragging = false;
      this.pinchStartDist = null;
    } else if (e.touches.length === 1) {
      // One finger lifted out of a pinch, resume panning from the remaining finger.
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.pinchStartDist = null;
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
