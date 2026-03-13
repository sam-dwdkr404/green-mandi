import Dexie from "dexie";

export const db = new Dexie("GreenMandiDB");

db.version(1).stores({
  listings: "++id,crop,farmer,quantity,price,location,synced,createdAt",
  orders: "++id,crop,buyer,quantity,price,paymentStatus,synced,createdAt",
});
