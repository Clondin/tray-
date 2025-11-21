
import type { PropertyData, PriceAllocations } from '../types';

export const PROPERTIES_DATA: PropertyData[] = [
  { id: 1, address: "75 Baldwin Ave, Newark, NJ 07107", rooms: 16, occupancy: 100, city: "Newark", imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80" },
  { id: 2, address: "11-13 Lincoln Park, Newark, NJ 07102", rooms: 35, occupancy: 85, city: "Newark", type: "non-class-a" },
  { id: 3, address: "350 East Main Street, Somerville, NJ 08876", rooms: 39, occupancy: 82, city: "Somerville", type: "non-class-a" },
  { id: 4, address: "677-681 Clinton Ave, Newark, NJ 07108", rooms: 30, occupancy: 57, city: "Newark" },
  { id: 5, address: "168 Clinton Ave, Newark, NJ 07108", rooms: 18, occupancy: 78, city: "Newark" },
  { id: 6, address: "50 South Walnut St, East Orange, NJ 07018", rooms: 11, occupancy: 18, city: "East Orange" },
  { id: 7, address: "52 South Walnut St, East Orange, NJ 07018", rooms: 11, occupancy: 18, city: "East Orange" },
  { id: 8, address: "69 Pennsylvania Ave, Newark, NJ 07105", rooms: 12, occupancy: 8, city: "Newark" },
  { id: 9, address: "1163 Broad St, Newark, NJ 07114", rooms: 14, occupancy: 57, city: "Newark" },
  { id: 10, address: "19 Lincoln Park, Newark, NJ 07102", rooms: 18, occupancy: 56, city: "Newark" },
  { id: 11, address: "468 Washington St, Newark, NJ 07102", rooms: 12, occupancy: 75, city: "Newark" },
  { id: 12, address: "471 Washington St, Newark, NJ 07102", rooms: 16, occupancy: 0, city: "Newark" },
  { id: 13, address: "472 Washington St, Newark, NJ 07102", rooms: 18, occupancy: 76, city: "Newark" },
  { id: 14, address: "474 Washington St, Newark, NJ 07102", rooms: 14, occupancy: 64, city: "Newark" },
  { id: 15, address: "476 Washington St, Newark, NJ 07102", rooms: 13, occupancy: 69, city: "Newark" }
];

const sortedProperties = [...PROPERTIES_DATA].sort((a, b) => b.occupancy - a.occupancy);
export const lowRiskIds = sortedProperties.slice(0, 7).map(p => p.id);
export const highRiskIds = sortedProperties.slice(7).map(p => p.id);

const totalRooms = PROPERTIES_DATA.reduce((sum, p) => sum + p.rooms, 0);
export const initialAllocations: PriceAllocations = {};
PROPERTIES_DATA.forEach(p => {
  initialAllocations[p.id] = (p.rooms / totalRooms) * 100;
});
