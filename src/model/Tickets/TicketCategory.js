class TicketCategory {
  constructor(seatCategory) {
    this.seatCategory = seatCategory;
    this.priceList = { 0: 2000, 1: 3000, 2: 4000, 3: 5000 };
  }

  getPrice() {
    return this.priceList[this.seatCategory];
  }
  getCategory() {
    return this.seatCategory;
  }
  setCategory(seatCategory) {
    this.seatCategory = seatCategory;
    return this;
  }
}

export { TicketCategory };
