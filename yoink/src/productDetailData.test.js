import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deliveryBenefits,
  makeProductDetail,
  productDetailVariant,
  reviewHighlights,
  reviewThread,
} from './productDetailData.js';

test('product detail data follows the 11a reviews and delivery layout', () => {
  const listing = {
    id: 'drop-pocket-tech-bubble-crt',
    name: 'Bubble CRT',
    price: '640',
    img: 'bubble crt',
    imageUrl: '/yoink-items/pocket-tech-bubble-crt.png',
    seller: 'yoink_drops',
    cta: 'Buy',
  };

  const detail = makeProductDetail(listing);

  assert.equal(productDetailVariant, '11a');
  assert.equal(detail.variant, '11a');
  assert.equal(detail.title, 'Bubble CRT');
  assert.equal(detail.imageUrl, '/yoink-items/pocket-tech-bubble-crt.png');
  assert.equal(detail.price, '640');
  assert.equal(detail.primaryCta, 'Add to cart');
  assert.equal(detail.secondaryCta, 'Buy now');
  assert.equal(detail.seller, 'yoink_drops');
  assert.deepEqual(reviewHighlights.map((item) => item.label), ['Looks cute', 'Fast shipping', 'As described', 'Drop quality']);
  assert.ok(reviewThread.length >= 2);
  assert.ok(reviewThread.every((review) => Number.isInteger(review.helpful)));
  assert.deepEqual(deliveryBenefits.map((item) => item.label), ['Ships in 24h', 'Free returns', 'Authenticity checked']);
  assert.equal(detail.deliveryEstimate, 'Ships after drop packing');
  assert.equal(detail.policyRows.find((row) => row.icon === 'storefront').label, 'Visit yoink_drops');
});
