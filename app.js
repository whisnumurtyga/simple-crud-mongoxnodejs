const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');
const moment = require('moment'); // require

require('./utils/db');
const Voucher = require('./models/voucher');

const app = express();
const port = 3000;

// setup method override
app.use(methodOverride('_method'));

// setup ejs
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// setup flash
app.use(cookieParser('secret'));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

// Home page
app.get('/', (req, res) => {
  const vouchers = [
    {
        username : 'user1', 
        password : 'password1',
        expired : '2024-04-26T15:44:32.352+00:00',
        lama_koneksi : '2',
        terakhir_login : '2024-04-25T15:44:32.352+00:00',
        kode_voucher : "LA9HMK4V"
    },
    {
        username : 'user2', 
        password : 'password2',
        expired : '2024-04-26T15:44:32.352+00:00',
        lama_koneksi : '2',
        terakhir_login : '2024-04-25T15:44:32.352+00:00',
        kode_voucher : "LA1CBK2V"
    }
];
  res.render('index', {
    layout: 'layouts/main-layout',
    nama: 'Admin',
    title: 'Halaman Home',
    vouchers,
    msg: req.flash('msg')
  });
});

function getRemainingDuration(voucherExpired) {
  const diffDuration = moment.duration(moment(voucherExpired).diff(moment()));

  const days = diffDuration.days();
  const hours = diffDuration.hours();
  const minutes = diffDuration.minutes();

  return `${days} days ${hours} hours ${minutes} minutes`;
}
// Status page
app.get('/status', (req, res, next) => {
  console.log(req.session.data)
  res.render('status', {
    layout: 'layouts/main-layout',
    title: 'Halaman Status',
    voucher: req.session.data ? req.session.data : null,
    moment,
    getRemainingDuration,
  });
});


// Contact page
app.get('/vouchers', async (req, res) => {
  const vouchers = await Voucher.find();
  // console.log(vouchers)
  res.render('vouchers', {
    layout: 'layouts/main-layout',
    title: 'Halaman Vouchers',
    vouchers,
    msg: req.flash('msg'),
    moment,
    getRemainingDuration,
  });
});

app.get('/vouchers/add', (req, res) => {
  res.render('add-voucher', {
    layout: 'layouts/main-layout',
    title: 'Add Voucher',
  });
});


function generateVoucher(length=8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let voucherCode = '';
  for (let i = 0; i < length; i++) {
      voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return voucherCode;
}


app.post(
  '/vouchers/store',
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render('add-voucher', {
        title: 'Add Voucher',
        layout: 'layouts/main-layout',
        errors: errors.array(),
      });
    } else {
      // console.log(req.body)
      // return 
      const durationInDays = moment.duration(req.body.duration, 'hours'); // Buat durasi dalam satuan hari
      data = {
        voucherCode: generateVoucher(),
        // expired: new Date(Date.now() + (req.body.duration * 24 * 60 * 60 * 1000))
        expired: moment().add(durationInDays.asHours(), 'hours')
      }
      
      const result = await Voucher.insertMany(data);
      if (result) {
        req.flash('msg', 'Voucher successfuly added!');
        res.redirect('/vouchers');
        console.log(result);
      }
    }
  }
);

app.delete('/vouchers', async (req, res) => {
  const result = await Voucher.deleteOne({ _id: req.body._id });
  if (result.deletedCount === 1) {
    req.flash('msg', 'Voucher successfuly deleted!');
    res.redirect('/vouchers');
  }
});

app.get('/vouchers/edit/:voucherCode', async (req, res) => {
  const voucher = await Voucher.findOne({ voucherCode: req.params.voucherCode });

  res.render('edit-voucher', {
    layout: 'layouts/main-layout',
    title: 'Edit Voucher',
    voucher,
    getRemainingDuration,
    moment
  });
});

app.put(
  '/vouchers',
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('edit-voucher', {
        title: 'Edit Voucher',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        voucher: req.body,
      });
    } else {
      const oldVoucher = await Voucher.findById(req.body._id);
      const result = await Voucher.updateOne(
        { _id: req.body._id },
        {
          $set: {
            expired: new Date(oldVoucher.expired.getTime() + (req.body.duration * 60 * 60 * 1000)),
          },
        }
      );
      if (result.modifiedCount === 1) {
        req.flash('msg', 'Voucher Duration Added!');
        res.redirect('/vouchers');
        console.log(result);
      }
    }
  }
);

app.put(
  '/vouchers/login',
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('index', {
        title: 'Edit Voucher',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        voucher: req.body,
      });
    } else {
      const oldVoucher = await Voucher.findOne({ voucherCode: req.body.voucherCode });
      let result = { modifiedCount: 0 }; 
      let msg = ''
      if (oldVoucher == null) {
        result.modifiedCount = 0
        msg = 'Voucher is Invalid'
        // req.flash('msg', 'Voucher is Invalid');
        // res.redirect('/');
      } else {
        if (oldVoucher.username == null) {
          // gas
          result = await Voucher.updateOne(
            { voucherCode: req.body.voucherCode },
            {
              $set: {
                username: req.body.username,
                lastLogin: new Date(),
              },
            }
          );
          result.modifiedCount = 1
        } else if (oldVoucher.username !== req.body.username) {
          // req.flash('msg', 'Username do not Match!');
          // res.redirect('/');
          result.modifiedCount = 0
          msg = 'Username does not match'
        } else {
          result = await Voucher.updateOne(
            { voucherCode: req.body.voucherCode },
            {
              $set: {
                username: req.body.username,
                lastLogin: new Date(),
              },
            }
          );
          result.modifiedCount = 1
        }
      }

      if (result.modifiedCount === 1) {
          req.flash('msg', 'Success Used Voucher!');
          const voucher = await Voucher.findOne({ voucherCode: req.body.voucherCode });
          req.session.data = voucher;
          res.redirect('/status');
      } else {
          req.flash('msg', msg);
          res.redirect('/');
      }
    }
  }
);

app.get('/vouchers/:voucherCode', async (req, res) => {
  const voucher = await Voucher.findOne({ voucherCode: req.params.voucherCode });

  res.render('detail', {
    layout: 'layouts/main-layout',
    title: 'Detail Vouchers',
    voucher,
    moment,
    getRemainingDuration,
  });
});

app.get('/logout', (req, res) => {
  // Hapus data dari sesi
  req.session.destroy((err) => {
      if (err) {
          console.error("Failed to destroy session:", err);
          // Handle error
      } else {
          // Redirect pengguna ke halaman login
          res.redirect('/');
      }
  });
});


app.listen(port, () => {
  console.log(`Wifi Telco INC | Listening at http://localhost:${port}`);
});
