import { Sector } from '../Sector/Sector.js';
import { createDOMElem } from 'domelemjs';
import { CanvasRenderer } from '../CanvasRenderer/CanvasRenderer.js';

class Auditorium {
  constructor(sectors) {
    this.sectors = [];
    this.seatNumber = 0;
    this.canvasRenderer = null;
    this.weighting = {
      rowNumber: 10,
      sectorIndex: 1000,
      positionIndex: 1,
      neighboursPrice: 100,
    };

    sectors.forEach((sectorConf, sectorId) => {
      const sector = new Sector({ ...sectorConf, sectorId });
      this.seatNumber += sector.seatNumber;
      this.sectors.push(sector);
    });
  }

  randomReservation(amount = 0) {
    if (amount < 0.2) {
      console.error(
        "The amount of reserved seat must be over 20% of the entire seats!"
      );
    } else {
      const allSeats = this.getAllSeats();
      const seatNr = allSeats.length;
      do {
        allSeats[Math.floor(Math.random() * seatNr)].setOccupied("Random");
      } while (
        this.getOccupiedSeats().length <= Math.ceil(seatNr * amount)
      );
    }
  }

  reserve(numberOfSeats) {
    numberOfSeats = Math.max(2, Math.min(8, Math.floor(numberOfSeats || 4)));

    let results = [];

    this.sectors.forEach((sector) => {
      sector.rows.forEach((row) => {
        const rowLength = row.seatsNumber;
        for (let i = 0; i < row.seatsNumber - numberOfSeats; i++) {
          const nextNeighbours = row.seats.slice(i, i + numberOfSeats);

          const isAllFree = nextNeighbours
            .map((seat) => seat.occupied)
            .every((seat) => !seat);

          if (isAllFree) {
            const neighboursPrice =
              nextNeighbours
                .map((seat) => 4 - seat.seatCategory.getCategory())
                .reduce((sum, category) => sum + category) /
              (numberOfSeats * 4);

            const positionIndex =
              (1 +
                nextNeighbours
                  .map((seat) => seat.seatPosPreference)
                  .reduce((a, b) => a + b)) /
              rowLength /
              2;

            const rowNumber = row.rowNr + 1;
            const sectorIndex = sector.sectorPreference / 4;

            const factors = {
              rowNumber,
              sectorIndex,
              positionIndex,
              neighboursPrice,
            };

            let weightedFactors = { ...factors };
            Object.keys(weightedFactors).forEach(
              (index) =>
                (weightedFactors[index] =
                  factors[index] * this.weighting[index])
            );

            let positionValue = 1;
            Object.keys(weightedFactors).forEach(
              (index) => (positionValue += weightedFactors[index])
            );

            const seatText = nextNeighbours
              .map((seat) => seat.seatNr + 1)
              .join(", ");

            results.push({
              sectorName: sector.name,
              rowNumber,
              seatNumbers: seatText,
              seats: nextNeighbours,
              ...weightedFactors,
              positionValue,
            });
          }
        }
      });
    });

    results.sort((a, b) => a.positionValue - b.positionValue);
    this.renderResults(results);
    return results;
  }

  renderResults(results) {
    const container = document.getElementById("results");
    if (!container) return;
    container.innerHTML = "";
    if (!results.length) {
      createDOMElem({
        tag: "p",
        attrs: { class: "result-row" },
        content: "Unfortunately there is no solution...",
        parent: container,
      });
      return;
    }

    const header = createDOMElem({
      tag: "div",
      attrs: { class: "result-header" },
      parent: container,
    });
    ["#", "Sector", "Row", "Seats", "Value"].forEach((h) => {
      const cell = document.createElement("span");
      cell.className = "result-cell";
      cell.textContent = h;
      header.appendChild(cell);
    });

    results.slice(0, 10).forEach((r, i) => {
      const label = createDOMElem({
        tag: "label",
        attrs: { class: `result-row ${i === 0 ? "best" : ""}` },
        parent: container,
      });

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "result";
      radio.value = i;
      radio.checked = i === 0;
      radio.addEventListener("change", () => {
        this.highlightedSeats = r.seats;
        if (this.canvasRenderer) this.canvasRenderer.render();
      });

      const cells = [
        radio,
        r.sectorName,
        r.rowNumber,
        r.seatNumbers,
        r.positionValue.toFixed(1),
      ];
      cells.forEach((val, ci) => {
        const cell = document.createElement("span");
        cell.className = "result-cell";
        if (ci === 0) {
          cell.appendChild(val);
        } else {
          cell.textContent = val;
        }
        label.appendChild(cell);
      });
    });

    if (results.length) {
      this.highlightedSeats = results[0].seats;
      if (this.canvasRenderer) this.canvasRenderer.render();
    }
  }

  getSeatNumber() {
    return this.seatNumber;
  }

  getAllSeats() {
    return this.sectors.map((sector) => sector.getAllSeats()).flat(1);
  }

  getOccupiedSeats() {
    return this.sectors.map((sector) => sector.getOccupiedSeats()).flat(1);
  }

  getFreeSeats() {
    return this.sectors.map((sector) => sector.getFreeSeats()).flat(1);
  }

  freeUpAllSeats() {
    this.getAllSeats().forEach((seat) => seat.setFree());
    if (this.canvasRenderer) this.canvasRenderer.render();
  }

  renderCanvas(container) {
    this.addPanel(container);
    this.canvasRenderer = new CanvasRenderer(this);
    this.canvasRenderer.mount(container);
    this.canvasRenderer.fitToScreen();
  }

  addPanel(container) {
    const parent = container || document.body;

    const makeSpinner = (id, value, min, max, step) => {
      const group = document.createElement("div");
      group.className = "spinner-group";

      const inp = document.createElement("input");
      inp.type = "number";
      inp.id = id;
      inp.value = value;
      inp.min = min;
      inp.max = max;
      if (step) inp.step = step;
      group.appendChild(inp);

      const arrows = document.createElement("div");
      arrows.className = "spinner-arrows";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.textContent = "\u25B2";
      upBtn.addEventListener("click", () => {
        inp.value = Math.min(max, +(inp.value || 0) + (step ? +step : 1));
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.textContent = "\u25BC";
      downBtn.addEventListener("click", () => {
        inp.value = Math.max(min, +(inp.value || 0) - (step ? +step : 1));
      });

      arrows.appendChild(upBtn);
      arrows.appendChild(downBtn);
      group.appendChild(arrows);
      return group;
    };

    const panel = createDOMElem({
      tag: "div",
      attrs: { class: "panel" },
      parent: parent,
    });

    const header = createDOMElem({
      tag: "div",
      attrs: { class: "panel-header" },
      parent: panel,
    });
    createDOMElem({
      tag: "span",
      attrs: { class: "panel-title" },
      content: "Auditorium",
      parent: header,
    });

    const headerBtns = createDOMElem({
      tag: "div",
      attrs: { class: "panel-header-btns" },
      parent: header,
    });

    const githubBtn = createDOMElem({
      tag: "a",
      attrs: {
        class: "panel-btn github-btn",
        title: "GitHub",
        href: "https://github.com/exphoenee/auditorium",
        target: "_blank",
        rel: "noopener noreferrer",
      },
      parent: headerBtns,
    });
    githubBtn.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

    createDOMElem({
      tag: "button",
      attrs: { class: "panel-btn help-btn", title: "Help" },
      content: "?",
      handleEvent: {
        event: "click",
        cb: () => this.showHelp(),
      },
      parent: headerBtns,
    });

    const reopenBtn = createDOMElem({
      tag: "button",
      attrs: { class: "reopen-btn", title: "Open panel" },
      content: "\u2630",
      parent: parent,
    });
    reopenBtn.style.display = "none";
    reopenBtn.addEventListener("click", () => {
      panel.style.display = "";
      reopenBtn.style.display = "none";
    });

    createDOMElem({
      tag: "button",
      attrs: { class: "panel-btn close-btn", title: "Close panel" },
      content: "\u00D7",
      handleEvent: {
        event: "click",
        cb: () => {
          panel.style.display = "none";
          reopenBtn.style.display = "";
        },
      },
      parent: headerBtns,
    });

    const row1 = createDOMElem({
      tag: "div",
      attrs: { class: "reserve-panel" },
      parent: panel,
    });
    row1.appendChild(makeSpinner("max", 4, 2, 8));
    createDOMElem({
      tag: "button",
      attrs: { class: "reserve" },
      handleEvent: {
        event: "click",
        cb: () => {
          this.reserve(+document.getElementById("max").value || 4);
          if (this.canvasRenderer) this.canvasRenderer.render();
        },
      },
      content: "reserve",
      parent: row1,
    });

    const row2 = createDOMElem({
      tag: "div",
      attrs: { class: "reserve-panel" },
      parent: panel,
    });
    row2.appendChild(makeSpinner("random", 0.2, 0.2, 1, 0.1));
    createDOMElem({
      tag: "button",
      attrs: { class: "randomize" },
      handleEvent: {
        event: "click",
        cb: () => {
          this.freeUpAllSeats();
          this.randomReservation(+document.getElementById("random").value);
          this.reserve(+document.getElementById("max").value || 4);
          if (this.canvasRenderer) this.canvasRenderer.render();
        },
      },
      content: "randomize",
      parent: row2,
    });

    createDOMElem({
      tag: "div",
      attrs: { id: "results", class: "results" },
      parent: panel,
    });
  }

  showHelp() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    const modal = document.createElement("div");
    modal.className = "modal";

    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close";
    closeBtn.textContent = "\u00D7";
    closeBtn.addEventListener("click", () => overlay.remove());
    modal.appendChild(closeBtn);

    const title = document.createElement("h2");
    title.textContent = "Auditorium";
    modal.appendChild(title);

    const sections = [
      {
        h: "What is this?",
        p: "An interactive theater seat reservation system. It models a multi-sector auditorium and finds the best contiguous blocks of N adjacent free seats using a weighted scoring algorithm.",
      },
      {
        h: "Navigation",
        items: [
          "Pan: Click and drag anywhere on the canvas",
          "Zoom: Mouse wheel (zooms toward cursor position)",
          "Fit to screen: The view auto-fits on load",
        ],
      },
      {
        h: "Reserving seats",
        items: [
          "Set the number of seats (2\u20138) using the spinner",
          "Click \u201CReserve\u201D to find the best available blocks",
          "Results appear in a table below \u2014 click a row to highlight those seats in red on the canvas",
        ],
      },
      {
        h: "Random occupancy",
        items: [
          "Set the occupancy ratio (0.2\u20131.0)",
          "Click \u201CRandomize\u201D to free all seats and fill randomly",
          "The reserve results auto-update after randomization",
        ],
      },
      {
        h: "Scoring",
        p: "Each seat block is scored by: price category (higher = better), sector (Auditorium > Balcony > Boxes), row proximity to stage, and centeredness in the row. Lower score = better position.",
      },
    ];

    sections.forEach((s) => {
      const h3 = document.createElement("h3");
      h3.textContent = s.h;
      modal.appendChild(h3);
      if (s.p) {
        const pp = document.createElement("p");
        pp.textContent = s.p;
        modal.appendChild(pp);
      }
      if (s.items) {
        const ul = document.createElement("ul");
        s.items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        });
        modal.appendChild(ul);
      }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
}

export { Auditorium };
