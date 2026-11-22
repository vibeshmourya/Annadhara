const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

async function run() {
  await connectDB();

  const Reservation = mongoose.model('Reservation', new mongoose.Schema({}, { strict: false }));
  const PickupTask = mongoose.model('PickupTask', new mongoose.Schema({}, { strict: false }));

  const resvs = await Reservation.find({
    $or: [
      { deliveryCode: { $exists: false } },
      { deliveryCode: null },
      { deliveryCode: '' },
    ],
  });

  console.log(`Found ${resvs.length} reservations without deliveryCode.`);

  for (const r of resvs) {
    const rawNumber = r.handoverCode ? r.handoverCode.replace(/^(FB|DL)-?/, '') : '7294';
    const code = `DL-${rawNumber}`;

    await Reservation.updateOne({ _id: r._id }, { $set: { deliveryCode: code } });
    await PickupTask.updateMany(
      {
        reservation: r._id,
        $or: [
          { deliveryCode: { $exists: false } },
          { deliveryCode: null },
          { deliveryCode: '' },
        ],
      },
      { $set: { deliveryCode: code } }
    );
    console.log(`Updated reservation ${r._id} and linked tasks with deliveryCode: ${code}`);
  }

  // Also check any PickupTasks that have missing deliveryCode but valid reservation
  const tasks = await PickupTask.find({
    $or: [
      { deliveryCode: { $exists: false } },
      { deliveryCode: null },
      { deliveryCode: '' },
    ],
  });

  console.log(`Found ${tasks.length} tasks without deliveryCode.`);
  for (const t of tasks) {
    if (t.reservation) {
      const resv = await Reservation.findById(t.reservation);
      if (resv && resv.deliveryCode) {
        await PickupTask.updateOne({ _id: t._id }, { $set: { deliveryCode: resv.deliveryCode } });
        console.log(`Synced task ${t._id} deliveryCode to: ${resv.deliveryCode}`);
      }
    }
  }

  console.log('Backfill successfully finished!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
