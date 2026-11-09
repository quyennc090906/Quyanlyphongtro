'use strict';

function calculateInvoice(input) {
  const oldElectric = Number(input.oldElectric);
  const newElectric = Number(input.newElectric);
  const oldWater = Number(input.oldWater);
  const newWater = Number(input.newWater);
  const electricPrice = Number(input.electricPrice || 0);
  const waterPrice = Number(input.waterPrice || 0);
  if (![oldElectric,newElectric,oldWater,newWater,electricPrice,waterPrice].every(Number.isFinite)) throw new TypeError('Chỉ số và đơn giá phải là số hợp lệ.');
  if (oldElectric < 0 || oldWater < 0 || electricPrice < 0 || waterPrice < 0) throw new RangeError('Chỉ số và đơn giá không được âm.');
  if (newElectric < oldElectric || newWater < oldWater) throw new RangeError('Chỉ số mới không được nhỏ hơn chỉ số cũ.');
  const electricUsage = newElectric - oldElectric;
  const waterUsage = newWater - oldWater;
  const electricTotal = electricUsage * electricPrice;
  const waterTotal = waterUsage * waterPrice;
  const roomPrice = Number(input.roomPrice || 0);
  const internetPrice = Number(input.internetPrice || 0);
  const trashPrice = Number(input.trashPrice || 0);
  const otherFee = Number(input.otherFee || 0);
  const discount = Number(input.discount || 0);
  const money = [roomPrice,internetPrice,trashPrice,otherFee,discount,electricTotal,waterTotal];
  if (!money.every(value => Number.isSafeInteger(value) && value >= 0)) throw new RangeError('Các khoản tiền phải là số nguyên không âm trong giới hạn an toàn.');
  const totalAmount = Math.max(0, roomPrice + electricTotal + waterTotal + internetPrice + trashPrice + otherFee - discount);
  if (!Number.isSafeInteger(totalAmount)) throw new RangeError('Tổng hóa đơn vượt giới hạn an toàn.');
  return { electricUsage, electricTotal, waterUsage, waterTotal, totalAmount };
}

module.exports = { calculateInvoice };
