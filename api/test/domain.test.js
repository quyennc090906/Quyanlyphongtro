'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateInvoice } = require('../domain');

test('tính đúng điện, nước và tổng hóa đơn', () => {
  const result = calculateInvoice({ roomPrice:3200000,oldElectric:450,newElectric:520,electricPrice:3500,oldWater:60,newWater:65,waterPrice:20000,internetPrice:80000,trashPrice:30000,otherFee:0,discount:0 });
  assert.deepEqual(result,{electricUsage:70,electricTotal:245000,waterUsage:5,waterTotal:100000,totalAmount:3655000});
});

test('chỉ số mới nhỏ hơn chỉ số cũ bị từ chối', () => {
  assert.throws(() => calculateInvoice({oldElectric:100,newElectric:99,oldWater:1,newWater:1}),/nhỏ hơn/);
  assert.throws(() => calculateInvoice({oldElectric:0,newElectric:0,oldWater:3,newWater:2}),/nhỏ hơn/);
});

test('từ chối số âm, NaN và khoản tiền không nguyên', () => {
  assert.throws(() => calculateInvoice({oldElectric:-1,newElectric:0,oldWater:0,newWater:0}),/không được âm/);
  assert.throws(() => calculateInvoice({oldElectric:0,newElectric:'x',oldWater:0,newWater:0}),/số hợp lệ/);
  assert.throws(() => calculateInvoice({roomPrice:1.25,oldElectric:0,newElectric:0,oldWater:0,newWater:0}),/số nguyên/);
});

test('giảm giá không thể làm hóa đơn âm', () => {
  const result=calculateInvoice({roomPrice:100,discount:500,oldElectric:0,newElectric:0,oldWater:0,newWater:0});
  assert.equal(result.totalAmount,0);
});
