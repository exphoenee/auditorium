import { TicketCategory } from '../../model/Tickets/TicketCategory.js';
import { createDOMElem } from 'domelemjs';

class Seat {
  constructor({
    seatNr,
    seatCategory,
    guestName,
    sectorId,
    rowNr,
    sectorName,
    seatPosPreference,
    sectorPreference,
  }) {
    this.seatNr = seatNr;
    this.seatDOM = null;
    this.sectorId = sectorId;
    this.sectorName = sectorName;
    this.rowNr = rowNr;
    this.seatPosPreference = seatPosPreference;
    this.sectorPreference = sectorPreference;
    guestName ? this.setOccupied(guestName) : this.setFree();
    this.seatCategory = new TicketCategory(seatCategory);
  }

  render(parent) {
    this.seatDOM = createDOMElem({
      tag: "div",
      attrs: {
        class: `seat seatNr-${this.seatNr} category-${
          this.seatCategory.getCategory()
        } ${this.occupied ? "occupied" : "free"}`,
      },
      parent: parent,
      content: this.seatNr + 1,
      handleEvent: {
        event: "click",
        cb: (e) => {
          e.preventDefault();
          this.occupied ? this.setFree() : this.setOccupied("Test");
        },
      },
    });
  }

  getNumber() {
    return this.seatNr;
  }

  getGuestName() {
    return this.guestName;
  }

  setGuestName(guestName) {
    this.guestName = guestName;
  }

  getSeatPrice() {
    return this.seatCategory.getPrice();
  }

  getSeatCategory() {
    return this.seatCategory.getCategory();
  }

  getOccupied() {
    return this.occupied;
  }

  setOccupied(guestName = "unknown") {
    this.occupied = true;
    this.setGuestName(guestName);
    if (this.seatDOM) {
      this.seatDOM.classList.add("occupied");
      this.seatDOM.classList.remove("free");
    }
    return this;
  }

  setFree() {
    this.occupied = false;
    this.setGuestName(null);
    if (this.seatDOM) {
      this.seatDOM.classList.add("free");
      this.seatDOM.classList.remove("occupied");
    }
    return this;
  }
}

export { Seat };
