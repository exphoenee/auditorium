import { Sector } from '../Sector/Sector.js';
import { createDOMElem, div, input, button } from '../../utils/domelemjs/domelemjs.js';

class Auditorium {
  constructor(sectors) {
    this.sectors = [];
    this.seatNumber = 0;
    this.wheighting = {
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
    let results = [];

    this.sectors.forEach((sector) => {
      sector.rows.forEach((row) => {
        const rowLength = row.seatsNumber;
        for (let i = 0; i < row.seatsNumber - numberOfSeats; i++) {
          const nextNeighbours = row.seats.slice(i, i + +numberOfSeats);

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

            let wheigtedFactors = { ...factors };
            Object.keys(wheigtedFactors).forEach(
              (index) =>
                (wheigtedFactors[index] =
                  factors[index] * this.wheighting[index])
            );

            let positionValue = 1;
            Object.keys(wheigtedFactors).forEach(
              (index) => (positionValue += wheigtedFactors[index])
            );

            const seatText = nextNeighbours
              .map((seat) => seat.seatNr + 1)
              .join(", ");

            results.push({
              sectorName: sector.name,
              rowNumber,
              seatNumbers: seatText,
              ...wheigtedFactors,
              positionValue,
            });
          }
        }
      });
    });

    results.length
      ? console.table(results.sort((a, b) => a.positionValue - b.positionValue))
      : console.log("Unfortunately there is no solution...");
    return results;
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
  }

  render(parent = "app") {
    this.addPanel();
    const auditoriumElem = createDOMElem({
      tag: div,
      attrs: { class: "auditorium" },
      parent: parent,
    });

    this.sectors.forEach((sector) => {
      sector.render(auditoriumElem);
    });
  }

  addPanel() {
    createDOMElem({
      tag: div,
      attrs: { class: "panel" },
      style: {
        position: "fixed",
        bottom: 0,
        left: 0,
        padding: "10px",
        margin: "10px",
      },
      children: [
        createDOMElem({
          tag: div,
          attrs: { class: "reserve-panel" },
          children: [
            createDOMElem({
              tag: input,
              attrs: { type: "number", id: "max", value: 4 },
              style: { width: "60px" },
            }),
            createDOMElem({
              tag: button,
              attrs: { class: "reserve" },
              handleEvent: {
                event: "click",
                cb: () => {
                  this.reserve(+document.getElementById("max").value || 4);
                },
              },
              content: "reserve",
            }),
          ],
        }),
        createDOMElem({
          tag: div,
          attrs: { class: "reserve-panel" },
          children: [
            createDOMElem({
              tag: input,
              attrs: {
                type: "number",
                step: "0.1",
                min: "0.1",
                max: "1",
                id: "random",
                value: 0.2,
              },
              style: { width: "60px" },
            }),
            createDOMElem({
              tag: button,
              attrs: { class: "randomize" },
              handleEvent: {
                event: "click",
                cb: () => {
                  this.freeUpAllSeats();
                  this.randomReservation(
                    +document.getElementById("random").value
                  );
                },
              },
              content: "randomize",
            }),
          ],
        }),
      ],
    });
  }
}

export { Auditorium };
