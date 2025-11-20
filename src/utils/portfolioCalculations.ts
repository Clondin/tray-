
import type { Portfolio, CalculatedProperty } from '../types';

export const calculatePortfolio = (portfolioId: string, portfolios: Portfolio[], calculatedProperties: CalculatedProperty[]) => {
  const portfolio = portfolios.find(p => p.id === portfolioId);
  if (!portfolio) return null;
  
  const properties = calculatedProperties.filter(p => portfolio.propertyIds.includes(p.id));
  const totalRooms = properties.reduce((sum, p) => sum + p.rooms, 0);
  if (totalRooms === 0) return { ...portfolio, propertyCount: 0, totalRooms: 0, current: {}, stabilized: {}, valuation: {} };

  const currentGRI = properties.reduce((sum, p) => sum + p.current.gri, 0);
  const currentOpex = properties.reduce((sum, p) => sum + p.current.opex, 0);
  const currentNOI = properties.reduce((sum, p) => sum + p.current.noi, 0);
  const stabilizedGRI = properties.reduce((sum, p) => sum + p.stabilized.gri, 0);
  const stabilizedOpex = properties.reduce((sum, p) => sum + p.stabilized.opex, 0);
  const stabilizedNOI = properties.reduce((sum, p) => sum + p.stabilized.noi, 0);
  const totalAskingPrice = properties.reduce((sum, p) => sum + p.valuation.askingPrice, 0);
  const totalStabilizedValue = properties.reduce((sum, p) => sum + p.valuation.stabilizedValue, 0);
  const stabilizedOccupancy = properties.reduce((sum, p) => sum + (p.stabilized.occupancy * p.rooms), 0) / totalRooms;

  // Value Creation %
  const upside = totalAskingPrice > 0 ? ((totalStabilizedValue - totalAskingPrice) / totalAskingPrice) * 100 : 0;

  return {
    ...portfolio,
    propertyCount: properties.length,
    totalRooms,
    current: { gri: currentGRI, opex: currentOpex, noi: currentNOI, capRate: totalAskingPrice > 0 ? (currentNOI / totalAskingPrice) * 100 : 0, occupancy: (properties.reduce((sum, p) => sum + (p.current.occupancy * p.rooms), 0) / totalRooms) },
    stabilized: { gri: stabilizedGRI, opex: stabilizedOpex, noi: stabilizedNOI, capRate: totalAskingPrice > 0 ? (stabilizedNOI / totalAskingPrice) * 100 : 0, occupancy: stabilizedOccupancy },
    valuation: { askingPrice: totalAskingPrice, stabilizedValue: totalStabilizedValue, pricePerRoom: totalAskingPrice / totalRooms, upside }
  };
};
