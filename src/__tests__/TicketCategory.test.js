import { describe, it, expect } from 'vitest';
import { TicketCategory } from '../model/Tickets/TicketCategory.js';

describe('TicketCategory', () => {
  it('should return correct price for each category', () => {
    expect(new TicketCategory(0).getPrice()).toBe(2000);
    expect(new TicketCategory(1).getPrice()).toBe(3000);
    expect(new TicketCategory(2).getPrice()).toBe(4000);
    expect(new TicketCategory(3).getPrice()).toBe(5000);
  });

  it('should return correct category', () => {
    expect(new TicketCategory(0).getCategory()).toBe(0);
    expect(new TicketCategory(3).getCategory()).toBe(3);
  });

  it('should update category with setCategory', () => {
    const tc = new TicketCategory(0);
    tc.setCategory(2);
    expect(tc.getCategory()).toBe(2);
    expect(tc.getPrice()).toBe(4000);
  });
});
