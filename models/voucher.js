const mongoose = require('mongoose');

const Voucher = mongoose.model('voucher', {
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  expired: {
    type: Date,
  },
  // durationUsed: {
  //   type: Number,
  // },
  lastLogin: {
    type: Date,  
  },
  voucherCode: {
    type: String,  
  }
});

// function generateVoucher(length=8) {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let voucherCode = '';
//   for (let i = 0; i < length; i++) {
//       voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return voucherCode;
// }

// for (let i = 1; i <= 3; i++) {
//   const voucher = new Voucher({
//     username: `user${i}`,
//     password: `password${i}`,
//     expired: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // expired in i days
//     // durationUsed: i * 2, // connection duration in i * 2 hours
//     lastLogin: new Date(), // current date and time
//     voucherCode: generateVoucher()
//   });

//   voucher.save(); // Save the voucher to the database
// }

module.exports = Voucher;
